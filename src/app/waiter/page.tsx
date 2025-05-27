
'use client';

import type { ChangeEvent } from 'react';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MENU_ITEMS, TABLE_NUMBERS } from '@/lib/constants';
import type { Order, OrderItem, User } from '@/types';
import { PlusCircle, Trash2, Send, ReceiptText, ClipboardEdit, ListOrdered, Sparkles, BellRing, CheckCircle } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurrentUser } from '@/lib/auth';
import { getSharedOrders, addOrUpdateSharedOrder, updateSharedOrderStatus } from '@/lib/orderManager';
import { Badge } from '@/components/ui/badge';

export default function WaiterPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [sessionOrders, setSessionOrders] = useState<Order[]>([]); 
  const { toast } = useToast();
  
  const [isBillConfirmOpen, setIsBillConfirmOpen] = useState(false);
  const [orderForBillConfirmation, setOrderForBillConfirmation] = useState<Order | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [displayedReadyNotifications, setDisplayedReadyNotifications] = useState<Set<string>>(new Set());

  const calculateSubtotal = useCallback((items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, []);

  const loadSessionOrders = useCallback(() => {
    if (!isMounted) return;
    const orders = getSharedOrders();
    setSessionOrders(orders);

    // Check for ready orders for this waiter
    if(currentUser) {
      const readyOrdersForThisWaiter = orders.filter(
        order => order.status === 'ready' && order.waiterId === currentUser.id && !displayedReadyNotifications.has(order.id)
      );

      if (readyOrdersForThisWaiter.length > 0) {
        const newNotifications = new Set(displayedReadyNotifications);
        readyOrdersForThisWaiter.forEach(order => {
          toast({
            title: 'Order Ready!',
            description: `Order for ${order.type === 'dine-in' ? `Table ${order.tableNumber}` : `Token ${order.id.slice(-6)}`} is ready for pickup.`,
            variant: 'default', 
            duration: 7000, // Keep toast a bit longer
          });
          newNotifications.add(order.id);
        });
        setDisplayedReadyNotifications(newNotifications);
      }
    }

  }, [isMounted, currentUser, toast, displayedReadyNotifications]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || (user.role !== 'waiter' && user.role !== 'admin')) { // Admin can also access waiter page
      router.push('/login');
    } else {
      setCurrentUser(user);
      setIsMounted(true);
    }
  }, [router]);

  useEffect(() => {
    if(isMounted){
        loadSessionOrders();
        const intervalId = setInterval(loadSessionOrders, 7000); // Check for ready orders every 7 seconds
        return () => clearInterval(intervalId);
    }
  }, [isMounted, loadSessionOrders]);


  const pendingOrderForSelectedTable = useMemo((): Order | undefined => {
    if (!selectedTable || !isMounted) return undefined;
    const tableNum = parseInt(selectedTable);
    // Find order that is not 'billed' or 'cancelled' for this table
    return sessionOrders.find(o => o.tableNumber === tableNum && o.status !== 'billed' && o.status !== 'cancelled');
  }, [selectedTable, sessionOrders, isMounted]);

  const allUnbilledOrdersList = useMemo(() => {
    if (!isMounted) return [];
    return sessionOrders
      .filter(order => order.type === 'dine-in' && order.status !== 'billed' && order.status !== 'cancelled')
      .sort((a, b) => (a.tableNumber || 0) - (b.tableNumber || 0));
  }, [sessionOrders, isMounted]);
  
  const subtotalForBillDialog = orderForBillConfirmation ? calculateSubtotal(orderForBillConfirmation.items) : 0;

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

  const handleRemoveItemFromCurrentSelection = (itemId: string) => {
    setCurrentOrderItems(currentOrderItems.filter(item => item.id !== itemId));
  };

  const handleSubmitOrder = () => {
    if (!selectedTable || !currentUser) {
      toast({ title: 'Error', description: 'Please select a table and ensure you are logged in.', variant: 'destructive' });
      return;
    }
    if (currentOrderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot submit an empty selection.', variant: 'destructive' });
      return;
    }

    const tableNum = parseInt(selectedTable);
    let orderToUpdate: Order;

    const existingOrder = sessionOrders.find(o => o.tableNumber === tableNum && o.status === 'pending');

    if (existingOrder) {
      orderToUpdate = { ...existingOrder };
      
      const updatedItemsMap = new Map<string, OrderItem>();
      orderToUpdate.items.forEach(item => updatedItemsMap.set(item.id, {...item})); 

      currentOrderItems.forEach(newItem => {
        if (updatedItemsMap.has(newItem.id)) {
          const currentItem = updatedItemsMap.get(newItem.id)!;
          currentItem.quantity += newItem.quantity; 
        } else {
          updatedItemsMap.set(newItem.id, {...newItem}); 
        }
      });
      orderToUpdate.items = Array.from(updatedItemsMap.values());
      orderToUpdate.timestamp = new Date().toISOString(); // Update timestamp on modification
      toast({ title: 'Order Updated', description: `Items added to Table ${selectedTable}. Sent to kitchen.` });
    } else { // No existing 'pending' order, create a new one
      orderToUpdate = {
        id: `ORD-${Date.now()}`,
        tableNumber: tableNum,
        items: [...currentOrderItems], 
        status: 'pending',
        timestamp: new Date().toISOString(),
        type: 'dine-in',
        waiterId: currentUser.id,
        waiterUsername: currentUser.username,
      };
      toast({ title: 'Order Submitted', description: `Order for Table ${selectedTable} sent to kitchen.` });
    }
    
    addOrUpdateSharedOrder(orderToUpdate);
    setCurrentOrderItems([]); // Clear current selection after submitting
    // setSelectedTable(''); // Keep table selected for further additions or bill generation
    loadSessionOrders(); 
  };

  const handleGenerateBillRequest = () => { 
    if (!pendingOrderForSelectedTable) { 
      toast({ title: 'Error', description: `No pending order found for Table ${selectedTable} to bill. Submit items first.`, variant: 'destructive' });
      return;
    }
    setOrderForBillConfirmation(pendingOrderForSelectedTable);
    setIsBillConfirmOpen(true);
  };

  const confirmAndGenerateBill = () => {
    if (!orderForBillConfirmation) return;

    const success = updateSharedOrderStatus(orderForBillConfirmation.id, 'billed');
    
    if (success) {
      const subtotal = calculateSubtotal(orderForBillConfirmation.items);
      toast({ 
        title: 'Bill Generated', 
        description: `Bill for Table ${orderForBillConfirmation.tableNumber} (Subtotal: $${subtotal.toFixed(2)}) sent to admin/billing. Table cleared.` 
      });
      loadSessionOrders();
    } else {
      toast({ title: 'Error', description: 'Failed to generate bill.', variant: 'destructive' });
    }
    
    setCurrentOrderItems([]); 
    if (selectedTable === String(orderForBillConfirmation.tableNumber)) {
      setSelectedTable(''); 
    }
    setIsBillConfirmOpen(false);
    setOrderForBillConfirmation(null);
  };

  const canSubmitCurrentSelection = selectedTable && currentOrderItems.length > 0;
  const canGenerateBillForSelectedTable = !!pendingOrderForSelectedTable && pendingOrderForSelectedTable.items.length > 0;

  const getStatusBadgeVariant = (status: Order['status']): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'pending': return 'default'; // Often blue or primary
      case 'preparing': return 'secondary'; // Yellow/Orange
      case 'ready': return 'default'; // Green
      case 'served': return 'secondary'; // Purple/Gray
      case 'billed': return 'secondary';
      default: return 'outline';
    }
  };
  
  const getStatusBadgeClass = (status: Order['status']): string => {
    switch (status) {
      case 'pending': return 'bg-blue-500 text-white';
      case 'preparing': return 'bg-yellow-500 text-black';
      case 'ready': return 'bg-green-500 text-white animate-pulse'; // Added pulse for ready
      case 'served': return 'bg-purple-500 text-white';
      case 'billed': return 'bg-gray-400 text-black';
      default: return 'bg-gray-200 text-gray-700';
    }
  };


  if (!isMounted || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Sparkles className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Waiter Interface" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="orderManagement" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="orderManagement" className="flex items-center gap-2"><ClipboardEdit /> Order Management</TabsTrigger>
            <TabsTrigger value="allPending" className="flex items-center gap-2"><ListOrdered /> All Active Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="orderManagement">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Create / Add to Order</CardTitle>
                  <CardDescription>Select table, add items to current selection for submission.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="tableNumber">Table Number</Label>
                    <Select 
                      value={selectedTable} 
                      onValueChange={(value) => {
                        setSelectedTable(value);
                        setCurrentOrderItems([]); 
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
                        <p className="text-xs text-muted-foreground">Adding items for Table {selectedTable}. Submit to add these to table's order.</p>
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
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(parseInt(e.target.value) || 1)}
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
                    {selectedTable && <CardDescription>For Table {selectedTable} (Subtotal for this selection: ${calculateSubtotal(currentOrderItems).toFixed(2)})</CardDescription>}
                    {!selectedTable && <CardDescription>Select a table to start an order.</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {currentOrderItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Image src="https://placehold.co/300x200.png" alt="Empty plate" width={150} height={100} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty plate restaurant"/>
                        <p>{selectedTable ? "No items in current selection." : "Select a table and add items."}</p>
                      </div>
                    ) : (
                      <ul className="space-y-3">
                        {currentOrderItems.map(item => (
                          <li key={item.id + Math.random()} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                            <div>
                              <p className="font-medium">{item.name} <span className="text-sm text-muted-foreground"> (x{item.quantity})</span></p>
                              <p className="text-sm text-primary">${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromCurrentSelection(item.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                  {(selectedTable && currentOrderItems.length > 0) && (
                    <CardFooter className="flex flex-col gap-4 pt-4 border-t sm:flex-row">
                      <Button onClick={handleSubmitOrder} className="flex-1" disabled={!canSubmitCurrentSelection}>
                          <Send className="mr-2" /> Submit Selection to Kitchen
                        </Button>
                    </CardFooter>
                  )}
                </Card>
                
                <Card className="shadow-lg">
                   <CardHeader>
                    <CardTitle className="text-xl flex items-center justify-between">
                      {selectedTable ? `Active Order for Table ${selectedTable}` : "Select Table to View Order"}
                      {pendingOrderForSelectedTable?.status === 'ready' && (
                        <Badge className={`${getStatusBadgeClass(pendingOrderForSelectedTable.status)} capitalize`}>
                          <BellRing className="w-4 h-4 mr-1" /> Ready
                        </Badge>
                      )}
                    </CardTitle>
                    {selectedTable && !pendingOrderForSelectedTable && <CardDescription>No active items for this table. Add and submit items above.</CardDescription>}
                    {selectedTable && pendingOrderForSelectedTable && 
                        <CardDescription>
                            Total subtotal: ${calculateSubtotal(pendingOrderForSelectedTable.items).toFixed(2)}
                            {pendingOrderForSelectedTable.status !== 'ready' && pendingOrderForSelectedTable.status !== 'pending' && 
                             <span className="ml-2 capitalize font-semibold">({pendingOrderForSelectedTable.status})</span>}
                        </CardDescription>
                    }
                  </CardHeader>
                  <CardContent>
                    {!selectedTable ? (
                       <p className="text-muted-foreground text-center py-4">Select a table from the panel on the left to view its full active order details here.</p>
                    ) : pendingOrderForSelectedTable && pendingOrderForSelectedTable.items.length > 0 ? (
                      <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {pendingOrderForSelectedTable.items.map(item => (
                          <li key={item.id} className="p-2 rounded-md bg-muted/30">
                            <div className="flex justify-between items-center">
                                <span>{item.name} (x{item.quantity})</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No items submitted to kitchen for Table {selectedTable} yet.</p>
                    )}
                  </CardContent>
                  {selectedTable && pendingOrderForSelectedTable && pendingOrderForSelectedTable.status !== 'billed' && pendingOrderForSelectedTable.status !== 'cancelled' && (
                    <CardFooter>
                       <Button onClick={handleGenerateBillRequest} className="w-full" variant="outline" disabled={!canGenerateBillForSelectedTable}>
                          <ReceiptText className="mr-2" /> Request Bill for Table {selectedTable}
                        </Button>
                    </CardFooter>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="allPending">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ListOrdered /> All Active Dine-in Orders</CardTitle>
                <CardDescription>Overview of all unbilled dine-in orders. Refreshing for status updates.</CardDescription>
              </CardHeader>
              <CardContent>
                {allUnbilledOrdersList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Image src="https://placehold.co/400x250.png" alt="Empty restaurant overview" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="restaurant empty tables"/>
                    <p>No active dine-in orders across any tables.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {allUnbilledOrdersList.map(order => (
                      <li key={order.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-lg font-semibold">Table {order.tableNumber}</span>
                            <span className="ml-2 text-xs text-muted-foreground">(ID: ...{order.id.slice(-6)})</span>
                          </div>
                           <Badge className={`${getStatusBadgeClass(order.status)} capitalize`}>
                            {order.status === 'ready' && <BellRing className="w-3 h-3 mr-1" />}
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Items: {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                        </p>
                        <p className="text-sm font-medium mb-2">
                          Subtotal: ${calculateSubtotal(order.items).toFixed(2)}
                        </p>
                        {order.waiterUsername && <p className="text-xs text-muted-foreground">Waiter: {order.waiterUsername}</p>}
                        <details className="text-xs mt-1">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View Items ({order.items.length})</summary>
                            <ul className="mt-1 list-disc list-inside pl-4 space-y-0.5 text-muted-foreground">
                            {order.items.map(item => <li key={item.id + order.id}>{item.name} x{item.quantity} (${(item.price * item.quantity).toFixed(2)})</li>)}
                            </ul>
                        </details>
                        <p className="mt-2 text-xs text-muted-foreground/80">Last update: {new Date(order.timestamp).toLocaleTimeString()}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {orderForBillConfirmation && (
          <AlertDialog open={isBillConfirmOpen} onOpenChange={setIsBillConfirmOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Bill for Table {orderForBillConfirmation.tableNumber}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will finalize and mark the order for Table {orderForBillConfirmation.tableNumber} as 'billed'. The bill will then be handled by Admin for payment processing. This action cannot be undone from the waiter interface.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 space-y-2 max-h-60 overflow-y-auto text-sm">
                  <p className="font-semibold">Items for Billing:</p>
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
                <AlertDialogCancel onClick={() => { setIsBillConfirmOpen(false); setOrderForBillConfirmation(null); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAndGenerateBill}>Confirm & Send to Billing</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  );
}
