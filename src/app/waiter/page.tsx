
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
import { getMenuItems } from '@/lib/menuManager';
import { getTableNumbersArray } from '@/lib/restaurantSettings'; // Import new function
import type { MenuItem as MenuItemType, Order, OrderItem, User, OrderStatus } from '@/types';
import { PlusCircle, Trash2, Send, ReceiptText, ClipboardEdit, ListOrdered, Sparkles, BellRing, CheckCircle, LayoutGrid, Coffee, Utensils, FileTextIcon } from 'lucide-react';
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

type TableDisplayStatus = 'vacant' | 'selected' | 'occupied_pending' | 'occupied_ready' | 'occupied_bill_requested' | 'occupied_billed_paid';


export default function WaiterPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]); 
  const { toast } = useToast();
  
  const [isBillConfirmOpen, setIsBillConfirmOpen] = useState(false);
  const [orderForBillConfirmation, setOrderForBillConfirmation] = useState<Order | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [displayedReadyNotifications, setDisplayedReadyNotifications] = useState<Set<string>>(new Set());
  const [menuOptions, setMenuOptions] = useState<MenuItemType[]>([]);
  const [tableNumbers, setTableNumbers] = useState<number[]>([]); // State for table numbers

  useEffect(() => {
    setIsMounted(true);
    const user = getCurrentUser();
    if (!user || (user.role !== 'waiter' && user.role !== 'admin')) {
      router.push('/login');
    } else {
      setCurrentUser(user);
      setMenuOptions(getMenuItems());
      setTableNumbers(getTableNumbersArray()); // Get table numbers from settings
    }
  }, [router]);

  const calculateSubtotal = useCallback((items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, []);

  const loadActiveOrders = useCallback(() => {
    if (!isMounted) return;
    const orders = getSharedOrders();
    setActiveOrders(orders);
    setTableNumbers(getTableNumbersArray()); // Refresh table numbers in case they changed

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
            duration: 7000,
          });
          newNotifications.add(order.id);
        });
        setDisplayedReadyNotifications(newNotifications);
      }
    }
  }, [isMounted, currentUser, toast, displayedReadyNotifications]);
  
  useEffect(() => {
    if(isMounted){
        loadActiveOrders();
        const intervalId = setInterval(loadActiveOrders, 7000); 
        return () => clearInterval(intervalId);
    }
  }, [isMounted, loadActiveOrders]);

  const pendingOrderForSelectedTable = useMemo((): Order | undefined => {
    if (!selectedTable || !isMounted) return undefined;
    const tableNum = parseInt(selectedTable);
    return activeOrders.find(o => o.tableNumber === tableNum && o.type === 'dine-in' && (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'served'));
  }, [selectedTable, activeOrders, isMounted]);
  
  const subtotalForBillDialog = orderForBillConfirmation ? calculateSubtotal(orderForBillConfirmation.items) : 0;

  const allUnbilledDineInOrdersList = useMemo(() => {
    if (!isMounted) return [];
    return activeOrders
      .filter(order => order.type === 'dine-in' && order.status !== 'paid' && order.status !== 'cancelled' && order.status !== 'billed')
      .sort((a, b) => (a.tableNumber || 0) - (b.tableNumber || 0));
  }, [activeOrders, isMounted]);


  const handleSelectTable = (tableNum: number) => {
    setSelectedTable(String(tableNum));
    setCurrentOrderItems([]); 
  };

  const handleAddItemToOrder = () => {
    if (!selectedMenuItemId || quantity <= 0) {
      toast({ title: 'Error', description: 'Please select an item and specify a valid quantity.', variant: 'destructive' });
      return;
    }
    if (!selectedTable) {
        toast({ title: 'Error', description: 'Please select a table from the grid first.', variant: 'destructive'});
        return;
    }
    const menuItem = menuOptions.find(item => item.id === selectedMenuItemId);
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

    const existingOrder = activeOrders.find(o => o.tableNumber === tableNum && o.type === 'dine-in' && (o.status === 'pending' || o.status === 'preparing' || o.status === 'ready' || o.status === 'served'));

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
      orderToUpdate.timestamp = new Date().toISOString();
      orderToUpdate.status = 'pending'; // Always set to pending when adding new items to kitchen
      

      toast({ title: 'Order Updated', description: `Items added/updated for Table ${selectedTable}. Sent to kitchen.` });
    } else { 
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
    setCurrentOrderItems([]); 
    loadActiveOrders(); 
  };

  const handleRequestBillForSelectedTable = () => { 
    if (!pendingOrderForSelectedTable) { 
      toast({ title: 'Error', description: `No active order found for Table ${selectedTable} to bill. Submit items first.`, variant: 'destructive' });
      return;
    }
    if (pendingOrderForSelectedTable.status === 'bill_requested') {
        toast({ title: 'Info', description: `Bill already requested for Table ${selectedTable}. Admin is processing.`, variant: 'default' });
        return;
    }
    setOrderForBillConfirmation(pendingOrderForSelectedTable);
    setIsBillConfirmOpen(true);
  };

  const confirmAndSendToBilling = () => {
    if (!orderForBillConfirmation) return;

    const success = updateSharedOrderStatus(orderForBillConfirmation.id, 'bill_requested');
    
    if (success) {
      const subtotal = calculateSubtotal(orderForBillConfirmation.items);
      toast({ 
        title: 'Bill Requested', 
        description: `Bill request for Table ${orderForBillConfirmation.tableNumber} (Subtotal: ₹${subtotal.toFixed(2)}) sent. Admin notified.` 
      });
      loadActiveOrders();
    } else {
      toast({ title: 'Error', description: 'Failed to request bill.', variant: 'destructive' });
    }
    
    setCurrentOrderItems([]); 
    setIsBillConfirmOpen(false);
    setOrderForBillConfirmation(null);
  };

  const getStatusBadgeClass = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'preparing': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ready': return 'bg-green-100 text-green-700 border-green-300 animate-pulse';
      case 'served': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'bill_requested': return 'bg-orange-100 text-orange-700 border-orange-300 font-semibold';
      case 'billed': return 'bg-gray-200 text-gray-800 border-gray-400'; 
      case 'paid': return 'bg-teal-100 text-teal-700 border-teal-300 font-semibold';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getTableDisplayStatus = (tableNum: number): TableDisplayStatus => {
    if (String(tableNum) === selectedTable) return 'selected';
    const order = activeOrders.find(o => o.tableNumber === tableNum && o.type === 'dine-in' && o.status !== 'cancelled' && o.status !== 'paid' && o.status !== 'billed');
    if (!order) return 'vacant';
    if (order.status === 'bill_requested') return 'occupied_bill_requested';
    if (order.status === 'ready' || order.status === 'served') return 'occupied_ready';
    return 'occupied_pending'; 
  };

  const getTableStatusStyle = (status: TableDisplayStatus): string => {
    switch (status) {
      case 'vacant': return 'bg-card hover:bg-muted/50 text-card-foreground border-border';
      case 'selected': return 'bg-primary text-primary-foreground border-primary ring-2 ring-primary ring-offset-2';
      case 'occupied_pending': return 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-400';
      case 'occupied_ready': return 'bg-green-100 hover:bg-green-200 text-green-700 border-green-400 animate-pulse';
      case 'occupied_bill_requested': return 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-400';
      default: return 'bg-card hover:bg-muted/50 border-border';
    }
  };

  const getTableStatusIcon = (status: TableDisplayStatus) => {
    switch (status) {
        case 'vacant': return <Coffee className="w-4 h-4 text-muted-foreground" />;
        case 'occupied_pending': return <Utensils className="w-4 h-4 text-blue-600" />;
        case 'occupied_ready': return <BellRing className="w-4 h-4 text-green-600" />;
        case 'occupied_bill_requested': return <FileTextIcon className="w-4 h-4 text-orange-600" />;
        default: return null;
    }
  };


  if (!isMounted || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Sparkles className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  const canSubmitCurrentSelection = selectedTable && currentOrderItems.length > 0;
  const canRequestBillForSelectedTable = !!pendingOrderForSelectedTable && pendingOrderForSelectedTable.items.length > 0 && 
                                         (pendingOrderForSelectedTable.status !== 'bill_requested' && 
                                          pendingOrderForSelectedTable.status !== 'billed' && 
                                          pendingOrderForSelectedTable.status !== 'paid');


  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Waiter Interface" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="tableManagement" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="tableManagement" className="flex items-center gap-2"><LayoutGrid /> Table Management</TabsTrigger>
            <TabsTrigger value="allActiveOrders" className="flex items-center gap-2"><ListOrdered /> All Active Dine-in Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="tableManagement">
            <Card className="mb-6 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Select a Table</CardTitle>
                <CardDescription>Click on a table below to manage its order. Table count is ({tableNumbers.length}).</CardDescription>
              </CardHeader>
              <CardContent>
                {tableNumbers.length > 0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 p-2">
                    {tableNumbers.map(num => {
                      const status = getTableDisplayStatus(num);
                      return (
                        <Button
                          key={num}
                          variant="outline"
                          className={`flex flex-col items-center justify-center h-20 aspect-square shadow-sm transition-all duration-150 ease-in-out transform hover:scale-105 ${getTableStatusStyle(status)}`}
                          onClick={() => handleSelectTable(num)}
                        >
                          <span className="text-lg font-bold">{num}</span>
                          <div className="mt-1">
                            {getTableStatusIcon(status)}
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No tables configured. Admin needs to set the number of tables in settings.</p>
                )}
              </CardContent>
            </Card>

            {selectedTable && (
              <div className="grid gap-6 lg:grid-cols-2 mt-6">
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl">Create / Add to Order for Table {selectedTable}</CardTitle>
                    <CardDescription>Add items to the current selection for Table {selectedTable}.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="menuItem">Menu Item</Label>
                      <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId} disabled={menuOptions.length === 0}>
                        <SelectTrigger id="menuItem">
                          <SelectValue placeholder={menuOptions.length === 0 ? "Loading menu..." : "Select an item"} />
                        </SelectTrigger>
                        <SelectContent>
                          {menuOptions.map(item => (
                            <SelectItem key={item.id} value={item.id}>{item.name} - ₹{item.price.toFixed(2)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {menuOptions.length === 0 && <p className="text-xs text-muted-foreground">Menu is empty. Admin needs to add items.</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <Button onClick={handleAddItemToOrder} className="w-full" disabled={!selectedMenuItemId || menuOptions.length === 0}>
                      <PlusCircle className="mr-2" /> Add Item to Current Selection
                    </Button>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-xl">Current Items for Submission</CardTitle>
                      <CardDescription>For Table {selectedTable} (Subtotal: ₹{calculateSubtotal(currentOrderItems).toFixed(2)})</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {currentOrderItems.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">No items in current selection for Table {selectedTable}.</p>
                      ) : (
                        <ul className="space-y-3 max-h-48 overflow-y-auto">
                          {currentOrderItems.map(item => (
                            <li key={item.id + Math.random()} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                              <div>
                                <p className="font-medium">{item.name} <span className="text-sm text-muted-foreground"> (x{item.quantity})</span></p>
                                <p className="text-sm text-primary">₹{(item.price * item.quantity).toFixed(2)}</p>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveItemFromCurrentSelection(item.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                    {currentOrderItems.length > 0 && (
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
                        Active Order for Table {selectedTable}
                        {pendingOrderForSelectedTable?.status && (
                          <Badge variant="outline" className={`${getStatusBadgeClass(pendingOrderForSelectedTable.status)} capitalize font-medium`}>
                            {pendingOrderForSelectedTable.status === 'ready' && <BellRing className="w-3 h-3 mr-1" />}
                            {pendingOrderForSelectedTable.status.replace('_', ' ')}
                          </Badge>
                        )}
                      </CardTitle>
                      {pendingOrderForSelectedTable && 
                          <CardDescription>
                              Total subtotal: ₹{calculateSubtotal(pendingOrderForSelectedTable.items).toFixed(2)}
                          </CardDescription>
                      }
                      {!pendingOrderForSelectedTable && <CardDescription>No items submitted for this table yet.</CardDescription>}
                    </CardHeader>
                    <CardContent>
                      {pendingOrderForSelectedTable && pendingOrderForSelectedTable.items.length > 0 ? (
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                          {pendingOrderForSelectedTable.items.map(item => (
                            <li key={item.id} className="p-2 rounded-md bg-muted/30">
                              <div className="flex justify-between items-center">
                                  <span>{item.name} (x{item.quantity})</span>
                                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-muted-foreground text-center py-4">No items submitted to kitchen for Table {selectedTable} yet.</p>
                      )}
                    </CardContent>
                    {pendingOrderForSelectedTable && canRequestBillForSelectedTable && (
                      <CardFooter>
                        <Button onClick={handleRequestBillForSelectedTable} className="w-full" variant="outline">
                            <ReceiptText className="mr-2" /> Request Bill for Table {selectedTable}
                          </Button>
                      </CardFooter>
                    )}
                     {pendingOrderForSelectedTable && pendingOrderForSelectedTable.status === 'bill_requested' && (
                        <CardFooter>
                            <p className="w-full text-center text-sm text-orange-600 font-semibold">Bill has been requested for this table.</p>
                        </CardFooter>
                    )}
                  </Card>
                </div>
              </div>
            )}
            {!selectedTable && tableNumbers.length > 0 && (
                 <Card className="shadow-lg">
                    <CardContent className="text-center py-12">
                         <Image src="https://placehold.co/400x250.png" alt="Restaurant tables illustration" width={200} height={125} className="mx-auto mb-4 rounded-lg opacity-70" data-ai-hint="restaurant tables" />
                        <p className="text-muted-foreground">Please select a table from the grid above to manage its order.</p>
                    </CardContent>
                </Card>
            )}
          </TabsContent>

          <TabsContent value="allActiveOrders">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><ListOrdered /> All Active Dine-in Orders</CardTitle>
                <CardDescription>Overview of all dine-in orders not yet paid. Refreshing for status updates.</CardDescription>
              </CardHeader>
              <CardContent>
                {allUnbilledDineInOrdersList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Image src="https://placehold.co/400x250.png" alt="Empty restaurant overview" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="restaurant empty tables"/>
                    <p>No active dine-in orders across any tables.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {allUnbilledDineInOrdersList.map(order => (
                      <li key={order.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-lg font-semibold">Table {order.tableNumber}</span>
                            <span className="ml-2 text-xs text-muted-foreground">(ID: ...{order.id.slice(-6)})</span>
                          </div>
                           <Badge variant="outline" className={`${getStatusBadgeClass(order.status)} capitalize font-medium`}>
                            {order.status === 'ready' && <BellRing className="w-3 h-3 mr-1" />}
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Total Items: {order.items.reduce((acc, item) => acc + item.quantity, 0)}
                        </p>
                        <p className="text-sm font-medium mb-2">
                          Subtotal: ₹{calculateSubtotal(order.items).toFixed(2)}
                        </p>
                        {order.waiterUsername && <p className="text-xs text-muted-foreground">Waiter: {order.waiterUsername}</p>}
                        <details className="text-xs mt-1">
                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View Items ({order.items.length})</summary>
                            <ul className="mt-1 list-disc list-inside pl-4 space-y-0.5 text-muted-foreground">
                            {order.items.map(item => <li key={item.id + order.id}>{item.name} x{item.quantity} (₹{(item.price * item.quantity).toFixed(2)})</li>)}
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
                <AlertDialogTitle>Confirm Bill Request for Table {orderForBillConfirmation.tableNumber}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will notify the admin that Table {orderForBillConfirmation.tableNumber} is ready for billing. The order status will be changed to 'Bill Requested'.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4 space-y-2 max-h-60 overflow-y-auto text-sm">
                  <p className="font-semibold">Items for Billing:</p>
                  <ul className="list-disc list-inside pl-4">
                      {orderForBillConfirmation.items.map(item => (
                          <li key={item.id}>
                              {item.name} (x{item.quantity}) - ₹{(item.price * item.quantity).toFixed(2)}
                          </li>
                      ))}
                  </ul>
                  <Separator className="my-2" />
                  <p className="font-bold text-base">Order Subtotal: ₹{subtotalForBillDialog.toFixed(2)}</p>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => { setIsBillConfirmOpen(false); setOrderForBillConfirmation(null); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmAndSendToBilling}>Confirm & Request Bill</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </main>
    </div>
  );
}
