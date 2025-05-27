
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import type { Order, OrderItem, Bill, User } from '@/types';
import { TipSuggestionTool } from './components/TipSuggestionTool';
import { ManageWaitersTool } from './components/ManageWaitersTool';
import { FileText, Percent, Sparkles, ListChecks, Users, CreditCard, UserCog, LineChart, CalendarDays, DollarSign, ShoppingCart, Info, CalendarIcon, Utensils, Tag } from 'lucide-react';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { getSharedOrders, initializeSharedOrdersWithMockData } from '@/lib/orderManager';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, parseISO, getMonth, getYear, subMonths, startOfDay, endOfDay, isValid } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"


// Enhanced Mock orders data for analytics and active orders display
const MOCK_ORDERS_SEED: Order[] = [
  {
    id: 'ORD-1001', tableNumber: 3, items: [{ ...MENU_ITEMS[0], quantity: 2 }, { ...MENU_ITEMS[2], quantity: 1 }],
    status: 'billed', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), type: 'dine-in'
  },
  {
    id: 'ORD-1002', tableNumber: 5, items: [{ ...MENU_ITEMS[3], quantity: 1 }, { ...MENU_ITEMS[4], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 2 }],
    status: 'billed', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), type: 'dine-in'
  },
  {
    id: 'TAKE-001', items: [{ ...MENU_ITEMS[8], quantity: 1 }, { ...MENU_ITEMS[7], quantity: 1 }],
    status: 'pending', timestamp: new Date(Date.now() - 180000).toISOString(), type: 'takeaway' // 3 mins ago
  },
  {
    id: 'ORD-1004', tableNumber: 1, items: [{ ...MENU_ITEMS[1], quantity: 1 }, { ...MENU_ITEMS[5], quantity: 1 }],
    status: 'billed', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), type: 'dine-in'
  },
  {
    id: 'TAKE-002', items: [{ ...MENU_ITEMS[0], quantity: 2 }],
    status: 'ready', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'takeaway' // 5 mins ago
  },
  {
    id: 'ORD-1005', items: [{ ...MENU_ITEMS[0], quantity: 2 }], 
    tableNumber: 9, status: 'pending', timestamp: new Date(Date.now() - 86400000 * 8).toISOString(), type: 'dine-in'
  },
  {
    id: 'ORD-1006', tableNumber: 4, items: [{ ...MENU_ITEMS[2], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 2 }],
    status: 'billed', timestamp: new Date(Date.now() - 86400000 * 15).toISOString(), type: 'dine-in'
  },
  {
    id: 'TAKE-003', items: [{ ...MENU_ITEMS[4], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 1 }],
    status: 'billed', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'takeaway' // 10 mins ago, already billed
  },
  {
    id: 'ORD-1007', tableNumber: 7, items: [{ ...MENU_ITEMS[3], quantity: 2 }, { ...MENU_ITEMS[7], quantity: 1 }],
    status: 'billed', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), type: 'dine-in'
  },
   {
    id: 'ORD-1008', items: [{ ...MENU_ITEMS[8], quantity: 1 }, { ...MENU_ITEMS[4], quantity: 1 }],
    tableNumber: 10, status: 'pending', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), type: 'dine-in'
  },
  {
    id: 'ORD-1009', tableNumber: 2, items: [{ ...MENU_ITEMS[0], quantity: 1 }],
    status: 'billed', timestamp: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(15)).toISOString(), type: 'dine-in'
  },
   {
    id: 'ORD-1010', tableNumber: 6, items: [{ ...MENU_ITEMS[5], quantity: 2 }],
    status: 'billed', timestamp: new Date().toISOString(), type: 'dine-in'
  },
  {
    id: 'ORD-1011', tableNumber: 8, items: [{ ...MENU_ITEMS[9], quantity: 1 }],
    status: 'billed', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(), type: 'dine-in'
  },
  {
    id: 'TAKE-004', items: [{ ...MENU_ITEMS[1], quantity: 2 }, { ...MENU_ITEMS[7], quantity: 2 }],
    status: 'pending', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString(), type: 'takeaway'
  },
   {
    id: 'TAKE-005', items: [{ ...MENU_ITEMS[4], quantity: 1 }],
    status: 'ready', timestamp: new Date(new Date(new Date().setMonth(new Date().getMonth() - 5)).setDate(5)).toISOString(), type: 'takeaway'
  }
];

