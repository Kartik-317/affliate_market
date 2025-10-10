"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { CheckCircle, ArrowRight, BarChart3, Settings, Users, Zap } from "lucide-react"

interface CompletionScreenProps {
  userData: any
}

export function CompletionScreen({ userData }: CompletionScreenProps) {
  const handleGoToDashboard = () => {
    // In a real app, this would redirect to the dashboard
    window.location.href = "/dashboard"
  }

  const features = [
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track your affiliate performance across all networks in real-time",
    },
    {
      icon: Zap,
      title: "Smart Optimization",
      description: "Get AI-powered recommendations to maximize your earnings",
    },
    {
      icon: Users,
      title: "Network Management",
      description: "Manage all your affiliate relationships from one central hub",
    },
    {
      icon: Settings,
      title: "Advanced Tools",
      description: "Access powerful tools for link management and campaign tracking",
    },
  ]

  return (
    <div className="pt-20">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-balance">Welcome to AffiliateHub!</h1>
            <p className="text-lg text-muted-foreground text-balance">
              Your account has been successfully set up. You're ready to start optimizing your affiliate business.
            </p>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">
                {userData.connectedAccounts?.length || 0} affiliate accounts connected
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Features Preview */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">What you can do now:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <feature.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Next Steps:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <span className="text-sm">Check your email for onboarding tips and best practices</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <span className="text-sm">Explore your dashboard and set up your first campaign</span>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <span className="text-sm">Join our community for tips and networking opportunities</span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center pt-4">
            <Button onClick={handleGoToDashboard} size="lg" className="px-8">
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              You can always change your settings later in your account preferences
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
