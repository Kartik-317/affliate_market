import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  icon: LucideIcon
}

export function MetricCard({ title, value, change, changeType, icon: Icon }: MetricCardProps) {
  const changeColor = {
    positive: "text-green-500",
    negative: "text-red-500",
    neutral: "text-muted-foreground",
  }[changeType]

  const TrendIcon = changeType === "positive" ? TrendingUp : TrendingDown

  return (
    <Card className="glass-effect hover:glass-effect-hover hover:shadow-lg transition-all duration-200 cursor-pointer group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          </div>
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>
        <div className="flex items-center mt-3">
          <TrendIcon className={`w-4 h-4 mr-1 ${changeColor}`} />
          <span className={`text-sm font-medium ${changeColor}`}>{change}</span>
          <span className="text-sm font-normal text-muted-foreground ml-1">from last period</span>
        </div>
      </CardContent>
    </Card>
  )
}
