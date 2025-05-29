'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { ManageUsersTool } from './components/ManageUsersTool'; // Updated import
import { FileText, Percent, Sparkles, ListChecks, Users, CreditCard, UserCog, LineChart, CalendarDays, DollarSign, ShoppingCart, Info, CalendarIcon, Utensils, Tag, BellRing, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import { getSharedOrders, initializeSharedOrdersWithMockData, updateSharedOrderStatus } from '@/lib/orderManager';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, isWithinInterval, parseISO, getMonth, getYear, subMonths, startOfDay, endOfDay, isValid } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Badge } from '@/components/ui/badge';


const MOCK_ORDERS_SEED: Order[] = [
  {
    id: 'ORD-1001', tableNumber: 3, items: [{ ...MENU_ITEMS[0], quantity: 2 }, { ...MENU_ITEMS[2], quantity: 1 }],
    status: 'paid', timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'ORD-1002', tableNumber: 5, items: [{ ...MENU_ITEMS[3], quantity: 1 }, { ...MENU_ITEMS[4], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 2 }],
    status: 'paid', timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'TAKE-001', items: [{ ...MENU_ITEMS[8], quantity: 1 }, { ...MENU_ITEMS[7], quantity: 1 }],
    status: 'pending', timestamp: new Date(Date.now() - 180000).toISOString(), type: 'takeaway'
  },
  {
    id: 'ORD-1004', tableNumber: 1, items: [{ ...MENU_ITEMS[1], quantity: 1 }, { ...MENU_ITEMS[5], quantity: 1 }],
    status: 'ready', timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'TAKE-002', items: [{ ...MENU_ITEMS[0], quantity: 2 }],
    status: 'ready', timestamp: new Date(Date.now() - 300000).toISOString(), type: 'takeaway'
  },
  {
    id: 'ORD-1005', items: [{ ...MENU_ITEMS[0], quantity: 2 }],
    tableNumber: 9, status: 'pending', timestamp: new Date(Date.now() - 86400000 * 8).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'ORD-1006', tableNumber: 4, items: [{ ...MENU_ITEMS[2], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 2 }],
    status: 'bill_requested', timestamp: new Date(Date.now() - 360000).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'TAKE-003', items: [{ ...MENU_ITEMS[4], quantity: 1 }, { ...MENU_ITEMS[6], quantity: 1 }],
    status: 'paid', timestamp: new Date(Date.now() - 600000).toISOString(), type: 'takeaway'
  },
  {
    id: 'ORD-1007', tableNumber: 7, items: [{ ...MENU_ITEMS[3], quantity: 2 }, { ...MENU_ITEMS[7], quantity: 1 }],
    status: 'paid', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
   {
    id: 'ORD-1008', items: [{ ...MENU_ITEMS[8], quantity: 1 }, { ...MENU_ITEMS[4], quantity: 1 }],
    tableNumber: 10, status: 'pending', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 2)).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'ORD-1009', tableNumber: 2, items: [{ ...MENU_ITEMS[0], quantity: 1 }],
    status: 'paid', timestamp: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(15)).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
   {
    id: 'ORD-1010', tableNumber: 6, items: [{ ...MENU_ITEMS[5], quantity: 2 }],
    status: 'paid', timestamp: new Date().toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'ORD-1011', tableNumber: 8, items: [{ ...MENU_ITEMS[9], quantity: 1 }],
    status: 'paid', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
  },
  {
    id: 'TAKE-004', items: [{ ...MENU_ITEMS[1], quantity: 2 }, { ...MENU_ITEMS[7], quantity: 2 }],
    status: 'pending', timestamp: new Date(new Date().setMonth(new Date().getMonth() - 4)).toISOString(), type: 'takeaway'
  },
   {
    id: 'TAKE-005', items: [{ ...MENU_ITEMS[4], quantity: 1 }],
    status: 'ready', timestamp: new Date(new Date(new Date().setMonth(new Date().getMonth() - 5)).setDate(5)).toISOString(), type: 'takeaway'
  },
  {
    id: 'ORD-1012', tableNumber: 11, items: [{ ...MENU_ITEMS[1], quantity: 1 }, { ...MENU_ITEMS[3], quantity: 1 }],
    status: 'bill_requested', timestamp: new Date(Date.now() - 120000).toISOString(), type: 'dine-in', waiterId: 'user-waiter-default-001', waiterUsername: 'waiter1'
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
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [orderForBill, setOrderForBill] = useState<Order | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [displayedBillRequestNotifications, setDisplayedBillRequestNotifications] = useState<Set<string>>(new Set());

  const [selectedAnalyticsPeriod, setSelectedAnalyticsPeriod] = useState<AnalyticsPeriod>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [billRequests, setBillRequests] = useState<Order[]>([]);

  const calculateOrderTotal = useCallback((items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, []);

  const formatPeriodLabel = useCallback((period: AnalyticsPeriod, start?: Date, end?: Date): string => {
    if (!start || !end && period === 'custom') return 'Custom range not set';
    if (!start || !end) {
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
  }, []);

  const paidOrders = useMemo(() => allOrders.filter(order => order.status === 'paid'), [allOrders]);

  const activeOrdersList = useMemo(() => {
      return allOrders
        .filter(order => order.status !== 'paid' && order.status !== 'cancelled')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [allOrders]);

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
        startDate = startOfMonth(now);
    }

    let filteredOrders: Order[] = [];
    let periodLabelValue = 'Loading...';

    if (startDate && endDate) {
      if (startDate > endDate) {
        periodLabelValue = 'Invalid custom range';
      } else {
        filteredOrders = paidOrders.filter(order => {
          const orderDate = parseISO(order.timestamp);
          return isValid(orderDate) && isWithinInterval(orderDate, { start: startDate as Date, end: endDate as Date});
        });
        periodLabelValue = formatPeriodLabel(selectedAnalyticsPeriod, startDate, endDate);
      }
    } else if (selectedAnalyticsPeriod === 'custom') {
      periodLabelValue = 'Please select a start and end date for the custom range.';
    } else if (startDate) {
        periodLabelValue = formatPeriodLabel(selectedAnalyticsPeriod, startDate, endDate);
         filteredOrders = paidOrders.filter(order => {
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
      periodLabel: periodLabelValue
    };
  }, [paidOrders, selectedAnalyticsPeriod, customStartDate, customEndDate, formatPeriodLabel, calculateOrderTotal]);

  const monthlyChartData = useMemo(() => {
    const salesByMonth: { [monthYear: string]: { month: string, monthNumeric: number, year: number, totalSales: number } } = {};

    paidOrders.forEach(order => {
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
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const targetMonthDate = subMonths(now, i);
      const monthYearStr = format(targetMonthDate, 'MMM yyyy');
      if (salesByMonth[monthYearStr]) {
        chartDataPoints.push(salesByMonth[monthYearStr]);
      } else {
         chartDataPoints.push({ month: monthYearStr, monthNumeric: getMonth(targetMonthDate), year: getYear(targetMonthDate), totalSales: 0 });
      }
    }
    return chartDataPoints.sort((a, b) => (a.year * 100 + a.monthNumeric) - (b.year * 100 + b.monthNumeric));

  }, [paidOrders, calculateOrderTotal]);

  const orderDetailsForTipTool = useMemo(() => {
    if (orderForBill && currentBill) {
      const itemsSummary = orderForBill.items.map(item => `${item.name} (x${item.quantity})`).join(', ');
      return `Items: ${itemsSummary}. Subtotal: $${currentBill.subtotal.toFixed(2)}. Tax: $${currentBill.taxAmount.toFixed(2)}. Total: $${currentBill.totalAmount.toFixed(2)}. Table: ${orderForBill.tableNumber}.`;
    }
    return '';
  }, [orderForBill, currentBill]);

  const loadAllOrders = useCallback(() => {
    if(!isMounted) return;
    const ordersFromStorage = getSharedOrders();
    setAllOrders(ordersFromStorage);

    const currentBillRequests = ordersFromStorage.filter(
        order => order.status === 'bill_requested' && order.type === 'dine-in'
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    setBillRequests(currentBillRequests);


    // Bill Request Notifications
    const newUnseenRequests = currentBillRequests.filter(
        order => !displayedBillRequestNotifications.has(order.id)
    );

    if (newUnseenRequests.length > 0) {
        const newNotifications = new Set(displayedBillRequestNotifications);
        newUnseenRequests.forEach(order => {
            toast({
                title: 'Bill Requested',
                description: `Table ${order.tableNumber} (Order ...${order.id.slice(-6)}) requests billing.`,
                duration: 10000,
                 variant: 'default'
            });
            newNotifications.add(order.id);
        });
        setDisplayedBillRequestNotifications(newNotifications);
    }

  }, [isMounted, toast, displayedBillRequestNotifications]);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
      router.push('/login');
    } else {
      setCurrentUser(user);
      initializeSharedOrdersWithMockData(MOCK_ORDERS_SEED);
      setIsMounted(true);
    }
  }, [router]);

  useEffect(() => {
    if(isMounted){
        loadAllOrders();
        const intervalId = setInterval(loadAllOrders, 7000);
        return () => clearInterval(intervalId);
    }
  }, [isMounted, loadAllOrders]);

  const handleSelectBillRequest = (order: Order) => {
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
      paymentStatus: order.status === 'paid' ? 'paid' : 'pending',
    });
    setDiscountPercentage(0); 
    toast({ title: 'Bill Loaded', description: `Bill for Table ${order.tableNumber} (Order ...${order.id.slice(-6)}) is ready.` });
  };


  const applyDiscount = () => {
    if (!currentBill || !orderForBill || currentBill.paymentStatus === 'paid') return; 
    const discountValue = (currentBill.subtotal * discountPercentage) / 100;
    const newTotal = currentBill.subtotal + currentBill.taxAmount - discountValue;
    setCurrentBill({ ...currentBill, discountAmount: discountValue, totalAmount: newTotal });
    toast({ title: 'Discount Applied', description: `${discountPercentage}% discount applied to the bill.` });
  };
  
  const handlePrintAdminBill = () => {
    if (!currentBill || !orderForBill) {
      toast({ title: 'Error', description: 'No bill loaded to print.', variant: 'destructive' });
      return;
    }

    let paymentFinalized = orderForBill.status === 'paid';

    if (orderForBill.status === 'bill_requested') {
      const currentDiscount = (currentBill.subtotal * discountPercentage) / 100;
      const finalTotal = currentBill.subtotal + currentBill.taxAmount - currentDiscount;
      
      const success = updateSharedOrderStatus(orderForBill.id, 'paid');
      if (success) {
        setCurrentBill(prev => prev ? { ...prev, paymentStatus: 'paid', discountAmount: currentDiscount, totalAmount: finalTotal } : null);
        setOrderForBill(prev => prev ? { ...prev, status: 'paid' } : null);

        toast({
          title: 'Bill Finalized',
          description: `Order ...${orderForBill.id.slice(-6)} marked as paid. Printing bill...`,
        });
        paymentFinalized = true;
      } else {
        toast({ title: 'Error', description: `Failed to mark order ...${orderForBill.id.slice(-6)} as paid.`, variant: 'destructive' });
        return; 
      }
    }

    if (paymentFinalized) {
        window.print();
        setTimeout(() => {
            setOrderForBill(null);
            setCurrentBill(null);
            setDiscountPercentage(0);
            loadAllOrders(); 
        }, 100);
    } else if (orderForBill.status !== 'bill_requested') { 
        toast({ title: 'Printing Bill', description: 'Printing current bill details.' });
        window.print();
    }
  };


  const getStatusBadgeClass = (status: Order['status']): string => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'preparing': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ready': return 'bg-green-100 text-green-700 border-green-300 animate-pulse';
      case 'served': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'bill_requested': return 'bg-orange-100 text-orange-700 border-orange-300 font-semibold';
      case 'billed': return 'bg-gray-100 text-gray-700 border-gray-300'; 
      case 'paid': return 'bg-teal-100 text-teal-700 border-teal-300 font-semibold';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
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
    <div className="flex flex-col min-h-screen" id="admin-page-container">
      <AppHeader title="Admin Dashboard" />
      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-6 md:grid-cols-5">
            <TabsTrigger value="orders" className="flex items-center gap-2"><ListChecks /> Active Orders</TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2"><FileText /> Bill Management</TabsTrigger>
            <TabsTrigger value="tips" className="flex items-center gap-2"><Sparkles /> AI Tip Suggester</TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2"><UserCog /> Manage Users</TabsTrigger> {/* Updated tab name */}
            <TabsTrigger value="analytics" className="flex items-center gap-2"><LineChart /> Sales Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="orders">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Manage Active Orders</CardTitle>
                <CardDescription>View and manage all current (unpaid) restaurant orders. Refreshing every 7 seconds.</CardDescription>
              </CardHeader>
              <CardContent>
                {activeOrdersList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <Image src="https://placehold.co/400x250.png" alt="Restaurant scene" width={200} height={125} className="mb-4 rounded-lg opacity-70" data-ai-hint="restaurant people" />
                        <p>No active (unpaid) orders at the moment.</p>
                    </div>
                ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID/Token</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Table/Waiter</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                       <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrdersList.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.id.slice(-6)}</TableCell>
                        <TableCell className="capitalize">{order.type}</TableCell>
                        <TableCell>
                          {order.type === 'dine-in'
                            ? `Table ${order.tableNumber} ${order.waiterUsername ? `(${order.waiterUsername})` : ''}`
                            : `Token ${order.id.slice(-6)}`}
                        </TableCell>
                        <TableCell>{order.items.length}</TableCell>
                        <TableCell>${calculateOrderTotal(order.items).toFixed(2)}</TableCell>
                        <TableCell>
                           <Badge variant="outline" className={`${getStatusBadgeClass(order.status)} capitalize font-medium`}>
                            {order.status === 'ready' && <BellRing className="w-3 h-3 mr-1" />}
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                            {format(parseISO(order.timestamp), "PPpp")}
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
              <Card className="shadow-lg" id="admin-bill-requests-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BellRing className="text-primary" /> Pending Bill Requests (Dine-in)
                  </CardTitle>
                  <CardDescription>Select a request to view and process the bill. Takeaway bills are managed on the Takeaway page.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {billRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mb-3 text-green-500" />
                      <p>No pending bill requests at this time.</p>
                    </div>
                  ) : (
                    billRequests.map(request => (
                      <Button
                        key={request.id}
                        variant="outline"
                        className="w-full justify-start h-auto p-3 text-left"
                        onClick={() => handleSelectBillRequest(request)}
                      >
                        <div className="flex flex-col">
                           <span className="font-semibold">Table {request.tableNumber} <span className="text-xs font-normal text-muted-foreground">(Order ...{request.id.slice(-6)})</span></span>
                           <span className="text-xs text-muted-foreground">Requested by: {request.waiterUsername || 'N/A'} at {format(parseISO(request.timestamp), "p")}</span>
                           <span className="text-xs text-muted-foreground">Items: {request.items.reduce((acc, item) => acc + item.quantity, 0)}, Subtotal: ${calculateOrderTotal(request.items).toFixed(2)}</span>
                        </div>
                      </Button>
                    ))
                  )}
                </CardContent>
              </Card>

              {orderForBill && currentBill ? (
                <Card className="shadow-lg" id="admin-final-bill-card">
                  <CardHeader>
                    <CardTitle>Bill for Table {orderForBill.tableNumber} (Order {orderForBill.id.slice(-6)})</CardTitle>
                    <CardDescription>Order Status: <Badge variant="outline" className={`${getStatusBadgeClass(orderForBill.status)} capitalize`}>{orderForBill.status.replace('_',' ')}</Badge> | Payment Status: <span className={`font-semibold ${currentBill.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>{currentBill.paymentStatus}</span></CardDescription>
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

                    {currentBill.paymentStatus === 'pending' && orderForBill.status === 'bill_requested' && (
                      <>
                        <Separator />
                        <div className="flex items-end gap-2 pt-2">
                          <div className="flex-grow">
                            <Label htmlFor="discount">Discount (%)</Label>
                            <Input id="discount" type="number" value={discountPercentage} onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)} min="0" max="100" />
                          </div>
                          <Button onClick={applyDiscount} variant="outline" disabled={currentBill.paymentStatus === 'paid'}><Percent className="mr-2 h-4 w-4" />Apply</Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                  <CardFooter className="flex-col gap-2">
                     <Button 
                        onClick={handlePrintAdminBill} 
                        className="w-full" 
                        variant="outline" 
                        size="lg" 
                        disabled={!currentBill || (orderForBill.status !== 'bill_requested' && orderForBill.status !== 'paid')}
                      >
                        <Printer className="mr-2 h-4 w-4" /> 
                        {orderForBill.status === 'bill_requested' ? 'Finalize Payment & Print Bill' 
                          : orderForBill.status === 'paid' ? 'Print Bill (Reprint)' 
                          : 'Print Bill'}
                     </Button>
                  </CardFooter>
                </Card>
              ) : (
                 <Card className="shadow-lg flex flex-col items-center justify-center">
                    <CardContent className="text-center">
                        <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Select a bill request from the left to view details here.</p>
                    </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tips">
            <TipSuggestionTool initialOrderDetails={orderDetailsForTipTool} />
          </TabsContent>
          <TabsContent value="users">
            <ManageUsersTool /> {/* Updated component */}
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