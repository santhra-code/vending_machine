export type Product = {
  id: string;
  name: string;
  brand: string;
  size: string;
  price: number;
  stock: number;
  image_url: string | null;
  active: boolean;
  created_at: string;
};

export type OrderStatus = "pending" | "paid" | "cancelled" | "dispensed";

export type PaymentMethod =
  | "qr"
  | "debit"
  | "cash"
  | "subscription_qr"
  | "coin"
  | "google_pay"
  | "razorpay";

export type Order = {
  id: string;
  product_id: string;
  qty: number;
  amount: number;
  status: OrderStatus;
  payment_method?: PaymentMethod;
  user_identifier?: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  user_name: string;
  user_email: string;
  user_phone: string;
  card_code: string;
  qr_data: string;
  status: "active" | "expired" | "suspended";
  plan_name: string;
  valid_from: string;
  valid_until: string;
  annual_quota: number;
  monthly_quota: number;
  used_quota: number;
  created_at: string;
};

export type DispenseLog = {
  id: string;
  order_id?: string;
  product_id: string;
  product_name?: string;
  qty: number;
  method: PaymentMethod | string;
  user_identifier?: string;
  status: "success" | "dispensing" | "failed";
  slot?: string;
  created_at: string;
};

export type CoinTransaction = {
  id: string;
  order_id: string;
  amount_required: number;
  coins_inserted: number;
  change_returned: number;
  status: "in_progress" | "completed" | "refunded";
  created_at: string;
};