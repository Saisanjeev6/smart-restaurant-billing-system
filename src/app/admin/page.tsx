'use client';

import { useState, useEffect, useMemo } from 'react';
import { AppHeader } from '@/components/layout/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MENU_ITEMS, TABLE_NUMBERS, TAX_RATE } from '@/lib/constants';
import type { Order, OrderItem, Bill } from '@/types';
import { TipSuggestionTool } from './components/TipSuggestionTool';
import { FileText, Percent, Sparkles, ListChecks, Users, CreditCard } from 'lucide-react';
import Image from 'next/image';

// Mock orders data
const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-1001', tableNumber: 3, items: [{ ...MENU_ITEMS[0], quantity: 2 }, { ...MENU_ITEMS[2], quantity: 1 }], 
    status: 'served', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'dine-in'
  },
  {
    id: 'ORD-1002', tableNumber: 5, items: [{ ...MENU_ITEMS[3], quantity: 1 }, { ...MENU_ITEMS[4], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 2 }], 
    status: 'billed', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'dine-in'
  },
  {
    id: 'ORD-1003', customerName: 'Jane Doe', items: [{ ...MENU_ITEMS[8], quantity: 1 }], 
    status: 'ready', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'takeaway'
  },
];

export default function AdminPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedTableForBill, setSelectedTableForBill] = useState<string>('');
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [orderForBill, setOrderForBill] = useState<Order | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const calculateOrderTotal = (items: OrderItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleFetchBill = () => {
    if (!selectedTableForBill) {
      toast({ title: 'Error', description: 'Please select a table to fetch the bill.', variant: 'destructive' });
      return;
    }
    const order = activeOrders.find(o => o.tableNumber === parseInt(selectedTableForBill) && o.status !== 'billed' && o.type === 'dine-in');
    if (!order) {
      toast({ title: 'No Bill Found', description: `No active, unbilled dine-in order found for table ${selectedTableForBill}.`, variant: 'destructive' });
      setCurrentBill(null);
      setOrderForBill(null);
      return;
    }

    setOrderForBill(order);
    const subtotal = calculateOrderTotal(order.items);
    const taxAmount = subtotal * TAX_RATE;
    const totalAmount = subtotal + taxAmount;

    setCurrentBill({
      orderId: order.id,
      subtotal,
      taxRate: TAX_RATE,
      taxAmount,
      discountAmount: 0,
      totalAmount,
      paymentStatus: 'pending',
    });
    setDiscountPercentage(0); // Reset discount
    toast({ title: 'Bill Fetched', description: `Bill for table ${selectedTableForBill} is ready.` });
  };

  const applyDiscount = () => {
    if (!currentBill || !orderForBill) return;
    const discountValue = (currentBill.subtotal * discountPercentage) / 100;
    const newTotal = currentBill.subtotal + currentBill.taxAmount - discountValue;
    setCurrentBill({ ...currentBill, discountAmount: discountValue, totalAmount: newTotal });
    toast({ title: 'Discount Applied', description: `${discountPercentage}% discount applied to the bill.` });
  };

  const processPayment = () => {
    if (!currentBill || !orderForBill) return;
    setCurrentBill({ ...currentBill, paymentStatus: 'paid' });
    setActiveOrders(prevOrders => prevOrders.map(o => o.id === orderForBill.id ? { ...o, status: 'billed' } : o));
    toast({ title: 'Payment Processed', description: `Bill for order ${orderForBill.id} marked as paid.`, variant: 'default' });
    // Optionally clear bill after payment
    // setCurrentBill(null); setOrderForBill(null); setSelectedTableForBill('');
  };
  
  const orderDetailsForTipTool = useMemo(() => {
    if (orderForBill && currentBill) {
      const itemsSummary = orderForBill.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
      return `Items: ${itemsSummary}. Subtotal: $${currentBill.subtotal.toFixed(2)}. Total: $${currentBill.totalAmount.toFixed(2)}. Table: ${orderForBill.tableNumber}.`;
    }
    return '';
  }, [orderForBill, currentBill]);

  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Admin Dashboard" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 md:grid-cols-3">
            <TabsTrigger value="orders" className="flex items-center gap-2"><ListChecks /> Active Orders</TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2"><FileText /> Bill Management</TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2"><Sparkles /> AI Tip Suggester</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manage Orders</CardTitle>
                <CardDescription>View and manage all current restaurant orders.</CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Image src="https://placehold.co/400x250.png" alt="Restaurant scene" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="restaurant scene people" />
                        <p>No active orders at the moment.</p>
                    </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Table/Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                        <TableCell className="capitalize">{order.type}</TableCell>
                        <TableCell>{order.type === 'dine-in' ? `Table ${order.tableNumber}` : order.customerName || 'N/A'}</TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell>${calculateOrderTotal(order.items).toFixed(2)}</TableCell>
                        <TableCell><span className={`px-2 py-1 text-xs rounded-full ${order.status === 'billed' ? 'bg-green-200 text-green-800' : order.status === 'ready' ? 'bg-yellow-200 text-yellow-800' : 'bg-blue-200 text-blue-800'}`}>{order.status}</span></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Finalize Bill</CardTitle>
                  <CardDescription>Select a table to generate and finalize their bill.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="billTableNumber">Table Number</Label>
                    <Select value={selectedTableForBill} onValueChange={setSelectedTableForBill}>
                      <SelectTrigger id="billTableNumber">
                        <SelectValue placeholder="Select table for billing" />
                      </SelectTrigger>
                      <SelectContent>
                        {TABLE_NUMBERS.map(num => (
                          <SelectItem key={num} value={String(num)}>Table {num}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleFetchBill} className="w-full" disabled={!selectedTableForBill}>Fetch Bill</Button>
                </CardContent>
              </Card>

              {orderForBill && currentBill && (
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle>Bill for Table {orderForBill.tableNumber} (Order {orderForBill.id.slice(-6)})</CardTitle>
                    <CardDescription>Status: <span className={`font-semibold ${currentBill.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{currentBill.paymentStatus}</span></CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="space-y-1 text-sm max-h-40 overflow-y-auto">
                      {orderForBill.items.map(item => (
                        <li key={item.id} className="flex justify-between">
                          <span>{item.name} x{item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                    <Separator />
                    <div className="flex justify-between text-sm"><p>Subtotal:</p><p>${currentBill.subtotal.toFixed(2)}</p></div>
                    <div className="flex justify-between text-sm"><p>Tax ({TAX_RATE * 100}%):</p><p>${currentBill.taxAmount.toFixed(2)}</p></div>
                    {currentBill.discountAmount > 0 && (
                      <div className="flex justify-between text-sm text-destructive"><p>Discount:</p><p>-${currentBill.discountAmount.toFixed(2)}</p></div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold"><p>Total:</p><p>${currentBill.totalAmount.toFixed(2)}</p></div>
                    
                    {currentBill.paymentStatus === 'pending' && (
                      <>
                        <Separator />
                        <div className="flex items-end gap-2 pt-2">
                          <div className="flex-grow">
                            <Label htmlFor="discount">Discount (%)</Label>
                            <Input id="discount" type="number" value={discountPercentage} onChange={e => setDiscountPercentage(parseFloat(e.target.value))} min="0" max="100" />
                          </div>
                          <Button onClick={applyDiscount} variant="outline"><Percent className="mr-2 h-4 w-4" />Apply</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                  {currentBill.paymentStatus === 'pending' && (
                    <CardFooter>
                      <Button onClick={processPayment} className="w-full" size="lg"><CreditCard className="mr-2 h-4 w-4" /> Process Payment</Button>
                    </CardFooter>
                  )}
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tips">
            <TipSuggestionTool initialOrderDetails={orderDetailsForTipTool} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
