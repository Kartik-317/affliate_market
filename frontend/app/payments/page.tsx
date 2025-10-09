"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowUpRight,
    Plus,
    Download,
    Settings,
    Wallet,
    Search,
    Filter,
    Calendar,
    CreditCard,
    Landmark,
    Smartphone,
    Bitcoin,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    DollarSign,
    Zap,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { PaymentHistory } from "@/components/payment-history"
import { WithdrawalForm } from "@/components/withdrawal-form"
import { AddPaymentMethodDialog } from "@/components/add-payment-method-dialog"
import { Elements } from "@stripe/react-stripe-js"
import { loadStripe, Stripe } from "@stripe/stripe-js"
import { ModifyAutoWithdrawalDialog } from "@/components/modify-auto-withdrawal-dialog"

// Initialize Stripe Promise state (will be loaded dynamically)
const initialStripePromise = loadStripe("pk_dummy_placeholder_for_initial_type_check");

// Define interface for affiliate events
interface AffiliateEvent {
    event: string;
    network: string;
    amount?: number;
    commissionAmount?: number;
    orderId?: string;
    date?: string;
    campaign?: string;
    clicks?: number;
    impressions?: number;
    payoutDate?: string;
    status?: string;
    read?: boolean;
    _id?: string;
    paymentMethodId?: string;
}

// Define interface for network breakdown
interface NetworkBreakdown {
    network: string;
    balance: number;
    pending: number;
}

// Define interface for PaymentHistory props
interface PaymentHistoryProps {
    events: AffiliateEvent[];
    limit?: number;
    searchQuery?: string;
    filter?: string;
}

// Define interface for autoWithdrawalSettings to include index signature
interface AutoWithdrawalSettings {
    enabled: boolean;
    frequency: string;
    minimumAmount: number;
    paymentMethodId: string;
    dayOfMonth: number;
    networkThresholds: { [key: string]: number };
}

