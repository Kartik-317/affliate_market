import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownLeft, Clock, XCircle } from "lucide-react"

interface AffiliateEvent {
  event: string;
  network: string;
  amount?: number;
  orderId?: string;
  date?: string;
  campaign?: string;
  clicks?: number;
  payoutDate?: string;
  status?: string;
  read?: boolean;
  _id?: string;
  paymentMethodId?: string;
}

interface PaymentHistoryProps {
  events: AffiliateEvent[];
  limit?: number;
  searchQuery?: string;
  filter?: string;
}

export function PaymentHistory({ events, limit, searchQuery = "", filter = "all" }: PaymentHistoryProps) {
  // Payment methods for mapping paymentMethodId
  const paymentMethods = [
    {
      id: "1",
      type: "bank",
      name: "Chase Bank",
      details: "****1234",
      methodDisplay: "Bank Transfer",
    },
    {
      id: "2",
      type: "paypal",
      name: "PayPal",
      details: "john@example.com",
      methodDisplay: "PayPal",
    },
    {
      id: "3",
      type: "crypto",
      name: "Bitcoin Wallet",
      details: "bc1q...xyz123",
      methodDisplay: "Bitcoin",
    },
    {
      id: "4",
      type: "mobile",
      name: "Venmo",
      details: "@johnsmith",
      methodDisplay: "Venmo",
    },
  ]

  // Filter and search transactions
  const filteredTransactions = events
    .filter((event) => {
      // Only include commission and payout events
      if (event.event !== "commission" && event.event !== "payout") return false;
      if (filter === "all") return true;
      if (filter === "earnings" && event.event === "commission") return true;
      if (filter === "withdrawals" && event.event === "payout") return true;
      return false;
    })
    .filter((event) =>
      event.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.network.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.campaign?.toLowerCase().includes(searchQuery.toLowerCase())
    )

  // Limit the number of transactions if specified
  const displayTransactions = limit ? filteredTransactions.slice(0, limit) : filteredTransactions

  const getIcon = (eventType: string, status: string | undefined) => {
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />
    if (status === "Pending") return <Clock className="w-4 h-4 text-yellow-500" />

    return eventType === "commission" ? (
      <ArrowDownLeft className="w-4 h-4 text-green-500" />
    ) : (
      <ArrowUpRight className="w-4 h-4 text-blue-500" />
    )
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case "Completed":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            Completed
          </Badge>
        )
      case "Pending":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Pending
          </Badge>
        )
      case "failed":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
            Failed
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getDescription = (event: AffiliateEvent) => {
    if (event.event === "commission") {
      return `Commission from ${event.network}${event.campaign ? ` - ${event.campaign}` : ""}`;
    } else if (event.event === "payout") {
      const method = paymentMethods.find((m) => m.id === event.paymentMethodId);
      return `Withdrawal to ${method ? method.name : "Unknown Method"}`;
    }
    return event.event;
  }

  const getMethodDisplay = (event: AffiliateEvent) => {
    if (event.event === "payout") {
      const method = paymentMethods.find((m) => m.id === event.paymentMethodId);
      return method ? method.methodDisplay : "Unknown";
    }
    return "Direct Deposit";
  }

  return (
    <div className="space-y-4">
      {displayTransactions.map((event) => (
        <div
          key={event._id || `${event.event}-${event.date}`}
          className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-10 h-10 bg-muted rounded-full">
              {getIcon(event.event, event.status)}
            </div>
            <div>
              <h4 className="font-semibold">{getDescription(event)}</h4>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <span>{event.date ? new Date(event.date).toLocaleDateString("en-US") : "N/A"}</span>
                <span>•</span>
                <span>{getMethodDisplay(event)}</span>
                <span>•</span>
                <Badge variant="outline" className="text-xs">
                  {event.network}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p
                className={`font-semibold ${
                  event.event === "commission" ? "text-green-500" : event.status === "failed" ? "text-red-500" : ""
                }`}
              >
                {event.amount !== undefined ? (event.event === "commission" ? "+" : "-") : ""}$
                {event.amount !== undefined ? Math.abs(event.amount).toLocaleString() : "0.00"}
              </p>
            </div>
            {getStatusBadge(event.status)}
          </div>
        </div>
      ))}
    </div>
  )
}