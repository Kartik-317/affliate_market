import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Eye, ArrowRight } from "lucide-react"
import { AffiliateEvent, ConversionAnalysisProps } from "@/app/analytics/page"

// Utility function to calculate network metrics, dynamically removing hardcoded networks
const calculateNetworkMetrics = (events: AffiliateEvent[]) => {
  const networkMetrics: {
    [key: string]: {
      network: string // Name used for display (e.g., "Amazon Associates")
      impressions: number
      clicks: number
      conversions: number
      revenue: number
      trend: "up" | "down"
    }
  } = {}

  // 1. Process events and dynamically populate networkMetrics
  events.forEach((event) => {
    // Skip invalid events (e.g., those missing a network name)
    if (!event || !event.network || typeof event.network !== 'string') {
        return;
    }
    
    // Create a consistent, lowercase key for each network (e.g., "amazon-associates")
    const networkKey = event.network.toLowerCase().replace(/ /g, '-')

    if (!networkMetrics[networkKey]) {
      networkMetrics[networkKey] = {
        // Use the original network name for better display consistency if the source provides it
        network: event.network,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        trend: "up", // Default trend
      }
    }

    const metrics = networkMetrics[networkKey]

    if (event.event === "impression" && typeof event.impressions === "number") {
      metrics.impressions += event.impressions
    } else if (event.event === "click" && typeof event.clicks === "number") {
      metrics.clicks += event.clicks
    } else if (event.event === "conversion" || event.event === "commission") {
      // Aggregate revenue (handling both commissionAmount and generic amount)
      const amount = event.commissionAmount ?? event.amount
      if (typeof amount === "number") {
        metrics.conversions += 1
        metrics.revenue += amount
      }
    }
  })

  // 2. Calculate trend (simple comparison of recent vs. older data)
  const now = new Date()
  const recentThreshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
  const recentRevenue: { [key: string]: number } = {}
  const olderRevenue: { [key: string]: number } = {}

  events.forEach((event) => {
    if (!event.network || typeof event.network !== 'string') return;
    
    const networkKey = event.network.toLowerCase().replace(/ /g, '-');
    const amount = event.commissionAmount ?? event.amount

    if ((event.event === "conversion" || event.event === "commission") && event.date && typeof amount === "number") {
      const eventDate = new Date(event.date)
      
      if (eventDate.getTime() >= recentThreshold.getTime()) {
        recentRevenue[networkKey] = (recentRevenue[networkKey] || 0) + amount
      } else {
        olderRevenue[networkKey] = (olderRevenue[networkKey] || 0) + amount
      }
    }
  })

  Object.keys(networkMetrics).forEach((networkKey) => {
    const recent = recentRevenue[networkKey] || 0
    const older = olderRevenue[networkKey] || 0
    networkMetrics[networkKey].trend = recent >= older ? "up" : "down"
  })

  // 3. Finalize calculations and return as an array
  return Object.values(networkMetrics).map((metrics) => ({
    ...metrics,
    ctr: metrics.clicks && metrics.impressions ? parseFloat(((metrics.clicks / metrics.impressions) * 100).toFixed(1)) : 0,
    conversionRate: metrics.conversions && metrics.clicks ? parseFloat(((metrics.conversions / metrics.clicks) * 100).toFixed(1)) : 0,
  }))
}

// Utility function to calculate funnel stages (no changes needed)
const calculateFunnelStages = (events: AffiliateEvent[]) => {
  let totalImpressions = 0
  let totalClicks = 0
  let totalConversions = 0
  let totalRevenue = 0

  events.forEach((event) => {
    if (event.event === "impression" && typeof event.impressions === "number") {
      totalImpressions += event.impressions
    } else if (event.event === "click" && typeof event.clicks === "number") {
      totalClicks += event.clicks
    } else if (event.event === "conversion" || event.event === "commission") {
      totalConversions += 1
      const amount = event.commissionAmount ?? event.amount
      if (typeof amount === "number") {
        totalRevenue += amount
      }
    }
  })

  // Calculate Average Commission (Revenue / Conversions), not a dropoff percentage
  const avgCommission = totalConversions > 0 ? parseFloat((totalRevenue / totalConversions).toFixed(2)) : 0;


  return [
    { stage: "Impressions", count: totalImpressions, percentage: 100, isCurrency: false },
    {
      stage: "Clicks",
      count: totalClicks,
      percentage: totalImpressions > 0 ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2)) : 0,
      isCurrency: false
    },
    {
      stage: "Conversions",
      count: totalConversions,
      percentage: totalClicks > 0 ? parseFloat(((totalConversions / totalClicks) * 100).toFixed(2)) : 0,
      isCurrency: false
    },
    {
      stage: "Avg. Commission", // Changed stage name for clarity
      count: avgCommission, // Now holds the average commission amount
      percentage: 0, // Not applicable for average commission
      isCurrency: true,
    },
  ]
}

export function ConversionAnalysis({ events }: ConversionAnalysisProps) {
  const conversionData = calculateNetworkMetrics(events)
  const funnelStages = calculateFunnelStages(events)

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Track your audience journey from impression to conversion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelStages.map((stage, index) => {
              const prevStage = funnelStages[index - 1]
              // Dropoff is calculated from the previous stage's count, unless it's the first stage (Impressions)
              const dropoffRate = prevStage && prevStage.count > 0 && !stage.isCurrency ? 
                parseFloat(((prevStage.count - stage.count) / prevStage.count * 100).toFixed(1)) : 0
              
              const displayDropoff = index > 0 && index < funnelStages.length - 1 && !stage.isCurrency

              return (
                <div key={index}>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <span className="font-bold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{stage.stage}</h4>
                        <p className="text-sm text-muted-foreground">
                          {stage.isCurrency ? "$" : ""}
                          {stage.count.toLocaleString()}
                          {stage.isCurrency ? "" : ` (${stage.percentage.toFixed(2)}%)`}
                        </p>
                      </div>
                    </div>
                    {displayDropoff && (
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            dropoffRate > 50
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          }
                        >
                          {dropoffRate.toFixed(1)}% drop-off
                        </Badge>
                      </div>
                    )}
                  </div>
                  {index < funnelStages.length - 1 && (
                    <div className="flex justify-center my-2">
                      <ArrowRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Network Performance */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Network Conversion Analysis</CardTitle>
          <CardDescription>Compare conversion performance across affiliate networks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionData.length > 0 ? (
              conversionData.map((network, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {network.trend === "up" ? (
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      ) : (
                        <Target className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{network.network}</h4>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{network.impressions.toLocaleString()} impressions</span>
                        <span>•</span>
                        <span>{network.clicks.toLocaleString()} clicks</span>
                        <span>•</span>
                        <span>{network.conversions} conversions</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="font-semibold">{network.ctr}%</p>
                      <p className="text-sm text-muted-foreground">CTR</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{network.conversionRate}%</p>
                      <p className="text-sm text-muted-foreground">Conv Rate</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${network.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      <p className="text-sm text-muted-foreground">Revenue</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No conversion data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
