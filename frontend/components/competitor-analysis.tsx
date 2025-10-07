import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Eye, Target, Users, Zap } from "lucide-react"

export function CompetitorAnalysis() {
  const competitors = [
    {
      name: "TechDeals Pro",
      niche: "Electronics",
      estimatedRevenue: 185000,
      marketShare: 12.3,
      trend: "up",
      strengths: ["High-converting landing pages", "Strong social media presence"],
      weaknesses: ["Limited product range", "Poor mobile experience"],
      opportunities: ["Expand to home automation", "Improve SEO"],
    },
    {
      name: "Gadget Guru",
      niche: "Consumer Electronics",
      estimatedRevenue: 142000,
      marketShare: 9.8,
      trend: "down",
      strengths: ["Excellent video content", "Strong brand recognition"],
      weaknesses: ["Outdated website design", "Slow page load times"],
      opportunities: ["Mobile optimization", "Email marketing"],
    },
    {
      name: "Smart Shopper",
      niche: "General Retail",
      estimatedRevenue: 98000,
      marketShare: 6.7,
      trend: "up",
      strengths: ["Diverse product portfolio", "Good customer reviews"],
      weaknesses: ["Low conversion rates", "Weak content strategy"],
      opportunities: ["Content marketing", "Influencer partnerships"],
    },
  ]

  const marketInsights = [
    {
      metric: "Average Commission Rate",
      value: "4.2%",
      trend: "up",
      change: "+0.3%",
      description: "Industry average has increased",
    },
    {
      metric: "Market Growth Rate",
      value: "15.8%",
      trend: "up",
      change: "+2.1%",
      description: "Year-over-year growth",
    },
    {
      metric: "Customer Acquisition Cost",
      value: "$23.50",
      trend: "down",
      change: "-$1.20",
      description: "Decreased due to better targeting",
    },
    {
      metric: "Average Order Value",
      value: "$127.80",
      trend: "up",
      change: "+$8.40",
      description: "Consumers spending more per purchase",
    },
  ]

  const opportunities = [
    {
      title: "Untapped Keywords",
      description: "15 high-volume keywords with low competition",
      impact: "High",
      effort: "Medium",
      icon: Target,
    },
    {
      title: "Emerging Niches",
      description: "Smart home and IoT products showing 40% growth",
      impact: "High",
      effort: "High",
      icon: Zap,
    },
    {
      title: "Content Gaps",
      description: "Competitors lack comprehensive buying guides",
      impact: "Medium",
      effort: "Low",
      icon: Users,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Market Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marketInsights.map((insight, index) => (
          <Card key={index} className="glass-effect">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{insight.metric}</p>
                  <p className="text-2xl font-bold">{insight.value}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  {insight.trend === "up" ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  )}
                </div>
              </div>
              <div className="flex items-center mt-4">
                {insight.trend === "up" ? (
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 mr-1 text-red-500" />
                )}
                <span className={`text-sm font-medium ${insight.trend === "up" ? "text-green-500" : "text-red-500"}`}>
                  {insight.change}
                </span>
                <span className="text-sm text-muted-foreground ml-1">vs last quarter</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Competitor Analysis */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Competitor Analysis</CardTitle>
          <CardDescription>Track your main competitors and identify opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {competitors.map((competitor, index) => (
              <div
                key={index}
                className="p-6 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {competitor.trend === "up" ? (
                        <TrendingUp className="w-6 h-6 text-green-500" />
                      ) : (
                        <TrendingDown className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{competitor.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>{competitor.niche}</span>
                        <span>•</span>
                        <span>${competitor.estimatedRevenue.toLocaleString()} est. revenue</span>
                        <span>•</span>
                        <span>{competitor.marketShare}% market share</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-green-500">Strengths</h4>
                    <ul className="space-y-1 text-sm">
                      {competitor.strengths.map((strength, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-red-500">Weaknesses</h4>
                    <ul className="space-y-1 text-sm">
                      {competitor.weaknesses.map((weakness, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          <span>{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm mb-2 text-blue-500">Opportunities</h4>
                    <ul className="space-y-1 text-sm">
                      {competitor.opportunities.map((opportunity, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                          <span>{opportunity}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Market Opportunities */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Market Opportunities</CardTitle>
          <CardDescription>Identified gaps and growth opportunities in your market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {opportunities.map((opportunity, index) => (
              <div
                key={index}
                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <opportunity.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{opportunity.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{opportunity.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="secondary"
                      className={
                        opportunity.impact === "High"
                          ? "bg-green-500/10 text-green-500 border-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      }
                    >
                      {opportunity.impact} Impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {opportunity.effort} Effort
                    </Badge>
                  </div>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    Explore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
