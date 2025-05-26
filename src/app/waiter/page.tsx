
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
  const [activeOrders, setActiveOrders] = useState<Order[]>([]); // All orders managed in this session
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [isBillConfirmOpen, setIsBillConfirmOpen] = useState(false);
  const [orderForBillConfirmation, setOrderForBillConfirmation] = useState<Order | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Memoized value for the pending order of the currently selected table
  const pendingOrderForSelectedTable = useMemo((): Order | undefined => {
    if (!selectedTable) return undefined;
    const tableNum = parseInt(selectedTable);
    return activeOrders.find(o => o.tableNumber === tableNum && o.status === 'pending');
  }, [selectedTable, activeOrders]);

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
    const existingOrderIndex = activeOrders.findIndex(o => o.tableNumber === tableNum && o.status === 'pending');

    if (existingOrderIndex > -1) {
      // Update existing pending order for the table
      const updatedActiveOrders = [...activeOrders];
      const orderToUpdate = { ...updatedActiveOrders[existingOrderIndex] };
      const updatedItems = [...orderToUpdate.items];

      currentOrderItems.forEach(newItem => {
        const existingItemIndex = updatedItems.findIndex(item => item.id === newItem.id);
        if (existingItemIndex > -1) {
          updatedItems[existingItemIndex].quantity += newItem.quantity;
        } else {
          updatedItems.push(newItem);
        }
      });
      orderToUpdate.items = updatedItems;
      orderToUpdate.timestamp = new Date().toISOString();
      updatedActiveOrders[existingOrderIndex] = orderToUpdate;
      setActiveOrders(updatedActiveOrders);
      toast({ title: 'Order Updated', description: `More items added to Table ${selectedTable}.` });
    } else {
      // Create new pending order for the table
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
    
    setCurrentOrderItems([]); // Clear current selection, table remains selected for more items or billing
    // Do not clear selectedTable here, so user returns to the "All Pending Session Orders" view.
    // To achieve "return to home page" implies clearing selectedTable.
    setSelectedTable(''); // Clear selected table to return to "All Pending Session Orders" view.
  };

  const handleGenerateBill = () => {
    if (!pendingOrderForSelectedTable) { // Use memoized value
      toast({ title: 'Error', description: `No pending items found for Table ${selectedTable} to bill.`, variant: 'destructive' });
      return;
    }
    setOrderForBillConfirmation(pendingOrderForSelectedTable);
    setIsBillConfirmOpen(true);
  };

  const confirmAndGenerateBill = () => {
    if (!orderForBillConfirmation) return;

    const subtotal = calculateSubtotal(orderForBillConfirmation.items);
    setActiveOrders(prevOrders =>
      prevOrders.map(o =>
        o.id === orderForBillConfirmation.id ? { ...o, status: 'billed', timestamp: new Date().toISOString() } : o
      )
    );
    
    toast({ 
      title: 'Bill Generated', 
      description: `Bill for Table ${orderForBillConfirmation.tableNumber} (Subtotal: $${subtotal.toFixed(2)}) generated.` 
    });
    
    setCurrentOrderItems([]); // Clear selection
    setSelectedTable(''); // Clear selected table, returning to "All Pending Session Orders" view
    setIsBillConfirmOpen(false);
    setOrderForBillConfirmation(null);
  };

  const canSubmitOrder = selectedTable && currentOrderItems.length > 0;
  const canGenerateBill = !!pendingOrderForSelectedTable && pendingOrderForSelectedTable.items.length > 0;

  if (!isMounted) {
    return null; 
  }

  const subtotalForBillDialog = orderForBillConfirmation ? calculateSubtotal(orderForBillConfirmation.items) : 0;

  // Filter orders for display in the "Session Orders" card
  const displayedSessionOrders = useMemo(() => {
    if (selectedTable && pendingOrderForSelectedTable) {
      return [pendingOrderForSelectedTable]; // Show only the active order for the selected table
    }
    // If no table selected, or selected table has no PENDING order, show all PENDING orders
    return activeOrders.filter(order => order.status === 'pending');
  }, [selectedTable, pendingOrderForSelectedTable, activeOrders]);

  const sessionOrdersTitle = selectedTable && pendingOrderForSelectedTable 
    ? `Pending Order for Table ${selectedTable}` 
    : "All Pending Session Orders";

  const sessionOrdersDescription = selectedTable && pendingOrderForSelectedTable
    ? `Details of the current unbilled order for Table ${selectedTable}.`
    : "Overview of all unbilled orders in this session.";


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
                    if (currentOrderItems.length > 0 && selectedTable !== value) {
                      toast({ title: "Unsubmitted Items", description: "Submit or clear current items before changing tables.", variant: "destructive"});
                      return;
                    }
                    setSelectedTable(value);
                    // setCurrentOrderItems([]); // Optionally clear items when table changes if not submitted
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
                    <p className="text-xs text-muted-foreground">Adding items for Table {selectedTable}. Submit to add these to the table's pending order.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="menuItem">Menu Item</Label>
                <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId} disabled={!selectedTable}>
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
                  disabled={!selectedTable}
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
                <CardTitle className="flex items-center gap-2 text-xl"><ListOrdered /> {sessionOrdersTitle}</CardTitle>
                <CardDescription>{sessionOrdersDescription}</CardDescription>
              </CardHeader>
              <CardContent>
                {displayedSessionOrders.length === 0 ? (
                   <p className="text-muted-foreground">
                     {selectedTable && pendingOrderForSelectedTable === undefined 
                       ? `No pending items for Table ${selectedTable}. Add items above.` 
                       : selectedTable && pendingOrderForSelectedTable?.items.length === 0
                       ? `No items yet for Table ${selectedTable}.`
                       : "No pending orders in this session."}
                   </p>
                ) : (
                  <ul className="space-y-3 max-h-60 overflow-y-auto">
                    {displayedSessionOrders.map(order => (
                      <li key={order.id} className="p-3 rounded-md bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">Table {order.tableNumber} - ID: {order.id.slice(-6)}</span>
                            <p className="text-xs text-muted-foreground">Total: ${calculateSubtotal(order.items).toFixed(2)} ({order.items.reduce((acc, item) => acc + item.quantity, 0)} items)</p>
                          </div>
                           <span className={`px-2 py-0.5 text-xs rounded-full font-semibold
                            ${order.status === 'billed' ? 'bg-green-100 text-green-700 border border-green-300' : 
                              order.status === 'pending' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                              'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">Last update: {new Date(order.timestamp).toLocaleTimeString()}</p>
                        <ul className="mt-1 text-xs list-disc list-inside pl-1">
                          {order.items.map(item => <li key={item.id + order.id}>- {item.name} x{item.quantity} (${(item.price * item.quantity).toFixed(2)})</li>)}
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
                This will finalize and mark the order for Table {orderForBillConfirmation.tableNumber} as 'billed'. Review items and subtotal before proceeding.
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
                <p className="font-bold text-base">Order Subtotal: ${subtotalForBillDialog.toFixed(2)}</p>
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

