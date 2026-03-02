/**
 * Unified FastTag Service
 * 
 * Uses MongoDB repository via REST API for all FastTag operations.
 */

import { mongoFastTagRepo } from '@/services/mongodb-fasttag-repository';
import type { FastTagSessionData, FastTagSessionRecord, FastTagHistoryData, FastTagHistoryRecord } from '@/lib/db';
import type { MongoFastTagDocument, MongoFastTagCreateInput, MongoFastTagTransaction, MongoFastTagFilter } from '@/models/mongodb-fasttag';

// ─── Adapter helpers: Mongo ↔ App shape ─────────────────────────

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
    processing_time: txn.processingTime || undefined,
    transaction_time: txn.transactionTime || undefined,
    nature: txn.nature as 'Debit' | 'Credit',
    amount: parseFloat(txn.amount) || 0,
    closing_balance: txn.closingBalance || 0,
    description: txn.description || undefined,
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

// ─── Service ─────────────────────────────────────────────────────

export class FastTagService {
  // ── Session operations ──

  async createSession(data: FastTagSessionData): Promise<FastTagSessionRecord> {
    const doc = await mongoFastTagRepo.create(sessionDataToMongoInput(data));
    return mongoDocToSession(doc);
  }

  async updateSession(id: string, data: Partial<FastTagSessionData>): Promise<FastTagSessionRecord> {
    const doc = await mongoFastTagRepo.update(id, {
      ownerName: data.customer_name || data.truck_owner_name,
      mobile: data.customer_mobile,
      carModel: data.truck_number,
      bank: data.bank_name || data.bank_id,
      openingBalance: data.opening_balance,
    });
    return mongoDocToSession(doc);
  }

  async getSession(id: string): Promise<FastTagSessionRecord | null> {
    const doc = await mongoFastTagRepo.getById(id);
    return doc ? mongoDocToSession(doc) : null;
  }

  async getSessions(filter?: MongoFastTagFilter): Promise<FastTagSessionRecord[]> {
    const docs = await mongoFastTagRepo.getAll(filter);
    return docs.map(mongoDocToSession);
  }

  // ── Transaction / History operations ──

  async createHistoryEntries(sessionId: string, entries: FastTagHistoryData[]): Promise<FastTagHistoryRecord[]> {
    const results: FastTagHistoryRecord[] = [];
    for (const entry of entries) {
      const doc = await mongoFastTagRepo.addTransaction(sessionId, historyDataToMongoTxn(entry));
      const lastTxn = doc.transactions[doc.transactions.length - 1];
      if (lastTxn) results.push(mongoTxnToHistory(lastTxn, sessionId));
    }
    return results;
  }

  async getHistoryBySession(sessionId: string): Promise<FastTagHistoryRecord[]> {
    const doc = await mongoFastTagRepo.getById(sessionId);
    if (!doc) return [];
    return doc.transactions.map(txn => mongoTxnToHistory(txn, sessionId));
  }

  async deleteHistoryEntry(sessionId: string, entryId: string): Promise<void> {
    await mongoFastTagRepo.removeTransaction(sessionId, entryId);
  }

  // ── Report-style queries ──

  async getSessionsByBankAndDateRange(bankId: string, startDate: Date, endDate: Date): Promise<FastTagSessionRecord[]> {
    const docs = await mongoFastTagRepo.getAll({
      bank: bankId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    return docs.map(mongoDocToSession);
  }
}

// ─── Singleton ───────────────────────────────────────────────────
export const fastTagService = new FastTagService();
