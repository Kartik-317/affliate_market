// pages/dashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation"; // Add useRouter for redirection
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Clock,
  Bell,
  CreditCard,
  FileText,
  Plus,
  Filter,
  Download,
  Calendar,
  Globe,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Search,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { MetricCard } from "@/components/metric-card";
import { RevenueChart } from "@/components/revenue-chart";
import { NetworkTable } from "@/components/network-table";
import { RecentActivity } from "@/components/recent-activity";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { AddNetworkDialog } from "@/components/add-network-dialog";

interface NetworkMetrics {
  name: string;
  revenue: number;
  pending: number;
  commissions: number;
  clicks: number;
  conversionRate: number;
  status: "active" | "warning";
  lastSync: string;
  lastPayout?: string;
  logo: string;
}

interface NetworkDataState {
  [key: string]: NetworkMetrics;
}

interface AffiliateEvent {
  event: string;
  network: string;
  amount?: number;
  orderId?: string;
  date?: string;
  campaign?: string;
  clicks?: number;
  impressions?: number;
  conversionAmount?: number;
  commissionAmount?: number;
  payoutDate?: string;
  status?: string;
  message?: string;
  read?: boolean;
  product?: string;
  _id?: string;
  paymentMethodId?: string;
}

const initialNetworkState: NetworkDataState = {
  "amazon-associates": {
    name: "Amazon Associates",
    logo: "📦",
    revenue: 0,
    pending: 0,
    commissions: 0,
    clicks: 0,
    conversionRate: 0,
    status: "active",
    lastSync: "N/A",
  },
  "shareasale": {
    name: "ShareASale",
    logo: "🛒",
    revenue: 0,
    pending: 0,
    commissions: 0,
    clicks: 0,
    conversionRate: 0,
    status: "active",
    lastSync: "N/A",
  },
  "commission-junction": {
    name: "Commission Junction",
    logo: "💼",
    revenue: 0,
    pending: 0,
    commissions: 0,
    clicks: 0,
    conversionRate: 0,
    status: "active",
    lastSync: "N/A",
  },
  "clickbank": {
    name: "ClickBank",
    logo: "🏦",
    revenue: 0,
    pending: 0,
    commissions: 0,
    clicks: 0,
    conversionRate: 0,
    status: "active",
    lastSync: "N/A",
  },
};

