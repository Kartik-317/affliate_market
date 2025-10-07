import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, DollarSign, Target, Zap, Users } from "lucide-react"

interface AnalyticsData {
  totalRevenue: number
  conversionRate: number
  averageCommission: number
  topPerformingCampaigns: number
  revenueGrowth: number
  clickThroughRate: number
  customerLifetimeValue: number
  returnOnAdSpend: number
}

interface PerformanceMetricsProps {
  data: AnalyticsData
  timeRange: string
}

export function PerformanceMetrics({ data, timeRange }: PerformanceMetricsProps) {
  const metrics = [
    {
      title: "Total Revenue",
      value: `$${data.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      change: `+${data.revenueGrowth}%`,
      changeType: "positive" as const,
      icon: DollarSign,
    },
    {
      title: "Conversion Rate",
      value: `${data.conversionRate.toFixed(1)}%`,
      change: "+0.4%",
      changeType: "positive" as const,
      icon: Target,
    },
    {
      title: "Avg Commission",
      value: `$${data.averageCommission.toFixed(2)}`,
      change: "+12.3%",
      changeType: "positive" as const,
      icon: Zap,
    },
    {
      title: "Click-Through Rate",
      value: `${data.clickThroughRate.toFixed(1)}%`,
      change: "-0.2%",
      changeType: "negative" as const,
      icon: Users,
    },
    {
      title: "Customer LTV",
      value: `$${data.customerLifetimeValue.toFixed(2)}`,
      change: "+8.7%",
      changeType: "positive" as const,
      icon: TrendingUp,
    },
    {
      title: "Return on Ad Spend",
      value: `${data.returnOnAdSpend.toFixed(1)}x`,
      change: "+15.2%",
      changeType: "positive" as const,
      icon: Target,
    },
  ]

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric, index) => {
        const changeColor = {
          positive: "text-green-600 dark:text-green-400",
          negative: "text-red-600 dark:text-red-400",
          neutral: "text-gray-500 dark:text-gray-400",
        }[metric.changeType]

        const TrendIcon = metric.changeType === "positive" ? TrendingUp : TrendingDown

        return (
          <Card
            key={index}
            className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="flex items-center justify-center mb-2">
                <metric.icon className="w-6 h-6 text-primary mr-2" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{metric.title}</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</p>
              <div className="flex items-center justify-center">
                <TrendIcon className={`w-4 h-4 mr-1 ${changeColor}`} />
                <span className={`text-sm font-semibold ${changeColor}`}>{metric.change}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">vs last {timeRange}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}