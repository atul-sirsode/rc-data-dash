import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, History, ArrowLeft, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getEnabledBanks } from '@/lib/admin-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SearchableSelect } from '@/components/SearchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface HistoryRecord {
  id: string;
  processingTime: string;
  transactionTime: string;
  nature: 'Debit' | 'Credit';
  amount: string;
  closingBalance: string;
  description: string;
  txnId: string;
}

// Mock data generator
function getMockHistory(vehicleNumber: string, bank: string): HistoryRecord[] {
  const entries: HistoryRecord[] = [
    {
      id: '1',
      processingTime: '25 Feb 26, 12:00 AM',
      transactionTime: '28 Feb 26, 12:00 AM',
      nature: 'Debit',
      amount: '90',
      closingBalance: '910',
      description: 'Sarandi Toll Plaza',
      txnId: '804596735861030',
    },
    {
      id: '2',
      processingTime: '24 Feb 26, 10:30 AM',
      transactionTime: '27 Feb 26, 10:30 AM',
      nature: 'Debit',
      amount: '76',
      closingBalance: '834',
      description: 'Basanthnagar Toll',
      txnId: '904596735861031',
    },
    {
      id: '3',
      processingTime: '23 Feb 26, 08:15 AM',
      transactionTime: '26 Feb 26, 08:15 AM',
      nature: 'Credit',
      amount: '500',
      closingBalance: '1334',
      description: 'Recharge',
      txnId: '704596735861032',
    },
    {
      id: '4',
      processingTime: '22 Feb 26, 03:00 PM',
      transactionTime: '25 Feb 26, 03:00 PM',
      nature: 'Debit',
      amount: '110',
      closingBalance: '1224',
      description: 'Chillakallu Toll',
      txnId: '604596735861033',
    },
    {
      id: '5',
      processingTime: '20 Feb 26, 11:00 AM',
      transactionTime: '23 Feb 26, 11:00 AM',
      nature: 'Debit',
      amount: '45',
      closingBalance: '1179',
      description: 'Yerkaram Toll',
      txnId: '504596735861034',
    },
  ];
  return entries;
}

export default function FastTagHistory() {
  const navigate = useNavigate();
  const banks = getEnabledBanks();
  const [selectedBank, setSelectedBank] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [searched, setSearched] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const bankOptions = useMemo(() => banks.map(b => ({ value: b.id, label: b.name })), [banks]);

  const handleSearch = async () => {
    if (!selectedBank) {
      toast({ title: 'Please select a bank', variant: 'destructive' });
      return;
    }
    if (!vehicleNumber.trim()) {
      toast({ title: 'Please enter vehicle number', variant: 'destructive' });
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 800));
    const data = getMockHistory(vehicleNumber, selectedBank);
    setHistory(data);
    setSearched(true);
    setLoading(false);
    toast({ title: `Found ${data.length} transaction(s)` });
  };

  const filteredHistory = useMemo(() => {
    if (!globalFilter) return history;
    const q = globalFilter.toLowerCase();
    return history.filter(h =>
      h.description.toLowerCase().includes(q) ||
      h.txnId.includes(q) ||
      h.amount.includes(q) ||
      h.nature.toLowerCase().includes(q)
    );
  }, [history, globalFilter]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">View History</h1>
              <p className="text-sm text-muted-foreground">Search transaction history by bank and vehicle</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/fast-tag')} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </motion.div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Search Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label>Select Bank</Label>
                <SearchableSelect
                  options={bankOptions}
                  value={selectedBank}
                  onValueChange={setSelectedBank}
                  placeholder="Search & select bank"
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle Number</Label>
                <Input
                  placeholder="Enter vehicle number"
                  value={vehicleNumber}
                  onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                />
              </div>
              <Button onClick={handleSearch} disabled={loading} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {searched && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg">
                  Transaction History
                  <Badge variant="secondary" className="ml-2">{history.length} records</Badge>
                </CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter results..."
                    value={globalFilter}
                    onChange={e => setGlobalFilter(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>
              </CardHeader>
              <CardContent>
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No transactions to display.</p>
                ) : (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Processing Time</TableHead>
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Transaction Time</TableHead>
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Nature</TableHead>
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Amount</TableHead>
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Closing Balance</TableHead>
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Description</TableHead>
                            <TableHead className="text-xs font-semibold whitespace-nowrap">Txn ID</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredHistory.map((row, idx) => (
                            <TableRow key={row.id}>
                              <TableCell className="text-sm whitespace-nowrap">{row.processingTime}</TableCell>
                              <TableCell className="text-sm whitespace-nowrap">{row.transactionTime}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    row.nature === 'Debit'
                                      ? 'text-destructive border-destructive/30'
                                      : 'text-success border-success/30'
                                  )}
                                >
                                  {row.nature}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm font-medium">₹{row.amount}</TableCell>
                              <TableCell className="text-sm">₹{row.closingBalance}</TableCell>
                              <TableCell className="text-sm">{row.description}</TableCell>
                              <TableCell className="text-sm font-mono text-xs text-muted-foreground">{row.txnId}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
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