export default function DashboardPage() {
  const router = useRouter(); // Add router for redirection
  const [networkData, setNetworkData] = useState<NetworkDataState>(initialNetworkState);
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedNetwork, setSelectedNetwork] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [allEvents, setAllEvents] = useState<AffiliateEvent[]>([]);
  const [showAddNetworkDialog, setShowAddNetworkDialog] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [dateRange, setDateRange] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found for notifications fetch");
          router.push("/onboarding");
          return;
        }
        const response = await fetch("/.netlify/functions/proxy/api/affiliate/notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const count = data.notifications.filter((n: any) => !n.read).length;
          setUnreadCount(count);
        } else {
          console.error("Failed to fetch unread count:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
      }
    };

    fetchUnreadCount();
  }, [router]);

  const processEvents = (events: AffiliateEvent[]) => {
    const updatedNetworkData: NetworkDataState = JSON.parse(JSON.stringify(initialNetworkState));

    events.forEach((event) => {
      if (!event.network) {
        console.error("Skipping event due to missing network property:", event);
        return;
      }

      const networkId = event.network.toLowerCase().replace(/ /g, "-");

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
          lastSync: "just now",
        };
        console.warn(`Event for a new network received: ${event.network}`);
      }

      const newMetrics = updatedNetworkData[networkId];

      switch (event.event) {
        case "commission":
          if (typeof event.amount === "number") {
            newMetrics.revenue += event.amount;
            newMetrics.commissions += 1;
            newMetrics.pending += event.amount;
            newMetrics.lastSync = "just now";
          }
          break;
        case "payout":
          if (typeof event.amount === "number" && event.status === "Completed") {
            newMetrics.pending -= event.amount;
            newMetrics.lastSync = "just now";
            newMetrics.lastPayout = new Date().toLocaleTimeString();
          }
          break;
        case "click":
          if (typeof event.clicks === "number") {
            newMetrics.clicks += event.clicks;
            newMetrics.lastSync = "just now";
          }
          break;
        case "impression":
          if (typeof event.impressions === "number") {
            newMetrics.clicks += event.impressions;
            newMetrics.lastSync = "just now";
          }
          break;
        case "conversion":
          if (typeof event.commissionAmount === "number") {
            newMetrics.revenue += event.commissionAmount;
            newMetrics.commissions += 1;
            newMetrics.pending += event.commissionAmount;
            newMetrics.lastSync = "just now";
          }
          break;
      }
    });

    Object.keys(updatedNetworkData).forEach((id) => {
      const net = updatedNetworkData[id];
      net.conversionRate = net.clicks > 0 ? (net.commissions / net.clicks) * 100 : 0;
      net.conversionRate = parseFloat(net.conversionRate.toFixed(2));
    });

    setNetworkData(updatedNetworkData);
    setAllEvents(events);
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found for initial data fetch");
          router.push("/onboarding");
          return;
        }
        const response = await fetch("/.netlify/functions/proxy/api/affiliate/events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch initial data: ${response.statusText}`);
        }
        const data = await response.json();
        processEvents(data.events);
      } catch (error) {
        console.error("Error fetching initial data:", error);
        processEvents([]);
        router.push("/onboarding");
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
      const websocket = new WebSocket(`ws://localhost:8000/api/affiliate/ws/${network.id}-events`);
      websockets.push(websocket);

      websocket.onopen = () => {
        console.log(`WebSocket connected for ${network.id}`);
        const token = localStorage.getItem("accessToken");
        if (token) {
          websocket.send(JSON.stringify({
            token, // Include accessToken
            config: { frequency: 50000, networks: [network.id] }, // Reduced frequency for testing
          }));
        } else {
          console.error(`No access token found for ${network.id} WebSocket`);
          websocket.close();
        }
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            console.error(`WebSocket error for ${network.id}: ${data.error}`);
            return;
          }

          const notificationEvent: AffiliateEvent = {
            ...data.event,
            message: data.notification?.message,
            read: data.notification?.read ?? false,
            _id: data.notification?._id ?? data.event._id,
          };

          console.log(`WebSocket event for ${network.id}:`, notificationEvent);

          setAllEvents((prev) => [notificationEvent, ...prev].slice(0, 100));

          if (!data.notification?.read) {
            setUnreadCount((prev) => prev + 1);
          }

          setNetworkData((prevData) => {
            const networkId = network.id;
            const newMetrics = { ...prevData[networkId] };
            const eventData = data.event;

            switch (eventData.event) {
              case "commission":
                if (typeof eventData.amount === "number") {
                  newMetrics.revenue += eventData.amount;
                  newMetrics.commissions += 1;
                  newMetrics.pending += eventData.amount;
                  newMetrics.lastSync = "just now";
                }
                break;
              case "payout":
                if (typeof eventData.amount === "number" && eventData.status === "Completed") {
                  newMetrics.pending -= eventData.amount;
                  newMetrics.lastSync = "just now";
                  newMetrics.lastPayout = new Date().toLocaleTimeString();
                }
                break;
              case "click":
                if (typeof eventData.clicks === "number") {
                  newMetrics.clicks += eventData.clicks;
                  newMetrics.lastSync = "just now";
                }
                break;
              case "impression":
                if (typeof eventData.impressions === "number") {
                  newMetrics.clicks += eventData.impressions;
                  newMetrics.lastSync = "just now";
                }
                break;
              case "conversion":
                if (typeof eventData.commissionAmount === "number") {
                  newMetrics.revenue += eventData.commissionAmount;
                  newMetrics.commissions += 1;
                  newMetrics.pending += eventData.commissionAmount;
                  newMetrics.lastSync = "just now";
                }
                break;
            }

            const newConversionRate = newMetrics.clicks > 0 ? (newMetrics.commissions / newMetrics.clicks) * 100 : 0;
            newMetrics.conversionRate = parseFloat(newConversionRate.toFixed(2));

            return {
              ...prevData,
              [networkId]: newMetrics,
            };
          });
        } catch (err) {
          console.error(`WebSocket message parsing error for ${network.id}:`, err);
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
  }, [router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        router.push("/onboarding");
        return;
      }
      const response = await fetch("/.netlify/functions/proxy/api/affiliate/events", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to refresh data: ${response.statusText}`);
      }
      const data = await response.json();
      processEvents(data.events);
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportToPdf = () => {
    console.log("Exporting data to PDF...");
    alert("Export to PDF functionality is a placeholder.");
  };

  const handleNetworkConnected = (networkId: string, networkName: string) => {
    console.log(`New network connected: ${networkName} (${networkId})`);
    setNetworkData((prevData) => ({
      ...prevData,
      [networkId]: {
        name: networkName,
        logo: "🔗",
        revenue: 0,
        pending: 0,
        commissions: 0,
        clicks: 0,
        conversionRate: 0,
        status: "active",
        lastSync: "just now",
      },
    }));
  };

  const dynamicChartData = useMemo(() => {
    const dailyData: { [key: string]: { revenue: number; commissions: number } } = {};

    allEvents.forEach((event) => {
      if ((event.event === "commission" || event.event === "conversion") && event.date) {
        const amount = event.event === "commission" ? event.amount : event.commissionAmount;
        if (typeof amount === "number") {
          const date = new Date(event.date).toISOString().split("T")[0];
          if (!dailyData[date]) {
            dailyData[date] = { revenue: 0, commissions: 0 };
          }
          dailyData[date].revenue += amount;
          dailyData[date].commissions += 1;
        }
      }
    });

    const sortedDates = Object.keys(dailyData).sort();

    return sortedDates.map((date) => ({
      date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: parseFloat(dailyData[date].revenue.toFixed(2)),
      commissions: dailyData[date].commissions,
    }));
  }, [allEvents]);

  const totalRevenue = Object.values(networkData).reduce((sum, net) => sum + net.revenue, 0);
  const pendingPayments = Object.values(networkData).reduce((sum, net) => sum + net.pending, 0);
  const thisMonthRevenue = totalRevenue;
  const totalCommissions = Object.values(networkData).reduce((sum, net) => sum + net.commissions, 0);
  const totalClicks = Object.values(networkData).reduce((sum, net) => sum + net.clicks, 0);
  const conversionRate = totalClicks > 0 ? (totalCommissions / totalClicks) * 100 : 0;

  const filteredNetworks = Object.values(networkData).filter((network) => {
    const matchesNetwork = selectedNetwork === "all" || network.name === selectedNetwork;
    const matchesSearch = network.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNetwork && matchesSearch;
  });

  return (
    <DashboardLayout unreadCount={unreadCount}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-balance">Dashboard</h1>
            <p className="text-muted-foreground">Your affiliate marketing command center</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                Last updated: {new Date().toLocaleTimeString()}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-6 px-2 text-xs hover:bg-accent transition-colors"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Syncing..." : "Refresh"}
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search networks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
              <SelectTrigger className="w-[180px]">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Networks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Networks</SelectItem>
                {Object.values(networkData).map((network) => (
                  <SelectItem key={network.name} value={network.name}>
                    <div className="flex items-center space-x-2">
                      <span>{network.logo}</span>
                      <span>{network.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-accent transition-colors bg-transparent"
              onClick={() => setShowDateRangePicker(true)}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Date Range
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-accent transition-colors bg-transparent"
              onClick={handleExportToPdf}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              className="hover:bg-primary/90 transition-colors"
              onClick={() => setShowAddNetworkDialog(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Network
            </Button>
          </div>
        </div>
        <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:grid-cols-5">
            <TabsTrigger value="24h">Today</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
            <TabsTrigger value="1y">1 Year</TabsTrigger>
          </TabsList>
          <TabsContent value={timeRange} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={`$${totalRevenue.toLocaleString()}`}
                change="+12.5%"
                changeType="positive"
                icon={DollarSign}
              />
              <MetricCard
                title="Pending Payments"
                value={`$${pendingPayments.toLocaleString()}`}
                change="+8.2%"
                changeType="positive"
                icon={Clock}
              />
              <MetricCard
                title="This Month"
                value={`$${thisMonthRevenue.toLocaleString()}`}
                change="+15.3%"
                changeType="positive"
                icon={TrendingUp}
              />
              <MetricCard
                title="Conversion Rate"
                value={`${conversionRate.toFixed(2)}%`}
                change="+0.4%"
                changeType="positive"
                icon={BarChart3}
              />
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {filteredNetworks.map((network) => (
                <Card
                  key={network.name}
                  className="glass-effect hover:glass-effect-hover hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer group"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{network.logo}</span>
                        <span className="font-semibold text-sm">{network.name}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {network.status === "active" ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        <Badge variant={network.status === "active" ? "secondary" : "destructive"} className="text-xs">
                          {network.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Revenue:</span>
                        <span className="font-medium">${network.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pending:</span>
                        <span className="font-medium">${network.pending.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last Sync:</span>
                        <span className="font-medium">{network.lastSync}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Your earnings across all networks over time</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hover:bg-accent transition-colors bg-transparent">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Chart Type
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-accent transition-colors bg-transparent">
                      <Filter className="w-4 h-4 mr-2" />
                      Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RevenueChart chartData={dynamicChartData} />
              </CardContent>
            </Card>
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card className="glass-effect">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Network Performance</CardTitle>
                        <CardDescription>Real-time data from all your connected networks</CardDescription>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        Click rows to expand
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <NetworkTable networks={filteredNetworks} />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card className="glass-effect">
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest commissions and payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RecentActivity wsEvents={allEvents} />
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddNetworkDialog
        open={showAddNetworkDialog}
        onOpenChange={setShowAddNetworkDialog}
        onNetworkConnected={handleNetworkConnected}
      />

      <Dialog open={showDateRangePicker} onOpenChange={setShowDateRangePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Date Range</DialogTitle>
          </DialogHeader>
          <CalendarComponent
            mode="range"
            selected={dateRange}
            onSelect={setDateRange}
            numberOfMonths={2}
          />
          <div className="flex justify-start space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowDateRangePicker(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setShowDateRangePicker(false);
                alert("Date range filtering is a placeholder feature.");
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}