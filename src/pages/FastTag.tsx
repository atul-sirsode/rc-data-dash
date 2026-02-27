import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ChevronRight, Clock, CheckCircle2, ExternalLink, CalendarIcon, User, Phone, Truck, IndianRupee, Pencil, Plus, MapPin, Loader2, Car, Bus, Bike, Caravan, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getEnabledBanks } from '@/lib/admin-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { verifyRC, getMockRCData } from '@/lib/rc-api';

// Dummy states and cities for fallback
const DUMMY_STATES: StateOption[] = [
  { name: 'Maharashtra', iso_code: 'MH' },
  { name: 'Telangana', iso_code: 'TG' },
  { name: 'Karnataka', iso_code: 'KA' },
  { name: 'Tamil Nadu', iso_code: 'TN' },
  { name: 'Gujarat', iso_code: 'GJ' },
  { name: 'Rajasthan', iso_code: 'RJ' },
  { name: 'Uttar Pradesh', iso_code: 'UP' },
  { name: 'Madhya Pradesh', iso_code: 'MP' },
  { name: 'Andhra Pradesh', iso_code: 'AP' },
  { name: 'Delhi', iso_code: 'DL' },
];

const DUMMY_CITIES: Record<string, string[]> = {
  MH: ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Thane', 'Solapur', 'Kolhapur'],
  TG: ['Hyderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam'],
  KA: ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga'],
  TN: ['Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy', 'Tirunelveli'],
  GJ: ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar'],
  RJ: ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Ajmer', 'Bikaner'],
  UP: ['Lucknow', 'Kanpur', 'Agra', 'Varanasi', 'Allahabad', 'Meerut'],
  MP: ['Bhopal', 'Indore', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar'],
  AP: ['Vijayawada', 'Visakhapatnam', 'Guntur', 'Nellore', 'Tirupati', 'Kurnool'],
  DL: ['New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi'],
};

const VEHICLE_TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  car: Car,
  truck: Truck,
  bus: Bus,
  bike: Bike,
  lcv: Truck,
  taxi: Car,
  rv: Caravan,
};

const VEHICLE_TYPES = [
  { value: '2AxlesAuto', description: 'Car, Jeep, Van, SUV', iconKey: 'car' },
  { value: '3AxlesAuto', description: 'Car, SUV towing 1-axle trailer', iconKey: 'car' },
  { value: '4AxlesAuto', description: 'Car, SUV towing 2-axle trailer', iconKey: 'car' },
  { value: '2AxlesTaxi', description: 'Taxi', iconKey: 'taxi' },
  { value: '2AxlesLCV', description: 'Pickup truck, Light Commercial Vehicles', iconKey: 'lcv' },
  { value: '2AxlesTruck', description: 'Truck - 2 Axles', iconKey: 'truck' },
  { value: '3AxlesTruck', description: 'Truck - 3 Axles', iconKey: 'truck' },
  { value: '4AxlesTruck', description: 'Truck - 4 Axles', iconKey: 'truck' },
  { value: '5AxlesTruck', description: 'Truck - 5 Axles', iconKey: 'truck' },
  { value: '6AxlesTruck', description: 'Truck - 6 Axles', iconKey: 'truck' },
  { value: '7AxlesTruck', description: 'Truck - 7+ Axles', iconKey: 'truck' },
  { value: '2AxlesBus', description: 'Bus - 2 Axles', iconKey: 'bus' },
  { value: '3AxlesBus', description: 'Bus - 3 Axles', iconKey: 'bus' },
  { value: '4AxlesBus', description: 'Bus - 4 Axles', iconKey: 'bus' },
  { value: '2AxlesMotorcycle', description: 'Bike', iconKey: 'bike' },
];

// Mock toll data for demo
const MOCK_TOLL_DATA = [
  { tollName: 'Arambha', amount: '0' },
  { tollName: 'Nandori', amount: '0' },
  { tollName: 'Visapur', amount: '0' },
  { tollName: 'Sarandi Toll Plaza', amount: '90' },
  { tollName: 'Mandamarri Toll Plaza', amount: '90' },
  { tollName: 'Basanthnagar', amount: '76' },
  { tollName: 'Singarajupally', amount: '45' },
  { tollName: 'Yerkaram', amount: '45' },
  { tollName: 'Chillakallu', amount: '110' },
  { tollName: 'Keesara Fee Plaza', amount: '70' },
];

