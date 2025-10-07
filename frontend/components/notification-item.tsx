import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  MoreHorizontal,
  Eye,
  EyeOff,
} from "lucide-react"

interface Notification {
  id: string
  type: "commission" | "payment" | "alert" | "system" | "optimization"
  title: string
  description: string
  amount?: string
  time: string
  read: boolean
  priority: "high" | "medium" | "low"
  network: string
}

interface NotificationItemProps {
  notification: Notification
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "commission":
        return <DollarSign className="w-5 h-5 text-green-500" />
      case "payment":
        return <CheckCircle className="w-5 h-5 text-blue-500" />
      case "alert":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "optimization":
        return <TrendingUp className="w-5 h-5 text-purple-500" />
      case "system":
        return <Settings className="w-5 h-5 text-gray-500" />
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            Low
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div
      className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors hover:border-primary/50 ${
        !notification.read ? "border-primary/30 bg-primary/5" : "border-border"
      }`}
    >
      <div className="mt-1">{getIcon(notification.type)}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className={`font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                {notification.title}
              </h4>
              {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.description}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="text-muted-foreground">{notification.time}</span>
              <Badge variant="outline" className="text-xs">
                {notification.network}
              </Badge>
              {getPriorityBadge(notification.priority)}
              {notification.amount && <span className="font-semibold text-green-500">{notification.amount}</span>}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <Button variant="ghost" size="sm">
              {notification.read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
