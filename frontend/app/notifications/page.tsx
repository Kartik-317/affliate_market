"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Bell,
  DollarSign,
  TrendingUp,
  Settings,
  EyeOff,
  Search,
  KanbanSquareDashed as MarkAsUnread,
  Trash2,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { NotificationSettings } from "@/components/notification-settings"

interface Notification {
  _id: string;
  type: string;
  title: string;
  description: string;
  amount?: string;
  time: string;
  timestamp: Date;
  read: boolean;
  priority: "high" | "medium" | "low";
  network: string;
  actionUrl: string;
  category: string;
  created_at: string;
  user_id: string;
}

const ITEMS_PER_PAGE = 5;

const getPriority = (type: string): "high" | "medium" | "low" => {
  switch (type) {
    case "commission":
    case "payout":
      return "high";
    case "alert":
    case "optimization":
      return "medium";
    default:
      return "low";
  }
};

const formatNotification = (event: any): Notification => {
  const time = event.created_at || new Date().toISOString();
  const timestamp = new Date(time);
  const timeDiff = new Date().getTime() - timestamp.getTime();
  const minutes = Math.floor(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  let timeString = "just now";
  if (minutes > 0 && minutes < 60) {
    timeString = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (hours > 0 && hours < 24) {
    timeString = `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (days > 0) {
    timeString = `${days} day${days > 1 ? 's' : ''} ago`;
  }

  let title = "";
  let description = event.message || "An update has been received.";
  let actionUrl = "/dashboard";
  let category = "system";
  let amount: string | undefined;

  const networkName = event.network || 'Unknown Network';

  switch (event.type) {
    case "commission":
      title = "New Commission Earned";
      if (typeof event.amount === 'number') {
        amount = `$${event.amount.toFixed(2)}`;
      }
      actionUrl = `/dashboard?network=${networkName.toLowerCase().replace(' ', '-')}`;
      category = "earnings";
      break;
    case "payout":
      title = "Payment Status Update";
      if (typeof event.amount === 'number') {
        amount = `$${Math.abs(event.amount).toFixed(2)}`;
      }
      actionUrl = "/payments";
      category = "payments";
      break;
    case "click":
      title = "New Clicks on Campaign";
      actionUrl = `/analytics?campaign=${encodeURIComponent(event.campaign || '')}`;
      category = "performance";
      break;
    case "impression":
      title = "New Impressions Recorded";
      actionUrl = `/analytics?campaign=${encodeURIComponent(event.campaign || '')}`;
      category = "performance";
      break;
    case "conversion":
      title = "New Conversion";
      if (typeof event.commissionAmount === 'number') {
        amount = `$${event.commissionAmount.toFixed(2)}`;
      }
      actionUrl = `/dashboard?network=${networkName.toLowerCase().replace(' ', '-')}`;
      category = "earnings";
      break;
    default:
      title = "System Update";
      break;
  }

  return {
    _id: event._id,
    type: event.type,
    title,
    description,
    amount,
    time: timeString,
    timestamp,
    read: event.read ?? false,
    priority: getPriority(event.type),
    network: networkName,
    actionUrl,
    category,
    created_at: event.created_at,
    user_id: event.user_id,
  };
};

export default function NotificationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_PAGE);

  const fetchNotifications = useCallback(async () => {
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
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized: Invalid or expired token");
          localStorage.removeItem("accessToken");
          router.push("/onboarding");
          return;
        }
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      const data = await response.json();
      const formattedNotifications = data.notifications.map(formatNotification);
      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      router.push("/onboarding");
    }
  }, [router]);

  useEffect(() => {
    fetchNotifications();

    const connectedNetworks = [
      { id: "amazon-associates", name: "Amazon Associates" },
      { id: "shareasale", name: "ShareASale" },
      { id: "commission-junction", name: "Commission Junction" },
      { id: "clickbank", name: "ClickBank" },
    ];

    const websockets: WebSocket[] = [];

    connectedNetworks.forEach((network) => {
      const websocket = new WebSocket(`ws://localhost:8000/api/affiliate/ws/${network.id}-events`);
      websockets.push(websocket);

      websocket.onopen = () => {
        console.log(`WebSocket connected for notifications: ${network.id}`);
        const token = localStorage.getItem("accessToken");
        if (token) {
          websocket.send(JSON.stringify({
            token,
            config: { frequency: 5000, networks: [network.id] },
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

          const notification = formatNotification({
            ...data.event,
            message: data.notification?.message,
            read: data.notification?.read ?? false,
            _id: data.notification?._id ?? data.event._id,
            user_id: data.notification?.user_id,
            created_at: data.notification?.created_at ?? data.event.date,
          });

          setNotifications((prev) => [notification, ...prev].slice(0, 100));
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
  }, [fetchNotifications]);

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token for marking notifications as read");
        router.push("/onboarding");
        return;
      }
      const response = await fetch("/.netlify/functions/proxy/api/affiliate/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (notificationIds.includes(n._id) ? { ...n, read: true } : n))
        );
        setSelectedNotifications([]);
      } else {
        if (response.status === 401) {
          console.error("Unauthorized: Invalid or expired token");
          localStorage.removeItem("accessToken");
          router.push("/onboarding");
        } else {
          console.error("Failed to mark notifications as read:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      router.push("/onboarding");
    }
  };

  const markAsUnread = async (notificationIds: string[]) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token for marking notifications as unread");
        router.push("/onboarding");
        return;
      }
      // Assuming backend supports marking as unread; otherwise, keep client-side
      const response = await fetch("/.netlify/functions/proxy/api/affiliate/notifications/mark-unread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (notificationIds.includes(n._id) ? { ...n, read: false } : n))
        );
        setSelectedNotifications([]);
      } else {
        if (response.status === 401) {
          console.error("Unauthorized: Invalid or expired token");
          localStorage.removeItem("accessToken");
          router.push("/onboarding");
        } else {
          console.error("Failed to mark notifications as unread:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error marking notifications as unread:", error);
      router.push("/onboarding");
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token for deleting notifications");
        router.push("/onboarding");
        return;
      }
      // Assuming backend supports deletion; otherwise, keep client-side
      const response = await fetch("/.netlify/functions/proxy/api/affiliate/notifications/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notification_ids: notificationIds }),
      });

      if (response.ok) {
        setNotifications((prev) => prev.filter((n) => !notificationIds.includes(n._id)));
        setSelectedNotifications([]);
      } else {
        if (response.status === 401) {
          console.error("Unauthorized: Invalid or expired token");
          localStorage.removeItem("accessToken");
          router.push("/onboarding");
        } else {
          console.error("Failed to delete notifications:", response.statusText);
        }
      }
    } catch (error) {
      console.error("Error deleting notifications:", error);
      router.push("/onboarding");
    }
  };

  const markAllAsRead = () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n._id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "medium":
        return <Info className="w-4 h-4 text-yellow-500" />;
      case "low":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "commission":
      case "conversion":
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case "payout":
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case "alert":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "optimization":
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      case "click":
      case "impression":
        return <TrendingUp className="w-4 h-4 text-teal-500" />;
      case "system":
        return <Settings className="w-4 h-4 text-gray-500" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleShowMore = () => {
    setItemsToShow((prevItemsToShow) => prevItemsToShow + ITEMS_PER_PAGE);
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      searchQuery === "" ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.network.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === "all") return true;
    if (activeTab === "unread") return !notification.read;
    if (activeTab === "commissions") return notification.type === "commission" || notification.type === "conversion";
    if (activeTab === "payments") return notification.type === "payout";
    if (activeTab === "alerts") return notification.type === "alert" || notification.type === "optimization";
    if (activeTab === "high-priority") return notification.priority === "high";
    return true;
  });

  const visibleNotifications = filteredNotifications.slice(0, itemsToShow);
  const hasMoreNotifications = filteredNotifications.length > itemsToShow;

  return (
    <DashboardLayout unreadCount={notifications.filter((n) => !n.read).length}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-balance">
              <Bell className="w-8 h-8 text-primary" />
              Notifications
              {notifications.filter((n) => !n.read).length > 0 && (
                <Badge className="bg-primary text-primary-foreground">
                  {notifications.filter((n) => !n.read).length} new
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground">Stay updated on your affiliate marketing activities</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button
              size="sm"
              onClick={markAllAsRead}
              disabled={notifications.filter((n) => !n.read).length === 0}
            >
              Mark All Read
            </Button>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{notifications.length}</p>
                </div>
                <Bell className="w-8 h-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Unread</p>
                  <p className="text-2xl font-bold">{notifications.filter((n) => !n.read).length}</p>
                </div>
                <EyeOff className="w-8 h-8 text-orange-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold">{notifications.filter((n) => n.priority === "high").length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Commissions</p>
                  <p className="text-2xl font-bold">
                    {notifications.filter((n) => n.type === "commission" || n.type === "conversion").length}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payments</p>
                  <p className="text-2xl font-bold">{notifications.filter((n) => n.type === "payout").length}</p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-500/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Notifications List */}
          <div className="lg:col-span-3">
            <Card className="glass-effect">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>All your notifications and alerts in one place</CardDescription>
                  </div>
                  {selectedNotifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{selectedNotifications.length} selected</Badge>
                      <Button variant="outline" size="sm" onClick={() => markAsRead(selectedNotifications)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Read
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => markAsUnread(selectedNotifications)}>
                        <MarkAsUnread className="w-4 h-4 mr-1" />
                        Unread
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteNotifications(selectedNotifications)}>
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="unread">
                      Unread
                      {notifications.filter((n) => !n.read).length > 0 && (
                        <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                          {notifications.filter((n) => !n.read).length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="high-priority">Priority</TabsTrigger>
                    <TabsTrigger value="commissions">Commissions</TabsTrigger>
                    <TabsTrigger value="payments">Payments</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                  </TabsList>

                  <TabsContent value={activeTab} className="mt-6">
                    <div className="space-y-3">
                      {visibleNotifications.length > 0 ? (
                        <>
                          {visibleNotifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 rounded-lg border transition-all cursor-pointer hover:border-primary/50 ${
                                !notification.read ? "bg-primary/5 border-primary/20" : "bg-background border-border"
                              } ${selectedNotifications.includes(notification._id) ? "ring-2 ring-primary/50" : ""}`}
                              onClick={() => {
                                if (selectedNotifications.includes(notification._id)) {
                                  setSelectedNotifications((prev) => prev.filter((id) => id !== notification._id));
                                } else {
                                  setSelectedNotifications((prev) => [...prev, notification._id]);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="flex items-center space-x-2">
                                    {getTypeIcon(notification.type)}
                                    {getPriorityIcon(notification.priority)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <h4
                                        className={`font-semibold text-sm ${
                                          !notification.read ? "text-foreground" : "text-muted-foreground"
                                        }`}
                                      >
                                        {notification.title}
                                      </h4>
                                      <div className="flex items-center space-x-2">
                                        {notification.amount && (
                                          <Badge variant="secondary" className="text-xs">
                                            {notification.amount}
                                          </Badge>
                                        )}
                                        <Badge variant="outline" className="text-xs">
                                          {notification.network}
                                        </Badge>
                                      </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {notification.description}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        <span>{notification.time}</span>
                                      </div>
                                      {notification.actionUrl && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 px-2 text-xs"
                                          onClick={() => router.push(notification.actionUrl)}
                                        >
                                          <ExternalLink className="w-3 h-3 mr-1" />
                                          View Details
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                          {hasMoreNotifications && (
                            <div className="text-center pt-2">
                              <Button onClick={handleShowMore} variant="ghost" size="sm">
                                Show More
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-12">
                          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">No notifications</h3>
                          <p className="text-muted-foreground">
                            {searchQuery
                              ? `No notifications match "${searchQuery}"`
                              : activeTab === "unread"
                              ? "You're all caught up! No unread notifications."
                              : "No notifications in this category yet."}
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Notification Settings */}
          <div>
            <NotificationSettings />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}