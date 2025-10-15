
"use client";

import { useState, useEffect, useMemo, Component, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Filter, Download, Settings, DollarSign } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { ConversionAnalysis } from "@/components/conversion-analysis";
import { CampaignOptimization } from "@/components/campaign-optimization";
import { RevenueForecasting } from "@/components/revenue-forecasting";
import { CompetitorAnalysis } from "@/components/competitor-analysis";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { useToast } from "@/components/ui/use-toast";

// Register Chart.js components outside the component to avoid re-registration
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// Error boundary for chart rendering
class ChartErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return <div>Error rendering chart. Please check the console for details.</div>;
        }
        return this.props.children;
    }
}

// Define interface for affiliate events
export interface AffiliateEvent {
    event: "impression" | "click" | "conversion" | "commission" | "payout";
    network: string;
    amount?: number;
    commissionAmount?: number;
    impressions?: number;
    clicks?: number;
    orderId?: string;
    date?: string;
    campaign?: string;
    payoutDate?: string;
    status?: string;
    read?: boolean;
    _id?: string;
    type?: string;
}

// Define interface for analytics data
interface AnalyticsData {
    totalRevenue: number;
    conversionRate: number;
    averageCommission: number;
    topPerformingCampaigns: number;
    revenueGrowth: number | null;
    clickThroughRate: number;
    customerLifetimeValue: number;
    returnOnAdSpend: number;
    totalClicks: number;
    totalCommissions: number;
}

// Define interface for network metrics
interface NetworkMetrics {
    name: string;
    revenue: number;
    pending: number;
    commissions: number;
    clicks: number;
    conversionRate: number;
    status: "active" | "warning";
    lastSync: string;
    logo: string;
}

// Define interface for optimization suggestions
interface OptimizationSuggestion {
    id: string;
    type: "campaign" | "keyword" | "audience" | "creative";
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    estimatedRevenue: number;
    effort: "high" | "medium" | "low";
}

// Define interface for ConversionAnalysis props
export interface ConversionAnalysisProps {
    events: AffiliateEvent[];
    campaignMetrics: { [key: string]: { revenue: number; commissions: number } };
}

// Define the overall state type with an index signature
interface NetworkDataState {
    [key: string]: NetworkMetrics;
}

const initialNetworkState: NetworkDataState = {
    "amazon-associates": { name: "Amazon Associates", logo: "📦", revenue: 0, pending: 0, commissions: 0, clicks: 0, conversionRate: 0, status: "active", lastSync: "N/A" },
    "shareasale": { name: "ShareASale", logo: "🛒", revenue: 0, pending: 0, commissions: 0, clicks: 0, conversionRate: 0, status: "active", lastSync: "N/A" },
    "commission-junction": { name: "Commission Junction", logo: "💼", revenue: 0, pending: 0, commissions: 0, clicks: 0, conversionRate: 0, status: "active", lastSync: "N/A" },
    "clickbank": { name: "ClickBank", logo: "🏦", revenue: 0, pending: 0, commissions: 0, clicks: 0, conversionRate: 0, status: "active", lastSync: "N/A" }
};

// Define valid campaigns from backend
const validCampaigns = [
    "Holiday Discounts",
    "Electronics Blast",
    "Fashion Flash Sale",
    "Back-to-School",
    "Prime Deals"
];

