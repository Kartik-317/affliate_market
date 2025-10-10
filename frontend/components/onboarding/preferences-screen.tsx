"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bell, Mail, Smartphone, Globe, TrendingUp } from "lucide-react"

interface PreferencesScreenProps {
  userData: any
  setUserData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

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

export function PreferencesScreen({ userData, setUserData, onNext, onBack }: PreferencesScreenProps) {
  const [preferences, setPreferences] = useState({
    notifications: {
      email: userData.preferences?.notifications?.email ?? true,
      push: userData.preferences?.notifications?.push ?? false,
    },
    timezone: userData.preferences?.timezone || "",
    currency: userData.preferences?.currency || "",
    phone: userData.preferences?.phone || "",
    monthlyRevenue: userData.preferences?.monthlyRevenue || "",
  })

  const handleNotificationChange = (type: "email" | "push", value: boolean) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [type]: value,
      },
    })
  }

  const handleNext = () => {
    setUserData({
      ...userData,
      preferences,
    })
    onNext()
  }

  const canProceed = preferences.timezone && preferences.currency

  return (
    <div className="ml-80 min-h-screen bg-background">
      <div className="p-8">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Setup Your Preferences</h1>
            <p className="text-lg text-muted-foreground">Customize your experience to match your needs.</p>
          </div>

          <div className="space-y-8">
            {/* Notification Preferences */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Notification Preferences</h2>
                    <p className="text-muted-foreground">Choose how you want to stay updated</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="email-notifications" className="text-base font-medium">
                          Email Notifications
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">Receive updates about your affiliate performance</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={preferences.notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="push-notifications" className="text-base font-medium">
                          Push Notifications
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">Get instant alerts for important events</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={preferences.notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Regional Settings */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Regional Settings</h2>
                    <p className="text-muted-foreground">Configure your timezone and currency</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="timezone" className="text-base font-medium">
                      Default Timezone *
                    </Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency" className="text-base font-medium">
                      Currency Preference *
                    </Label>
                    <Select
                      value={preferences.currency}
                      onValueChange={(value) => setPreferences({ ...preferences, currency: value })}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select your currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency.value} value={currency.value}>
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Contact Information</h2>
                    <p className="text-muted-foreground">Optional contact details for enhanced security</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base font-medium">
                    Phone Number (Optional)
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={preferences.phone}
                    onChange={(e) => setPreferences({ ...preferences, phone: e.target.value })}
                    className="h-12"
                  />
                  <p className="text-sm text-muted-foreground">For SMS alerts and account security</p>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Survey */}
            <Card className="border-2 border-border">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Business Information</h2>
                    <p className="text-muted-foreground">Help us tailor recommendations to your business</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-revenue" className="text-base font-medium">
                    What's your average monthly affiliate revenue? (Optional)
                  </Label>
                  <Select
                    value={preferences.monthlyRevenue}
                    onValueChange={(value) => setPreferences({ ...preferences, monthlyRevenue: value })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select revenue range" />
                    </SelectTrigger>
                    <SelectContent>
                      {revenueRanges.map((range) => (
                        <SelectItem key={range.value} value={range.value}>
                          {range.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    This helps us provide better recommendations and features tailored to your business size
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between pt-8 border-t border-border">
              <Button variant="outline" onClick={onBack} size="lg">
                Back
              </Button>
              <Button onClick={handleNext} disabled={!canProceed} size="lg" className="bg-primary hover:bg-primary/90">
                Next: Review & Finish
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