type AnalyticsPeriod = 'today' | 'week' | 'month' | '2months' | 'custom';

const chartConfig = {
  totalSales: {
    label: "Total Sales",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;


export default function AdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedTableForBill, setSelectedTableForBill] = useState<string>('');
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [orderForBill, setOrderForBill] = useState<Order | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState<AnalyticsPeriod>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);


  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
    } else {
      setCurrentUser(user);
      initializeSharedOrdersWithMockData(MOCK_ORDERS_SEED); // Seed if empty
      setActiveOrders(getSharedOrders()); // Load from shared storage
      setIsMounted(true);
    }
  }, [router]);

  const calculateOrderTotal = (items: OrderItem[]) => items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const formatPeriodLabel = (period: AnalyticsPeriod, start?: Date, end?: Date): string => {
    if (!start || !end && period === 'custom') return 'Custom range not set';
    if (!start || !end) { // For non-custom periods where start/end might be derived later
        switch (period) {
            case 'today': return `Today`;
            case 'week': return `This Week`;
            case 'month': return `This Month`;
            case '2months': return `Last 2 Months`;
            default: return '';
        }
    }
    switch (period) {
      case 'today': return `Today (${format(start, 'MMM d')})`;
      case 'week': return `This Week (${format(start, 'MMM d')} - ${format(end, 'MMM d')})`;
      case 'month': return `This Month (${format(start, 'MMMM yyyy')})`;
      case '2months': return `Last 2 Months (${format(start, 'MMMM yyyy')} - ${format(end, 'MMMM yyyy')})`;
      case 'custom':
        if (isValid(start) && isValid(end)) {
          return `Custom: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
        }
        return 'Custom range not fully set';
      default: return '';
    }
  };

  const billedOrders = useMemo(() => activeOrders.filter(order => order.status === 'billed'), [activeOrders]);

  const analyticsData = useMemo(() => {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined = endOfDay(now);

    switch (selectedAnalyticsPeriod) {
      case 'today':
        startDate = startOfDay(now);
        break;
      case 'week':
        startDate = startOfWeek(now, { weekStartsOn: 1 }); 
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case '2months':
        startDate = startOfMonth(subMonths(now, 1)); 
        endDate = endOfMonth(now); 
        break;
      case 'custom':
        startDate = customStartDate ? startOfDay(customStartDate) : undefined;
        endDate = customEndDate ? endOfDay(customEndDate) : undefined;
        break;
      default:
        startDate = startOfMonth(now); // Default to this month if something unexpected
    }
    
    let filteredOrders: Order[] = [];
    let periodLabel = 'Loading...';

    if (startDate && endDate) {
      if (startDate > endDate) {
        // This toast should ideally be triggered by user action, not in useMemo
        // Consider moving validation to where custom dates are set
        periodLabel = 'Invalid custom range';
      } else {
        filteredOrders = billedOrders.filter(order => {
          const orderDate = parseISO(order.timestamp);
          return isValid(orderDate) && isWithinInterval(orderDate, { start: startDate as Date, end: endDate as Date});
        });
        periodLabel = formatPeriodLabel(selectedAnalyticsPeriod, startDate, endDate);
      }
    } else if (selectedAnalyticsPeriod === 'custom') {
      periodLabel = 'Please select a start and end date for the custom range.';
    } else if (startDate) { // For non-custom ranges where endDate might be implicitly now
        periodLabel = formatPeriodLabel(selectedAnalyticsPeriod, startDate, endDate);
         filteredOrders = billedOrders.filter(order => {
          const orderDate = parseISO(order.timestamp);
          return isValid(orderDate) && isWithinInterval(orderDate, { start: startDate as Date, end: endDate as Date});
        });
    }


    const totalSales = filteredOrders.reduce((sum, order) => sum + calculateOrderTotal(order.items), 0);
    const totalOrders = filteredOrders.length;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      periodLabel
    };
  }, [billedOrders, selectedAnalyticsPeriod, customStartDate, customEndDate]);

  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const salesByMonth: { [monthYear: string]: { month: string, monthNumeric: number, year: number, totalSales: number } } = {};

    billedOrders.forEach(order => {
      const orderDate = parseISO(order.timestamp);
       if (!isValid(orderDate)) return;

      const monthYearStr = format(orderDate, 'MMM yyyy');
      const monthNumeric = getMonth(orderDate); 
      const year = getYear(orderDate);
      
      if (!salesByMonth[monthYearStr]) {
        salesByMonth[monthYearStr] = { month: monthYearStr, monthNumeric, year, totalSales: 0 };
      }
      salesByMonth[monthYearStr].totalSales += calculateOrderTotal(order.items);
    });
    
    const chartDataPoints = [];
    for (let i = 5; i >= 0; i--) { // Iterate for last 6 months including current
      const targetMonthDate = subMonths(now, i);
      const monthYearStr = format(targetMonthDate, 'MMM yyyy');
      if (salesByMonth[monthYearStr]) {
        chartDataPoints.push(salesByMonth[monthYearStr]);
      } else {
         chartDataPoints.push({ month: monthYearStr, monthNumeric: getMonth(targetMonthDate), year: getYear(targetMonthDate), totalSales: 0 });
      }
    }
    // Sort ensures chronological order for the chart
    return chartDataPoints.sort((a, b) => (a.year * 100 + a.monthNumeric) - (b.year * 100 + b.monthNumeric));

  }, [billedOrders]);

  const orderDetailsForTipTool = useMemo(() => {
    if (orderForBill && currentBill) {
      const itemsSummary = orderForBill.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
      return `Items: ${itemsSummary}. Subtotal: $${currentBill.subtotal.toFixed(2)}. Total: $${currentBill.totalAmount.toFixed(2)}. Table: ${orderForBill.tableNumber}.`;
    }
    return '';
  }, [orderForBill, currentBill]);

  // Filter out 'billed' orders for the "Active Orders" tab
  const nonBilledOrders = useMemo(() => activeOrders.filter(order => order.status !== 'billed'), [activeOrders]);


  const handleFetchBill = () => {
    if (!selectedTableForBill) {
      toast({ title: 'Error', description: 'Please select a table to fetch the bill.', variant: 'destructive' });
      return;
    }
    // Find unbilled dine-in order for the selected table from current activeOrders state
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
    setDiscountPercentage(0); 
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
    // Update the order status in the shared orders via orderManager
    // For now, just updating local state for immediate UI feedback
    setActiveOrders(prevOrders => prevOrders.map(o => o.id === orderForBill.id ? { ...o, status: 'billed' } : o));
    // In a full app, you would also update this in shared storage:
    // updateSharedOrderStatus(orderForBill.id, 'billed');
    toast({ title: 'Payment Processed', description: `Bill for order ${orderForBill.id} marked as paid.`, variant: 'default' });
  };
  
  if (!isMounted || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Utensils className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  const analyticsPeriods: { label: string; value: AnalyticsPeriod }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 2 Months', value: '2months' },
    { label: 'Custom Range', value: 'custom' },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader title="Admin Dashboard" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 md:grid-cols-5">
            <TabsTrigger value="orders" className="flex items-center gap-2"><ListChecks /> Active Orders</TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2"><FileText /> Bill Management</TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2"><Sparkles /> AI Tip Suggester</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2"><UserCog /> Manage Waiters</TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2"><LineChart /> Sales Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manage Active Orders</CardTitle>
                <CardDescription>View and manage all current (unbilled) restaurant orders, including dine-in and takeaway.</CardDescription>
              </CardHeader>
              <CardContent>
                {nonBilledOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Image src="https://placehold.co/400x250.png" alt="Restaurant scene" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="restaurant people" />
                        <p>No active (unbilled) orders at the moment.</p>
                    </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID/Token</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Table/Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {nonBilledOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                        <TableCell className="capitalize">{order.type}</TableCell>
                        <TableCell>
                          {order.type === 'dine-in' ? `Table ${order.tableNumber}` : (order.id.slice(-6) || 'Takeaway')}
                        </TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell>${calculateOrderTotal(order.items).toFixed(2)}</TableCell>
                        <TableCell>
                           <span className={`px-2 py-1 text-xs rounded-full font-medium
                            ${order.status === 'pending' ? 'bg-blue-100 text-blue-700 border border-blue-300' : ''}
                            ${order.status === 'preparing' ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' : ''}
                            ${order.status === 'ready' ? 'bg-green-100 text-green-700 border border-green-300' : ''}
                            ${order.status === 'served' ? 'bg-purple-100 text-purple-700 border border-purple-300' : ''}
                            ${order.status === 'billed' ? 'bg-gray-100 text-gray-700 border border-gray-300' : ''}
                          `}>
                            {order.status}
                          </span>
                        </TableCell>
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
                  <CardTitle>Finalize Dine-in Bill</CardTitle>
                  <CardDescription>Select a table to generate and finalize their bill. Takeaway bills are managed on the Takeaway page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="billTableNumber">Table Number (Dine-in)</Label>
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
          <TabsContent value="users">
            <ManageWaitersTool />
          </TabsContent>
          <TabsContent value="analytics">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><LineChart className="text-primary" /> Sales Analytics</CardTitle>
                <CardDescription>Analyze sales data over different periods. Displaying data for <span className="font-semibold">{analyticsData.periodLabel}</span>.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col gap-4 p-3 rounded-md bg-muted">
                  <div className="flex flex-wrap items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                    <span className="mr-2 text-sm font-medium text-muted-foreground">Select Period:</span>
                    {analyticsPeriods.map(period => (
                      <Button
                        key={period.value}
                        variant={selectedAnalyticsPeriod === period.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedAnalyticsPeriod(period.value);
                          if (period.value !== 'custom') {
                            // Optionally reset custom dates if a predefined period is chosen
                            // setCustomStartDate(undefined);
                            // setCustomEndDate(undefined);
                          }
                        }}
                      >
                        {period.label}
                      </Button>
                    ))}
                  </div>
                  {selectedAnalyticsPeriod === 'custom' && (
                    <div className="grid grid-cols-1 gap-4 pt-2 border-t sm:grid-cols-2 border-border">
                      <div>
                        <Label htmlFor="customStartDate" className="text-xs">Start Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="customStartDate"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !customStartDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {customStartDate ? format(customStartDate, "PPP") : <span>Pick a start date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={customStartDate}
                              onSelect={(date) => {
                                setCustomStartDate(date);
                                if (date && customEndDate && date > customEndDate) setCustomEndDate(undefined);
                              }}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="customEndDate" className="text-xs">End Date</Label>
                         <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="customEndDate"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !customEndDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              {customEndDate ? format(customEndDate, "PPP") : <span>Pick an end date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              disabled={(date) => (customStartDate && date < customStartDate) || date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}
                </div>


                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2"><DollarSign className="text-green-500"/>Total Sales</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${analyticsData.totalSales.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2"><ShoppingCart className="text-blue-500" />Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-medium flex items-center gap-2"><DollarSign className="text-purple-500" /><Percent className="text-purple-500 w-4 h-4 -ml-4 -mt-1" />Avg. Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${analyticsData.averageOrderValue.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Separator />

                <div>
                  <h3 className="mb-4 text-lg font-semibold">Monthly Sales Overview (Last 6 Months)</h3>
                  {monthlyChartData.length > 0 ? (
                     <ChartContainer config={chartConfig} className="h-[300px] w-full">
                      <BarChart accessibilityLayer data={monthlyChartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month" 
                          tickLine={false} 
                          axisLine={false} 
                          tickMargin={8}
                          tickFormatter={(value) => value.slice(0, 3)} 
                        />
                        <YAxis 
                          tickFormatter={(value) => `$${value}`}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Legend />
                        <Bar dataKey="totalSales" fill="var(--color-totalSales)" radius={4} />
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Info className="w-12 h-12 mb-3 text-primary/50" />
                      <p>No sales data available for the past 6 months to display in the chart.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

