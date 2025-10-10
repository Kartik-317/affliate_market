"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  Edit,
  Shield,
  Clock,
  Mail,
  Bell,
  Globe,
  Smartphone,
  TrendingUp,
  ArrowRight,
  ShoppingCart,
  Link2,
  Zap,
  Briefcase,
  Target,
  DollarSign,
} from "lucide-react"

interface ReviewScreenProps {
  userData: any
  onBack: () => void
  onComplete: () => void
}

const affiliateNetworks = [
  { id: "amazon", name: "Amazon Associates", icon: ShoppingCart },
  { id: "cj", name: "Commission Junction", icon: Link2 },
  { id: "impact", name: "Impact", icon: Zap },
  { id: "shareasale", name: "ShareASale", icon: Briefcase },
  { id: "rakuten", name: "Rakuten Advertising", icon: Target },
  { id: "clickbank", name: "ClickBank", icon: DollarSign },
]

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
]

const currencies = [
  { value: "USD", label: "US Dollar (USD)" },
  { value: "EUR", label: "Euro (EUR)" },
  { value: "GBP", label: "British Pound (GBP)" },
  { value: "CAD", label: "Canadian Dollar (CAD)" },
  { value: "AUD", label: "Australian Dollar (AUD)" },
  { value: "JPY", label: "Japanese Yen (JPY)" },
  { value: "CHF", label: "Swiss Franc (CHF)" },
  { value: "CNY", label: "Chinese Yuan (CNY)" },
]

const revenueRanges = [
  { value: "0-1000", label: "$0 - $1,000" },
  { value: "1000-5000", label: "$1,000 - $5,000" },
  { value: "5000-10000", label: "$5,000 - $10,000" },
  { value: "10000-25000", label: "$10,000 - $25,000" },
  { value: "25000-50000", label: "$25,000 - $50,000" },
  { value: "50000+", label: "$50,000+" },
]

export function ReviewScreen({ userData, onBack, onComplete }: ReviewScreenProps) {
  const getConnectedNetworks = () => {
    return userData.connectedAccounts
      ?.filter((id: string) => id !== "csv-upload")
      .map((id: string) => affiliateNetworks.find((network) => network.id === id))
      .filter(Boolean)
  }

  const hasCSVUpload = userData.connectedAccounts?.includes("csv-upload")

  const getTimezoneLabel = (value: string) => {
    return timezones.find((tz) => tz.value === value)?.label || value
  }

  const getCurrencyLabel = (value: string) => {
    return currencies.find((curr) => curr.value === value)?.label || value
  }

  const getRevenueLabel = (value: string) => {
    return revenueRanges.find((range) => range.value === value)?.label || value
  }

  return (
    <div className="ml-80 min-h-screen bg-background">
      <div className="p-8">
        <div className="max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mx-auto w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-accent" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Review & Finish</h1>
            <p className="text-lg text-muted-foreground">
              Review your setup and complete your onboarding to start managing your affiliate programs.
            </p>
          </div>

          <div className="space-y-8">
            {/* Account Summary */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Account Information</h2>
                  <Button variant="ghost" size="sm" onClick={onBack} className="text-primary hover:text-primary/80">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="bg-muted/30 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium text-lg">{userData.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connected Accounts */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Connected Accounts</h2>
                  <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                    {userData.connectedAccounts?.length || 0} connected
                  </Badge>
                </div>

                <div className="space-y-4">
                  {getConnectedNetworks()?.map((network: any) => {
                    const IconComponent = network.icon
                    return (
                      <div key={network.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <span className="font-medium text-base">{network.name}</span>
                        </div>
                        <Badge variant="secondary" className="bg-accent/20 text-accent-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Connected
                        </Badge>
                      </div>
                    )
                  })}

                  {hasCSVUpload && (
                    <div className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium text-base">CSV Data Upload</span>
                      </div>
                      <Badge variant="secondary" className="bg-primary/20 text-primary-foreground">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Uploaded
                      </Badge>
                    </div>
                  )}

                  {(!userData.connectedAccounts || userData.connectedAccounts.length === 0) && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No accounts connected yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Preferences Summary */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-6">Your Preferences</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Notifications */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Bell className="h-5 w-5 text-primary" />
                      <span className="font-medium text-base">Notifications</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>Email notifications</span>
                        <Badge variant={userData.preferences?.notifications?.email ? "default" : "secondary"}>
                          {userData.preferences?.notifications?.email ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Push notifications</span>
                        <Badge variant={userData.preferences?.notifications?.push ? "default" : "secondary"}>
                          {userData.preferences?.notifications?.push ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Regional Settings */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <Globe className="h-5 w-5 text-primary" />
                      <span className="font-medium text-base">Regional Settings</span>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Timezone:</span>
                        <p className="font-medium">{getTimezoneLabel(userData.preferences?.timezone)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Currency:</span>
                        <p className="font-medium">{getCurrencyLabel(userData.preferences?.currency)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  {userData.preferences?.phone && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Smartphone className="h-5 w-5 text-primary" />
                        <span className="font-medium text-base">Contact Information</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">{userData.preferences.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Revenue Info */}
                  {userData.preferences?.monthlyRevenue && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        <span className="font-medium text-base">Business Information</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Monthly Revenue:</span>
                        <p className="font-medium">{getRevenueLabel(userData.preferences.monthlyRevenue)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Security & Privacy */}
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Security & Privacy</h2>
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-primary mt-1" />
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Your data is secure</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• All connections use secure OAuth protocols</li>
                      <li>• We never store your affiliate network passwords</li>
                      <li>• Your data is encrypted both in transit and at rest</li>
                      <li>• We comply with SOC 2 and GDPR standards</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card className="border-2 border-accent/20 bg-accent/5">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">What's Next?</h2>
                <div className="flex items-start space-x-4">
                  <Clock className="h-6 w-6 text-accent mt-1" />
                  <div className="space-y-3">
                    <h3 className="font-medium text-foreground">Get ready to optimize your affiliate business</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li>• Access your personalized dashboard with performance insights</li>
                      <li>• Receive onboarding emails with tips and best practices</li>
                      <li>• Start tracking your affiliate performance across all networks</li>
                      <li>• Get recommendations to optimize your earnings</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-8 border-t border-border">
              <Button variant="outline" onClick={onBack} size="lg">
                Back
              </Button>
              <Button onClick={onComplete} size="lg" className="px-8 bg-primary hover:bg-primary/90">
                Complete Setup
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
