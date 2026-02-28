import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileSpreadsheet, Info, AlertCircle, CheckCircle2, X, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

const REQUIRED_COLUMNS = [
  'rc_number',
  'source_state',
  'source_city',
  'destination_state',
  'destination_city',
  'opening_amount',
  'start_date',
];

const COLUMN_LABELS: Record<string, string> = {
  rc_number: 'RC Number',
  source_state: 'Source State',
  source_city: 'Source City',
  destination_state: 'Destination State',
  destination_city: 'Destination City',
  opening_amount: 'Opening Amount',
  start_date: 'Start Date',
};

interface UploadedRow {
  [key: string]: string;
}

interface ValidationResult {
  valid: boolean;
  data: UploadedRow[];
  errors: string[];
  mappedColumns: Record<string, string>;
  fileName: string;
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/[\s\-]+/g, '_');
}

function findColumn(headers: string[], target: string): string | null {
  const aliases: Record<string, string[]> = {
    rc_number: ['rc_number', 'rcnumber', 'rc', 'registration_number', 'vehicle_number', 'veh_no'],
    source_state: ['source_state', 'sourcestate', 'from_state', 'fromstate', 'src_state'],
    source_city: ['source_city', 'sourcecity', 'from_city', 'fromcity', 'src_city'],
    destination_state: ['destination_state', 'destinationstate', 'dest_state', 'deststate', 'to_state', 'tostate'],
    destination_city: ['destination_city', 'destinationcity', 'dest_city', 'destcity', 'to_city', 'tocity'],
    opening_amount: ['opening_amount', 'openingamount', 'opening_balance', 'openingbalance', 'amount'],
    start_date: ['start_date', 'startdate', 'date', 'from_date', 'fromdate'],
  };

  const targetAliases = aliases[target] || [target];
  for (const header of headers) {
    const norm = normalizeHeader(header);
    if (targetAliases.includes(norm)) return header;
  }
  return null;
}

function validateFile(headers: string[], data: Record<string, unknown>[], fileName: string): ValidationResult {
  const errors: string[] = [];
  const mappedColumns: Record<string, string> = {};

  for (const req of REQUIRED_COLUMNS) {
    const found = findColumn(headers, req);
    if (!found) {
      errors.push(`Missing required column: "${COLUMN_LABELS[req]}"`);
    } else {
      mappedColumns[req] = found;
    }
  }

  if (errors.length > 0) {
    return { valid: false, data: [], errors, mappedColumns, fileName };
  }

  const rows: UploadedRow[] = data.map((row) => {
    const mapped: UploadedRow = {};
    for (const [key, originalHeader] of Object.entries(mappedColumns)) {
      mapped[key] = String(row[originalHeader] || '').trim();
    }
    return mapped;
  });

  // Validate each row
  const rowErrors: string[] = [];
  rows.forEach((row, idx) => {
    if (!row.rc_number) rowErrors.push(`Row ${idx + 1}: RC Number is empty`);
    if (!row.source_state) rowErrors.push(`Row ${idx + 1}: Source State is empty`);
    if (!row.destination_state) rowErrors.push(`Row ${idx + 1}: Destination State is empty`);
    if (!row.opening_amount || isNaN(Number(row.opening_amount))) rowErrors.push(`Row ${idx + 1}: Opening Amount is invalid`);
  });

  if (rowErrors.length > 0 && rowErrors.length <= 5) {
    errors.push(...rowErrors);
  } else if (rowErrors.length > 5) {
    errors.push(...rowErrors.slice(0, 5));
    errors.push(`...and ${rowErrors.length - 5} more row errors`);
  }

  return { valid: rowErrors.length === 0, data: rows, errors, mappedColumns, fileName };
}

export default function FastTagUpload() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);

  const processFile = useCallback(async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      toast({ title: 'Unsupported file format', description: 'Please upload a CSV or Excel file', variant: 'destructive' });
      return;
    }

    setParsing(true);
    try {
      let headers: string[] = [];
      let data: Record<string, unknown>[] = [];

      if (ext === 'csv') {
        const parsed = await new Promise<Papa.ParseResult<Record<string, unknown>>>((resolve) => {
          Papa.parse<Record<string, unknown>>(file, { header: true, skipEmptyLines: true, complete: resolve });
        });
        headers = parsed.meta.fields || [];
        data = parsed.data;
      } else {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
        if (data.length > 0) headers = Object.keys(data[0]);
      }

      if (data.length === 0) {
        toast({ title: 'File is empty', variant: 'destructive' });
        setParsing(false);
        return;
      }

      const validation = validateFile(headers, data, file.name);
      setResult(validation);

      if (validation.valid) {
        toast({ title: `${validation.data.length} rows loaded successfully` });
      } else {
        toast({ title: 'Validation issues found', description: `${validation.errors.length} issue(s)`, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to parse file', variant: 'destructive' });
    } finally {
      setParsing(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const clearResult = () => {
    setResult(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Upload File to Get Toll Details</h1>
              <p className="text-sm text-muted-foreground">Import a CSV or Excel file with vehicle and route data for toll search</p>
            </div>
          </div>
        </motion.div>

        {/* Upload Area */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all',
                dragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-muted/30'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center gap-3">
                {parsing ? (
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                    <Upload className="w-7 h-7 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold text-foreground">Upload CSV or Excel file</p>
                  <p className="text-sm text-muted-foreground mt-1">Drag and drop or click to browse</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileSpreadsheet className="w-4 h-4" />
                  Supports .csv, .xlsx, .xls files
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* File Requirements */}
        {!result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-primary" />
                  File Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    File must contain these required columns:
                    <div className="flex flex-wrap gap-1.5 ml-1">
                      {REQUIRED_COLUMNS.map(col => (
                        <Badge key={col} variant="secondary" className="text-xs">{COLUMN_LABELS[col]}</Badge>
                      ))}
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Supported formats: CSV, XLSX, XLS
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    Each row should contain one vehicle's toll route data
                  </li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Results */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* File Info Bar */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{result.fileName}</p>
                  <p className="text-xs text-muted-foreground">{result.data.length} rows loaded</p>
                </div>
                {result.valid ? (
                  <Badge className="gap-1 bg-success/10 text-success border-success/30" variant="outline">
                    <CheckCircle2 className="w-3 h-3" /> Valid
                  </Badge>
                ) : (
                  <Badge className="gap-1" variant="destructive">
                    <AlertCircle className="w-3 h-3" /> Has Issues
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={clearResult}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Errors */}
            {result.errors.length > 0 && (
              <Card className="border-destructive/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-sm text-destructive">{err}</p>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Data Table */}
            {result.data.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Uploaded Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-semibold whitespace-nowrap w-10">#</TableHead>
                            {REQUIRED_COLUMNS.map(col => (
                              <TableHead key={col} className="text-xs font-semibold whitespace-nowrap">
                                {COLUMN_LABELS[col]}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.data.slice(0, 50).map((row, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-xs text-muted-foreground">{idx + 1}</TableCell>
                              {REQUIRED_COLUMNS.map(col => (
                                <TableCell key={col} className="text-sm whitespace-nowrap">
                                  {row[col] || <span className="text-destructive">—</span>}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  {result.data.length > 50 && (
                    <p className="text-xs text-muted-foreground text-center mt-3">
                      Showing first 50 of {result.data.length} rows
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action buttons */}
            {result.valid && result.data.length > 0 && (
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={clearResult}>Upload Another</Button>
                <Button onClick={() => toast({ title: 'Processing toll search', description: `Processing ${result.data.length} entries...` })}>
                  Process Toll Search
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
