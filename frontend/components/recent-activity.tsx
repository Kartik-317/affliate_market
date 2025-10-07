"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock } from "lucide-react";

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

interface Activity {
  type: string;
  description: string;
  amount: string;
  time: string;
  status: string;
}

interface RecentActivityProps {
  wsEvents: AffiliateEvent[];
}

const ITEMS_PER_PAGE = 10;

export function RecentActivity({ wsEvents }: RecentActivityProps) {
  const [itemsToShow, setItemsToShow] = useState(ITEMS_PER_PAGE);

  const formatWebSocketEvent = (event: AffiliateEvent): Activity => {
    // Debug: Log the incoming event
    console.log("Processing event in formatWebSocketEvent:", event);

    const time = event.date || event.payoutDate || new Date().toISOString();
    const formattedTime = new Date(time).toLocaleTimeString();
    const network = event.network || "Unknown Network";

    if (!event.event) {
      console.warn("Event missing event type:", event);
      return {
        type: "unknown",
        description: event.message || `Unspecified event from ${network}`,
        amount: "N/A",
        time: formattedTime,
        status: "info",
      };
    }

    switch (event.event.toLowerCase().trim()) {
      case "commission":
        return {
          type: "commission",
          description: event.message || `New commission from ${network} for ${event.product || "unknown product"} (Campaign: ${event.campaign || "N/A"}, Order: ${event.orderId || "N/A"})`,
          amount: event.amount ? `$${event.amount.toFixed(2)}` : "N/A",
          time: formattedTime,
          status: "completed",
        };
      case "payout":
        return {
          type: "payment",
          description: event.message || `Payout from ${network}${event.paymentMethodId ? ` (Method ID: ${event.paymentMethodId})` : ""}${event.status ? ` - ${event.status}` : ""}`,
          amount: event.amount ? `$${Math.abs(event.amount).toFixed(2)}` : "N/A",
          time: formattedTime,
          status: event.status?.toLowerCase() || "completed",
        };
      case "click":
        return {
          type: "optimization",
          description: event.message || `New clicks from ${network} for ${event.product || "unknown product"} (${event.campaign || "unknown"})`,
          amount: event.clicks ? `${event.clicks} clicks` : "N/A",
          time: formattedTime,
          status: "info",
        };
      case "impression":
        return {
          type: "optimization",
          description: event.message || `New impressions from ${network} for ${event.product || "unknown product"} (${event.campaign || "unknown"})`,
          amount: event.impressions ? `${event.impressions} impressions` : "N/A",
          time: formattedTime,
          status: "info",
        };
      case "conversion":
        return {
          type: "commission",
          description: event.message || `New conversion from ${network} for ${event.product || "unknown product"} (Campaign: ${event.campaign || "N/A"}, Order: ${event.orderId || "N/A"})`,
          amount: event.commissionAmount ? `$${event.commissionAmount.toFixed(2)}` : "N/A",
          time: formattedTime,
          status: "completed",
        };
      default:
        console.warn(`Unrecognized event type: ${event.event}`, event);
        return {
          type: "unknown",
          description: event.message || `Unrecognized event type '${event.event}' from ${network}`,
          amount: event.impressions ? `${event.impressions} impressions` : event.clicks ? `${event.clicks} clicks` : "N/A",
          time: formattedTime,
          status: "info",
        };
    }
  };

  const activities: Activity[] = wsEvents.map(formatWebSocketEvent);
  const visibleActivities = activities.slice(0, itemsToShow);
  const hasMoreEvents = activities.length > itemsToShow;

  const handleShowMore = () => {
    setItemsToShow((prevItemsToShow) => prevItemsToShow + ITEMS_PER_PAGE);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "commission":
        return <DollarSign className="w-4 h-4 text-green-500" />;
      case "payment":
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case "optimization":
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Pending
          </Badge>
        );
      case "info":
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">
            Info
          </Badge>
        );
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity</p>
      ) : (
        <>
          {visibleActivities.map((activity, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-2.5 border border-border rounded-lg hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm transition-all duration-200 cursor-pointer group"
            >
              <div className="mt-1">{getIcon(activity.type)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{activity.description}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm font-normal text-muted-foreground">{activity.time}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-foreground">{activity.amount}</span>
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              </div>
            </div>
          ))}
          {hasMoreEvents && (
            <div className="text-center pt-2">
              <Button onClick={handleShowMore} variant="ghost" size="sm">
                Show More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}