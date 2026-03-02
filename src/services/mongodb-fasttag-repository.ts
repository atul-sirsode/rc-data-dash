/**
 * MongoDB FastTag Repository
 * 
 * Calls an external REST API proxy that connects to MongoDB.
 * Implements the same IFastTagRepository interface so it can be
 * swapped in place of the Supabase implementation.
 */

import { getMongoApiBaseUrl } from '@/config/db-provider';
import type {
  MongoFastTagDocument,
  MongoFastTagCreateInput,
  MongoFastTagUpdateInput,
  MongoFastTagFilter,
  MongoFastTagTransaction,
} from '@/models/mongodb-fasttag';

// ─── Repository Interface ────────────────────────────────────────

export interface IMongoFastTagRepository {
  create(data: MongoFastTagCreateInput): Promise<MongoFastTagDocument>;
  update(id: string, data: MongoFastTagUpdateInput): Promise<MongoFastTagDocument>;
  getById(id: string): Promise<MongoFastTagDocument | null>;
  getAll(filter?: MongoFastTagFilter): Promise<MongoFastTagDocument[]>;
  delete(id: string): Promise<void>;

  // Transaction-level operations
  addTransaction(documentId: string, txn: MongoFastTagTransaction): Promise<MongoFastTagDocument>;
  removeTransaction(documentId: string, txnId: string): Promise<MongoFastTagDocument>;
  updateTransaction(documentId: string, txnId: string, txn: Partial<MongoFastTagTransaction>): Promise<MongoFastTagDocument>;
}

// ─── REST API Implementation ─────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getMongoApiBaseUrl();
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`MongoDB API error (${res.status}): ${body}`);
  }
  return res.json();
}

export class MongoFastTagRepository implements IMongoFastTagRepository {
  private basePath = '/fasttag';

  async create(data: MongoFastTagCreateInput): Promise<MongoFastTagDocument> {
    return apiFetch<MongoFastTagDocument>(this.basePath, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: MongoFastTagUpdateInput): Promise<MongoFastTagDocument> {
    return apiFetch<MongoFastTagDocument>(`${this.basePath}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getById(id: string): Promise<MongoFastTagDocument | null> {
    try {
      return await apiFetch<MongoFastTagDocument>(`${this.basePath}/${id}`);
    } catch {
      return null;
    }
  }

  async getAll(filter?: MongoFastTagFilter): Promise<MongoFastTagDocument[]> {
    const params = new URLSearchParams();
    if (filter?.bank) params.set('bank', filter.bank);
    if (filter?.vehicleNumber) params.set('vehicleNumber', filter.vehicleNumber);
    if (filter?.formType) params.set('formType', filter.formType);
    if (filter?.startDate) params.set('startDate', filter.startDate);
    if (filter?.endDate) params.set('endDate', filter.endDate);

    const qs = params.toString();
    return apiFetch<MongoFastTagDocument[]>(`${this.basePath}${qs ? `?${qs}` : ''}`);
  }

  async delete(id: string): Promise<void> {
    await apiFetch<void>(`${this.basePath}/${id}`, { method: 'DELETE' });
  }

  async addTransaction(documentId: string, txn: MongoFastTagTransaction): Promise<MongoFastTagDocument> {
    return apiFetch<MongoFastTagDocument>(`${this.basePath}/${documentId}/transactions`, {
      method: 'POST',
      body: JSON.stringify(txn),
    });
  }

  async removeTransaction(documentId: string, txnId: string): Promise<MongoFastTagDocument> {
    return apiFetch<MongoFastTagDocument>(`${this.basePath}/${documentId}/transactions/${txnId}`, {
      method: 'DELETE',
    });
  }

  async updateTransaction(
    documentId: string,
    txnId: string,
    txn: Partial<MongoFastTagTransaction>,
  ): Promise<MongoFastTagDocument> {
    return apiFetch<MongoFastTagDocument>(`${this.basePath}/${documentId}/transactions/${txnId}`, {
      method: 'PUT',
      body: JSON.stringify(txn),
    });
  }
}

// ─── Singleton ───────────────────────────────────────────────────
export const mongoFastTagRepo = new MongoFastTagRepository();
