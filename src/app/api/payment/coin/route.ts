import { NextRequest, NextResponse } from "next/server";
import { DataService } from "@/lib/dataService";

type CoinSession = {
  order_id: string;
  amount_required: number;
  coins_inserted: number;
  change_returned: number;
  status: "in_progress" | "completed" | "refunded";
  history: { coin: number; timestamp: string }[];
};

// In-memory sessions map
declare global {
  // eslint-disable-next-line no-var
  var __coinSessions: Map<string, CoinSession> | undefined;
}

function getSessions(): Map<string, CoinSession> {
  if (!global.__coinSessions) {
    global.__coinSessions = new Map();
  }
  return global.__coinSessions;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

  const session = getSessions().get(orderId);
  if (!session) {
    return NextResponse.json({
      order_id: orderId,
      amount_required: 0,
      coins_inserted: 0,
      change_returned: 0,
      status: "in_progress",
      history: [],
    });
  }

  return NextResponse.json({ ok: true, data: session });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { orderId, coin, amountRequired, action } = body || {};

  if (!orderId) {
    return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
  }

  const sessions = getSessions();
  let session = sessions.get(orderId);

  if (!session) {
    session = {
      order_id: orderId,
      amount_required: Number(amountRequired ?? 30),
      coins_inserted: 0,
      change_returned: 0,
      status: "in_progress",
      history: [],
    };
    sessions.set(orderId, session);
  }

  // Handle Return / Eject action
  if (action === "refund" || action === "eject") {
    const refunded = session.coins_inserted;
    session.coins_inserted = 0;
    session.status = "refunded";
    session.change_returned = refunded;
    return NextResponse.json({
      ok: true,
      message: `Coins ejected. Returned ₹${refunded} in coin return tray.`,
      session,
    });
  }

  // Add coin
  const coinVal = Number(coin ?? 0);
  if (![1, 2, 5, 10, 20].includes(coinVal)) {
    return NextResponse.json({ error: "Invalid coin denomination. Accepted coins: ₹1, ₹2, ₹5, ₹10" }, { status: 400 });
  }

  session.coins_inserted += coinVal;
  session.history.push({ coin: coinVal, timestamp: new Date().toISOString() });

  const isComplete = session.coins_inserted >= session.amount_required;
  if (isComplete) {
    session.status = "completed";
    session.change_returned = Math.max(0, session.coins_inserted - session.amount_required);

    // Record in DB and update order
    await DataService.recordCoinTransaction({
      order_id: orderId,
      amount_required: session.amount_required,
      coins_inserted: session.coins_inserted,
      change_returned: session.change_returned,
      status: "completed",
    });

    await DataService.updateOrderStatus(orderId, "paid");
    const order = await DataService.getOrderById(orderId);
    if (order) {
      await DataService.logDispense({
        order_id: orderId,
        product_id: order.product_id,
        qty: order.qty,
        method: "coin",
        user_identifier: "Cash/Coin Acceptor",
        status: "success",
        slot: "Tray-A1",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    data: session,
    completed: isComplete,
    remaining: Math.max(0, session.amount_required - session.coins_inserted),
  });
}
