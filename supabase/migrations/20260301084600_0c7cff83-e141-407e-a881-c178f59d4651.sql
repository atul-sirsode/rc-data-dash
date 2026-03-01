CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  start_date DATE NOT NULL,
  validity_days INTEGER NOT NULL DEFAULT 30,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to user_subscriptions" ON public.user_subscriptions FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.compute_subscription_end_date()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $function$
BEGIN
  NEW.end_date := NEW.start_date + (NEW.validity_days || ' days')::INTERVAL;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_subscription_end_date
  BEFORE INSERT OR UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_subscription_end_date();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();