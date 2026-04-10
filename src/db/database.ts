import Dexie, { type Table } from "dexie";
import type { CartItem, Customer, Product, Transaction, TransactionType } from "../types";

export type ProductRecord = Omit<Product, "checkout_count"> & {
  checkout_count: number;
};

export type CustomerRecord = Customer & {
  updated_at: string;
};

// Local-only transaction row (auto-increment id for queue ordering)
export type LocalTransactionRecord = {
  id?: number;
  transaction_type: TransactionType;
  customer_id: string | null;
  total_amount: number;
  paid_amount: number;
  debt_created: number;
  created_at: string;
  is_synced: boolean;
  // UUID to use when uploading to Supabase (optional for back-compat)
  remote_id?: string;
};

export type LocalTransactionItemRecord = {
  id?: number;
  transaction_id: number;
  product_id: string;
  quantity: number;
  historical_capital_price: number;
  historical_selling_price: number;
};

type AddProductInput = Omit<
  ProductRecord,
  "id" | "updated_at" | "checkout_count"
> &
  Partial<Pick<ProductRecord, "id" | "updated_at" | "checkout_count">>;

type AddCustomerInput = Omit<
  CustomerRecord,
  "id" | "created_at" | "updated_at"
> &
  Partial<Pick<CustomerRecord, "id" | "created_at" | "updated_at">>;

export type AddTransactionInput = Omit<
  LocalTransactionRecord,
  "id" | "is_synced" | "remote_id"
> & {
  items: Array<Omit<LocalTransactionItemRecord, "id" | "transaction_id">>;
};

export class PosWarungDB extends Dexie {
  products!: Table<ProductRecord, string>;
  customers!: Table<CustomerRecord, string>;
  transactions!: Table<LocalTransactionRecord, number>;
  transaction_items!: Table<LocalTransactionItemRecord, number>;

  constructor() {
    super("pos-warung-db");

    // Primary keys:
    // - products/customers: string UUID
    // - transactions/transaction_items: auto-increment for ordering
    this.version(1).stores({
      products: "id, category, low_stock_flag, checkout_count, name",
      customers: "id, name, total_outstanding_debt",
      transactions:
        "++id, is_synced, created_at, transaction_type, customer_id",
      transaction_items: "++id, transaction_id, product_id",
    });

    this.version(2).stores({
      products: "id, category, low_stock_flag, checkout_count, name, barcode, sku",
    });
  }

  // -----------------
  // Products
  // -----------------
  async addProduct(product: AddProductInput) {
    const now = new Date().toISOString();
    const record: ProductRecord = {
      id: product.id ?? crypto.randomUUID(),
      name: product.name,
      category: product.category,
      capital_price: product.capital_price,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      low_stock_flag: product.low_stock_flag,
      checkout_count: product.checkout_count ?? 0,
      updated_at: product.updated_at ?? now,
      ...(product.barcode && { barcode: product.barcode }),
      ...(product.sku && { sku: product.sku }),
      ...(product.supplier && { supplier: product.supplier }),
      ...(product.catatan && { catatan: product.catatan }),
    };
    await this.products.put(record);
    return record;
  }

  async updateProduct(id: string, updates: Partial<Omit<ProductRecord, "id">>) {
    const now = new Date().toISOString();
    await this.products.update(id, { ...updates, updated_at: now });
  }

  async deleteProduct(id: string) {
    await this.products.delete(id);
  }

  async getAllProducts() {
    return this.products.toArray();
  }

  async getProductByName(name: string) {
    return this.products.where("name").equals(name).first();
  }

  async getProductByBarcode(barcode: string) {
    return this.products.where("barcode").equals(barcode).first();
  }

  async getProductBySku(sku: string) {
    return this.products.where("sku").equals(sku).first();
  }

  async getLowStockProducts() {
    return this.products.filter((p) => p.low_stock_flag === true).toArray();
  }

  // -----------------
  // Customers
  // -----------------
  async addCustomer(customer: AddCustomerInput) {
    const now = new Date().toISOString();
    const record: CustomerRecord = {
      id: customer.id ?? crypto.randomUUID(),
      name: customer.name,
      phone: customer.phone,
      total_outstanding_debt: customer.total_outstanding_debt ?? 0,
      created_at: customer.created_at ?? now,
      updated_at: customer.updated_at ?? now,
    };
    await this.customers.put(record);
    return record;
  }

  async updateCustomer(
    id: string,
    updates: Partial<Omit<CustomerRecord, "id" | "created_at">>,
  ) {
    const now = new Date().toISOString();
    await this.customers.update(id, { ...updates, updated_at: now });
  }

