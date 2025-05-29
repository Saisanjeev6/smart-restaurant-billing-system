
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createUser, getUsers } from '@/lib/auth';
import type { User, UserRole, NewUserCredentials } from '@/types';
import { UserPlus, Users, ShieldCheck, BadgeInfo, ChefHat, ConciergeBell } from 'lucide-react';

export function ManageUsersTool() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('waiter');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setUsers(getUsers()); // Fetch waiters and kitchen staff
  }, []);

  const handleCreateUser = (event: FormEvent) => {
    event.preventDefault();
    if (!newUsername.trim() || !newUserPassword.trim()) {
      toast({ title: 'Error', description: 'Username and password cannot be empty.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const credentials: NewUserCredentials = { username: newUsername, password: newUserPassword, role: newUserRole as 'waiter' | 'kitchen' };
    const result = createUser(credentials);
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setUsers(result.users || getUsers()); 
      setNewUsername('');
      setNewUserPassword('');
      setNewUserRole('waiter'); // Reset role to default
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'waiter') return <ConciergeBell className="w-4 h-4 text-blue-600" />;
    if (role === 'kitchen') return <ChefHat className="w-4 h-4 text-orange-600" />;
    return <ShieldCheck className="w-4 h-4 text-green-600" />; // Default or admin
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><UserPlus className="text-primary" /> Create New User</CardTitle>
          <CardDescription>Add new waiter or kitchen staff accounts to the system.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateUser}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newUsername">Username</Label>
              <Input
                id="newUsername"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g., user_john"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newUserPassword">Password</Label>
              <Input
                id="newUserPassword"
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                placeholder="Set a secure password"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newUserRole">Role</Label>
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as UserRole)}>
                <SelectTrigger id="newUserRole">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="kitchen">Kitchen Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="p-3 mt-2 rounded-md bg-destructive/10 border border-destructive/30">
                <div className="flex items-start gap-2">
                    <BadgeInfo className="w-5 h-5 mt-0.5 text-destructive" />
                    <p className="text-xs text-destructive/90">
                        <strong>Security Notice:</strong> Passwords are stored in plaintext in browser localStorage for this prototype. This is <strong>highly insecure</strong> and not suitable for production environments. Use strong, unique passwords if testing, and do not use real credentials.
                    </p>
                </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Users className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Create User
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Users className="text-primary" /> Existing Staff Accounts</CardTitle>
          <CardDescription>List of all waiter and kitchen staff accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground">No staff accounts created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="flex items-center gap-1 capitalize">
                      {getRoleIcon(user.role)}
                      {user.role}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
