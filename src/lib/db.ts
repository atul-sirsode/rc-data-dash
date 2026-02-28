/**
 * Database Abstraction Layer (Repository Pattern)
 * 
 * This module provides a clean interface for database operations,
 * allowing easy switching between different database providers.
 * Currently uses Lovable Cloud (Supabase) under the hood.
 */

import { supabase } from '@/integrations/supabase/client';

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

// ─── Supabase Implementation ─────────────────────────────────────

class SupabaseFastTagRepository implements IFastTagRepository {
  async createSession(data: FastTagSessionData): Promise<FastTagSessionRecord> {
    const { data: result, error } = await supabase
      .from('fasttag_sessions' as any)
      .insert(data as any)
      .select()
      .single();

    if (error) throw new Error(`Failed to create session: ${error.message}`);
    return result as unknown as FastTagSessionRecord;
  }

  async updateSession(id: string, data: Partial<FastTagSessionData>): Promise<FastTagSessionRecord> {
    const { data: result, error } = await supabase
      .from('fasttag_sessions' as any)
      .update(data as any)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update session: ${error.message}`);
    return result as unknown as FastTagSessionRecord;
  }

  async getSession(id: string): Promise<FastTagSessionRecord | null> {
    const { data: result, error } = await supabase
      .from('fasttag_sessions' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return result as unknown as FastTagSessionRecord;
  }

  async getSessions(): Promise<FastTagSessionRecord[]> {
    const { data: result, error } = await supabase
      .from('fasttag_sessions' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch sessions: ${error.message}`);
    return (result || []) as unknown as FastTagSessionRecord[];
  }

  async createHistoryEntries(entries: FastTagHistoryData[]): Promise<FastTagHistoryRecord[]> {
    const { data: result, error } = await supabase
      .from('fasttag_history' as any)
      .insert(entries as any)
      .select();

    if (error) throw new Error(`Failed to create history entries: ${error.message}`);
    return (result || []) as unknown as FastTagHistoryRecord[];
  }

  async getHistoryBySession(sessionId: string): Promise<FastTagHistoryRecord[]> {
    const { data: result, error } = await supabase
      .from('fasttag_history' as any)
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch history: ${error.message}`);
    return (result || []) as unknown as FastTagHistoryRecord[];
  }

  async deleteHistoryEntry(id: string): Promise<void> {
    const { error } = await supabase
      .from('fasttag_history' as any)
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete history entry: ${error.message}`);
  }
}

// ─── Export singleton ────────────────────────────────────────────
// To switch databases, replace the implementation class here.

export const fastTagRepo: IFastTagRepository = new SupabaseFastTagRepository();
