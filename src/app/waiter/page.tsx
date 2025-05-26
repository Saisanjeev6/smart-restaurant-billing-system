'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MENU_ITEMS, TABLE_NUMBERS } from '@/lib/constants';
import type { Order, OrderItem, MenuItem as MenuItemType } from '@/types';
import { PlusCircle, Trash2, Send, ListOrdered } from 'lucide-react';
import Image from 'next/image';

export default function WaiterPage() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const handleAddItemToOrder = () => {
    if (!selectedMenuItemId || quantity <= 0) {
      toast({ title: 'Error', description: 'Please select an item and specify a valid quantity.', variant: 'destructive' });
      return;
    }
    const menuItem = MENU_ITEMS.find(item => item.id === selectedMenuItemId);
    if (!menuItem) return;

    const existingItemIndex = currentOrderItems.findIndex(item => item.id === menuItem.id);
    if (existingItemIndex > -1) {
      const updatedItems = [...currentOrderItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCurrentOrderItems(updatedItems);
    } else {
      setCurrentOrderItems([...currentOrderItems, { ...menuItem, quantity }]);
    }
    setSelectedMenuItemId('');
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrderItems(currentOrderItems.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmitOrder = () => {
    if (!selectedTable) {
      toast({ title: 'Error', description: 'Please select a table number.', variant: 'destructive' });
      return;
    }
    if (currentOrderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot submit an empty order.', variant: 'destructive' });
      return;
    }

    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      tableNumber: parseInt(selectedTable),
      items: currentOrderItems,
      status: 'pending',
      timestamp: new Date().toISOString(),
      type: 'dine-in',
    };

    setActiveOrders(prevOrders => [...prevOrders, newOrder]);
    toast({ title: 'Order Submitted', description: `Order for table ${selectedTable} sent to kitchen.` });
    setCurrentOrderItems([]);
    setSelectedTable('');
  };

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Waiter Interface" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Create New Order</CardTitle>
              <CardDescription>Select table, add items, and submit to kitchen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger id="tableNumber">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_NUMBERS.map(num => (
                      <SelectItem key={num} value={String(num)}>Table {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="menuItem">Menu Item</Label>
                <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId}>
                  <SelectTrigger id="menuItem">
                    <SelectValue placeholder="Select an item" />
                  </SelectTrigger>
                  <SelectContent>
                    {MENU_ITEMS.map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.name} - ${item.price.toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(parseInt(e.target.value))}
                />
              </div>
              <Button onClick={handleAddItemToOrder} className="w-full" disabled={!selectedMenuItemId}>
                <PlusCircle className="mr-2" /> Add Item
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Current Order Details</CardTitle>
                {selectedTable && <CardDescription>For Table {selectedTable}</CardDescription>}
              </CardHeader>
              <CardContent>
                {currentOrderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                     <Image src="https://placehold.co/300x200.png" alt="Empty plate" width={150} height={100} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty plate restaurant" />
                    <p>No items added yet. Select items from the menu.</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {currentOrderItems.map(item => (
                      <li key={item.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                        <div>
                          <p className="font-medium">{item.name} <span className="text-sm text-muted-foreground"> (x{item.quantity})</span></p>
                          <p className="text-sm text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
              {currentOrderItems.length > 0 && (
                <CardFooter className="flex flex-col gap-4 pt-4 border-t">
                  <div className="flex justify-between w-full text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal(currentOrderItems).toFixed(2)}</span>
                  </div>
                  <Button onClick={handleSubmitOrder} className="w-full" size="lg" disabled={!selectedTable}>
                    <Send className="mr-2" /> Submit Order
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ListOrdered /> Active Orders</CardTitle>
                <CardDescription>Orders submitted in this session.</CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                   <p className="text-muted-foreground">No orders submitted yet in this session.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {activeOrders.map(order => (
                      <li key={order.id} className="p-3 rounded-md bg-muted/50">
                        <div className="flex justify-between">
                          <span className="font-medium">Table {order.tableNumber} - {order.id.slice(-6)}</span>
                          <span className="text-sm capitalize text-primary">{order.status}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(order.timestamp).toLocaleTimeString()}</p>
                        <ul className="mt-1 text-xs">
                          {order.items.map(item => <li key={item.id}>- {item.name} x{item.quantity}</li>)}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