  async getAllCustomers() {
    return this.customers.orderBy("name").toArray();
  }

  async getCustomer(id: string) {
    return this.customers.get(id);
  }

  async getCustomersWithDebt() {
    return this.customers.where("total_outstanding_debt").above(0).toArray();
  }

  // -----------------
  // Transactions
  // -----------------
  async addTransaction(input: AddTransactionInput): Promise<{
    id: number;
    remote_id: string;
  }>;
  async addTransaction(
    transaction: Transaction,
    cart: CartItem[],
  ): Promise<{ id: number; remote_id: string }>;
  async addTransaction(
    arg1: AddTransactionInput | Transaction,
    arg2?: CartItem[],
  ) {
    const normalized: AddTransactionInput =
      "items" in arg1
        ? (arg1 as AddTransactionInput)
        : {
            transaction_type: arg1.transaction_type,
            customer_id: arg1.customer_id,
            total_amount: arg1.total_amount,
            paid_amount: arg1.paid_amount,
            debt_created: arg1.debt_created,
            created_at: arg1.created_at,
            items: (arg2 ?? []).map((ci) => ({
              product_id: ci.id,
              quantity: ci.cart_quantity,
              historical_capital_price: ci.capital_price,
              historical_selling_price: ci.selling_price,
            })),
          };

    const createdAt = normalized.created_at ?? new Date().toISOString();
    const remoteId = crypto.randomUUID();

    return this.transaction(
      "rw",
      this.transactions,
      this.transaction_items,
      this.products,
      this.customers,
      async () => {
        const transactionId = await this.transactions.add({
          transaction_type: normalized.transaction_type,
          customer_id: normalized.customer_id,
          total_amount: normalized.total_amount,
          paid_amount: normalized.paid_amount,
          debt_created: normalized.debt_created,
          created_at: createdAt,
          is_synced: false,
          remote_id: remoteId,
        });

        // Insert items + update product stock/checkout_count atomically
        for (const item of normalized.items) {
          await this.transaction_items.add({
            transaction_id: transactionId,
            product_id: item.product_id,
            quantity: item.quantity,
            historical_capital_price: item.historical_capital_price,
            historical_selling_price: item.historical_selling_price,
          });

          // Decrement stock; increment checkout_count
          const product = await this.products.get(item.product_id);
          if (product) {
            const newStock = Math.max(0, product.current_stock - item.quantity);
            await this.products.update(item.product_id, {
              current_stock: newStock,
              low_stock_flag: newStock <= 5,
              checkout_count: (product.checkout_count ?? 0) + item.quantity,
              updated_at: new Date().toISOString(),
            });
          }
        }

        // If this is a repayment entry (KasbonPage style), reduce local debt.
        if (
          normalized.customer_id &&
          normalized.total_amount === 0 &&
          normalized.paid_amount > 0
        ) {
          const customer = await this.customers.get(normalized.customer_id);
          if (customer) {
            await this.customers.update(normalized.customer_id, {
              total_outstanding_debt: Math.max(
                0,
                customer.total_outstanding_debt - normalized.paid_amount,
              ),
              updated_at: new Date().toISOString(),
            });
          }
        }

        // Update customer debt locally for kasbon/partial payments.
        if (normalized.customer_id && normalized.debt_created > 0) {
          const customer = await this.customers.get(normalized.customer_id);
          if (customer) {
            await this.customers.update(normalized.customer_id, {
              total_outstanding_debt:
                customer.total_outstanding_debt + normalized.debt_created,
              updated_at: new Date().toISOString(),
            });
          }
        }

        return {
          id: transactionId,
          remote_id: remoteId,
        };
      },
    );
  }

  async getTransactionsByDate(date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.transactions
      .where("created_at")
      .between(start.toISOString(), end.toISOString(), true, true)
      .toArray();
  }

  async getAllTransactions() {
    return this.transactions.orderBy("created_at").reverse().toArray();
  }

  async getUnsyncedTransactions() {
    return this.transactions.filter((t) => t.is_synced === false).toArray();
  }

  async markTransactionSynced(transactionId: number) {
    await this.transactions.update(transactionId, { is_synced: true });
  }

  // Helpers for sync
  async getTransactionItems(transactionId: number) {
    return this.transaction_items
      .where("transaction_id")
      .equals(transactionId)
      .toArray();
  }

  // Convenience mapping to shared types (not strictly required, but helpful)
  async getTransactionWithItems(transactionId: number) {
    const tx = await this.transactions.get(transactionId);
    if (!tx) return null;
    const items = await this.getTransactionItems(transactionId);
    return { tx, items };
  }
}

export const db = new PosWarungDB();
