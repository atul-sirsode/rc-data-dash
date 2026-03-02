/**
 * Database Types & Interface
 * 
 * Defines the repository interface for FastTag operations.
 * Implementation is provided by the MongoDB repository.
 */

// ─── Types ───────────────────────────────────────────────────────

export interface FastTagSessionData {
  bank_id: string;
  bank_name: string;
  vehicle_number: string;
  customer_name?: string;
  customer_mobile?: string;
  truck_number?: string;
  truck_owner_name?: string;
  opening_balance: number;
  start_date?: string;
  end_date?: string;
  pdf_url?: string;
}

export interface FastTagSessionRecord extends FastTagSessionData {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface FastTagHistoryData {
  session_id: string;
  processing_time?: string;
  transaction_time?: string;
  nature: 'Debit' | 'Credit';
  amount: number;
  closing_balance: number;
  description?: string;
  txn_id?: string;
}

export interface FastTagHistoryRecord extends FastTagHistoryData {
  id: string;
  created_at: string;
}

// ─── Repository Interface ────────────────────────────────────────

export interface IFastTagRepository {
  createSession(data: FastTagSessionData): Promise<FastTagSessionRecord>;
  updateSession(id: string, data: Partial<FastTagSessionData>): Promise<FastTagSessionRecord>;
  getSession(id: string): Promise<FastTagSessionRecord | null>;
  getSessions(): Promise<FastTagSessionRecord[]>;
  
  createHistoryEntries(entries: FastTagHistoryData[]): Promise<FastTagHistoryRecord[]>;
  getHistoryBySession(sessionId: string): Promise<FastTagHistoryRecord[]>;
  deleteHistoryEntry(id: string): Promise<void>;
}
