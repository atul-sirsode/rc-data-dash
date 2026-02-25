import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getEnabledBanks } from '@/lib/admin-settings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function FastTag() {
  const banks = getEnabledBanks();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
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

        {/* Bank Selection */}
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
                onClick={() => setSelectedBank(bank.id === selectedBank ? null : bank.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selectedBank === bank.id
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-border hover:border-primary/40 hover:bg-muted/50'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                </div>
                <span className="flex-1 font-medium text-foreground">{bank.name}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </motion.button>
            ))}

            {/* View History */}
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

        {selectedBank && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-lg font-medium text-foreground mb-1">Coming Soon</p>
                <p className="text-sm">
                  Fast Tag verification for{' '}
                  <span className="font-semibold text-foreground">
                    {banks.find(b => b.id === selectedBank)?.name}
                  </span>{' '}
                  will be available soon.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
