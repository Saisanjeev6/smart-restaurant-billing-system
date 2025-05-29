
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getTaxRate } from '@/lib/restaurantSettings';
import { getMenuItems } from '@/lib/menuManager';
import type { MenuItem as MenuItemType, Order, OrderItem, Bill, User } from '@/types';
import { PlusCircle, Trash2, ShoppingBag, CreditCard, ReceiptText, Printer, RotateCcw, Sparkles, Ticket } from 'lucide-react';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { addOrUpdateSharedOrder, updateSharedOrderStatus, getSharedOrderById } from '@/lib/orderManager';


export default function TakeawayPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentOrderItems, setCurrentOrderItems] = useState<OrderItem[]>([]);
  const [selectedMenuItemId, setSelectedMenuItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [menuOptions, setMenuOptions] = useState<MenuItemType[]>([]);
  const [taxRate, setTaxRate] = useState(0.08);


  useEffect(() => {
    if (isMounted) {
      setMenuOptions(getMenuItems());
      setTaxRate(getTaxRate());
    }
  }, [isMounted]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { 
      router.push('/login');
    } else {
      setCurrentUser(user);
      setIsMounted(true);
    }
  }, [router]);

  const loadOrderAndBill = useCallback(() => {
    if (activeOrder) {
      const freshOrder = getSharedOrderById(activeOrder.id);
      if (freshOrder) {
        const updatedItems = freshOrder.items.map(item => {
            const menuItemDetails = menuOptions.find(mi => mi.id === item.id);
            return menuItemDetails ? { ...item, price: menuItemDetails.price, name: menuItemDetails.name, category: menuItemDetails.category } : item;
        });
        const potentiallyUpdatedOrder = {...freshOrder, items: updatedItems};
        setActiveOrder(potentiallyUpdatedOrder);

        if (freshOrder.status === 'pending' || freshOrder.status === 'paid' || freshOrder.status === 'ready' ) { 
          const subtotal = calculateSubtotal(potentiallyUpdatedOrder.items);
          const currentTaxRate = getTaxRate();
          const taxAmount = subtotal * currentTaxRate;
          const totalAmount = subtotal + taxAmount;
          setCurrentBill({
            orderId: freshOrder.id,
            subtotal,
            taxRate: currentTaxRate,
            taxAmount,
            discountAmount: 0, 
            totalAmount,
            paymentStatus: freshOrder.status === 'paid' ? 'paid' : 'pending',
          });
        }
      } else {
        // Order might have been cleared or doesn't exist anymore
        if (currentBill?.paymentStatus !== 'paid'){ // Keep bill if it was paid
            handleStartNewOrder(); 
        }
      }
    }
  }, [activeOrder, menuOptions, currentBill?.paymentStatus]); 

  useEffect(() => {
    if (!isMounted) return;
    loadOrderAndBill(); 
    const intervalId = setInterval(loadOrderAndBill, 5000); 
    return () => clearInterval(intervalId);
  }, [isMounted, loadOrderAndBill]);


  const handleAddItemToOrder = () => {
    if (currentBill) { 
      toast({ title: 'Order Finalized', description: 'Cannot add items after bill is generated. Please start a new order.', variant: 'destructive' });
      return;
    }
    if (!selectedMenuItemId || quantity <= 0) {
      toast({ title: 'Error', description: 'Please select an item and specify a valid quantity.', variant: 'destructive' });
      return;
    }
    const menuItem = menuOptions.find(item => item.id === selectedMenuItemId);
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
     if (currentBill) { 
      toast({ title: 'Order Finalized', description: 'Cannot remove items after bill is generated.', variant: 'destructive' });
      return;
    }
    setCurrentOrderItems(currentOrderItems.filter(item => item.id !== itemId));
  };

  const calculateSubtotal = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleGenerateBill = () => {
    if (currentOrderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot generate bill for an empty order.', variant: 'destructive' });
      return;
    }
    if (currentBill) { 
        toast({ title: 'Bill Already Generated', description: 'A bill for this order already exists.', variant: 'default' });
        return;
    }

    const newOrder: Order = {
      id: `TAKE-${Date.now()}`, 
      items: currentOrderItems,
      status: 'pending', 
      timestamp: new Date().toISOString(),
      type: 'takeaway',
      waiterId: currentUser?.id, 
      waiterUsername: currentUser?.username,
    };
    addOrUpdateSharedOrder(newOrder); 
    setActiveOrder(newOrder);

    const subtotal = calculateSubtotal(currentOrderItems);
    const currentTaxRate = getTaxRate();
    const taxAmount = subtotal * currentTaxRate;
    const totalAmount = subtotal + taxAmount;

    setCurrentBill({
      orderId: newOrder.id,
      subtotal,
      taxRate: currentTaxRate,
      taxAmount,
      discountAmount: 0, 
      totalAmount,
      paymentStatus: 'pending',
    });
    toast({ title: 'Order Sent to Kitchen', description: `Token: ${newOrder.id.slice(-6)}. Bill ready for payment.` });
  };
  
  const processPayment = () => {
    if (!currentBill || !activeOrder) return;
    const success = updateSharedOrderStatus(activeOrder.id, 'paid'); 
    if (success) {
      setCurrentBill({ ...currentBill, paymentStatus: 'paid' });
      setActiveOrder({ ...activeOrder, status: 'paid' }); 
      toast({ title: 'Payment Processed', description: `Takeaway order ${activeOrder.id.slice(-6)} paid.`, variant: 'default' });
    } else {
      toast({ title: 'Error', description: 'Failed to process payment.', variant: 'destructive' });
    }
  };

  const handlePrintBill = () => {
    if (currentBill?.paymentStatus === 'paid') {
      console.log("Takeaway: Attempting to print bill...");
      setTimeout(() => window.print(), 100); 
    } else {
      toast({ title: 'Error', description: 'Bill must be paid before printing.', variant: 'destructive' });
    }
  };

  const handleStartNewOrder = () => {
    setCurrentOrderItems([]);
    setCurrentBill(null);
    setActiveOrder(null);
    setSelectedMenuItemId('');
    setQuantity(1);
    setTaxRate(getTaxRate());
    toast({ title: 'New Order Started', description: 'Ready to take the next takeaway order.'});
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
      <AppHeader title="Takeaway Orders" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl"><ShoppingBag /> New Takeaway Order</CardTitle>
              <CardDescription>Add items to the order. A token will be generated when the bill is created. Currency is INR (₹).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="menuItem">Menu Item</Label>
                <Select value={selectedMenuItemId} onValueChange={setSelectedMenuItemId} disabled={!!currentBill || menuOptions.length === 0}>
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
                  disabled={!!currentBill}
                />
              </div>
              <Button onClick={handleAddItemToOrder} className="w-full" disabled={!selectedMenuItemId || !!currentBill || menuOptions.length === 0}>
                <PlusCircle className="mr-2" /> Add Item to Order
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6" id="takeaway-right-column">
            <Card className="shadow-lg" id={currentOrderItems.length > 0 && !currentBill ? "current-order-summary-card" : undefined}>
              <CardHeader>
                <CardTitle className="text-xl">Current Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {currentOrderItems.length === 0 && !activeOrder ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Image src="https://placehold.co/300x200.png" alt="Empty shopping bag" width={150} height={100} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty bag takeaway" />
                    <p>No items added yet. Start building the order.</p>
                  </div>
                ) : currentOrderItems.length > 0 && !activeOrder ? ( 
                  <ul className="space-y-3">
                    {currentOrderItems.map(item => (
                      <li key={item.id} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                        <div>
                          <p className="font-medium">{item.name} <span className="text-sm text-muted-foreground"> (x{item.quantity})</span></p>
                          <p className="text-sm text-primary">₹{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} disabled={!!currentBill}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : null 
                }
              </CardContent>
              {currentOrderItems.length > 0 && !currentBill && (
                <CardFooter className="flex flex-col gap-4 pt-4 border-t">
                  <div className="flex justify-between w-full text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span>₹{calculateSubtotal(currentOrderItems).toFixed(2)}</span>
                  </div>
                  <Button onClick={handleGenerateBill} className="w-full" size="lg" disabled={!!currentBill}>
                    <ReceiptText className="mr-2" /> Generate Bill & Send to Kitchen
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {currentBill && activeOrder && (
                <Card className="shadow-lg" id="final-bill-card-takeaway">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Ticket className="text-primary"/>Order Token: {activeOrder.id.slice(-6)}</CardTitle>
                    <CardDescription>Status: <span className={`font-semibold ${currentBill.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{currentBill.paymentStatus} (Order status: <span className='capitalize'>{activeOrder.status.replace('_',' ')}</span>)</span></CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {activeOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between"><p>Subtotal:</p><p>₹{currentBill.subtotal.toFixed(2)}</p></div>
                    <div className="flex justify-between"><p>Tax ({(taxRate * 100).toFixed(1)}%):</p><p>₹{currentBill.taxAmount.toFixed(2)}</p></div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold"><p>Total Amount:</p><p>₹{currentBill.totalAmount.toFixed(2)}</p></div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    {currentBill.paymentStatus === 'pending' && (
                      <Button onClick={processPayment} className="w-full" size="lg"><CreditCard className="mr-2 h-4 w-4" /> Process Payment</Button>
                    )}
                    {currentBill.paymentStatus === 'paid' && (
                      <>
                        <Button onClick={handlePrintBill} className="w-full" size="lg" variant="outline" aria-label="Print Bill">
                          <Printer className="mr-2 h-4 w-4" /> Print Bill
                        </Button>
                        <Button onClick={handleStartNewOrder} className="w-full" size="lg">
                          <RotateCcw className="mr-2 h-4 w-4" /> Start New Order
                        </Button>
                      </>
                    )}
                     {currentBill.paymentStatus !== 'paid' && activeOrder.status !== 'pending' && activeOrder.status !== 'paid' && ( 
                       <p className='text-sm text-center text-green-600'>Order is {activeOrder.status.replace('_',' ')}. Awaiting payment.</p>
                    )}
                  </CardFooter>
                </Card>
              )}
          </div>
        </div>
      </main>
    </div>
  );
}

