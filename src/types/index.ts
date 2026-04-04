export interface Product {
  id: string;
  name: string;
  category: string;
  capital_price: number;
  selling_price: number;
  current_stock: number;
  low_stock_flag: boolean;
  updated_at: string;
  checkout_count?: number; // for sorting by frequency
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  total_outstanding_debt: number;
  created_at: string;
}

export type TransactionType = "LUNAS" | "KASBON_FULL" | "SEBAGIAN";

export interface Transaction {
  id: string;
  transaction_type: TransactionType;
  customer_id: string | null;
  total_amount: number;
  paid_amount: number;
  debt_created: number;
  created_at: string;
  is_synced: boolean;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  historical_capital_price: number;
  historical_selling_price: number;
}

export interface CartItem extends Product {
  cart_quantity: number;
}
