import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart, Loader2, FileDown, CalendarIcon } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getEnabledBanks } from '@/lib/admin-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { fastTagReportService } from '@/services/fasttag-report-service';
import { generateReportPDF } from '@/lib/fasttag-report-pdf';
import type { FastTagReportRow } from '@/models/fasttag-report';

export default function FastTagReports() {
  const banks = getEnabledBanks();
  const bankOptions = useMemo(() => banks.map(b => ({ value: b.id, label: b.name })), [banks]);

  const [selectedBank, setSelectedBank] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<FastTagReportRow[]>([]);
  const [searched, setSearched] = useState(false);

  const selectedBankName = banks.find(b => b.id === selectedBank)?.name || '';

  const handleSearch = async () => {
    if (!selectedBank) { toast({ title: 'Please select a bank', variant: 'destructive' }); return; }
    if (!startDate || !endDate) { toast({ title: 'Please select date range', variant: 'destructive' }); return; }
    if (endDate < startDate) { toast({ title: 'End date must be after start date', variant: 'destructive' }); return; }

    setLoading(true);
    try {
      const data = await fastTagReportService.getReport({
        bankId: selectedBank,
        bankName: selectedBankName,
        startDate,
        endDate,
      });
      setRows(data);
      setSearched(true);
      toast({ title: `Found ${data.length} session(s)` });
    } catch (err: any) {
      toast({ title: 'Failed to fetch report', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (rows.length === 0) { toast({ title: 'No data to export', variant: 'destructive' }); return; }
    generateReportPDF({ bankId: selectedBank, bankName: selectedBankName, startDate: startDate!, endDate: endDate! }, rows);
  };

  const totalTransactions = rows.reduce((sum, r) => sum + r.transactions.length, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileBarChart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">FastTag Reports</h1>
            <p className="text-sm text-muted-foreground">Filter saved transactions by bank & date range</p>
          </div>
        </motion.div>

        {/* Filters */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Filters</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-2">
                <Label>Select Bank</Label>
                <SearchableSelect options={bankOptions} value={selectedBank} onValueChange={setSelectedBank} placeholder="Search & select bank" />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover open={startOpen} onOpenChange={setStartOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, 'dd MMM yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(d) => {
                        setStartDate(d);
                        setStartOpen(false);
                        if (d && endDate && endDate < d) setEndDate(undefined);
                      }}
                      disabled={(date) => date > new Date()}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover open={endOpen} onOpenChange={setEndOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !endDate && 'text-muted-foreground')}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, 'dd MMM yyyy') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => { setEndDate(d); setEndOpen(false); }}
                      disabled={(date) => date > new Date() || (startDate ? date < startDate : false)}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileBarChart className="w-4 h-4" />}
                Get Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  Report Results
                  <Badge variant="secondary">{rows.length} sessions</Badge>
                  <Badge variant="outline">{totalTransactions} txns</Badge>
                </CardTitle>
                <Button onClick={handleExportPDF} variant="outline" size="sm" className="gap-1.5" disabled={rows.length === 0}>
                  <FileDown className="w-4 h-4" /> Export PDF
                </Button>
              </CardHeader>
              <CardContent>
                {rows.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No sessions found for the selected filters.</p>
                ) : (
                  <div className="space-y-4">
                    {rows.map((row, idx) => (
                      <div key={row.session.id} className="rounded-lg border border-border overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/50 px-4 py-3 gap-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">#{idx + 1}</Badge>
                            <span className="font-semibold text-sm">{row.session.vehicle_number}</span>
                            <span className="text-muted-foreground text-xs">{row.session.customer_name || '—'}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Opening: ₹{row.session.opening_balance} | Created: {format(new Date(row.session.created_at), 'dd MMM yyyy')}
                          </div>
                        </div>
                        {row.transactions.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">No transactions</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/30">
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Processing Time</TableHead>
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Transaction Time</TableHead>
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Nature</TableHead>
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Amount</TableHead>
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Closing Bal</TableHead>
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Description</TableHead>
                                  <TableHead className="text-xs font-semibold whitespace-nowrap">Txn ID</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {row.transactions.map(txn => (
                                  <TableRow key={txn.id}>
                                    <TableCell className="text-sm whitespace-nowrap">{txn.processing_time ? format(new Date(txn.processing_time), 'dd MMM yy, hh:mm a') : '—'}</TableCell>
                                    <TableCell className="text-sm whitespace-nowrap">{txn.transaction_time ? format(new Date(txn.transaction_time), 'dd MMM yy, hh:mm a') : '—'}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className={cn(txn.nature === 'Debit' ? 'text-destructive border-destructive/30' : 'text-green-600 border-green-300')}>
                                        {txn.nature}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm font-medium">₹{txn.amount}</TableCell>
                                    <TableCell className="text-sm">₹{txn.closing_balance}</TableCell>
                                    <TableCell className="text-sm">{txn.description || '—'}</TableCell>
                                    <TableCell className="text-sm font-mono text-xs text-muted-foreground">{txn.txn_id || '—'}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
