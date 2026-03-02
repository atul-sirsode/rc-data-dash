import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Building2, Plus, Trash2, ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/AppLayout';
import { getAdminSettings, saveAdminSettings, AdminSettings } from '@/lib/admin-settings';
import { getDbProvider, setDbProvider, getMongoApiBaseUrl, setMongoApiBaseUrl, DbProvider } from '@/config/db-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const { toast } = useToast();
  const [newBankName, setNewBankName] = useState('');
  const [dbProvider, setDbProviderState] = useState<DbProvider>(getDbProvider());
  const [mongoUrl, setMongoUrl] = useState(getMongoApiBaseUrl());

  const handleProviderToggle = () => {
    const next: DbProvider = dbProvider === 'supabase' ? 'mongodb' : 'supabase';
    setDbProvider(next);
    setDbProviderState(next);
    toast({ title: `Switched to ${next === 'supabase' ? 'Supabase (PostgreSQL)' : 'MongoDB'}` });
  };

  const handleMongoUrlSave = () => {
    setMongoApiBaseUrl(mongoUrl);
    toast({ title: 'MongoDB API URL saved' });
  };

  const save = (updated: AdminSettings) => {
    setSettings(updated);
    saveAdminSettings(updated);
    toast({ title: 'Settings saved' });
  };

  const addBank = () => {
    if (!newBankName.trim()) return;
    const id = newBankName.trim().toLowerCase().replace(/\s+/g, '-');
    save({
      ...settings,
      banks: [...settings.banks, { id, name: newBankName.trim(), enabled: true }],
    });
    setNewBankName('');
  };

  const removeBank = (id: string) => {
    save({ ...settings, banks: settings.banks.filter(b => b.id !== id) });
  };

  const toggleBank = (id: string) => {
    save({
      ...settings,
      banks: settings.banks.map(b => (b.id === id ? { ...b, enabled: !b.enabled } : b)),
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <SettingsIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground">Manage bank list</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Exit
            </Button>
          </div>
        </motion.div>

        <div className="space-y-4">
          {/* Database Provider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4" /> Database Provider
              </CardTitle>
              <CardDescription>Switch between Supabase (PostgreSQL) and MongoDB for FastTag operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {dbProvider === 'supabase' ? 'Supabase (PostgreSQL)' : 'MongoDB'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dbProvider === 'supabase' ? 'Using Lovable Cloud backend' : 'Using external MongoDB REST API'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">PG</span>
                  <Switch checked={dbProvider === 'mongodb'} onCheckedChange={handleProviderToggle} />
                  <span className="text-xs text-muted-foreground">Mongo</span>
                </div>
              </div>
              {dbProvider === 'mongodb' && (
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label>MongoDB API Base URL</Label>
                    <Input
                      value={mongoUrl}
                      onChange={e => setMongoUrl(e.target.value)}
                      placeholder="http://localhost:5000/api"
                    />
                  </div>
                  <Button variant="outline" onClick={handleMongoUrlSave}>Save</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Bank */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Add Bank</CardTitle>
              <CardDescription>Add a new bank to the Fast Tag bank list</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-1">
                  <Label>Bank Name</Label>
                  <Input value={newBankName} onChange={e => setNewBankName(e.target.value)} placeholder="e.g. IDFC First Bank | Blackbuck" />
                </div>
                <Button onClick={addBank} className="gap-2">
                  <Plus className="w-4 h-4" /> Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bank List */}
          {settings.banks.map((bank) => (
            <Card key={bank.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch checked={bank.enabled} onCheckedChange={() => toggleBank(bank.id)} />
                    <span className={`font-medium ${bank.enabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {bank.name}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeBank(bank.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
