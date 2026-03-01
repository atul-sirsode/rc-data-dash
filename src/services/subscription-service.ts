import { supabase } from '@/integrations/supabase/client';
import type { Subscription, SubscriptionInput } from '@/models/subscription';

// ─── Repository Interface ────────────────────────────────────────
export interface ISubscriptionRepository {
  upsert(data: SubscriptionInput): Promise<Subscription>;
  getByUsername(username: string): Promise<Subscription | null>;
  getAll(): Promise<Subscription[]>;
}

// ─── Supabase Implementation ─────────────────────────────────────
class SupabaseSubscriptionRepository implements ISubscriptionRepository {
  async upsert(data: SubscriptionInput): Promise<Subscription> {
    // Check if subscription exists for this user
    const existing = await this.getByUsername(data.username);

    if (existing) {
      const { data: result, error } = await supabase
        .from('user_subscriptions' as any)
        .update({
          start_date: data.start_date,
          validity_days: data.validity_days,
        } as any)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(`Failed to update subscription: ${error.message}`);
      return result as unknown as Subscription;
    }

    const { data: result, error } = await supabase
      .from('user_subscriptions' as any)
      .insert({
        username: data.username,
        start_date: data.start_date,
        validity_days: data.validity_days,
        end_date: data.start_date, // placeholder, trigger computes real value
      } as any)
      .select()
      .single();
    if (error) throw new Error(`Failed to create subscription: ${error.message}`);
    return result as unknown as Subscription;
  }

  async getByUsername(username: string): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('user_subscriptions' as any)
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return data as unknown as Subscription | null;
  }

  async getAll(): Promise<Subscription[]> {
    const { data, error } = await supabase
      .from('user_subscriptions' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`Failed to fetch subscriptions: ${error.message}`);
    return (data || []) as unknown as Subscription[];
  }
}

// ─── Service Layer ───────────────────────────────────────────────
export class SubscriptionService {
  constructor(private repo: ISubscriptionRepository = new SupabaseSubscriptionRepository()) {}

  async saveSubscription(input: SubscriptionInput): Promise<Subscription> {
    return this.repo.upsert(input);
  }

  async getSubscription(username: string): Promise<Subscription | null> {
    return this.repo.getByUsername(username);
  }

  async getAllSubscriptions(): Promise<Subscription[]> {
    return this.repo.getAll();
  }

  /**
   * Returns days remaining. Negative means expired.
   */
  getDaysRemaining(subscription: Subscription): number {
    const end = new Date(subscription.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }

  shouldShowWarning(subscription: Subscription): boolean {
    const days = this.getDaysRemaining(subscription);
    return days >= 0 && days <= 7;
  }

  isExpired(subscription: Subscription): boolean {
    return this.getDaysRemaining(subscription) < 0;
  }
}

export const subscriptionService = new SubscriptionService();