interface RouteInfo {
  routeName: string;
  distance: string;
  duration: string;
  fastagTotal: number;
  tollSegments: { name: string; amount: number }[];
}

interface FormData {
  vehicleNumber: string;
  customerName: string;
  customerMobile: string;
  truckNumber: string;
  truckOwnerName: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  openingBalance: string;
}

interface TollEntry {
  id: string;
  processingTime: string;
  transactionTime: string;
  amount: string;
  tollName: string;
  selected: boolean;
}

interface HistoryEntry {
  id: string;
  processingTime: string;
  transactionTime: string;
  nature: 'Debit' | 'Credit';
  amount: string;
  closingBalance: string;
  description: string;
  txnId: string;
}

interface ManualTransaction {
  processingTime: string;
  transactionTime: string;
  type: string;
  amount: string;
  description: string;
}

interface StateOption {
  name: string;
  iso_code: string;
}

function generateTxnId(): string {
  return Math.floor(Math.random() * 90000000000000 + 10000000000000).toString();
}

export default function FastTag() {
  const banks = getEnabledBanks();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [detailsFetched, setDetailsFetched] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [tollsLoaded, setTollsLoaded] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    vehicleNumber: '',
    customerName: '',
    customerMobile: '',
    truckNumber: '',
    truckOwnerName: '',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date(),
    openingBalance: '',
  });

  // Toll finder state
  const [vehicleType, setVehicleType] = useState('');
  const [sourceState, setSourceState] = useState('');
  const [sourceCity, setSourceCity] = useState('');
  const [destState, setDestState] = useState('');
  const [destCity, setDestCity] = useState('');
  const [states, setStates] = useState<StateOption[]>([]);
  const [sourceCities, setSourceCities] = useState<string[]>([]);
  const [destCities, setDestCities] = useState<string[]>([]);
  const [tolls, setTolls] = useState<TollEntry[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [editingEntry, setEditingEntry] = useState<HistoryEntry | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Manual transaction state
  const [manualTx, setManualTx] = useState<ManualTransaction>({
    processingTime: '',
    transactionTime: '',
    type: 'Debit',
    amount: '',
    description: '',
  });

  // Fetch states only when post-submit view is shown
  useEffect(() => {
    if (!submitted) return;
    fetch('https://api.atulsirsode.cloud/api/states-cities/get-states', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        const statesList = data?.data ?? data?.states ?? data;
        if (Array.isArray(statesList) && statesList.length > 0) {
          setStates(statesList.map((s: any) => ({
            name: s.name || s.state || s,
            iso_code: s.iso_code || s.isoCode || s.iso2 || s.code || '',
          })));
        } else {
          setStates(DUMMY_STATES);
        }
      })
      .catch(() => {
        setStates(DUMMY_STATES);
      });
  }, [submitted]);

  // Fetch source cities
  useEffect(() => {
    if (!sourceState) { setSourceCities([]); return; }
    fetch(`https://api.atulsirsode.cloud/api/states-cities/get-city-by-state?iso_code=${sourceState}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        const cities = data?.data ?? data?.cities ?? data;
        if (Array.isArray(cities) && cities.length > 0) {
          setSourceCities(cities.map((c: any) => typeof c === 'string' ? c : c.name || c.city || ''));
        } else {
          setSourceCities(DUMMY_CITIES[sourceState] || []);
        }
      })
      .catch(() => setSourceCities(DUMMY_CITIES[sourceState] || []));
  }, [sourceState]);

  // Fetch dest cities
  useEffect(() => {
    if (!destState) { setDestCities([]); return; }
    fetch(`https://api.atulsirsode.cloud/api/states-cities/get-city-by-state?iso_code=${destState}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        const cities = data?.data ?? data?.cities ?? data;
        if (Array.isArray(cities) && cities.length > 0) {
          setDestCities(cities.map((c: any) => typeof c === 'string' ? c : c.name || c.city || ''));
        } else {
          setDestCities(DUMMY_CITIES[destState] || []);
        }
      })
      .catch(() => setDestCities(DUMMY_CITIES[destState] || []));
  }, [destState]);

  const updateForm = (key: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGetDetails = async () => {
    if (!formData.vehicleNumber.trim()) {
      toast({ title: 'Vehicle Number is required', variant: 'destructive' });
      return;
    }
    setFetchingDetails(true);
    try {
      let data;
      try {
        const response = await verifyRC(formData.vehicleNumber.trim());
        data = response.data;
      } catch {
        const mock = getMockRCData(formData.vehicleNumber.trim());
        data = mock.data;
      }
      if (data) {
        setFormData(prev => ({
          ...prev,
          customerName: data.owner_name || prev.customerName,
          truckNumber: data.rc_number || prev.truckNumber,
          truckOwnerName: data.owner_name || prev.truckOwnerName,
        }));
        setDetailsFetched(true);
        toast({ title: 'Vehicle details fetched successfully' });
      }
    } catch (err) {
      toast({ title: 'Failed to fetch vehicle details', variant: 'destructive' });
    } finally {
      setFetchingDetails(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.openingBalance.trim() || isNaN(Number(formData.openingBalance))) {
      toast({ title: 'Opening Balance is required and must be a valid number', variant: 'destructive' });
      return;
    }
    if (!formData.startDate || !formData.endDate) {
      toast({ title: 'Please select statement duration', variant: 'destructive' });
      return;
    }
    setSubmitted(true);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setSubmitted(false);
    setIsEditing(true);
  };

  const selectedBankName = banks.find(b => b.id === selectedBank)?.name || '';

  // Get Toll Routes handler
  const handleGetTollRoutes = () => {
    if (!vehicleType || !sourceState || !sourceCity || !destState || !destCity) {
      toast({ title: 'Please fill all toll finder fields', variant: 'destructive' });
      return;
    }
    const newTolls: TollEntry[] = MOCK_TOLL_DATA.map((t, i) => ({
      id: `toll-${Date.now()}-${i}`,
      processingTime: '',
      transactionTime: '',
      amount: t.amount,
      tollName: t.tollName,
      selected: false,
    }));
    setTolls(newTolls);
    setTollsLoaded(true);

    // Build route info from toll data
    const totalAmount = newTolls.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const segments = newTolls
      .filter(t => Number(t.amount) > 0 || newTolls.indexOf(t) === 0 || newTolls.indexOf(t) === newTolls.length - 1)
      .map(t => ({ name: t.tollName, amount: Number(t.amount) || 0 }));
    // Use first and last as key segments if not already included
    const firstToll = newTolls[0];
    const lastToll = newTolls[newTolls.length - 1];
    const keySegments = [
      { name: `${firstToll.tollName} to ${newTolls.find(t => Number(t.amount) > 0)?.tollName || lastToll.tollName}`, amount: totalAmount },
      { name: lastToll.tollName, amount: Number(lastToll.amount) || 0 },
    ];

    setRouteInfo({
      routeName: `${sourceCity} to ${destCity} Route`,
      distance: `${Math.floor(Math.random() * 500 + 300)} km`,
      duration: `${Math.floor(Math.random() * 12 + 4)} h ${Math.floor(Math.random() * 59)} min`,
      fastagTotal: totalAmount,
      tollSegments: keySegments,
    });

    toast({ title: 'Toll routes loaded' });
  };

  // Select all tolls
  const allSelected = tolls.length > 0 && tolls.every(t => t.selected);
  const someSelected = tolls.some(t => t.selected);
  const handleSelectAll = (checked: boolean) => {
    setTolls(prev => prev.map(t => ({ ...t, selected: checked })));
  };

  // Calculate running closing balance
  const calculateClosingBalance = (upToIndex: number, existingHistory: HistoryEntry[]): string => {
    let balance = Number(formData.openingBalance) || 0;
    for (let i = 0; i <= upToIndex; i++) {
      const entry = existingHistory[i];
      const amt = Number(entry.amount) || 0;
      balance = entry.nature === 'Debit' ? balance - amt : balance + amt;
    }
    return balance.toLocaleString('en-IN');
  };

  // Recalculate all closing balances
  const recalcBalances = (entries: HistoryEntry[]): HistoryEntry[] => {
    let balance = Number(formData.openingBalance) || 0;
    return entries.map(e => {
      const amt = Number(e.amount) || 0;
      balance = e.nature === 'Debit' ? balance - amt : balance + amt;
      return { ...e, closingBalance: balance.toLocaleString('en-IN') };
    });
  };

  // Add selected tolls to history
  const handleAddSelectedTolls = () => {
    const selectedTolls = tolls.filter(t => t.selected);
    if (selectedTolls.length === 0) {
      toast({ title: 'Please select at least one toll', variant: 'destructive' });
      return;
    }

    // Validate datetime fields for selected tolls
    const missingDates = selectedTolls.filter(t => !t.processingTime || !t.transactionTime);
    if (missingDates.length > 0) {
      toast({
        title: 'Processing Time and Transaction Time are required',
        description: `Please fill date/time for all selected tolls (${missingDates.length} missing)`,
        variant: 'destructive',
      });
      return;
    }

    const newEntries: HistoryEntry[] = selectedTolls.map(t => ({
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      processingTime: t.processingTime,
      transactionTime: t.transactionTime,
      nature: 'Debit' as const,
      amount: t.amount,
      closingBalance: '0',
      description: t.tollName,
      txnId: generateTxnId(),
    }));

    const updated = recalcBalances([...history, ...newEntries]);
    setHistory(updated);

    // Uncheck added tolls
    setTolls(prev => prev.map(t => t.selected ? { ...t, selected: false } : t));
    toast({ title: `${selectedTolls.length} toll(s) added to history` });
  };

  // Add manual transaction to history
  const addManualTransaction = () => {
    if (!manualTx.amount || !manualTx.description) {
      toast({ title: 'Amount and Description are required', variant: 'destructive' });
      return;
    }

    const newEntry: HistoryEntry = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      processingTime: manualTx.processingTime,
      transactionTime: manualTx.transactionTime,
      nature: manualTx.type as 'Debit' | 'Credit',
      amount: manualTx.amount,
      closingBalance: '0',
      description: manualTx.description,
      txnId: generateTxnId(),
    };

    const updated = recalcBalances([...history, newEntry]);
    setHistory(updated);
    toast({ title: 'Transaction added', description: `${manualTx.type} of ₹${manualTx.amount}` });
    setManualTx({ processingTime: '', transactionTime: '', type: 'Debit', amount: '', description: '' });
  };

  // Delete history entry
  const handleDeleteHistory = (id: string) => {
    const updated = recalcBalances(history.filter(h => h.id !== id));
    setHistory(updated);
    toast({ title: 'Transaction deleted' });
  };

  // Edit history entry
  const handleOpenEdit = (entry: HistoryEntry) => {
    setEditingEntry({ ...entry });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingEntry) return;
    const updated = recalcBalances(history.map(h => h.id === editingEntry.id ? editingEntry : h));
    setHistory(updated);
    setEditDialogOpen(false);
    setEditingEntry(null);
    toast({ title: 'Transaction updated' });
  };

  // Bank selection screen
  if (!selectedBank) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Fast Tag</h1>
                <p className="text-sm text-muted-foreground">Select a bank to proceed</p>
              </div>
            </div>
          </motion.div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pick the bank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {banks.map((bank, index) => (
                <motion.button
                  key={bank.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedBank(bank.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="flex-1 font-medium text-foreground">{bank.name}</span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              ))}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: banks.length * 0.05 }}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/50 transition-all text-left"
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">View History</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Form / Post-submit screen
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedBank(null); setSubmitted(false); setIsEditing(false); }}>
              ← Back
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Fast Tag</h1>
              <p className="text-sm text-muted-foreground">{selectedBankName}</p>
            </div>
          </div>
        </motion.div>

        {!submitted ? (
          /* ========== FORM ========== */
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Fill the details</CardTitle>
                <CardDescription>Start by entering the customer's vehicle number</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Vehicle Number */}
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Vehicle Number</Label>
                  <div className="flex gap-3">
                    <Input
                      value={formData.vehicleNumber}
                      onChange={e => updateForm('vehicleNumber', e.target.value.toUpperCase())}
                      placeholder="Enter vehicle number"
                      className="flex-1 bg-primary/5 border-primary/20"
                    />
                    <Button variant="outline" size="sm" className="shrink-0" onClick={handleGetDetails} disabled={fetchingDetails}>
                      {fetchingDetails ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Fetching...</> : <>Get details <ExternalLink className="w-4 h-4 ml-1" /></>}
                    </Button>
                  </div>
                </div>

                {/* Customer details grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Customer Name</Label>
                    <Input value={formData.customerName} onChange={e => updateForm('customerName', e.target.value)} placeholder="Enter customer name" disabled={!detailsFetched} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Customer Mobile</Label>
                    <Input value={formData.customerMobile} onChange={e => updateForm('customerMobile', e.target.value)} placeholder="Enter mobile number" disabled={!detailsFetched} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Truck Number</Label>
                    <Input value={formData.truckNumber} onChange={e => updateForm('truckNumber', e.target.value.toUpperCase())} placeholder="Enter truck number" disabled={!detailsFetched} />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Truck Owner Name</Label>
                    <Input value={formData.truckOwnerName} onChange={e => updateForm('truckOwnerName', e.target.value)} placeholder="Enter owner name" disabled={!detailsFetched} />
                  </div>
                </div>

                {/* Statement Duration */}
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Statement Duration</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" disabled={!detailsFetched} className={cn('flex-1 w-full justify-start text-left font-normal', !formData.startDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, 'dd/MM/yyyy') : 'Start'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={formData.startDate} onSelect={d => { updateForm('startDate', d); setStartDateOpen(false); }} initialFocus className={cn('p-3 pointer-events-auto')} />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground font-medium hidden sm:block">–</span>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" disabled={!detailsFetched} className={cn('flex-1 w-full justify-start text-left font-normal', !formData.endDate && 'text-muted-foreground')}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, 'dd/MM/yyyy') : 'End'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={formData.endDate} onSelect={d => { updateForm('endDate', d); setEndDateOpen(false); }} initialFocus className={cn('p-3 pointer-events-auto')} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm text-primary/70">Select the duration for which you want the statement</p>
                </div>

                {/* Opening Balance */}
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Opening balance</Label>
                  <Input value={formData.openingBalance} onChange={e => updateForm('openingBalance', e.target.value)} placeholder="XXXXX" type="text" disabled={!detailsFetched} />
                  <p className="text-sm text-primary/70">Enter your opening balance for the statement</p>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSubmit}>Submit</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* ========== POST-SUBMIT LAYOUT ========== */
          <div className="space-y-6">
            {/* Entered Information Card */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Entered Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-primary/70">Customer Name</p>
                        <p className="font-semibold text-foreground">{formData.customerName || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-primary/70">Customer Mobile</p>
                        <p className="font-semibold text-foreground">{formData.customerMobile || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-primary/70">Truck Number</p>
                        <p className="font-semibold text-foreground">{formData.truckNumber || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-primary/70">Truck Owner Name</p>
                        <p className="font-semibold text-foreground">{formData.truckOwnerName || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-primary/70">Statement Duration</p>
                        <p className="font-semibold text-foreground">
                          {formData.startDate && formData.endDate
                            ? `${format(formData.startDate, 'dd MMM yyyy')} - ${format(formData.endDate, 'dd MMM yyyy')}`
                            : '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <IndianRupee className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-primary/70">Opening Balance</p>
                        <p className="font-semibold text-foreground">₹ {Number(formData.openingBalance).toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm" onClick={handleEdit}>
                      <Pencil className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Route Breadcrumb */}
            {routeInfo && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <Card className="border-primary/20">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-foreground">{routeInfo.routeName}</span>
                        <span className="text-sm text-muted-foreground">({routeInfo.distance} • {routeInfo.duration})</span>
                        <span className="ml-auto text-sm font-semibold text-primary">FASTag Total: ₹{routeInfo.fastagTotal}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap text-sm">
                        {routeInfo.tollSegments.map((seg, idx) => (
                          <span key={idx} className="flex items-center gap-2">
                            {idx > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                            <span className="px-3 py-1 rounded-full border border-border bg-muted/50 text-foreground">
                              {seg.name} • ₹{seg.amount}
                            </span>
                          </span>
                        ))}
                        <span className="ml-2 font-semibold text-primary">⇒ ₹{routeInfo.fastagTotal}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Find Tolls */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Find tolls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Vehicle Type</Label>
                      <Select value={vehicleType} onValueChange={setVehicleType}>
                        <SelectTrigger><SelectValue placeholder="Select a vehicle type" /></SelectTrigger>
                        <SelectContent>
                          {VEHICLE_TYPES.map(vt => {
                            const IconComp = VEHICLE_TYPE_ICONS[vt.iconKey];
                            return (
                              <SelectItem key={vt.value} value={vt.value}>
                                <span className="flex items-center gap-2">
                                  <IconComp className="h-4 w-4 text-primary" />
                                  <span>{vt.description}</span>
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Source State</Label>
                      <Select value={sourceState} onValueChange={v => { setSourceState(v); setSourceCity(''); }}>
                        <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                        <SelectContent>
                          {states.map(s => (
                            <SelectItem key={s.iso_code} value={s.iso_code}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Source City</Label>
                      <Select value={sourceCity} onValueChange={setSourceCity} disabled={!sourceState}>
                        <SelectTrigger><SelectValue placeholder="Enter source city" /></SelectTrigger>
                        <SelectContent>
                          {sourceCities.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Destination State</Label>
                      <Select value={destState} onValueChange={v => { setDestState(v); setDestCity(''); }}>
                        <SelectTrigger><SelectValue placeholder="Select a state" /></SelectTrigger>
                        <SelectContent>
                          {states.map(s => (
                            <SelectItem key={s.iso_code} value={s.iso_code}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-semibold text-foreground">Destination City</Label>
                      <Select value={destCity} onValueChange={setDestCity} disabled={!destState}>
                        <SelectTrigger><SelectValue placeholder="Enter destination city" /></SelectTrigger>
                        <SelectContent>
                          {destCities.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleGetTollRoutes}>Get Toll Routes</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tolls Table - shown after Get Toll Routes */}
            {tollsLoaded && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardContent className="pt-6">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[60px]">
                              <Checkbox
                                checked={allSelected}
                                onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                aria-label="Select all"
                              />
                            </TableHead>
                            <TableHead>Processing time</TableHead>
                            <TableHead>Transaction time</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Toll name</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tolls.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-muted-foreground text-center">No tolls found.</TableCell>
                            </TableRow>
                          ) : (
                            tolls.map(toll => (
                              <TableRow key={toll.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={toll.selected}
                                    onCheckedChange={checked => {
                                      setTolls(prev => prev.map(t => t.id === toll.id ? { ...t, selected: !!checked } : t));
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="datetime-local"
                                    value={toll.processingTime}
                                    onChange={e => setTolls(prev => prev.map(t => t.id === toll.id ? { ...t, processingTime: e.target.value } : t))}
                                    className="w-[200px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="datetime-local"
                                    value={toll.transactionTime}
                                    onChange={e => setTolls(prev => prev.map(t => t.id === toll.id ? { ...t, transactionTime: e.target.value } : t))}
                                    className="w-[200px]"
                                  />
                                </TableCell>
                                <TableCell>
                                  <span className="font-medium text-foreground">₹ {toll.amount}</span>
                                </TableCell>
                                <TableCell>
                                  <Textarea
                                    value={toll.tollName}
                                    onChange={e => setTolls(prev => prev.map(t => t.id === toll.id ? { ...t, tollName: e.target.value } : t))}
                                    className="min-h-[40px] resize-y"
                                    rows={1}
                                  />
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button onClick={handleAddSelectedTolls}>Add Selected Tolls to Statement</Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Manual Transactions */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add manual transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-3 items-end flex-wrap">
                    <div className="space-y-1.5 w-full sm:w-auto sm:flex-1">
                      <Label>Processing Time</Label>
                      <Input type="datetime-local" value={manualTx.processingTime} onChange={e => setManualTx(p => ({ ...p, processingTime: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:flex-1">
                      <Label>Transaction Time</Label>
                      <Input type="datetime-local" value={manualTx.transactionTime} onChange={e => setManualTx(p => ({ ...p, transactionTime: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:w-[120px]">
                      <Label>Type</Label>
                      <Select value={manualTx.type} onValueChange={v => setManualTx(p => ({ ...p, type: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Debit">Debit</SelectItem>
                          <SelectItem value="Credit">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:w-[120px]">
                      <Label>Amount</Label>
                      <Input value={manualTx.amount} onChange={e => setManualTx(p => ({ ...p, amount: e.target.value }))} placeholder="Amount" />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:flex-1">
                      <Label>Description</Label>
                      <Input value={manualTx.description} onChange={e => setManualTx(p => ({ ...p, description: e.target.value }))} placeholder="Description" />
                    </div>
                    <Button onClick={addManualTransaction} className="shrink-0">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* History Table */}
            {history.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Processing Time</TableHead>
                            <TableHead>Transaction Time</TableHead>
                            <TableHead>Nature</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Closing Balance</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Txn ID</TableHead>
                            <TableHead>Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {history.map(entry => (
                            <TableRow key={entry.id}>
                              <TableCell className="whitespace-nowrap">
                                {entry.processingTime ? format(new Date(entry.processingTime), 'dd MMM yy, hh:mm a') : '—'}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {entry.transactionTime ? format(new Date(entry.transactionTime), 'dd MMM yy, hh:mm a') : '—'}
                              </TableCell>
                              <TableCell>
                                <span className={cn('font-semibold', entry.nature === 'Debit' ? 'text-destructive' : 'text-green-600')}>
                                  {entry.nature}
                                </span>
                              </TableCell>
                              <TableCell>{entry.amount}</TableCell>
                              <TableCell>{entry.closingBalance}</TableCell>
                              <TableCell>{entry.description}</TableCell>
                              <TableCell className="font-mono text-xs">{entry.txnId}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(entry)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteHistory(entry.id)}>
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Generate PDF Button */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className="flex justify-center">
                <Button size="lg" className="w-full sm:w-auto px-12 py-6 text-base bg-muted-foreground hover:bg-muted-foreground/90 text-background rounded-xl">
                  Generate PDF and Save Changes
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Edit Transaction Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit transaction</DialogTitle>
            <DialogDescription>Make changes to your transaction here. Click save when you're done.</DialogDescription>
          </DialogHeader>
          {editingEntry && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Processing Time</Label>
                <Input
                  type="datetime-local"
                  value={editingEntry.processingTime}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, processingTime: e.target.value } : prev)}
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction Time</Label>
                <Input
                  type="datetime-local"
                  value={editingEntry.transactionTime}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, transactionTime: e.target.value } : prev)}
                />
              </div>
              <div className="space-y-2">
                <Label>Nature</Label>
                <div className="flex rounded-lg overflow-hidden border border-border">
                  <button
                    type="button"
                    className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors', editingEntry.nature === 'Debit' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted')}
                    onClick={() => setEditingEntry(prev => prev ? { ...prev, nature: 'Debit' } : prev)}
                  >
                    Debit
                  </button>
                  <button
                    type="button"
                    className={cn('flex-1 py-2.5 text-sm font-semibold transition-colors', editingEntry.nature === 'Credit' ? 'bg-foreground text-background' : 'bg-background text-foreground hover:bg-muted')}
                    onClick={() => setEditingEntry(prev => prev ? { ...prev, nature: 'Credit' } : prev)}
                  >
                    Credit
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input
                  value={editingEntry.amount}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, amount: e.target.value } : prev)}
                  placeholder="Amount"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={editingEntry.description}
                  onChange={e => setEditingEntry(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  placeholder="Description"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