export default function PaymentsPage() {
    const [activeTab, setActiveTab] = useState("overview")
    const [showWithdrawal, setShowWithdrawal] = useState(false)
    const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false)
    const [showModifySchedule, setShowModifySchedule] = useState(false);
    const [searchQuery, setSearchQuery] = useState("")
    const [dateRange, setDateRange] = useState("30d")
    const [paymentFilter, setPaymentFilter] = useState("all")
    const [unreadCount, setUnreadCount] = useState(0)
    const [events, setEvents] = useState<AffiliateEvent[]>([])
    const [walletData, setWalletData] = useState({
        totalBalance: 0,
        availableBalance: 0,
        pendingBalance: 0,
        thisMonth: 0,
        averageMonthly: 0,
        nextPayoutDate: "N/A", // Will be calculated
        totalEarnings: 0, // This is the value that needs to match Total Revenue
        totalWithdrawals: 0,
        totalBalanceChange: null as number | null,
        thisMonthChange: null as number | null,
        networkBreakdown: [] as NetworkBreakdown[],
    })

    const [paymentMethods, setPaymentMethods] = useState<any[]>([])
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

    const [autoWithdrawalSettings, setAutoWithdrawalSettings] = useState<AutoWithdrawalSettings>({
        enabled: true,
        frequency: "monthly",
        minimumAmount: 1000,
        paymentMethodId: "1",
        dayOfMonth: 15,
        networkThresholds: {
            "ShareASale": 500,
            "Commission Junction": 750,
            "ClickBank": 300,
            "Amazon Associates": 100,
        },
    })
    
    // --- Fetch Stripe Publishable Key ---
    useEffect(() => {
        const fetchStripeConfig = async () => {
            try {
                const response = await fetch("/.netlify/functions/proxy/payments/config");
                if (!response.ok) {
                    throw new Error("Failed to fetch Stripe configuration.");
                }
                const data = await response.json();
                const pk = data.publishableKey;
                if (pk) {
                    setStripePromise(loadStripe(pk));
                } else {
                    console.error("Stripe Publishable Key not found in config.");
                }
            } catch (error) {
                console.error("Error fetching Stripe config:", error);
            }
        };

        fetchStripeConfig();
    }, []);

    // --- Fetch Unread Count ---
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch("/.netlify/functions/proxy/api/affiliate/notifications");
                if (response.ok) {
                    const data = await response.json();
                    const count = data.notifications.filter((n: any) => !n.read).length;
                    setUnreadCount(count);
                } else {
                    console.error("Failed to fetch unread count.");
                }
            } catch (error) {
                console.error("Error fetching unread count:", error);
            }
        };

        fetchUnreadCount();
    }, []);

    // --- Fetch Initial Events and Payment Methods ---
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const eventsResponse = await fetch("/.netlify/functions/proxy/api/affiliate/events");
                if (!eventsResponse.ok) {
                    throw new Error("Failed to fetch initial events.");
                }
                const eventsData = await eventsResponse.json();
                // Ensure event.network exists before setting events to avoid future crashes
                const validEvents = eventsData.events.filter((e: AffiliateEvent) => e.network);
                setEvents(validEvents);

                const methodsResponse = await fetch("/.netlify/functions/proxy/payments/methods"); 
                if (methodsResponse.ok) {
                    const methodsData = await methodsResponse.json();
                    
                    const mappedMethods = methodsData.map((method: any) => ({
                        ...method,
                        icon: getPaymentMethodIcon(method.type),
                        minimumAmount: method.minimumAmount || (method.type === "card" ? 100 : method.type === "bank" ? 100 : 50),
                        processingTime: method.processingTime || (method.type === "card" ? "1-3 business days" : method.type === "bank" ? "1-3 business days" : "Instant"),
                        fees: method.fees || (method.type === "card" ? "1% fee" : method.type === "bank" ? "Free" : "2.9% + $0.30"),
                        details: method.details.last4 ? `****${method.details.last4}` : method.details.email || method.details.address || `Type: ${method.type}`,
                        name: method.name || `${method.type.charAt(0).toUpperCase() + method.type.slice(1)}`,
                    }));

                    setPaymentMethods(mappedMethods);
                } else {
                    console.error("Failed to fetch payment methods.");
                }

            } catch (error) {
                console.error("Error fetching initial data:", error);
                setEvents([]);
            }
        };

        fetchInitialData();

        // Set up WebSockets for real-time events (Keeping original WebSocket logic)
        const connectedNetworks = [
            { id: "amazon-associates", name: "amazon-associates", logo: "📦" },
            { id: "shareasale", name: "shareasale", logo: "🛒" },
            { id: "commission-junction", name: "commission-junction", logo: "💼" },
            { id: "clickbank", name: "clickbank", logo: "🏦" },
        ];

        const websockets: WebSocket[] = [];

        connectedNetworks.forEach((network) => {
            const websocket = new WebSocket(`ws://localhost:8000/api/affiliate/ws/${network.id}-events`);
            websockets.push(websocket);

            websocket.onopen = () => {
                console.log(`WebSocket connected for ${network.id}`);
            };

            websocket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                const notificationEvent: AffiliateEvent = {
                    ...data.notification,
                    event: data.notification.type,
                    network: data.notification.network, // Ensure network is pulled from notification if missing from event
                    amount: data.notification.amount || data.event.amount,
                    commissionAmount: data.event.commissionAmount,
                    date: data.notification.created_at,
                };
                console.log("WebSocket event received:", notificationEvent);
                setEvents((prev) => [notificationEvent, ...prev]);

                if (!notificationEvent.read) {
                    setUnreadCount((prev) => prev + 1);
                }
            };

            websocket.onclose = () => {
                console.log(`WebSocket disconnected for ${network.id}`);
            };

            websocket.onerror = (error) => {
                console.error(`WebSocket error for ${network.id}:`, error);
            };
        });

        return () => {
            websockets.forEach((ws) => ws.close());
        };
    }, []);

    // Utility function needed for component logic
    const getPaymentMethodIcon = (type: string) => {
        switch (type) {
            case "bank":
                return Landmark
            case "paypal":
                return Smartphone
            case "crypto":
                return Bitcoin
            case "card":
                return CreditCard
            default:
                return CreditCard
        }
    }

    // --- Calculate Wallet Data ---
    useEffect(() => {
        const calculateWalletData = () => {
            const networkBreakdownMap: { [key: string]: { balance: number; pending: number } } = {
                "amazon-associates": { balance: 0, pending: 0 },
                "shareasale": { balance: 0, pending: 0 },
                "commission-junction": { balance: 0, pending: 0 },
                "clickbank": { balance: 0, pending: 0 },
            };
            let totalEarnings = 0; // Total money ever earned (commissions/conversions)
            let totalWithdrawals = 0;
            let pendingBalance = 0;
            let thisMonthRevenue = 0;
            let currentMonthEarnings = 0;
            let previousMonthEarnings = 0;
            const monthlyRevenues: { [key: string]: number } = {};

            const now = new Date();
            const currentMonth = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
            const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));

            let rangeStart: Date;
            let rangeEnd = new Date();
            let prevRangeStart: Date;
            let prevRangeEnd: Date;
            switch (dateRange) {
                case "7d":
                    rangeStart = new Date(rangeEnd.getTime() - 7 * 24 * 60 * 60 * 1000);
                    prevRangeStart = new Date(rangeStart.getTime() - 7 * 24 * 60 * 60 * 1000);
                    prevRangeEnd = new Date(rangeStart.getTime() - 1);
                    break;
                case "30d":
                    rangeStart = new Date(rangeEnd.getTime() - 30 * 24 * 60 * 60 * 1000);
                    prevRangeStart = new Date(rangeStart.getTime() - 30 * 24 * 60 * 60 * 1000);
                    prevRangeEnd = new Date(rangeStart.getTime() - 1);
                    break;
                case "90d":
                    rangeStart = new Date(rangeEnd.getTime() - 90 * 24 * 60 * 60 * 1000);
                    prevRangeStart = new Date(rangeStart.getTime() - 90 * 24 * 60 * 60 * 1000);
                    prevRangeEnd = new Date(rangeStart.getTime() - 1);
                    break;
                case "1y":
                    rangeStart = new Date(rangeEnd.getTime() - 365 * 24 * 60 * 60 * 1000);
                    prevRangeStart = new Date(rangeStart.getTime() - 365 * 24 * 60 * 60 * 1000);
                    prevRangeEnd = new Date(rangeStart.getTime() - 1);
                    break;
                default:
                    rangeStart = new Date(0);
                    prevRangeStart = new Date(0);
                    prevRangeEnd = new Date(0);
            }

            const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

            let currentPeriodEarnings = 0;
            let previousPeriodEarnings = 0;
            let totalAvailableBalance = 0; // Temp tracker for all money eligible for withdrawal

            events.forEach((event) => {
                // Use commissionAmount for conversion/commission events if available, otherwise fallback to amount.
                // This ensures we capture the correct earned amount.
                const earnedAmount = (event.event === "commission" || event.event === "conversion") 
                    ? (event.commissionAmount ?? event.amount) 
                    : event.amount;

                if (!event.date || typeof earnedAmount !== 'number' || !event.network) {
                    return; // Skip invalid events
                }

                const eventDate = new Date(event.date);
                const eventMonth = eventDate.getFullYear() + '-' + (eventDate.getMonth() + 1).toString().padStart(2, '0');
                const network = event.network.toLowerCase().replace(/ /g, '-'); // Use normalized network ID

                // Initialize network entry if it doesn't exist
                if (!networkBreakdownMap[network]) {
                    networkBreakdownMap[network] = { balance: 0, pending: 0 };
                }

                if (event.event === "commission" || event.event === "conversion") {
                    totalEarnings += earnedAmount; // Accumulate all earnings for Total Earnings metric

                    // Logic for wallet breakdown
                    if (event.status === "Pending" || (event.event === "conversion" && event.status !== "Completed")) {
                        networkBreakdownMap[network].pending += earnedAmount;
                        pendingBalance += earnedAmount;
                    } else {
                        // Assuming "commission" events are immediately available unless marked "Pending"
                        networkBreakdownMap[network].balance += earnedAmount;
                        totalAvailableBalance += earnedAmount; 
                    }

                    // For monthly metrics
                    if (eventMonth === currentMonth) {
                        thisMonthRevenue += earnedAmount;
                        currentMonthEarnings += earnedAmount;
                    }

                    if (!monthlyRevenues[eventMonth]) {
                        monthlyRevenues[eventMonth] = 0;
                    }
                    monthlyRevenues[eventMonth] += earnedAmount;

                    // For time range comparison (Total Balance Change calculation)
                    if (eventDate >= rangeStart && eventDate <= rangeEnd) {
                        currentPeriodEarnings += earnedAmount;
                    }
                    if (eventDate >= prevRangeStart && eventDate <= prevRangeEnd) {
                        previousPeriodEarnings += earnedAmount;
                    }

                    if (eventDate >= prevMonthStart && eventDate <= prevMonthEnd) {
                        previousMonthEarnings += earnedAmount;
                    }
                } else if (event.event === "payout" && event.status === "Completed") {
                    // Payout events reduce the available balance and accumulate total withdrawals
                    const payoutAmount = Math.abs(earnedAmount); // Payout amount is usually negative in mock data
                    totalWithdrawals += payoutAmount;
                    totalAvailableBalance -= payoutAmount; // Reduce the global available balance tracker
                }
            });

            // After calculating all deposits (commissions) and withdrawals (payouts),
            // calculate the final network balances by distributing the reduction.
            // This is complex and usually handled by the backend ledger, so for the FE calculation,
            // we will use the aggregated `totalAvailableBalance` for the main card.

            // 1. Calculate the actual current total balance after all movements
            const finalTotalBalance = totalAvailableBalance;

            // 2. Adjust network breakdown map based on the reduction from payouts
            //    (Simplified model: Payouts reduce the total Available Balance, not necessarily individual network balances in real-time on the FE)
            //    We stick to the simplified method:
            //    Network balance = sum of non-pending earnings from that network
            //    Total Balance = sum of all network balances - total withdrawals.
            const totalNetworkBalanceBeforeWithdrawals = Object.values(networkBreakdownMap).reduce((sum, data) => sum + data.balance, 0);

            // The correct total balance is Total Available Commissions - Total Payouts
            const correctTotalAvailableBalance = totalNetworkBalanceBeforeWithdrawals - totalWithdrawals;

            // Reset pending based on the loop count
            pendingBalance = Object.values(networkBreakdownMap).reduce((sum, data) => sum + data.pending, 0);


            // Calculate the 6-month average
            let totalMonthlyRevenue = 0;
            let monthCount = 0;
            Object.keys(monthlyRevenues).forEach((month) => {
                const monthDate = new Date(month + '-01');
                if (monthDate >= sixMonthsAgo) {
                    totalMonthlyRevenue += monthlyRevenues[month];
                    monthCount += 1;
                }
            });
            const averageMonthly = monthCount > 0 ? totalMonthlyRevenue / monthCount : thisMonthRevenue;


            // Calculate period-over-period changes
            const totalBalanceChange = previousPeriodEarnings > 0
                ? ((currentPeriodEarnings - previousPeriodEarnings) / previousPeriodEarnings * 100)
                : (currentPeriodEarnings > 0 ? null : 0); // Null if new revenue > 0, 0 if both are 0
            const thisMonthChange = previousMonthEarnings > 0
                ? ((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings * 100)
                : (currentMonthEarnings > 0 ? null : 0);


            // Final map for display
            const networkBreakdown = Object.entries(networkBreakdownMap)
                .map(([network, data]) => ({
                    network: network,
                    // Note: Distributing the total payout across network balances is too complex for this component.
                    // We will display the network's accumulated, available earnings before factoring in withdrawals.
                    // The main "Total Balance" card will show the net available amount.
                    balance: data.balance, 
                    pending: data.pending,
                }))
                .filter(network => network.balance > 0 || network.pending > 0 || ['clickbank', 'amazon-associates', 'shareasale', 'commission-junction'].includes(network.network));

            const nextPayoutDateObj = calculateNextPayoutDate(autoWithdrawalSettings.enabled, autoWithdrawalSettings.dayOfMonth);
            const nextPayoutDateString = nextPayoutDateObj
                ? nextPayoutDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : "N/A";

            console.log("Calculated wallet data:", {
                totalBalance: correctTotalAvailableBalance,
                availableBalance: Math.max(0, correctTotalAvailableBalance),
                pendingBalance,
                thisMonth: thisMonthRevenue,
                averageMonthly,
                totalBalanceChange,
                thisMonthChange,
                networkBreakdown,
                totalEarnings, // The fix: This should now match the total revenue from other pages
                totalWithdrawals,
            });

            setWalletData({
                totalBalance: correctTotalAvailableBalance, // This is the net balance
                availableBalance: Math.max(0, correctTotalAvailableBalance),
                pendingBalance,
                thisMonth: Math.max(0, thisMonthRevenue),
                averageMonthly: Math.max(0, averageMonthly),
                nextPayoutDate: nextPayoutDateString,
                totalEarnings: totalEarnings, // Use totalEarnings here for consistency with other dashboards
                totalWithdrawals: totalWithdrawals,
                totalBalanceChange,
                thisMonthChange,
                networkBreakdown,
            });
        };

        calculateWalletData();
    }, [events, autoWithdrawalSettings.dayOfMonth, dateRange, autoWithdrawalSettings.enabled]);

    // Helper function moved out of useEffect dependencies
    const calculateNextPayoutDate = (enabled: boolean, dayOfMonth: number) => {
        if (!enabled || dayOfMonth <= 0) return null;

        const today = new Date();
        const currentDay = today.getDate();
        let nextMonth = today.getMonth();
        let nextYear = today.getFullYear();

        if (currentDay < dayOfMonth) {
            // Payout is in the current month
            return new Date(nextYear, nextMonth, dayOfMonth);
        } else {
            // Payout is next month
            if (nextMonth === 11) { // December
                nextMonth = 0; // January
                nextYear += 1;
            } else {
                nextMonth += 1;
            }
            return new Date(nextYear, nextMonth, dayOfMonth);
        }
    };


    const getStatusColor = (status: string) => {
        switch (status) {
            case "verified":
                return "text-green-500 bg-green-500/10 border-green-500/20"
            case "pending":
                return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20"
            case "failed":
                return "text-red-500 bg-red-500/10 border-red-500/20"
            default:
                return "text-gray-500 bg-gray-500/10 border-gray-500/20"
        }
    }

    const handleAddPaymentMethod = (method: any) => {
        setPaymentMethods((prev) => {
            const newMethod = {
                id: method.id,
                type: method.type,
                name: method.name || `${method.type.charAt(0).toUpperCase() + method.type.slice(1)} ${method.details.last4 ? `Ending ${method.details.last4}` : method.details.email || method.details.address || ""}`,
                details: method.details.last4 ? `****${method.details.last4}` : method.details.email || method.details.address || "",
                isDefault: false,
                status: method.status,
                addedDate: new Date().toISOString().split('T')[0],
                lastUsed: "Never",
                minimumAmount: method.minimumAmount || (method.type === "card" ? 100 : method.type === "bank" ? 100 : 50),
                processingTime: method.processingTime || (method.type === "card" ? "1-3 business days" : method.type === "bank" ? "1-3 business days" : "Instant"),
                fees: method.fees || (method.type === "card" ? "1% fee" : method.type === "bank" ? "Free" : "2.9% + $0.30"),
                icon: getPaymentMethodIcon(method.type),
            };

            const existingIndex = prev.findIndex(m => m.id === newMethod.id);
            if (existingIndex !== -1) {
                return prev.map((m, index) => index === existingIndex ? newMethod : m);
            }
            return [newMethod, ...prev];
        });
        setShowAddPaymentMethod(false);
    }
    
    // Handler function for the new dialog
    const handleSaveAutoWithdrawal = (newSettings: AutoWithdrawalSettings) => {
        setAutoWithdrawalSettings(newSettings);
    };

    const selectedPaymentMethod = paymentMethods.find(m => m.id === autoWithdrawalSettings.paymentMethodId);

    return (
        <Elements stripe={stripePromise}>
            <DashboardLayout unreadCount={unreadCount}>
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-3 text-balance">
                                <Wallet className="w-8 h-8 text-primary" />
                                Payments & Wallet
                            </h1>
                            <p className="text-muted-foreground">Manage your earnings and withdrawal methods</p>
                            <div className="flex items-center space-x-4 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                    Next auto-payout: {walletData.nextPayoutDate}
                                </Badge>
                                {autoWithdrawalSettings.enabled && (
                                    <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                                        Auto-withdrawal active
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-64"
                                />
                            </div>
                            <Select value={dateRange} onValueChange={setDateRange}>
                                <SelectTrigger className="w-[140px]">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">Last 7 days</SelectItem>
                                    <SelectItem value="30d">Last 30 days</SelectItem>
                                    <SelectItem value="90d">Last 90 days</SelectItem>
                                    <SelectItem value="1y">Last year</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Export
                            </Button>
                            <Button size="sm" onClick={() => setShowWithdrawal(true)} disabled={walletData.availableBalance <= 0}>
                                <ArrowUpRight className="w-4 h-4 mr-2" />
                                Withdraw
                            </Button>
                        </div>
                    </div>

                    {/* Enhanced Wallet Overview */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                        <Card className="glass-effect border-2 border-primary/20 lg:col-span-2">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Available Balance</p>
                                        <p className="text-4xl font-bold">${walletData.availableBalance.toLocaleString()}</p>
                                    </div>
                                    <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <DollarSign className="w-8 h-8 text-primary" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">Total Lifetime Earnings</p>
                                        <p className="text-xl font-bold">${walletData.totalEarnings.toLocaleString()}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-sm font-medium text-muted-foreground">Total Withdrawn</p>
                                        <p className="text-xl font-bold">${walletData.totalWithdrawals.toLocaleString()}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="glass-effect">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                        <p className="text-2xl font-bold">${walletData.pendingBalance.toLocaleString()}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                                        <Clock className="w-6 h-6 text-yellow-500" />
                                    </div>
                                </div>
                                {walletData.pendingBalance > 0 && (
                                    <Badge className="mt-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Processing</Badge>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="glass-effect">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                        <p className="text-2xl font-bold">${walletData.thisMonth.toLocaleString()}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                        <TrendingUp className="w-6 h-6 text-blue-500" />
                                    </div>
                                </div>
                                {walletData.thisMonthChange !== null && (
                                    <div className="flex items-center mt-4">
                                        <TrendingUp className={`w-4 h-4 mr-1 ${walletData.thisMonthChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                                        <span className={`text-sm font-medium ${walletData.thisMonthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                            {walletData.thisMonthChange >= 0 ? '+' : ''}{walletData.thisMonthChange.toFixed(1)}%
                                        </span>
                                        <span className="text-sm text-muted-foreground ml-1">from last month</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="glass-effect hidden lg:block">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Avg Monthly</p>
                                        <p className="text-2xl font-bold">${walletData.averageMonthly.toLocaleString()}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                        <Zap className="w-6 h-6 text-purple-500" />
                                    </div>
                                </div>
                                {walletData.averageMonthly > 0 && (
                                    <Badge className="mt-4 bg-purple-500/10 text-purple-500 border-purple-500/20">6-month avg</Badge>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Network Balance Breakdown */}
                    <Card className="glass-effect">
                        <CardHeader>
                            <CardTitle>Balance by Network</CardTitle>
                            <CardDescription>Your available and pending earnings breakdown across affiliate networks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                {walletData.networkBreakdown
                                    // Use original networkBreakdown logic to filter and map
                                    .map((network) => (
                                        <div key={network.network} className="p-4 rounded-lg border bg-background/50">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold text-sm">{network.network}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    Active
                                                </Badge>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Available:</span>
                                                    <span className="font-medium">${network.balance.toLocaleString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">Pending:</span>
                                                    <span className="font-medium">${network.pending.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Content */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
                            <TabsTrigger value="schedule">Auto-Withdrawal</TabsTrigger>
                            <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="lg:col-span-2">
                                    <Card className="glass-effect">
                                        <CardHeader>
                                            <CardTitle>Recent Transactions</CardTitle>
                                            <CardDescription>Your latest earnings and withdrawals</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <PaymentHistory events={events} limit={5} searchQuery={searchQuery} filter={paymentFilter} />
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-4">
                                    <Card className="glass-effect">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Button
                                                className="w-full justify-start"
                                                onClick={() => setShowWithdrawal(true)}
                                                disabled={walletData.availableBalance <= 0}
                                            >
                                                <ArrowUpRight className="w-4 h-4 mr-2" />
                                                Withdraw Funds
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-start bg-transparent"
                                                onClick={() => setShowAddPaymentMethod(true)}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Payment Method
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={() => setShowModifySchedule(true)}>
                                                <Settings className="w-4 h-4 mr-2" />
                                                Auto-Withdrawal Settings
                                            </Button>
                                            <Button variant="outline" className="w-full justify-start bg-transparent">
                                                <Download className="w-4 h-4 mr-2" />
                                                Export Tax Documents
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-effect">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Next Auto-Payout</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-center">
                                                <p className="text-2xl font-bold text-primary">{walletData.nextPayoutDate}</p>
                                                <p className="text-sm text-muted-foreground mt-1">Estimated payout date</p>
                                                <div className="mt-3 space-y-2">
                                                    {autoWithdrawalSettings.enabled && (
                                                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                                            Auto-withdrawal enabled
                                                        </Badge>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">
                                                        Minimum: ${autoWithdrawalSettings.minimumAmount.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="history" className="space-y-6">
                            <Card className="glass-effect">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Payment History</CardTitle>
                                            <CardDescription>Complete record of all your transactions</CardDescription>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                                                <SelectTrigger className="w-[140px]">
                                                    <Filter className="w-4 h-4 mr-2" />
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Types</SelectItem>
                                                    <SelectItem value="earnings">Earnings</SelectItem>
                                                    <SelectItem value="withdrawals">Withdrawals</SelectItem>
                                                    <SelectItem value="refunds">Refunds</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <PaymentHistory events={events} searchQuery={searchQuery} filter={paymentFilter} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="methods" className="space-y-6">
                            <div className="grid gap-6 lg:grid-cols-3">
                                <div className="lg:col-span-2">
                                    <Card className="glass-effect">
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <CardTitle>Payment Methods</CardTitle>
                                                    <CardDescription>Manage your withdrawal methods and preferences</CardDescription>
                                                </div>
                                                <Button size="sm" onClick={() => setShowAddPaymentMethod(true)}>
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add Method
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {paymentMethods.map((method) => {
                                                    const IconComponent = method.icon
                                                    return (
                                                        <div
                                                            key={method.id}
                                                            className="p-4 rounded-lg border bg-background/50 hover:border-primary/50 transition-colors"
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-3">
                                                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                        <IconComponent className="w-5 h-5 text-primary" />
                                                                    </div>
                                                                    <div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <h4 className="font-semibold">{method.name}</h4>
                                                                            {method.isDefault && (
                                                                                <Badge variant="secondary" className="text-xs">
                                                                                    Default
                                                                                </Badge>
                                                                            )}
                                                                            <Badge className={`text-xs ${getStatusColor(method.status)}`}>
                                                                                {method.status}
                                                                            </Badge>
                                                                        </div>
                                                                        <p className="text-sm text-muted-foreground">{method.details}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Button variant="outline" size="sm">
                                                                        Edit
                                                                    </Button>
                                                                    <Button variant="outline" size="sm">
                                                                        Remove
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Minimum</p>
                                                                    <p className="text-sm font-medium">${method.minimumAmount}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Processing</p>
                                                                    <p className="text-sm font-medium">{method.processingTime}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs text-muted-foreground">Fees</p>
                                                                    <p className="text-sm font-medium">{method.fees}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                {paymentMethods.length === 0 && (
                                                    <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                                                        <p className="text-muted-foreground mb-4">No payment methods added yet.</p>
                                                        <Button variant="outline" onClick={() => setShowAddPaymentMethod(true)}>
                                                            <Plus className="w-4 h-4 mr-2" />
                                                            Add Your First Method
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div>
                                    <Card className="glass-effect">
                                        <CardHeader>
                                            <CardTitle className="text-lg">Security & Verification</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <p className="font-medium text-sm">Identity Verified</p>
                                                    <p className="text-xs text-muted-foreground">Account fully verified</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <CheckCircle className="w-5 h-5 text-green-500" />
                                                <div>
                                                    <p className="font-medium text-sm">2FA Enabled</p>
                                                    <p className="text-xs text-muted-foreground">Extra security active</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                                <div>
                                                    <p className="font-medium text-sm">Tax Info Needed</p>
                                                    <p className="text-xs text-muted-foreground">Update for compliance</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="schedule" className="space-y-6">
                            <Card className="glass-effect">
                                <CardHeader>
                                    <CardTitle>Auto-Withdrawal Settings</CardTitle>
                                    <CardDescription>Configure automatic withdrawals and payment schedules</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <Card className="border-2 border-primary/20">
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-semibold">Auto-Withdrawal</h3>
                                                        {autoWithdrawalSettings.enabled && (
                                                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <p>
                                                            <span className="text-muted-foreground">Frequency:</span> {autoWithdrawalSettings.frequency}
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">Minimum Amount:</span> ${autoWithdrawalSettings.minimumAmount.toLocaleString()}
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">Next Withdrawal:</span> {walletData.nextPayoutDate}
                                                        </p>
                                                        {selectedPaymentMethod && (
                                                            <p>
                                                                <span className="text-muted-foreground">Method:</span> {selectedPaymentMethod.name} {selectedPaymentMethod.details}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full mt-4 bg-transparent"
                                                        onClick={() => setShowModifySchedule(true)}
                                                    >
                                                        Modify Schedule
                                                    </Button>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-6">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="font-semibold">Emergency Withdrawals</h3>
                                                        <Badge variant="secondary">Available</Badge>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <p>
                                                            <span className="text-muted-foreground">Available Balance:</span> $
                                                            {walletData.availableBalance.toLocaleString()}
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">Processing Time:</span> 1-3 business days
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">Minimum:</span> $100
                                                        </p>
                                                        <p>
                                                            <span className="text-muted-foreground">Fee:</span> Free
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="w-full mt-4"
                                                        onClick={() => setShowWithdrawal(true)}
                                                        disabled={walletData.availableBalance <= 0}
                                                    >
                                                        Emergency Withdraw
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="text-lg">Network Withdrawal Thresholds</CardTitle>
                                                <CardDescription>Set minimum amounts for each affiliate network</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    {Object.entries(autoWithdrawalSettings.networkThresholds).map(([network, threshold]) => (
                                                        <div key={network} className="flex items-center justify-between p-3 rounded-lg border">
                                                            <span className="font-medium">{network}</span>
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-sm text-muted-foreground">$</span>
                                                                <Input
                                                                    type="number"
                                                                    value={threshold}
                                                                    className="w-20 h-8"
                                                                    onChange={(e) => {
                                                                        const newThresholds = { ...autoWithdrawalSettings.networkThresholds };
                                                                        newThresholds[network] = Number.parseInt(e.target.value) || 0;
                                                                        setAutoWithdrawalSettings((prev) => ({ ...prev, networkThresholds: newThresholds }));
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle>Earnings Trends</CardTitle>
                                        <CardDescription>Your payment patterns over time</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Total Lifetime Earnings</span>
                                                <span className="font-bold">${walletData.totalEarnings.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Total Withdrawals</span>
                                                <span className="font-bold">${walletData.totalWithdrawals.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Average Monthly</span>
                                                <span className="font-bold">${walletData.averageMonthly.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle>Payment Method Usage</CardTitle>
                                        <CardDescription>How you prefer to receive payments</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {paymentMethods
                                                .filter((m) => m.status === "verified")
                                                .map((method) => (
                                                    <div key={method.id} className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <method.icon className="w-4 h-4 text-muted-foreground" />
                                                            <span className="text-sm">{method.name}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-medium">
                                                                {method.lastUsed === "Never" ? "Never" : method.lastUsed}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">Last used</p>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>

                    {/* Withdrawal Modal */}
                    {showWithdrawal && (
                        <WithdrawalForm
                            availableBalance={walletData.availableBalance}
                            paymentMethods={paymentMethods}
                            onClose={() => setShowWithdrawal(false)}
                        />
                    )}

                    {/* Add Payment Method Modal */}
                    {showAddPaymentMethod && (
                        <AddPaymentMethodDialog
                            onClose={() => setShowAddPaymentMethod(false)}
                            onAdd={handleAddPaymentMethod}
                        />
                    )}
                    
                    {/* NEW: Modify Auto-Withdrawal Schedule Dialog */}
                    {showModifySchedule && (
                        <ModifyAutoWithdrawalDialog
                            onClose={() => setShowModifySchedule(false)}
                            paymentMethods={paymentMethods}
                            currentSettings={autoWithdrawalSettings}
                            onSave={handleSaveAutoWithdrawal}
                        />
                    )}
                </div>
            </DashboardLayout>
        </Elements>
    )
}
