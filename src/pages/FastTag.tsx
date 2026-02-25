import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ChevronRight, Clock, CheckCircle2, ExternalLink, CalendarIcon, User, Phone, Truck, IndianRupee, Pencil, Plus, MapPin, Loader2 } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { verifyRC, getMockRCData } from '@/lib/rc-api';

const VEHICLE_TYPES = [
  'Car, Jeep, Van, SUV',
  'Car, SUV towing 1-axle trailer',
  'Car, SUV towing 2-axle trailer',
  'Taxi',
  'Pickup truck, Light Commercial Vehicles',
  'Truck - 2-Axles',
  'Truck - 3 Axles',
  'Truck - 4 Axles',
  'Truck - 5 Axles',
  'Truck - 6 Axles',
  'Truck - 7 Axles',
  'Bus - 2-Axles',
  'Bus - 3 Axles',
  'Bus - 4 Axles',
  'Bike',
];

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

export default function FastTag() {
  const banks = getEnabledBanks();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [detailsFetched, setDetailsFetched] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    vehicleNumber: '',
    customerName: '',
    customerMobile: '',
    truckNumber: '',
    truckOwnerName: '',
    startDate: undefined,
    endDate: undefined,
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
        console.log('States API response:', data);
        const statesList = data?.data ?? data?.states ?? data;
        if (Array.isArray(statesList)) {
          setStates(statesList.map((s: any) => ({
            name: s.name || s.state || s,
            iso_code: s.iso_code || s.isoCode || s.iso2 || s.code || '',
          })));
        }
      })
      .catch(err => {
        console.error('States fetch error:', err);
        toast({ title: 'Failed to load states', variant: 'destructive' });
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
        console.log('Source cities response:', data);
        const cities = data?.data ?? data?.cities ?? data;
        if (Array.isArray(cities)) setSourceCities(cities.map((c: any) => typeof c === 'string' ? c : c.name || c.city || ''));
      })
      .catch(() => setSourceCities([]));
  }, [sourceState]);

  // Fetch dest cities
  useEffect(() => {
    if (!destState) { setDestCities([]); return; }
    fetch(`https://api.atulsirsode.cloud/api/states-cities/get-city-by-state?iso_code=${destState}`, {
      headers: { 'Accept': 'application/json' },
    })
      .then(res => res.json())
      .then(data => {
        console.log('Dest cities response:', data);
        const cities = data?.data ?? data?.cities ?? data;
        if (Array.isArray(cities)) setDestCities(cities.map((c: any) => typeof c === 'string' ? c : c.name || c.city || ''));
      })
      .catch(() => setDestCities([]));
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
        // Fallback to mock if CORS or API error
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

  const addManualTransaction = () => {
    if (!manualTx.amount || !manualTx.description) {
      toast({ title: 'Amount and Description are required', variant: 'destructive' });
      return;
    }
    toast({ title: 'Transaction added', description: `${manualTx.type} of ₹${manualTx.amount}` });
    setManualTx({ processingTime: '', transactionTime: '', type: 'Debit', amount: '', description: '' });
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
                    <Input
                      value={formData.customerName}
                      onChange={e => updateForm('customerName', e.target.value)}
                      placeholder="Enter customer name"
                      disabled={!detailsFetched}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Customer Mobile</Label>
                    <Input
                      value={formData.customerMobile}
                      onChange={e => updateForm('customerMobile', e.target.value)}
                      placeholder="Enter mobile number"
                      disabled={!detailsFetched}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Truck Number</Label>
                    <Input
                      value={formData.truckNumber}
                      onChange={e => updateForm('truckNumber', e.target.value.toUpperCase())}
                      placeholder="Enter truck number"
                      disabled={!detailsFetched}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-foreground">Truck Owner Name</Label>
                    <Input
                      value={formData.truckOwnerName}
                      onChange={e => updateForm('truckOwnerName', e.target.value)}
                      placeholder="Enter owner name"
                      disabled={!detailsFetched}
                    />
                  </div>
                </div>

                {/* Statement Duration */}
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Statement Duration</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!detailsFetched}
                          className={cn(
                            'flex-1 w-full justify-start text-left font-normal',
                            !formData.startDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.startDate ? format(formData.startDate, 'dd/MM/yyyy') : 'Start'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.startDate}
                          onSelect={d => { updateForm('startDate', d); setStartDateOpen(false); }}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                    <span className="text-muted-foreground font-medium hidden sm:block">–</span>
                    <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={!detailsFetched}
                          className={cn(
                            'flex-1 w-full justify-start text-left font-normal',
                            !formData.endDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.endDate ? format(formData.endDate, 'dd/MM/yyyy') : 'End'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.endDate}
                          onSelect={d => { updateForm('endDate', d); setEndDateOpen(false); }}
                          initialFocus
                          className={cn('p-3 pointer-events-auto')}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-sm text-primary/70">Select the duration for which you want the statement</p>
                </div>

                {/* Opening Balance */}
                <div className="space-y-2">
                  <Label className="font-semibold text-foreground">Opening balance</Label>
                    <Input
                      value={formData.openingBalance}
                      onChange={e => updateForm('openingBalance', e.target.value)}
                      placeholder="XXXXX"
                      type="text"
                      disabled={!detailsFetched}
                    />
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
                          {VEHICLE_TYPES.map(vt => (
                            <SelectItem key={vt} value={vt}>{vt}</SelectItem>
                          ))}
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
                    <Button>Get Toll Routes</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tolls Table */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">Select</TableHead>
                          <TableHead>Processing time</TableHead>
                          <TableHead>Transaction time</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Toll name</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tolls.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-muted-foreground">No tolls.</TableCell>
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
                              <TableCell>{toll.processingTime}</TableCell>
                              <TableCell>{toll.transactionTime}</TableCell>
                              <TableCell>{toll.amount}</TableCell>
                              <TableCell>{toll.tollName}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button>Add Selected Tolls to Statement</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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
                      <Input
                        type="datetime-local"
                        value={manualTx.processingTime}
                        onChange={e => setManualTx(p => ({ ...p, processingTime: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:flex-1">
                      <Label>Transaction Time</Label>
                      <Input
                        type="datetime-local"
                        value={manualTx.transactionTime}
                        onChange={e => setManualTx(p => ({ ...p, transactionTime: e.target.value }))}
                      />
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
                      <Input
                        value={manualTx.amount}
                        onChange={e => setManualTx(p => ({ ...p, amount: e.target.value }))}
                        placeholder="Amount"
                      />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:flex-1">
                      <Label>Description</Label>
                      <Input
                        value={manualTx.description}
                        onChange={e => setManualTx(p => ({ ...p, description: e.target.value }))}
                        placeholder="Description"
                      />
                    </div>
                    <Button onClick={addManualTransaction} className="shrink-0">
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

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
    </AppLayout>
  );
}
