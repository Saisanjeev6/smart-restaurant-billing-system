
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Utensils, LogIn, Shield, UserCheck, Soup } from 'lucide-react'; // Added Soup for Kitchen
import { AppHeader } from '@/components/layout/AppHeader';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';

export default function Home() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get current user directly for rendering decisions *after* component is mounted
  const currentUserForRender = isMounted ? getCurrentUser() : null;

  if (!isMounted) {
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Gastronomic Gatherer" />
        <main className="flex items-center justify-center flex-grow">
          <Utensils className="w-16 h-16 animate-pulse text-primary" />
        </main>
        <footer className="py-6 mt-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
        </footer>
      </div>
    );
  }

  // Content for logged-in ADMIN users
  if (currentUserForRender && currentUserForRender.role === 'admin') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <AppHeader title="Admin Hub" />
        <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
          <Utensils className="w-24 h-24 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Admin Hub
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Access administrative tools or manage takeaway orders.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-2xl mx-auto w-full px-4 sm:px-0">
            <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
              <CardHeader className="items-center text-center">
                <Shield className="w-12 h-12 mb-3 text-destructive" />
                <CardTitle className="text-2xl">Admin Console</CardTitle>
                <CardDescription>Manage system settings and users.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild size="lg" className="w-full">
                  <Link href="/admin">Go to Admin Console</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
              <CardHeader className="items-center text-center">
                <ShoppingBag className="w-12 h-12 mb-3 text-accent" />
                <CardTitle className="text-2xl">Takeaway Orders</CardTitle>
                <CardDescription>Process and manage takeaway sales.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild size="lg" className="w-full">
                  <Link href="/takeaway">Go to Takeaway</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="py-6 mt-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
        </footer>
      </div>
    );
  }

  // Content for logged-in WAITER users
  if (currentUserForRender && currentUserForRender.role === 'waiter') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <AppHeader title="Waiter Hub" />
        <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
          <Utensils className="w-24 h-24 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Waiter Hub
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            Access your dashboard or manage takeaway orders.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-2xl mx-auto w-full px-4 sm:px-0">
            <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
              <CardHeader className="items-center text-center">
                <UserCheck className="w-12 h-12 mb-3 text-primary" />
                <CardTitle className="text-2xl">Waiter Dashboard</CardTitle>
                <CardDescription>Manage your tables and orders.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild size="lg" className="w-full">
                  <Link href="/waiter">Go to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
              <CardHeader className="items-center text-center">
                <ShoppingBag className="w-12 h-12 mb-3 text-accent" />
                <CardTitle className="text-2xl">Takeaway Orders</CardTitle>
                <CardDescription>Process and manage takeaway sales.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild size="lg" className="w-full">
                  <Link href="/takeaway">Go to Takeaway</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="py-6 mt-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
        </footer>
      </div>
    );
  }

  // Content for logged-in KITCHEN users
  if (currentUserForRender && currentUserForRender.role === 'kitchen') {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
        <AppHeader title="Kitchen Hub" />
        <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
          <Soup className="w-24 h-24 mx-auto mb-6 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Kitchen Hub
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-xl">
            View and manage incoming food orders.
          </p>
          <div className="grid grid-cols-1 max-w-xs gap-6 mt-10 mx-auto">
            <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
              <CardHeader className="items-center text-center">
                <Soup className="w-12 h-12 mb-3 text-primary" />
                <CardTitle className="text-2xl">Kitchen Console</CardTitle>
                <CardDescription>View and process orders.</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild size="lg" className="w-full">
                  <Link href="/kitchen">Go to Kitchen Console</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <footer className="py-6 mt-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
        </footer>
      </div>
    );
  }

  // Content for unauthenticated users: Login tile + Takeaway tile
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <AppHeader title="Gastronomic Gatherer" />
      
      <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
        <Utensils className="w-24 h-24 mx-auto mb-6 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Welcome to Gastronomic Gatherer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-2xl">
          Your all-in-one solution for efficient restaurant billing and order management.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-2xl mx-auto w-full px-4 sm:px-0">
           <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
            <CardHeader className="items-center text-center">
              <LogIn className="w-12 h-12 mb-3 text-primary" />
              <CardTitle className="text-2xl">Member Access</CardTitle>
              <CardDescription>Login to access your dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="w-full">
                <Link href="/login">Sign In</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
            <CardHeader className="items-center text-center">
              <ShoppingBag className="w-12 h-12 mb-3 text-accent" />
              <CardTitle className="text-2xl">Takeaway Orders</CardTitle>
              <CardDescription>Process and manage takeaway sales.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="w-full">
                <Link href="/takeaway">Go to Takeaway</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <footer className="py-6 mt-auto text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
      </footer>
    </div>
  );
}
