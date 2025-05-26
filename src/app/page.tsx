import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UsersRound, ClipboardPenLine, ShoppingBag, Utensils } from 'lucide-react';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gradient-to-br from-background to-secondary">
      <header className="mb-12 text-center">
        <Utensils className="w-24 h-24 mx-auto mb-4 text-primary" />
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          Gastronomic Gatherer
        </h1>
        <p className="mt-2 text-xl text-muted-foreground">
          Efficient Restaurant Billing & Order Management
        </p>
      </header>

      <div className="grid max-w-4xl gap-6 md:grid-cols-3">
        <Card className="transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl hover:scale-105">
          <CardHeader className="items-center text-center">
            <UsersRound className="w-12 h-12 mb-3 text-accent" />
            <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
            <CardDescription>Manage orders, bills, and tips.</CardDescription>
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
      
      <footer className="mt-16 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Gastronomic Gatherer. Powered by Firebase Studio.</p>
      </footer>
    </div>
  );
}
