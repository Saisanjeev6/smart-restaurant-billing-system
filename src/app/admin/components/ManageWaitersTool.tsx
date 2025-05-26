'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createUser, getUsers } from '@/lib/auth';
import type { User, NewUserCredentials } from '@/types';
import { UserPlus, Users, ShieldCheck, BadgeInfo } from 'lucide-react';

export function ManageWaitersTool() {
  const [waiters, setWaiters] = useState<User[]>([]);
  const [newWaiterUsername, setNewWaiterUsername] = useState('');
  const [newWaiterPassword, setNewWaiterPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setWaiters(getUsers('waiter'));
  }, []);

  const handleCreateWaiter = (event: FormEvent) => {
    event.preventDefault();
    if (!newWaiterUsername.trim() || !newWaiterPassword.trim()) {
      toast({ title: 'Error', description: 'Username and password cannot be empty.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const result = createUser({ username: newWaiterUsername, password: newWaiterPassword, role: 'waiter' });
    setIsLoading(false);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setWaiters(result.users || getUsers('waiter')); // Update waiter list
      setNewWaiterUsername('');
      setNewWaiterPassword('');
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><UserPlus className="text-primary" /> Create New Waiter</CardTitle>
          <CardDescription>Add new waiter accounts to the system.</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateWaiter}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="newWaiterUsername">Waiter Username</Label>
              <Input
                id="newWaiterUsername"
                value={newWaiterUsername}
                onChange={(e) => setNewWaiterUsername(e.target.value)}
                placeholder="e.g., waiter_john"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="newWaiterPassword">Password</Label>
              <Input
                id="newWaiterPassword"
                type="password"
                value={newWaiterPassword}
                onChange={(e) => setNewWaiterPassword(e.target.value)}
                placeholder="Set a secure password"
                required
              />
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
              Create Waiter
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl"><Users className="text-primary" /> Existing Waiters</CardTitle>
          <CardDescription>List of all waiter accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          {waiters.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground">No waiter accounts created yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waiters.map((waiter) => (
                  <TableRow key={waiter.id}>
                    <TableCell className="font-medium">{waiter.username}</TableCell>
                    <TableCell className="flex items-center gap-1 capitalize">
                      <ShieldCheck className="w-4 h-4 text-green-600" /> 
                      {waiter.role}
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
