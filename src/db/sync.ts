import { db, type LocalTransactionItemRecord, type LocalTransactionRecord } from './database'
import { supabase } from '../lib/supabase'

type SyncSummary = { synced: number; failed: number }

export class SyncManager {
  private intervalId: number | null = null
  private onlineHandler: (() => void) | null = null
  private isSyncing = false

  async sync(): Promise<SyncSummary> {
    if (this.isSyncing) return { synced: 0, failed: 0 }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return { synced: 0, failed: 0 }
    }

    this.isSyncing = true
    try {
      const unsynced = await db.getUnsyncedTransactions()
      let synced = 0
      let failed = 0

      for (const tx of unsynced) {
        try {
          await this.syncOneTransaction(tx)
          synced += 1
        } catch (e) {
          failed += 1
          console.error('[sync] Failed to sync transaction', { localId: tx.id, error: e })
          // continue with next transaction
        }
      }

      try {
        await this.syncProductsSnapshot()
      } catch (e) {
        console.error('[sync] Failed to sync products snapshot', e)
      }

      return { synced, failed }
    } finally {
      this.isSyncing = false
    }
  }

  private async syncProductsSnapshot() {
    const products = await db.getAllProducts()
    if (products.length === 0) return

    const payload = products.map((product) => ({
      id: product.id,
      name: product.name,
      category: product.category,
      capital_price: product.capital_price,
      selling_price: product.selling_price,
      current_stock: product.current_stock,
      low_stock_flag: product.low_stock_flag,
      checkout_count: product.checkout_count,
      updated_at: product.updated_at,
    }))

    const { error } = await supabase
      .from('products')
      .upsert(payload, { onConflict: 'id' })

    if (error) {
      throw error
    }
  }

  private async ensureProductsForItems(items: LocalTransactionItemRecord[]) {
    const productIds = Array.from(new Set(items.map((item) => item.product_id)))

    for (const productId of productIds) {
      const product = await db.products.get(productId)
      if (!product) {
        throw new Error(`Missing local product for transaction item: ${productId}`)
      }

      const { error } = await supabase.from('products').upsert(
        {
          id: product.id,
          name: product.name,
          category: product.category,
          capital_price: product.capital_price,
          selling_price: product.selling_price,
          low_stock_flag: product.low_stock_flag,
          updated_at: product.updated_at,
        },
        { onConflict: 'id' },
      )

      if (error) throw error
    }
  }

  startAutoSync() {
    if (typeof window === 'undefined') return
    if (this.onlineHandler) return

    this.onlineHandler = () => {
      if (navigator.onLine) {
        void this.sync()
        this.ensureInterval()
      }
    }

    window.addEventListener('online', this.onlineHandler)

    if (navigator.onLine) {
      void this.sync()
      this.ensureInterval()
    }
  }

  stopAutoSync() {
    if (typeof window === 'undefined') return
    if (this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler)
      this.onlineHandler = null
    }
    if (this.intervalId != null) {
      window.clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private ensureInterval() {
    if (typeof window === 'undefined') return
    if (this.intervalId != null) return

    this.intervalId = window.setInterval(() => {
      if (navigator.onLine) void this.sync()
    }, 30_000)
  }

  private async syncOneTransaction(tx: LocalTransactionRecord) {
    if (!tx.id) throw new Error('Transaction missing local id')

    const localId = tx.id
    const items = await db.getTransactionItems(localId)
    const remoteTxId = tx.remote_id || crypto.randomUUID()

    await this.ensureProductsForItems(items)

    // If remote_id was missing, persist it so retries are idempotent.
    if (!tx.remote_id) {
      await db.transactions.update(localId, { remote_id: remoteTxId })
    }

    // Best-effort rollback if any later step fails.
    let insertedTransaction = false

    try {
      // 1) Insert transaction
      const { error: txErr } = await supabase.from('transactions').insert({
        id: remoteTxId,
        transaction_type: tx.transaction_type,
        customer_id: tx.customer_id,
        total_amount: tx.total_amount,
        paid_amount: tx.paid_amount,
        debt_created: tx.debt_created,
        created_at: tx.created_at,
      })
      if (txErr) throw txErr
      insertedTransaction = true

      // 2) Insert transaction_items
      if (items.length > 0) {
        const remoteItems = items.map((it) => ({
          id: crypto.randomUUID(),
          transaction_id: remoteTxId,
          product_id: it.product_id,
          quantity: it.quantity,
          historical_capital_price: it.historical_capital_price,
          historical_selling_price: it.historical_selling_price,
        }))

        const { error: itemsErr } = await supabase
          .from('transaction_items')
          .insert(remoteItems)
        if (itemsErr) throw itemsErr
      }

      // 3) Update customer debt
      // - POS sales create debt via debt_created
      // - KasbonPage creates repayment entries with total_amount = 0 and paid_amount > 0
      if (tx.customer_id) {
        const { data: cust, error: custSelErr } = await supabase
          .from('customers')
          .select('total_outstanding_debt')
          .eq('id', tx.customer_id)
          .single()
        if (custSelErr) throw custSelErr

        const currentDebt = Number(cust.total_outstanding_debt ?? 0)
        let nextDebt = currentDebt
        if (tx.total_amount === 0 && tx.paid_amount > 0) {
          nextDebt = Math.max(0, currentDebt - tx.paid_amount)
        }

        const { error: custUpErr } = await supabase
          .from('customers')
          .update({
            total_outstanding_debt: nextDebt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', tx.customer_id)
        if (custUpErr) throw custUpErr
      }

      await db.markTransactionSynced(localId)
    } catch (e) {
      if (insertedTransaction) {
      // Roll back remote rows best-effort to avoid duplicates on retry.
        try {
          await supabase.from('transaction_items').delete().eq('transaction_id', remoteTxId)
        } catch {
          // ignore
        }
        try {
          await supabase.from('transactions').delete().eq('id', remoteTxId)
        } catch {
          // ignore
        }
      }

      throw e
    }
  }
}

export const syncManager = new SyncManager()
