"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Bell, Mail, Smartphone, Shield, Zap, Moon } from "lucide-react"

export function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    commissionAlerts: true,
    paymentAlerts: true,
    performanceAlerts: true,
    systemAlerts: false,
    optimizationSuggestions: true,
    quietHours: true,
    quietStart: "22:00",
    quietEnd: "08:00",
    frequency: "instant",
    highPriorityOnly: false,
    weekendNotifications: true,
    soundEnabled: true,
  })

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const pushSupported = typeof window !== "undefined" && "Notification" in window
  const pushPermission = typeof window !== "undefined" ? Notification.permission : "default"

  const requestPushPermission = async () => {
    if (pushSupported) {
      const permission = await Notification.requestPermission()
      if (permission === "granted") {
        handleSettingChange("pushNotifications", true)
      }
    }
  }

  return (
    <Card className="glass-effect">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-5 h-5 text-primary" />
          <span>Notification Settings</span>
        </CardTitle>
        <CardDescription>Customize how and when you receive notifications</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Delivery Methods */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center space-x-2">
            <Zap className="w-4 h-4 text-primary" />
            <span>Delivery Methods</span>
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="email-notifications" className="text-sm">
                  Email Notifications
                </Label>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <Label htmlFor="push-notifications" className="text-sm">
                    Push Notifications
                  </Label>
                  {!pushSupported && (
                    <span className="text-xs text-muted-foreground">Not supported in this browser</span>
                  )}
                  {pushSupported && pushPermission === "denied" && (
                    <span className="text-xs text-red-500">Permission denied</span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {pushSupported && pushPermission === "default" && (
                  <Button variant="outline" size="sm" onClick={requestPushPermission}>
                    Enable
                  </Button>
                )}
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications && pushPermission === "granted"}
                  onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                  disabled={!pushSupported || pushPermission !== "granted"}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <Label htmlFor="sms-notifications" className="text-sm">
                    SMS Notifications
                  </Label>
                  <span className="text-xs text-muted-foreground">High-priority alerts only</span>
                </div>
              </div>
              <Switch
                id="sms-notifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => handleSettingChange("smsNotifications", checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Notification Types */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm flex items-center space-x-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>Notification Types</span>
          </h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="commission-alerts" className="text-sm">
                  Commission Alerts
                </Label>
                <Badge variant="secondary" className="text-xs">
                  Essential
                </Badge>
              </div>
              <Switch
                id="commission-alerts"
                checked={settings.commissionAlerts}
                onCheckedChange={(checked) => handleSettingChange("commissionAlerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="payment-alerts" className="text-sm">
                  Payment Alerts
                </Label>
                <Badge variant="secondary" className="text-xs">
                  Essential
                </Badge>
              </div>
              <Switch
                id="payment-alerts"
                checked={settings.paymentAlerts}
                onCheckedChange={(checked) => handleSettingChange("paymentAlerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="performance-alerts" className="text-sm">
                Performance Alerts
              </Label>
              <Switch
                id="performance-alerts"
                checked={settings.performanceAlerts}
                onCheckedChange={(checked) => handleSettingChange("performanceAlerts", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="optimization-suggestions" className="text-sm">
                AI Optimization Suggestions
              </Label>
              <Switch
                id="optimization-suggestions"
                checked={settings.optimizationSuggestions}
                onCheckedChange={(checked) => handleSettingChange("optimizationSuggestions", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="system-alerts" className="text-sm">
                System Alerts
              </Label>
              <Switch
                id="system-alerts"
                checked={settings.systemAlerts}
                onCheckedChange={(checked) => handleSettingChange("systemAlerts", checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Advanced Settings</h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="high-priority-only" className="text-sm">
                High Priority Only
              </Label>
              <Switch
                id="high-priority-only"
                checked={settings.highPriorityOnly}
                onCheckedChange={(checked) => handleSettingChange("highPriorityOnly", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="weekend-notifications" className="text-sm">
                Weekend Notifications
              </Label>
              <Switch
                id="weekend-notifications"
                checked={settings.weekendNotifications}
                onCheckedChange={(checked) => handleSettingChange("weekendNotifications", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled" className="text-sm">
                Sound Alerts
              </Label>
              <Switch
                id="sound-enabled"
                checked={settings.soundEnabled}
                onCheckedChange={(checked) => handleSettingChange("soundEnabled", checked)}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Frequency */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm">Frequency</h4>
          <Select value={settings.frequency} onValueChange={(value) => handleSettingChange("frequency", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instant">Instant (Recommended)</SelectItem>
              <SelectItem value="hourly">Hourly Digest</SelectItem>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Summary</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Quiet Hours */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="quiet-hours" className="text-sm">
                Do Not Disturb
              </Label>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.quietHours}
              onCheckedChange={(checked) => handleSettingChange("quietHours", checked)}
            />
          </div>

          {settings.quietHours && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quiet-start" className="text-xs text-muted-foreground">
                  Start Time
                </Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietStart}
                  onChange={(e) => handleSettingChange("quietStart", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end" className="text-xs text-muted-foreground">
                  End Time
                </Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietEnd}
                  onChange={(e) => handleSettingChange("quietEnd", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <Button className="w-full" size="sm">
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}
