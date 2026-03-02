/**
 * FastTag Report Service
 * Uses MongoDB via the unified FastTagService for report queries.
 */

import { fastTagService } from '@/services/fasttag-service';
import type {
  FastTagReportFilter,
  FastTagReportSession,
  FastTagReportTransaction,
  FastTagReportRow,
} from '@/models/fasttag-report';

export class FastTagReportService {
  async getReport(filter: FastTagReportFilter): Promise<FastTagReportRow[]> {
    const sessions = await fastTagService.getSessionsByBankAndDateRange(
      filter.bankId,
      filter.startDate,
      filter.endDate,
    );
    if (sessions.length === 0) return [];

    const rows: FastTagReportRow[] = [];
    for (const session of sessions) {
      const transactions = await fastTagService.getHistoryBySession(session.id);
      rows.push({
        session: session as unknown as FastTagReportSession,
        transactions: transactions as unknown as FastTagReportTransaction[],
      });
    }
    return rows;
  }
}

// ─── Singleton export ────────────────────────────────────────────
export const fastTagReportService = new FastTagReportService();
