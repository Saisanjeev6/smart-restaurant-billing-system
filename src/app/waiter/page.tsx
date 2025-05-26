
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
import { MENU_ITEMS, TABLE_NUMBERS, TAX_RATE } from '@/lib/constants';
import type { Order, OrderItem, MenuItem as MenuItemType } from '@/types';
import { PlusCircle, Trash2, Send, ListOrdered, ReceiptText } from 'lucide-react';
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

  const handleGenerateBill = () => {
    if (!selectedTable) {
      toast({ title: 'Error', description: 'Please select a table number to generate a bill.', variant: 'destructive' });
      return;
    }
    if (currentOrderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot generate a bill for an empty order.', variant: 'destructive' });
      return;
    }

    const subtotal = calculateSubtotal(currentOrderItems);
    // const taxAmount = subtotal * TAX_RATE;
    // const totalAmount = subtotal + taxAmount;

    const billedOrder: Order = {
      id: `ORD-${Date.now()}`, // Using ORD prefix for consistency, status distinguishes it
      tableNumber: parseInt(selectedTable),
      items: currentOrderItems,
      status: 'billed', // New status
      timestamp: new Date().toISOString(),
      type: 'dine-in',
    };

    setActiveOrders(prevOrders => [...prevOrders, billedOrder]);
    toast({ 
      title: 'Bill Generated', 
      description: `Bill for Table ${selectedTable} (Subtotal: $${subtotal.toFixed(2)}) is ready. Order cleared.` 
    });
    
    setCurrentOrderItems([]);
    setSelectedTable('');
  };

  const canSubmitOrBill = selectedTable && currentOrderItems.length > 0;

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
              <CardDescription>Select table, add items, and manage order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable} disabled={currentOrderItems.length > 0 && !!selectedTable}>
                  <SelectTrigger id="tableNumber">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_NUMBERS.map(num => (
                      <SelectItem key={num} value={String(num)}>Table {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {currentOrderItems.length > 0 && !!selectedTable && (
                    <p className="text-xs text-muted-foreground">Clear current order items or generate bill to change table.</p>
                )}
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
              <Button onClick={handleAddItemToOrder} className="w-full" disabled={!selectedMenuItemId || !selectedTable}>
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
                     <Image src="https://placehold.co/300x200.png" alt="Empty plate" width={150} height={100} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty plate restaurant"/>
                    <p>{selectedTable ? "No items added yet for this table." : "Select a table to start an order."}</p>
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
                <CardFooter className="flex flex-col gap-4 pt-4 border-t sm:flex-row">
                  <div className="flex items-center justify-between w-full text-lg font-semibold sm:w-auto sm:flex-grow">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal(currentOrderItems).toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col w-full gap-2 sm:flex-row sm:w-auto">
                    <Button onClick={handleSubmitOrder} className="flex-1" disabled={!canSubmitOrBill}>
                      <Send className="mr-2" /> Submit Order
                    </Button>
                    <Button onClick={handleGenerateBill} className="flex-1" variant="outline" disabled={!canSubmitOrBill}>
                      <ReceiptText className="mr-2" /> Generate Bill
                    </Button>
                  </div>
                </CardFooter>
              )}
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ListOrdered /> Active Orders</CardTitle>
                <CardDescription>Orders processed in this session.</CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                   <p className="text-muted-foreground">No orders processed yet in this session.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {activeOrders.map(order => (
                      <li key={order.id} className="p-3 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Table {order.tableNumber} - {order.id.slice(-6)}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-semibold
                            ${order.status === 'billed' ? 'bg-green-100 text-green-700 border border-green-300' : 
                              order.status === 'pending' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                              'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                            {order.status}
                          </span>
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

