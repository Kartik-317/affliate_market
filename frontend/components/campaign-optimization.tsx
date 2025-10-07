import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, Target, Users, ArrowRight, CheckCircle } from "lucide-react"

interface OptimizationSuggestion {
  id: string
  type: "campaign" | "keyword" | "audience" | "creative"
  title: string
  description: string
  impact: "high" | "medium" | "low"
  estimatedRevenue: number
  effort: "high" | "medium" | "low"
}

interface CampaignOptimizationProps {
  suggestions: OptimizationSuggestion[]
}

export function CampaignOptimization({ suggestions }: CampaignOptimizationProps) {
  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "high":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            High Impact
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Medium Impact
          </Badge>
        )
      case "low":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            Low Impact
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getEffortBadge = (effort: string) => {
    switch (effort) {
      case "low":
        return (
          <Badge variant="outline" className="border-green-500/20 text-green-500">
            Low Effort
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="border-yellow-500/20 text-yellow-500">
            Medium Effort
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="border-red-500/20 text-red-500">
            High Effort
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "campaign":
        return <TrendingUp className="w-5 h-5 text-blue-500" />
      case "keyword":
        return <Target className="w-5 h-5 text-purple-500" />
      case "audience":
        return <Users className="w-5 h-5 text-green-500" />
      case "creative":
        return <Lightbulb className="w-5 h-5 text-orange-500" />
      default:
        return <Lightbulb className="w-5 h-5 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Optimization Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Suggestions</p>
                <p className="text-2xl font-bold">{suggestions.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-primary/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Potential Revenue</p>
                <p className="text-2xl font-bold">
                  ${suggestions.reduce((sum, s) => sum + s.estimatedRevenue, 0).toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-effect">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Impact</p>
                <p className="text-2xl font-bold">{suggestions.filter((s) => s.impact === "high").length}</p>
              </div>
              <Target className="w-8 h-8 text-red-500/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions to maximize your affiliate revenue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {suggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-6 border rounded-lg transition-colors hover:border-primary/50 ${
                  suggestion.impact === "high" ? "border-green-500/30 bg-green-500/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      {getTypeIcon(suggestion.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{suggestion.title}</h4>
                        {getImpactBadge(suggestion.impact)}
                        {getEffortBadge(suggestion.effort)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-green-500 font-medium">
                          +${suggestion.estimatedRevenue.toLocaleString()} potential revenue
                        </span>
                        <Badge variant="outline" className="text-xs capitalize">
                          {suggestion.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4" />
                    <span>Ready to implement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      Learn More
                    </Button>
                    <Button size="sm">
                      Apply Suggestion
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Wins */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-lg">Quick Wins</CardTitle>
          <CardDescription>Low-effort, high-impact optimizations you can implement today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {suggestions
              .filter((s) => s.effort === "low" && s.impact === "high")
              .map((suggestion) => (
                <div key={suggestion.id} className="p-4 border border-green-500/20 bg-green-500/5 rounded-lg">
                  <div className="flex items-center space-x-3 mb-2">
                    {getTypeIcon(suggestion.type)}
                    <h4 className="font-semibold text-sm">{suggestion.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-500">
                      +${suggestion.estimatedRevenue.toLocaleString()}
                    </span>
                    <Button size="sm">Apply Now</Button>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}