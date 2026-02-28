-- Create fasttag_sessions table
CREATE TABLE public.fasttag_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  vehicle_number TEXT NOT NULL,
  customer_name TEXT,
  customer_mobile TEXT,
  truck_number TEXT,
  truck_owner_name TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fasttag_history table
CREATE TABLE public.fasttag_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.fasttag_sessions(id) ON DELETE CASCADE,
  processing_time TIMESTAMP WITH TIME ZONE,
  transaction_time TIMESTAMP WITH TIME ZONE,
  nature TEXT NOT NULL CHECK (nature IN ('Debit', 'Credit')),
  amount NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  txn_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fasttag_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fasttag_history ENABLE ROW LEVEL SECURITY;

-- Allow all operations (app uses custom auth, not Supabase auth)
CREATE POLICY "Allow all access to fasttag_sessions" ON public.fasttag_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to fasttag_history" ON public.fasttag_history FOR ALL USING (true) WITH CHECK (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_fasttag_sessions_updated_at
  BEFORE UPDATE ON public.fasttag_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();