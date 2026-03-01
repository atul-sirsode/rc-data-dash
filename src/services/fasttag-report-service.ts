/**
 * FastTag Report Service
 * Handles fetching report data. Uses repository pattern for easy DB switching.
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  FastTagReportFilter,
  FastTagReportSession,
  FastTagReportTransaction,
  FastTagReportRow,
} from '@/models/fasttag-report';

// ─── Repository Interface ────────────────────────────────────────

export interface IFastTagReportRepository {
  getSessionsByBankAndDateRange(filter: FastTagReportFilter): Promise<FastTagReportSession[]>;
  getTransactionsBySessionIds(sessionIds: string[]): Promise<FastTagReportTransaction[]>;
}

// ─── Supabase Implementation ─────────────────────────────────────

class SupabaseFastTagReportRepository implements IFastTagReportRepository {
  async getSessionsByBankAndDateRange(filter: FastTagReportFilter): Promise<FastTagReportSession[]> {
    const { data, error } = await supabase
      .from('fasttag_sessions')
      .select('*')
      .eq('bank_id', filter.bankId)
      .gte('created_at', filter.startDate.toISOString())
      .lte('created_at', filter.endDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch sessions: ${error.message}`);
    return (data || []) as unknown as FastTagReportSession[];
  }

  async getTransactionsBySessionIds(sessionIds: string[]): Promise<FastTagReportTransaction[]> {
    if (sessionIds.length === 0) return [];
    const { data, error } = await supabase
      .from('fasttag_history')
      .select('*')
      .in('session_id', sessionIds)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Failed to fetch transactions: ${error.message}`);
    return (data || []) as unknown as FastTagReportTransaction[];
  }
}

// ─── Service Class ───────────────────────────────────────────────

export class FastTagReportService {
  private repo: IFastTagReportRepository;

  constructor(repo?: IFastTagReportRepository) {
    this.repo = repo || new SupabaseFastTagReportRepository();
  }

  async getReport(filter: FastTagReportFilter): Promise<FastTagReportRow[]> {
    const sessions = await this.repo.getSessionsByBankAndDateRange(filter);
    if (sessions.length === 0) return [];

    const sessionIds = sessions.map(s => s.id);
    const transactions = await this.repo.getTransactionsBySessionIds(sessionIds);

    const txnMap = new Map<string, FastTagReportTransaction[]>();
    for (const txn of transactions) {
      const list = txnMap.get(txn.session_id) || [];
      list.push(txn);
      txnMap.set(txn.session_id, list);
    }

    return sessions.map(session => ({
      session,
      transactions: txnMap.get(session.id) || [],
    }));
  }
}

// ─── Singleton export ────────────────────────────────────────────
export const fastTagReportService = new FastTagReportService();
