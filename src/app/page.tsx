'use client'; // Make home page a client component to use hooks for AppHeader context

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersRound, ClipboardPenLine, ShoppingBag, Utensils, LogIn } from 'lucide-react';
import Image from 'next/image';
import { AppHeader } from '@/components/layout/AppHeader';
import { useEffect, useState } from 'react';
import { getCurrentUser } from '@/lib/auth';
import type { User } from '@/types';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    setIsMounted(true);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/50">
      {/* AppHeader is now used here to show logout button if logged in */}
      <AppHeader title="Gastronomic Gatherer" showBackButton={false} />
      
      <main className="flex flex-col items-center justify-center flex-grow p-4 text-center">
        <Utensils className="w-24 h-24 mx-auto mb-6 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Welcome to Gastronomic Gatherer
        </h1>
        <p className="mt-3 text-xl text-muted-foreground max-w-2xl">
          Your all-in-one solution for efficient restaurant billing, order management, and an enhanced dining experience.
        </p>

        {isMounted && !currentUser && (
          <Button asChild size="lg" className="mt-10 animate-bounce">
            <Link href="/login">
              <LogIn className="mr-2" /> Please Login to Continue
            </Link>
          </Button>
        )}

        {isMounted && currentUser && (
          <p className="mt-8 text-lg text-foreground">
            You are logged in as <span className="font-semibold text-primary">{currentUser.username} ({currentUser.role})</span>.
          </p>
        )}

        <div className="grid max-w-4xl gap-6 mt-12 md:grid-cols-3">
          <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
            <CardHeader className="items-center text-center">
              <UsersRound className="w-12 h-12 mb-3 text-accent" />
              <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
              <CardDescription>Manage orders, bills, tips, and users.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="w-full">
                <Link href="/admin">Go to Admin</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
            <CardHeader className="items-center text-center">
              <ClipboardPenLine className="w-12 h-12 mb-3 text-accent" />
              <CardTitle className="text-2xl">Waiter Interface</CardTitle>
              <CardDescription>Input orders and manage tables.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild size="lg" className="w-full">
                <Link href="/waiter">Go to Waiter</Link>
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