export default function AnalyticsPage() {
    const [activeTab, setActiveTab] = useState("performance");
    const [timeRange, setTimeRange] = useState("30d");
    const [events, setEvents] = useState<AffiliateEvent[]>([]);
    const [networkData, setNetworkData] = useState<NetworkDataState>(initialNetworkState);
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
        totalRevenue: 0,
        conversionRate: 0,
        averageCommission: 0,
        topPerformingCampaigns: 0,
        revenueGrowth: null,
        clickThroughRate: 2.8,
        customerLifetimeValue: 245.67,
        returnOnAdSpend: 4.2,
        totalClicks: 0,
        totalCommissions: 0,
    });
    const [optimizationSuggestions, setOptimizationSuggestions] = useState<OptimizationSuggestion[]>([]);
    const [optimizationError, setOptimizationError] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [initialRevenues, setInitialRevenues] = useState<{
        [key: string]: { revenue: number; commissions: number };
    }>({});
    const [unreadCount, setUnreadCount] = useState(0);

    const { toast } = useToast();
    const router = useRouter();

    // 1. Fetch access token from localStorage and handle redirection
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        console.log("Access Token:", token);
        if (token) {
            setAccessToken(token);
        } else {
            console.log("No token found, redirecting to /onboarding");
            toast({
                title: "Authentication Required",
                description: "Please log in to access this page.",
                variant: "destructive",
            });
            router.replace("/onboarding");
        }
    }, [router, toast]);

    // 2. Load initialRevenues from localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            try {
                const storedRevenues = localStorage.getItem("initialCampaignRevenues");
                setInitialRevenues(JSON.parse(storedRevenues || "{}"));
            } catch (error) {
                console.error("Error reading from localStorage:", error);
                setInitialRevenues({});
            }
        }
    }, []);

    // 3. Fetch Unread Count (for DashboardLayout)
    useEffect(() => {
        async function fetchUnreadCount() {
            if (!accessToken) return;
            try {
                const response = await fetch("/.netlify/functions/proxy/api/affiliate/notifications", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Fetch notifications failed: ${response.status} ${errorText}`);
                    if (response.status === 401) {
                        throw new Error("Unauthorized: Invalid or expired token");
                    }
                    throw new Error("Failed to fetch notifications");
                }
                const data = await response.json();
                const count = data.notifications.filter((n: any) => !n.read).length;
                setUnreadCount(count);
            } catch (error: any) {
                console.error("Error fetching unread count:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to load notifications.",
                    variant: "destructive",
                });
                if (error.message.includes("Unauthorized")) {
                    localStorage.removeItem("accessToken");
                    router.replace("/onboarding");
                }
            }
        }
        fetchUnreadCount();
    }, [accessToken, toast, router]);

    // Process events to update network metrics
    const processEvents = (events: AffiliateEvent[]) => {
        const updatedNetworkData: NetworkDataState = JSON.parse(JSON.stringify(initialNetworkState));

        events.forEach(event => {
            if (!event || !event.network || typeof event.network !== 'string') {
                console.warn("Skipping invalid event due to missing network property:", event);
                return;
            }

            const networkId = event.network.toLowerCase().replace(/ /g, '-');
            if (!updatedNetworkData[networkId]) {
                updatedNetworkData[networkId] = {
                    name: event.network,
                    logo: "🌐",
                    revenue: 0,
                    pending: 0,
                    commissions: 0,
                    clicks: 0,
                    conversionRate: 0,
                    status: "active",
                    lastSync: "just now"
                };
                console.warn(`Event for a new network received: ${event.network}`);
            }

            const newMetrics = updatedNetworkData[networkId];
            const amount = event.commissionAmount ?? event.amount ?? 0;

            switch (event.event) {
                case "impression":
                    if (typeof event.impressions === 'number') {
                        newMetrics.clicks += event.impressions;
                    }
                    break;
                case "click":
                    if (typeof event.clicks === 'number') {
                        newMetrics.clicks += event.clicks;
                    }
                    break;
                case "conversion":
                case "commission":
                    if (typeof amount === 'number' && amount > 0) {
                        newMetrics.revenue += amount;
                        newMetrics.commissions += 1;
                        newMetrics.pending += amount;
                    }
                    break;
                case "payout":
                    break;
            }
        });

        Object.keys(updatedNetworkData).forEach(id => {
            const net = updatedNetworkData[id];
            net.conversionRate = net.clicks > 0 ? parseFloat((net.commissions / net.clicks * 100).toFixed(2)) : 0;
        });

        setNetworkData(updatedNetworkData);
        setEvents(events);
    };

    // 4. Fetch initial events and set up WebSocket
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!accessToken) return;

            try {
                const eventsResponse = await fetch("/.netlify/functions/proxy/api/affiliate/events", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!eventsResponse.ok) {
                    const errorText = await response.text();
                    console.error(`Fetch events failed: ${eventsResponse.status} ${errorText}`);
                    if (eventsResponse.status === 401) {
                        throw new Error("Unauthorized: Invalid or expired token");
                    }
                    throw new Error("Failed to fetch initial events.");
                }
                const eventsData = await eventsResponse.json();
                processEvents(eventsData.events || []);

                const initialCampaignMetrics: { [key: string]: { revenue: number; commissions: number } } = {};
                validCampaigns.forEach(campaign => {
                    initialCampaignMetrics[campaign] = { revenue: 0, commissions: 0 };
                });
                eventsData.events.forEach((event: AffiliateEvent) => {
                    if (event.campaign && validCampaigns.includes(event.campaign) && (event.event === "commission" || event.event === "conversion")) {
                        const amount = event.commissionAmount ?? event.amount ?? 0;
                        if (amount > 0) {
                            initialCampaignMetrics[event.campaign].revenue += amount;
                            initialCampaignMetrics[event.campaign].commissions += 1;
                        }
                    }
                });
                console.log("Setting initialCampaignRevenues:", initialCampaignMetrics);
                localStorage.setItem('initialCampaignRevenues', JSON.stringify(initialCampaignMetrics));
            } catch (error: any) {
                console.error("Error fetching initial data:", error);
                toast({
                    title: "Error",
                    description: error.message || "Failed to load data. Please try again.",
                    variant: "destructive",
                });
                if (error.message.includes("Unauthorized")) {
                    localStorage.removeItem("accessToken");
                    router.replace("/onboarding");
                }
                processEvents([]);
                const initialCampaignMetrics: { [key: string]: { revenue: number; commissions: number } } = {};
                validCampaigns.forEach(campaign => {
                    initialCampaignMetrics[campaign] = { revenue: 0, commissions: 0 };
                });
                localStorage.setItem('initialCampaignRevenues', JSON.stringify(initialCampaignMetrics));
            }
        };

        fetchInitialData();

        const connectedNetworks = [
            { id: "amazon-associates", name: "Amazon Associates", logo: "📦" },
            { id: "shareasale", name: "ShareASale", logo: "🛒" },
            { id: "commission-junction", name: "Commission Junction", logo: "💼" },
            { id: "clickbank", name: "ClickBank", logo: "🏦" },
        ];

        const websockets: WebSocket[] = [];

        connectedNetworks.forEach((network) => {
            const websocket = new WebSocket(`wss://144.126.253.174:8083/api/affiliate/ws/${network.id}-events`);
            websockets.push(websocket);

            websocket.onopen = () => {
                console.log(`WebSocket connected for ${network.id}`);
                if (accessToken) {
                    websocket.send(JSON.stringify({ token: accessToken }));
                } else {
                    console.error(`No access token available for ${network.id} WebSocket`);
                }
            };

            websocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.error) {
                        console.error(`WebSocket error for ${network.id}: ${data.error}`);
                        if (data.error.includes("Invalid token") || data.error.includes("No token")) {
                            toast({
                                title: "WebSocket Authentication Error",
                                description: "Your session has expired. Please log in again.",
                                variant: "destructive",
                            });
                            localStorage.removeItem("accessToken");
                            router.replace("/onboarding");
                        }
                        return;
                    }

                    const notificationEvent: AffiliateEvent = {
                        ...data.event,
                        date: data.event.date || data.notification.created_at,
                        type: data.notification?.type,
                    };
                    console.log("WebSocket event received:", notificationEvent);

                    setEvents((prev) => [notificationEvent, ...prev]);

                    setNetworkData((prevData) => {
                        const networkId = network.id;
                        const newMetrics = { ...prevData[networkId] };
                        const eventData = data.event;
                        const amount = eventData.commissionAmount ?? eventData.amount ?? 0;

                        switch (eventData.event) {
                            case "impression":
                                if (typeof eventData.impressions === "number") {
                                    newMetrics.clicks += eventData.impressions;
                                    newMetrics.lastSync = "just now";
                                }
                                break;
                            case "click":
                                if (typeof eventData.clicks === "number") {
                                    newMetrics.clicks += eventData.clicks;
                                    newMetrics.lastSync = "just now";
                                }
                                break;
                            case "conversion":
                            case "commission":
                                if (typeof amount === "number" && amount > 0) {
                                    newMetrics.revenue += amount;
                                    newMetrics.commissions += 1;
                                    newMetrics.pending += amount;
                                    newMetrics.lastSync = "just now";
                                }
                                break;
                            case "payout":
                                break;
                        }

                        const newConversionRate = newMetrics.clicks > 0 ? (newMetrics.commissions / newMetrics.clicks * 100) : 0;
                        newMetrics.conversionRate = parseFloat(newConversionRate.toFixed(2));

                        return {
                            ...prevData,
                            [networkId]: newMetrics,
                        };
                    });
                } catch (error) {
                    console.error(`Error processing WebSocket message for ${network.id}:`, error);
                }
            };

            websocket.onclose = (event) => {
                console.log(`WebSocket disconnected for ${network.id}, code: ${event.code}, reason: ${event.reason}`);
            };

            websocket.onerror = (error) => {
                console.error(`WebSocket error for ${network.id}:`, error);
            };
        });

        return () => {
            websockets.forEach((ws) => ws.close());
        };
    }, [accessToken, toast, router]);

    // 5. Fetch optimization suggestions
    useEffect(() => {
        const fetchOptimizationSuggestions = async () => {
            if (!accessToken) return;

            try {
                const response = await fetch("/.netlify/functions/proxy/api/affiliate/optimization-suggestions", {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Fetch optimization suggestions failed: ${response.status} ${errorText}`);
                    if (response.status === 401) {
                        throw new Error("Unauthorized: Invalid or expired token");
                    }
                    throw new Error(`Failed to fetch optimization suggestions: ${errorText}`);
                }
                const data = await response.json();
                console.log("Optimization suggestions:", data.suggestions);
                setOptimizationSuggestions(data.suggestions.map((s: any) => ({
                    ...s,
                    impact: s.impact.toLowerCase() as "high" | "medium" | "low",
                    effort: s.effort.toLowerCase() as "high" | "medium" | "low",
                })));
                setOptimizationError(null);
            } catch (error: any) {
                console.error("Error fetching optimization suggestions:", error);
                setOptimizationError("Failed to load optimization suggestions. Please try again later.");
                setOptimizationSuggestions([]);
                if (error.message.includes("Unauthorized")) {
                    localStorage.removeItem("accessToken");
                    router.replace("/onboarding");
                }
            }
        };

        fetchOptimizationSuggestions();
    }, [accessToken, router]);

    // Calculate campaign metrics
    const campaignMetrics = useMemo(() => {
        const metrics: { [key: string]: { revenue: number; commissions: number } } = {};
        validCampaigns.forEach(campaign => {
            metrics[campaign] = { revenue: 0, commissions: 0 };
        });

        events.forEach(event => {
            if (event.campaign && validCampaigns.includes(event.campaign) && (event.event === "commission" || event.event === "conversion")) {
                const amount = event.commissionAmount ?? event.amount ?? 0;
                if (typeof amount === 'number' && amount > 0) {
                    metrics[event.campaign].revenue += amount;
                    metrics[event.campaign].commissions += 1;
                }
            }
        });
        return metrics;
    }, [events]);

    // Calculate analytics data
    useEffect(() => {
        const calculateAnalyticsData = () => {
            let totalRevenue = 0;
            let totalClicks = 0;
            let totalCommissions = 0;
            let currentPeriodRevenue = 0;
            let previousPeriodRevenue = 0;

            const now = new Date();
            let rangeStart: Date;
            let rangeEnd = new Date();
            let prevRangeStart: Date;
            let prevRangeEnd: Date;

            switch (timeRange) {
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

            events.forEach((event) => {
                if (!event.date || ((event.event === "commission" || event.event === "conversion") && typeof event.commissionAmount !== 'number' && typeof event.amount !== 'number')) {
                    return;
                }

                const eventDate = new Date(event.date);

                if (event.event === "commission" || event.event === "conversion") {
                    const amount = event.commissionAmount ?? event.amount ?? 0;
                    if (amount > 0) {
                        totalRevenue += amount;
                        totalCommissions += 1;
                    }
                    if (eventDate >= rangeStart && eventDate <= rangeEnd && amount > 0) {
                        currentPeriodRevenue += amount;
                    }
                    if (eventDate >= prevRangeStart && eventDate <= prevRangeEnd && amount > 0) {
                        previousPeriodRevenue += amount;
                    }
                }

                if (event.event === "click" && typeof event.clicks === 'number') {
                    totalClicks += event.clicks;
                }
            });

            const revenueGrowth = previousPeriodRevenue > 0
                ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100)
                : (currentPeriodRevenue > 0 ? null : 0);

            const averageCommission = totalCommissions > 0 ? totalRevenue / totalCommissions : 0;
            const conversionRate = totalClicks > 0 ? parseFloat((totalCommissions / totalClicks * 100).toFixed(2)) : 0;
            const topPerformingCampaigns = Object.keys(campaignMetrics).length;

            setAnalyticsData((prev) => ({
                ...prev,
                totalRevenue,
                revenueGrowth,
                averageCommission,
                conversionRate,
                totalClicks,
                totalCommissions,
                topPerformingCampaigns,
            }));
        };

        calculateAnalyticsData();
    }, [events, timeRange, campaignMetrics]);

    // Prepare chart data for conversion analysis
    const conversionChartData = useMemo(() => {
        const dailyData: { [key: string]: { clicks: number; commissions: number; conversionRate: number } } = {};

        events.forEach(event => {
            if (event.date && (event.event === "commission" || event.event === "click" || event.event === "conversion") && event.campaign && validCampaigns.includes(event.campaign)) {
                const date = new Date(event.date).toISOString().split('T')[0];
                if (!dailyData[date]) {
                    dailyData[date] = { clicks: 0, commissions: 0, conversionRate: 0 };
                }
                const amount = event.commissionAmount ?? event.amount ?? 0;
                if ((event.event === "commission" || event.event === "conversion") && amount > 0) {
                    dailyData[date].commissions += 1;
                }
                if (event.event === "click" && typeof event.clicks === 'number') {
                    dailyData[date].clicks += event.clicks;
                }
            }
        });

        const sortedDates = Object.keys(dailyData).sort();

        return sortedDates.map(date => ({
            date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            clicks: dailyData[date].clicks,
            commissions: dailyData[date].commissions,
            conversionRate: dailyData[date].clicks > 0 ? parseFloat((dailyData[date].commissions / dailyData[date].clicks * 100).toFixed(2)) : 0
        }));
    }, [events]);

    // Prepare chart data for campaign revenue
    const campaignChartData = useMemo(() => {
        const data = validCampaigns.map(campaign => campaignMetrics[campaign]?.revenue || 0);
        if (!data.every(val => typeof val === 'number' && !isNaN(val))) {
            console.error("Invalid chart data:", data);
            return { labels: validCampaigns, datasets: [] };
        }
        return {
            labels: validCampaigns,
            datasets: [
                {
                    label: "Campaign Revenue",
                    data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                    pointStyle: 'circle',
                    pointRadius: 3,
                    pointHoverRadius: 5,
                },
            ],
        };
    }, [campaignMetrics]);

    // Sort campaigns by revenue in descending order and calculate growth
    const sortedCampaigns = useMemo(() => {
        return validCampaigns
            .map(campaign => {
                const currentRevenue = campaignMetrics[campaign]?.revenue || 0;
                const initialRevenue = initialRevenues[campaign]?.revenue || 0;
                let growth: number | null = null;

                if (initialRevenue > 0) {
                    growth = ((currentRevenue - initialRevenue) / initialRevenue * 100);
                } else if (currentRevenue > 0 && initialRevenue === 0) {
                    growth = null;
                } else {
                    growth = 0;
                }

                return {
                    name: campaign,
                    revenue: currentRevenue,
                    growth: growth !== null ? parseFloat(growth.toFixed(1)) : null,
                };
            })
            .sort((a, b) => b.revenue - a.revenue);
    }, [campaignMetrics, initialRevenues]);

    return (
        <DashboardLayout unreadCount={unreadCount}>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-primary" />
                            Analytics & Optimization
                        </h1>
                        <p className="text-muted-foreground">Deep insights and actionable recommendations for growth</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="glass-effect border-2 border-primary/20">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                    <p className="text-2xl font-bold">${analyticsData.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-primary" />
                                </div>
                            </div>
                            {analyticsData.revenueGrowth !== null && (
                                <div className="flex items-center mt-4">
                                    <TrendingUp className={`w-4 h-4 mr-1 ${analyticsData.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                                    <span className={`text-sm font-medium ${analyticsData.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {analyticsData.revenueGrowth >= 0 ? '+' : ''}{analyticsData.revenueGrowth.toFixed(1)}%
                                    </span>
                                    <span className="text-sm text-muted-foreground ml-1">from last period</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card className="glass-effect">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                                    <p className="text-2xl font-bold">{analyticsData.conversionRate.toFixed(1)}%</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-blue-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-effect">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Avg Commission</p>
                                    <p className="text-2xl font-bold">${analyticsData.averageCommission.toLocaleString()}</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-purple-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="glass-effect">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Top Campaigns</p>
                                    <p className="text-2xl font-bold">{analyticsData.topPerformingCampaigns}</p>
                                </div>
                                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                                    <TrendingUp className="w-6 h-6 text-green-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                        <TabsTrigger value="conversion">Conversion</TabsTrigger>
                        <TabsTrigger value="optimization">Optimization</TabsTrigger>
                        <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
                        <TabsTrigger value="competitive">Competitive</TabsTrigger>
                    </TabsList>

                    <TabsContent value="performance" className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle>Campaign Revenue Performance</CardTitle>
                                        <CardDescription>Revenue across all campaigns</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="h-80">
                                            <ChartErrorBoundary>
                                                <Line
                                                    data={campaignChartData}
                                                    options={{
                                                        responsive: true,
                                                        maintainAspectRatio: false,
                                                        plugins: {
                                                            legend: {
                                                                position: 'top',
                                                            },
                                                            title: {
                                                                display: true,
                                                                text: 'Campaign Revenue',
                                                            },
                                                        },
                                                        scales: {
                                                            y: {
                                                                type: 'linear',
                                                                beginAtZero: true,
                                                                title: {
                                                                    display: true,
                                                                    text: 'Revenue ($)',
                                                                },
                                                            },
                                                            x: {
                                                                type: 'category',
                                                            },
                                                        },
                                                    }}
                                                />
                                            </ChartErrorBoundary>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div>
                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Top Campaigns</CardTitle>
                                        <CardDescription>Your best performing campaigns by revenue</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {sortedCampaigns.map((campaign, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                                                >
                                                    <div>
                                                        <h4 className="font-semibold text-sm">{campaign.name}</h4>
                                                        <p className="text-xs text-muted-foreground">
                                                            ${campaign.revenue.toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant="secondary"
                                                        className={`${
                                                            campaign.growth !== null && campaign.growth >= 0
                                                                ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                                                : campaign.growth !== null && campaign.growth < 0
                                                                ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                                                : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                                                        }`}
                                                    >
                                                        {campaign.growth !== null
                                                            ? `${campaign.growth >= 0 ? '+' : ''}${campaign.growth}%`
                                                            : 'N/A'}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="conversion" className="space-y-6">
                        <ConversionAnalysis events={events} campaignMetrics={campaignMetrics} />
                    </TabsContent>

                    <TabsContent value="optimization" className="space-y-6">
                        {optimizationError ? (
                            <Card className="glass-effect">
                                <CardContent className="p-6">
                                    <p className="text-red-500">{optimizationError}</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <CampaignOptimization suggestions={optimizationSuggestions} />
                        )}
                    </TabsContent>

                    <TabsContent value="forecasting" className="space-y-6">
                        <RevenueForecasting events={events} campaignMetrics={campaignMetrics} accessToken={accessToken} />
                    </TabsContent>

                    <TabsContent value="competitive" className="space-y-6">
                        <CompetitorAnalysis />
                    </TabsContent>
                </Tabs>
            </div>
        </DashboardLayout>
    );
}
