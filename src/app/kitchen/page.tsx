
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Order, User } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { getSharedOrders, updateSharedOrderStatus } from '@/lib/orderManager';
import { Soup, CheckCircle2, Utensils, ListOrdered, Clock } from 'lucide-react';
import Image from 'next/image';

export default function KitchenPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'kitchen') {
      router.push('/login');
    } else {
      setCurrentUser(user);
      setIsMounted(true);
    }
  }, [router]);

  const loadOrders = useCallback(() => {
    if (!isMounted) return;
    const allOrders = getSharedOrders();
    // Kitchen sees 'pending' orders (and potentially 'preparing' in the future)
    const kitchenViewOrders = allOrders
      .filter(order => order.status === 'pending')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()); // Oldest first
    setPendingOrders(kitchenViewOrders);
  }, [isMounted]);

  useEffect(() => {
    loadOrders();
    // Optional: Set up an interval to refresh orders, good for multi-user demo
    const intervalId = setInterval(loadOrders, 5000); // Refresh every 5 seconds
    return () => clearInterval(intervalId);
  }, [loadOrders]);

  const handleMarkAsReady = (orderId: string) => {
    const success = updateSharedOrderStatus(orderId, 'ready');
    if (success) {
      toast({ title: 'Order Ready', description: `Order ${orderId.slice(-6)} marked as ready for serving/pickup.` });
      loadOrders(); // Refresh the list
    } else {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
    }
  };

  if (!isMounted || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Soup className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Kitchen Console" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><ListOrdered /> Incoming Orders</CardTitle>
            <CardDescription>View and manage orders submitted to the kitchen. Refreshing every 5 seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Image src="https://placehold.co/400x250.png" alt="Empty kitchen" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="kitchen chef"/>
                <p className="text-lg">No pending orders at the moment.</p>
                <p className="text-sm">Waiting for new orders from waiters or takeaway...</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingOrders.map(order => (
                  <Card key={order.id} className="flex flex-col shadow-md">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-xl">
                        {order.type === 'dine-in' ? (
                          <span className="flex items-center gap-2"><Utensils className="w-5 h-5 text-primary" />Table {order.tableNumber}</span>
                        ) : (
                          <span className="flex items-center gap-2"><Soup className="w-5 h-5 text-accent" />Token: {order.id.slice(-6)}</span>
                        )}
                        <Badge variant={order.status === 'pending' ? 'default' : 'secondary'} className="capitalize bg-blue-500 text-white">
                          {order.status}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs pt-1">
                        <Clock className="w-3 h-3" /> Received: {new Date(order.timestamp).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2">
                      <p className="font-medium text-sm text-muted-foreground">Items:</p>
                      <ul className="space-y-1 text-sm list-disc list-inside pl-2 max-h-40 overflow-y-auto">
                        {order.items.map(item => (
                          <li key={item.id} className="ml-2">
                            {item.name} <span className="font-semibold">x{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleMarkAsReady(order.id)} className="w-full">
                        <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as Ready
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
