import { AppLayout } from '@/components/AppLayout';
import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FastTagUpload() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">FastTag Upload</h1>
              <p className="text-sm text-muted-foreground">Upload and manage FastTag data</p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-lg font-medium text-foreground">Coming Soon</p>
          <p className="text-sm text-muted-foreground mt-1">FastTag upload functionality will be available here.</p>
        </div>
      </div>
    </AppLayout>
  );
}
