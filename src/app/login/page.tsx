
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { login, getCurrentUser } from '@/lib/auth';
import { Utensils, LogIn } from 'lucide-react';
import { AppHeader } from '@/components/layout/AppHeader';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, redirect them away from login page
    const user = getCurrentUser();
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'waiter') {
        router.push('/waiter');
      } else {
        router.push('/'); // Fallback to home for unknown roles or if preferred
      }
    }
  }, [router]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    const user = login(username, password);
    setIsLoading(false);

    if (user) {
      toast({ title: 'Login Successful', description: `Welcome, ${user.username}!` });
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'waiter') {
        router.push('/waiter');
      } else {
        // Fallback for other roles or if no specific redirect is defined
        router.push('/');
      }
    } else {
      toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <AppHeader title="Restaurant System Login" />
      <main className="flex items-center justify-center flex-grow p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <Utensils className="w-16 h-16 mx-auto mb-4 text-primary" />
            <CardTitle className="text-3xl">Welcome Back</CardTitle>
            <CardDescription>Please sign in to access your dashboard.</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g., admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading} size="lg">
                {isLoading ? (
                  <LogIn className="w-5 h-5 mr-2 animate-pulse" />
                ) : (
                  <LogIn className="w-5 h-5 mr-2" />
                )}
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
      <footer className="py-4 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Gastronomic Gatherer. All rights reserved.
      </footer>
    </div>
  );
}
