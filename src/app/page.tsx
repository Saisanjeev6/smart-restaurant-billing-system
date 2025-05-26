'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Utensils, LogIn } from 'lucide-react';
import Image from 'next/image';
import { AppHeader } from '@/components/layout/AppHeader';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';

export default function Home() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsMounted(true);

    if (user) {
      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'waiter') {
        router.replace('/waiter');
      }
    }
  }, [router]);

  if (!isMounted) {
    // Basic loading state to avoid flashing content and layout shifts
    return (
      <div className="flex flex-col min-h-screen">
        <AppHeader title="Gastronomic Gatherer" showBackButton={false} />
        <main className="flex items-center justify-center flex-grow">
          <Utensils className="w-16 h-16 animate-pulse text-primary" />
        </main>
         <footer className="py-6 mt-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
        </footer>
      </div>
    );
  }

  // If a logged-in user lands here, the useEffect will redirect them.
  // This content is primarily for unauthenticated users.
  if (currentUser) {
    // This state is typically brief as redirection occurs.
    // You can show a more specific loading message if desired.
    return (
       <div className="flex flex-col min-h-screen">
        <AppHeader title="Gastronomic Gatherer" showBackButton={false} />
        <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
          <Utensils className="w-16 h-16 mb-4 animate-pulse text-primary" />
          <p className="text-lg text-muted-foreground">Loading your experience...</p>
        </main>
         <footer className="py-6 mt-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
        </footer>
      </div>
    );
  }

  // Content for unauthenticated users
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
      <AppHeader title="Gastronomic Gatherer" showBackButton={false} />
      
      <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
        <Utensils className="w-24 h-24 mx-auto mb-6 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Welcome to Gastronomic Gatherer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-2xl">
          Your all-in-one solution for efficient restaurant billing and order management.
        </p>

        <Button asChild size="lg" className="mt-10 animate-bounce">
          <Link href="/login">
            <LogIn className="mr-2" /> Please Login to Continue
          </Link>
        </Button>

        <div className="grid grid-cols-1 max-w-xs gap-6 mt-12">
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
