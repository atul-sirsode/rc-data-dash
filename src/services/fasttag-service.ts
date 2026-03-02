/**
 * Unified FastTag Service
 * 
 * Delegates to either Supabase or MongoDB repository based on the
 * active database provider. All UI components should use this service
 * instead of importing repositories directly.
 */

import { getDbProvider } from '@/config/db-provider';
import { fastTagRepo } from '@/lib/db';
import { mongoFastTagRepo } from '@/services/mongodb-fasttag-repository';
import type { FastTagSessionData, FastTagSessionRecord, FastTagHistoryData, FastTagHistoryRecord } from '@/lib/db';
import type { MongoFastTagDocument, MongoFastTagCreateInput, MongoFastTagTransaction, MongoFastTagFilter } from '@/models/mongodb-fasttag';

// ─── Adapter helpers: Mongo ↔ Supabase shape ────────────────────

function mongoDocToSession(doc: MongoFastTagDocument): FastTagSessionRecord {
  return {
    id: doc._id,
    bank_id: doc.bank || '',
    bank_name: doc.bank || '',
    vehicle_number: doc.vehicleNumber,
    customer_name: doc.ownerName,
    customer_mobile: doc.mobile,
    truck_number: doc.carModel,
    truck_owner_name: doc.ownerName,
    opening_balance: doc.openingBalance,
    start_date: doc.createdAt,
    end_date: doc.updatedAt,
    created_at: doc.createdAt,
    updated_at: doc.updatedAt,
    pdf_url: undefined,
  };
}

function mongoTxnToHistory(txn: MongoFastTagTransaction, sessionId: string): FastTagHistoryRecord {
  return {
    id: txn.id,
    session_id: sessionId,
    processing_time: txn.processingTime || null,
    transaction_time: txn.transactionTime || null,
    nature: txn.nature as 'Debit' | 'Credit',
    amount: parseFloat(txn.amount) || 0,
    closing_balance: txn.closingBalance || 0,
    description: txn.description || null,
    txn_id: txn.id,
    created_at: txn.transactionTime || new Date().toISOString(),
  };
}

function sessionDataToMongoInput(data: FastTagSessionData): MongoFastTagCreateInput {
  return {
    formType: 'fasttag',
    vehicleNumber: data.vehicle_number,
    openingBalance: data.opening_balance,
    ownerName: data.truck_owner_name || data.customer_name,
    mobile: data.customer_mobile,
    carModel: data.truck_number,
    bank: data.bank_name || data.bank_id,
  };
}

function historyDataToMongoTxn(entry: FastTagHistoryData): MongoFastTagTransaction {
  return {
    id: entry.txn_id || crypto.randomUUID(),
    nature: entry.nature,
    amount: String(entry.amount),
    closingBalance: entry.closing_balance,
    description: entry.description || '',
    processingTime: entry.processing_time || undefined,
    transactionTime: entry.transaction_time || new Date().toISOString(),
  };
}

// ─── Unified Service ─────────────────────────────────────────────

export class FastTagService {
  // ── Session operations ──

  async createSession(data: FastTagSessionData): Promise<FastTagSessionRecord> {
    if (getDbProvider() === 'mongodb') {
      const doc = await mongoFastTagRepo.create(sessionDataToMongoInput(data));
      return mongoDocToSession(doc);
    }
    return fastTagRepo.createSession(data);
  }

  async updateSession(id: string, data: Partial<FastTagSessionData>): Promise<FastTagSessionRecord> {
    if (getDbProvider() === 'mongodb') {
      const doc = await mongoFastTagRepo.update(id, {
        ownerName: data.customer_name || data.truck_owner_name,
        mobile: data.customer_mobile,
        carModel: data.truck_number,
        bank: data.bank_name || data.bank_id,
        openingBalance: data.opening_balance,
      });
      return mongoDocToSession(doc);
    }
    return fastTagRepo.updateSession(id, data);
  }

  async getSession(id: string): Promise<FastTagSessionRecord | null> {
    if (getDbProvider() === 'mongodb') {
      const doc = await mongoFastTagRepo.getById(id);
      return doc ? mongoDocToSession(doc) : null;
    }
    return fastTagRepo.getSession(id);
  }

  async getSessions(filter?: MongoFastTagFilter): Promise<FastTagSessionRecord[]> {
    if (getDbProvider() === 'mongodb') {
      const docs = await mongoFastTagRepo.getAll(filter);
      return docs.map(mongoDocToSession);
    }
    return fastTagRepo.getSessions();
  }

  // ── Transaction / History operations ──

  async createHistoryEntries(sessionId: string, entries: FastTagHistoryData[]): Promise<FastTagHistoryRecord[]> {
    if (getDbProvider() === 'mongodb') {
      const results: FastTagHistoryRecord[] = [];
      for (const entry of entries) {
        const doc = await mongoFastTagRepo.addTransaction(sessionId, historyDataToMongoTxn(entry));
        const lastTxn = doc.transactions[doc.transactions.length - 1];
        if (lastTxn) results.push(mongoTxnToHistory(lastTxn, sessionId));
      }
      return results;
    }
    return fastTagRepo.createHistoryEntries(entries);
  }

  async getHistoryBySession(sessionId: string): Promise<FastTagHistoryRecord[]> {
    if (getDbProvider() === 'mongodb') {
      const doc = await mongoFastTagRepo.getById(sessionId);
      if (!doc) return [];
      return doc.transactions.map(txn => mongoTxnToHistory(txn, sessionId));
    }
    return fastTagRepo.getHistoryBySession(sessionId);
  }

  async deleteHistoryEntry(sessionId: string, entryId: string): Promise<void> {
    if (getDbProvider() === 'mongodb') {
      await mongoFastTagRepo.removeTransaction(sessionId, entryId);
      return;
    }
    return fastTagRepo.deleteHistoryEntry(entryId);
  }

  // ── Report-style queries ──

  async getSessionsByBankAndDateRange(bankId: string, startDate: Date, endDate: Date): Promise<FastTagSessionRecord[]> {
    if (getDbProvider() === 'mongodb') {
      const docs = await mongoFastTagRepo.getAll({
        bank: bankId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      return docs.map(mongoDocToSession);
    }
    // Supabase path - delegate to existing report service
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase
      .from('fasttag_sessions')
      .select('*')
      .eq('bank_id', bankId)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as unknown as FastTagSessionRecord[];
  }
}

// ─── Singleton ───────────────────────────────────────────────────
export const fastTagService = new FastTagService();
