
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MENU_ITEMS, TABLE_NUMBERS } from '@/lib/constants';
import type { Order, OrderItem } from '@/types';
import { PlusCircle, Trash2, Send, ListOrdered, ReceiptText } from 'lucide-react';
import Image from 'next/image';
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

export default function WaiterPage() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [isBillConfirmOpen, setIsBillConfirmOpen] = useState(false);
  const [orderForBillConfirmation, setOrderForBillConfirmation] = useState<Order | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const getPendingOrderForTable = (tableNumStr: string): Order | undefined => {
    if (!tableNumStr) return undefined;
    const tableNum = parseInt(tableNumStr);
    return activeOrders.find(o => o.tableNumber === tableNum && o.status === 'pending');
  };

  const handleAddItemToOrder = () => {
    if (!selectedMenuItemId || quantity <= 0) {
      toast({ title: 'Error', description: 'Please select an item and specify a valid quantity.', variant: 'destructive' });
      return;
    }
    if (!selectedTable) {
        toast({ title: 'Error', description: 'Please select a table first.', variant: 'destructive'});
        return;
    }
    const menuItem = MENU_ITEMS.find(item => item.id === selectedMenuItemId);
    if (!menuItem) return;

    setCurrentOrderItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(item => item.id === menuItem.id);
      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        return [...prevItems, { ...menuItem, quantity }];
      }
    });
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

    const tableNum = parseInt(selectedTable);
    const existingOrder = getPendingOrderForTable(selectedTable);

    if (existingOrder) {
      const updatedItems = [...existingOrder.items];
      currentOrderItems.forEach(newItem => {
        const existingItemIndex = updatedItems.findIndex(item => item.id === newItem.id);
        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });

      setActiveOrders(prevOrders => 
        prevOrders.map(o => 
          o.id === existingOrder.id ? { ...o, items: updatedItems, timestamp: new Date().toISOString() } : o
        )
      );
      toast({ title: 'Order Updated', description: `More items added to Table ${selectedTable}.` });
    } else {
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        tableNumber: tableNum,
        items: [...currentOrderItems],
        status: 'pending',
        timestamp: new Date().toISOString(),
        type: 'dine-in',
      };
      setActiveOrders(prevOrders => [...prevOrders, newOrder]);
      toast({ title: 'Order Submitted', description: `Order for Table ${selectedTable} sent to kitchen.` });
    }
    
    setCurrentOrderItems([]);
    // Keep selectedTable selected for further additions
  };

  const handleGenerateBill = () => {
    if (!selectedTable) {
      toast({ title: 'Error', description: 'Please select a table to generate a bill.', variant: 'destructive' });
      return;
    }
    const orderToBill = getPendingOrderForTable(selectedTable);
    if (!orderToBill || orderToBill.items.length === 0) {
      toast({ title: 'Error', description: `No pending items found for Table ${selectedTable} to bill.`, variant: 'destructive' });
      return;
    }
    setOrderForBillConfirmation(orderToBill);
    setIsBillConfirmOpen(true);
  };

  const confirmAndGenerateBill = () => {
    if (!orderForBillConfirmation || !selectedTable) return;

    const subtotal = calculateSubtotal(orderForBillConfirmation.items);
    setActiveOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderForBillConfirmation.id ? { ...o, status: 'billed', timestamp: new Date().toISOString() } : o
      )
    );
    
    toast({ 
      title: 'Bill Generated', 
      description: `Bill for Table ${selectedTable} (Subtotal: $${subtotal.toFixed(2)}) generated. Table cleared.` 
    });
    
    setCurrentOrderItems([]);
    setSelectedTable('');
    setIsBillConfirmOpen(false);
    setOrderForBillConfirmation(null);
  };

  const canSubmitOrder = selectedTable && currentOrderItems.length > 0;
  const pendingOrderForSelectedTable = useMemo(() => getPendingOrderForTable(selectedTable), [selectedTable, activeOrders]);
  const canGenerateBill = selectedTable && !!pendingOrderForSelectedTable && pendingOrderForSelectedTable.items.length > 0;

  if (!isMounted) {
    return null; 
  }

  const subtotalForBillDialog = orderForBillConfirmation ? calculateSubtotal(orderForBillConfirmation.items) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Waiter Interface" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">Create / Add to Order</CardTitle>
              <CardDescription>Select table, add items to current order.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tableNumber">Table Number</Label>
                <Select 
                  value={selectedTable} 
                  onValueChange={(value) => {
                    if (currentOrderItems.length > 0) {
                      toast({ title: "Unsubmitted Items", description: "Please submit or clear current items before changing tables.", variant: "destructive"});
                      return;
                    }
                    setSelectedTable(value);
                  }}
                >
                  <SelectTrigger id="tableNumber">
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {TABLE_NUMBERS.map(num => (
                      <SelectItem key={num} value={String(num)}>Table {num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                 {currentOrderItems.length > 0 && selectedTable && (
                    <p className="text-xs text-muted-foreground">Adding items for Table {selectedTable}. Submit to finalize these items for the table.</p>
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
                <PlusCircle className="mr-2" /> Add Item to Current Selection
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Current Items for Submission</CardTitle>
                {selectedTable && <CardDescription>For Table {selectedTable} (Subtotal for these items: ${calculateSubtotal(currentOrderItems).toFixed(2)})</CardDescription>}
                 {!selectedTable && <CardDescription>Select a table to start an order.</CardDescription>}
              </CardHeader>
              <CardContent>
                {currentOrderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                     <Image src="https://placehold.co/300x200.png" alt="Empty plate" width={150} height={100} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty plate restaurant"/>
                    <p>{selectedTable ? "No items added to current selection yet." : "Select a table and add items."}</p>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {currentOrderItems.map(item => (
                      <li key={item.id + Math.random()} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
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
              {(selectedTable || currentOrderItems.length > 0) && (
                <CardFooter className="flex flex-col gap-4 pt-4 border-t sm:flex-row">
                   <Button onClick={handleSubmitOrder} className="flex-1" disabled={!canSubmitOrder}>
                      <Send className="mr-2" /> Submit Items to Kitchen
                    </Button>
                    <Button onClick={handleGenerateBill} className="flex-1" variant="outline" disabled={!canGenerateBill}>
                      <ReceiptText className="mr-2" /> Generate Bill for Table
                    </Button>
                </CardFooter>
              )}
            </Card>
            
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ListOrdered /> Session Orders</CardTitle>
                <CardDescription>Orders processed in this session. Full bill generation updates status here.</CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                   <p className="text-muted-foreground">No orders processed yet in this session.</p>
                ) : (
                  <ul className="space-y-2 max-h-60 overflow-y-auto">
                    {activeOrders.map(order => (
                      <li key={order.id} className="p-3 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Table {order.tableNumber} - {order.id.slice(-6)}</span>
                            <p className="text-xs text-muted-foreground">Total: ${calculateSubtotal(order.items).toFixed(2)} ({order.items.reduce((acc, item) => acc + item.quantity, 0)} items)</p>
                          </div>
                          <span className={`px-2 py-0.5 text-xs rounded-full font-semibold
                            ${order.status === 'billed' ? 'bg-green-100 text-green-700 border border-green-300' : 
                              order.status === 'pending' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                              'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">Last update: {new Date(order.timestamp).toLocaleTimeString()}</p>
                        <ul className="mt-1 text-xs list-disc list-inside">
                          {order.items.map(item => <li key={item.id + order.id}>- {item.name} x{item.quantity}</li>)}
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

      {orderForBillConfirmation && (
        <AlertDialog open={isBillConfirmOpen} onOpenChange={setIsBillConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Bill for Table {orderForBillConfirmation.tableNumber}?</AlertDialogTitle>
              <AlertDialogDescription>
                This will finalize the bill for Table {orderForBillConfirmation.tableNumber}. Please review items and subtotal.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="my-4 space-y-2 max-h-60 overflow-y-auto text-sm">
                <p className="font-semibold">Items:</p>
                <ul className="list-disc list-inside pl-4">
                    {orderForBillConfirmation.items.map(item => (
                        <li key={item.id}>
                            {item.name} (x{item.quantity}) - ${(item.price * item.quantity).toFixed(2)}
                        </li>
                    ))}
                </ul>
                <Separator className="my-2" />
                <p className="font-bold text-base">Subtotal: ${subtotalForBillDialog.toFixed(2)}</p>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOrderForBillConfirmation(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmAndGenerateBill}>Confirm & Generate Bill</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
