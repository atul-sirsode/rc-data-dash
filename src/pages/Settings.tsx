import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings as SettingsIcon, Users, Building2, Plus, Trash2, Shield } from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { getAdminSettings, saveAdminSettings, AdminSettings, UserAccess, getAllMenuItems } from '@/lib/admin-settings';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Settings() {
  const [settings, setSettings] = useState<AdminSettings>(getAdminSettings());
  const { toast } = useToast();
  const menuItems = getAllMenuItems();

  // New user form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // New bank form
  const [newBankName, setNewBankName] = useState('');

  const save = (updated: AdminSettings) => {
    setSettings(updated);
    saveAdminSettings(updated);
    toast({ title: 'Settings saved' });
  };

  const addUser = () => {
    if (!newUsername.trim()) return;
    const updated = {
      ...settings,
      users: [
        ...settings.users,
        {
          username: newUsername.trim(),
          password: newPassword.trim() || undefined,
          bypassOTP: false,
          allowedMenus: ['rc-verification'],
          isAdmin: false,
        } as UserAccess,
      ],
    };
    save(updated);
    setNewUsername('');
    setNewPassword('');
  };

  const removeUser = (username: string) => {
    save({ ...settings, users: settings.users.filter(u => u.username !== username) });
  };

  const updateUser = (username: string, patch: Partial<UserAccess>) => {
    save({
      ...settings,
      users: settings.users.map(u => (u.username === username ? { ...u, ...patch } : u)),
    });
  };

  const toggleUserMenu = (username: string, menuId: string) => {
    const user = settings.users.find(u => u.username === username);
    if (!user) return;
    const menus = user.allowedMenus.includes(menuId)
      ? user.allowedMenus.filter(m => m !== menuId)
      : [...user.allowedMenus, menuId];
    updateUser(username, { allowedMenus: menus });
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
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage users, access, and banks</p>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" /> Users & Access
            </TabsTrigger>
            <TabsTrigger value="banks" className="gap-2">
              <Building2 className="w-4 h-4" /> Bank List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-4">
            {/* Add User */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add User</CardTitle>
                <CardDescription>Add a user with optional OTP bypass</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label>Username</Label>
                    <Input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="Username" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label>Password (for bypass)</Label>
                    <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password" type="password" />
                  </div>
                  <Button onClick={addUser} className="gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* User List */}
            {settings.users.map((user) => (
              <Card key={user.username}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-semibold text-foreground">{user.username}</span>
                        {user.isAdmin && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Admin</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={user.bypassOTP}
                          onCheckedChange={(v) => updateUser(user.username, { bypassOTP: v })}
                        />
                        <Label className="text-sm">Bypass OTP (direct login)</Label>
                      </div>

                      <div className="flex items-center gap-3">
                        <Switch
                          checked={user.isAdmin}
                          onCheckedChange={(v) => updateUser(user.username, { isAdmin: v })}
                        />
                        <Label className="text-sm">Admin access</Label>
                      </div>

                      <div>
                        <Label className="text-sm mb-2 block">Menu Access</Label>
                        <div className="flex flex-wrap gap-3">
                          {menuItems.map((menu) => (
                            <label key={menu.id} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={user.allowedMenus.includes(menu.id)}
                                onCheckedChange={() => toggleUserMenu(user.username, menu.id)}
                              />
                              {menu.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button variant="ghost" size="icon" onClick={() => removeUser(user.username)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="banks" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
