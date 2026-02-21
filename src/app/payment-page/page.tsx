import { Suspense } from "react";
import PaymentClient from "./PaymentClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center mt-20">Loading...</div>}>
      <PaymentClient />
    </Suspense>
  );
}