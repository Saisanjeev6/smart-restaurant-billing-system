
'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { MENU_ITEMS, TAX_RATE } from '@/lib/constants';
import type { Order, OrderItem, Bill, User } from '@/types';
import { PlusCircle, Trash2, ShoppingBag, CreditCard, ReceiptText, Printer, RotateCcw, Sparkles, Ticket } from 'lucide-react';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';


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

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) { 
      router.push('/login');
    } else {
      setCurrentUser(user);
      setIsMounted(true);
    }
  }, [router]);

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

  const handleGenerateBill = () => {
    if (currentOrderItems.length === 0) {
      toast({ title: 'Error', description: 'Cannot generate bill for an empty order.', variant: 'destructive' });
      return;
    }

    const newOrder: Order = {
      id: `TAKE-${Date.now()}`, 
      items: currentOrderItems,
      status: 'pending', // Order is pending, sent to kitchen upon bill generation
      timestamp: new Date().toISOString(),
      type: 'takeaway',
    };
    setActiveOrder(newOrder);

    const subtotal = calculateSubtotal(currentOrderItems);
    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    setCurrentBill({
      orderId: newOrder.id,
      subtotal,
      taxRate: TAX_RATE,
      taxAmount,
      discountAmount: 0, 
      totalAmount,
      paymentStatus: 'pending',
    });
    toast({ title: 'Order Sent to Kitchen', description: `Token: ${newOrder.id.slice(-6)}. Bill ready for payment.` });
  };
  
  const processPayment = () => {
    if (!currentBill || !activeOrder) return;
    setCurrentBill({ ...currentBill, paymentStatus: 'paid' });
    // In a real app, this order's status might be updated to 'paid' or 'completed' in a backend.
    // For this prototype, we'll just update the local activeOrder state.
    setActiveOrder({ ...activeOrder, status: 'billed' }); 
    toast({ title: 'Payment Processed', description: `Takeaway order ${activeOrder.id.slice(-6)} paid.`, variant: 'default' });
  };

  const handlePrintBill = () => {
    if (currentBill?.paymentStatus === 'paid') {
      window.print();
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
              <CardDescription>Add items to the order. A token will be generated when the bill is created.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                {currentOrderItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Image src="https://placehold.co/300x200.png" alt="Empty shopping bag" width={150} height={100} className="mb-4 rounded-lg opacity-70" data-ai-hint="empty bag takeaway" />
                    <p>No items added yet. Start building the order.</p>
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
              {currentOrderItems.length > 0 && !currentBill && (
                <CardFooter className="flex flex-col gap-4 pt-4 border-t">
                  <div className="flex justify-between w-full text-lg font-semibold">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal(currentOrderItems).toFixed(2)}</span>
                  </div>
                  <Button onClick={handleGenerateBill} className="w-full" size="lg" disabled={currentBill?.paymentStatus === 'pending'}>
                    <ReceiptText className="mr-2" /> Generate Bill & Send to Kitchen
                  </Button>
                </CardFooter>
              )}
            </Card>
            
            {currentBill && activeOrder && (
                <Card className="shadow-lg" id="final-bill-card-takeaway">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Ticket className="text-primary"/>Order Token: {activeOrder.id.slice(-6)}</CardTitle>
                    <CardDescription>Status: <span className={`font-semibold ${currentBill.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{currentBill.paymentStatus} (Order status: {activeOrder.status})</span></CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {activeOrder.items.map(item => (
                        <div key={item.id} className="flex justify-between">
                            <span>{item.name} (x{item.quantity})</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between"><p>Subtotal:</p><p>${currentBill.subtotal.toFixed(2)}</p></div>
                    <div className="flex justify-between"><p>Tax ({TAX_RATE * 100}%):</p><p>${currentBill.taxAmount.toFixed(2)}</p></div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold"><p>Total Amount:</p><p>${currentBill.totalAmount.toFixed(2)}</p></div>
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                    {currentBill.paymentStatus === 'pending' && (
                      <Button onClick={processPayment} className="w-full" size="lg"><CreditCard className="mr-2 h-4 w-4" /> Process Payment</Button>
                    )}
                    {currentBill.paymentStatus === 'paid' && (
                      <>
                        <Button onClick={handlePrintBill} className="w-full" size="lg" variant="outline">
                          <Printer className="mr-2 h-4 w-4" /> Print Bill
                        </Button>
                        <Button onClick={handleStartNewOrder} className="w-full" size="lg">
                          <RotateCcw className="mr-2 h-4 w-4" /> Start New Order
                        </Button>
                      </>
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

