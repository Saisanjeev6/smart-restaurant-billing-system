
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import type { Order, User, OrderItem } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { getSharedOrders, updateSharedOrderStatus } from '@/lib/orderManager';
import { Soup, CheckCircle2, Utensils, ListOrdered, Clock, CookingPot, ThumbsUp, MessageSquare } from 'lucide-react';
import Image from 'next/image';

export default function KitchenPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [kitchenOrders, setKitchenOrders] = useState<Order[]>([]);
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
    const relevantOrders = allOrders
      .filter(order => order.status === 'pending' || order.status === 'preparing')
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setKitchenOrders(relevantOrders);
  }, [isMounted]);

  useEffect(() => {
    if (isMounted) {
      loadOrders();
      const intervalId = setInterval(loadOrders, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isMounted, loadOrders]);

  const pendingOrders = useMemo(() => kitchenOrders.filter(o => o.status === 'pending'), [kitchenOrders]);
  const preparingOrders = useMemo(() => kitchenOrders.filter(o => o.status === 'preparing'), [kitchenOrders]);

  const handleStartPreparing = (orderId: string) => {
    const success = updateSharedOrderStatus(orderId, 'preparing');
    if (success) {
      toast({ title: 'Order Update', description: `Order ${orderId.slice(-6)} marked as preparing.` });
      loadOrders();
    } else {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
    }
  };

  const handleMarkAsReady = (orderId: string) => {
    const success = updateSharedOrderStatus(orderId, 'ready');
    if (success) {
      toast({ title: 'Order Ready', description: `Order ${orderId.slice(-6)} marked as ready for serving/pickup.` });
      loadOrders();
    } else {
      toast({ title: 'Error', description: 'Failed to update order status.', variant: 'destructive' });
    }
  };

  const getStatusBadgeClass = (status: Order['status']): string => {
    switch (status) {
      case 'pending': return 'bg-blue-500 text-white';
      case 'preparing': return 'bg-yellow-500 text-yellow-900 animate-pulse';
      default: return 'bg-gray-500 text-white';
    }
  };

  const renderOrderItem = (item: OrderItem, index: number) => (
    <li key={`${item.id}-${index}`} className="ml-2">
      {item.name} <span className="font-semibold">x{item.quantity}</span>
      {item.comment && (
        <p className="text-xs italic text-orange-600 flex items-center gap-1">
          <MessageSquare className="w-3 h-3" /> {item.comment}
        </p>
      )}
    </li>
  );


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
      <main className="flex-grow p-4 md:p-6 lg:p-8 space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><ListOrdered /> Incoming Orders (Pending)</CardTitle>
            <CardDescription>New orders awaiting preparation. Refreshing every 5 seconds.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Image src="https://placehold.co/400x250.png" alt="Empty kitchen area" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="kitchen chef waiting"/>
                <p className="text-lg">No new orders waiting.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {pendingOrders.map(order => (
                  <Card key={order.id} className="flex flex-col shadow-md border-blue-300 border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-xl">
                        {order.type === 'dine-in' ? (
                          <span className="flex items-center gap-2"><Utensils className="w-5 h-5 text-primary" />Table {order.tableNumber}</span>
                        ) : (
                          <span className="flex items-center gap-2"><Soup className="w-5 h-5 text-accent" />Token: {order.id.slice(-6)}</span>
                        )}
                        <Badge variant='default' className={`${getStatusBadgeClass(order.status)} capitalize`}>
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
                        {order.items.map(renderOrderItem)}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleStartPreparing(order.id)} className="w-full bg-blue-600 hover:bg-blue-700">
                        <CookingPot className="mr-2 h-4 w-4" /> Start Preparing
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl"><CookingPot className="text-yellow-600" /> Currently Preparing Orders</CardTitle>
            <CardDescription>Orders that are currently being prepared.</CardDescription>
          </CardHeader>
          <CardContent>
            {preparingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                 <Image src="https://placehold.co/400x250.png" alt="Chef cooking" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="chef cooking food"/>
                <p className="text-lg">No orders are currently being prepared.</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {preparingOrders.map(order => (
                  <Card key={order.id} className="flex flex-col shadow-md border-yellow-400 border-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-xl">
                        {order.type === 'dine-in' ? (
                          <span className="flex items-center gap-2"><Utensils className="w-5 h-5 text-primary" />Table {order.tableNumber}</span>
                        ) : (
                          <span className="flex items-center gap-2"><Soup className="w-5 h-5 text-accent" />Token: {order.id.slice(-6)}</span>
                        )}
                         <Badge variant='default' className={`${getStatusBadgeClass(order.status)} capitalize`}>
                          {order.status}
                        </Badge>
                      </CardTitle>
                       <CardDescription className="flex items-center gap-1 text-xs pt-1">
                        <Clock className="w-3 h-3" /> Started: {new Date(order.timestamp).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-2">
                      <p className="font-medium text-sm text-muted-foreground">Items:</p>
                      <ul className="space-y-1 text-sm list-disc list-inside pl-2 max-h-40 overflow-y-auto">
                        {order.items.map(renderOrderItem)}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button onClick={() => handleMarkAsReady(order.id)} className="w-full bg-green-600 hover:bg-green-700">
                        <ThumbsUp className="mr-2 h-4 w-4" /> Mark as Ready
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
