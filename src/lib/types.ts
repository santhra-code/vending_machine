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

export type OrderStatus = "pending" | "paid" | "cancelled";

export type Order = {
  id: string;
  product_id: string;
  qty: number;
  amount: number;
  status: OrderStatus;
  created_at: string;
};