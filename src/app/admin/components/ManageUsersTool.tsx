
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { createUser, getUsers, deleteUser } from '@/lib/auth'; // Removed updateUserPassword
import type { User, UserRole, NewUserCredentials } from '@/types';
import { UserPlus, Users, ShieldCheck, ChefHat, ConciergeBell, Trash2, BadgeInfo } from 'lucide-react'; // Removed Pencil
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ManageUsersTool() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('waiter');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
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
      setNewUserRole('waiter');
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleOpenDeleteDialog = (user: User) => {
    setDeletingUser(user);
    setShowDeleteConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    setIsLoading(true);
    const result = deleteUser(deletingUser.id);
    setIsLoading(false);
    setShowDeleteConfirmDialog(false);
    setDeletingUser(null);

    if (result.success) {
      toast({ title: 'Success', description: result.message });
      setUsers(result.users || getUsers());
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const getRoleIcon = (role: UserRole) => {
    if (role === 'waiter') return <ConciergeBell className="w-4 h-4 text-blue-600" />;
    if (role === 'kitchen') return <ChefHat className="w-4 h-4 text-orange-600" />;
    return <ShieldCheck className="w-4 h-4 text-green-600" />; 
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
          <CardDescription>List of all waiter and kitchen staff accounts. Admins are not listed here.</CardDescription>
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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      {/* Update Password Button Removed */}
                      <Button variant="destructive" size="sm" onClick={() => handleOpenDeleteDialog(user)} disabled={isLoading}>
                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Update Password Dialog Removed */}

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete {deletingUser?.username}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user account ({deletingUser?.role}) will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingUser(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
             {isLoading ? <Trash2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

