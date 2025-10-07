"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Settings, Building, Calculator, Bell } from "lucide-react"

export function TaxSettings() {
  const [settings, setSettings] = useState({
    businessName: "John Doe Consulting",
    ein: "12-3456789",
    businessType: "sole-proprietorship",
    taxYear: "2024",
    filingStatus: "single",
    estimatedTaxRate: "25",
    quarterlyReminders: true,
    deadlineAlerts: true,
    autoGenerate1099s: true,
    homeOfficeDeduction: true,
    mileageTracking: false,
  })

  const handleSettingChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Business Information */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-primary" />
            <span>Business Information</span>
          </CardTitle>
          <CardDescription>Update your business details for tax reporting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-name">Business Name</Label>
              <Input
                id="business-name"
                value={settings.businessName}
                onChange={(e) => handleSettingChange("businessName", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ein">EIN (Employer Identification Number)</Label>
              <Input
                id="ein"
                value={settings.ein}
                onChange={(e) => handleSettingChange("ein", e.target.value)}
                placeholder="12-3456789"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="business-type">Business Type</Label>
              <Select
                value={settings.businessType}
                onValueChange={(value) => handleSettingChange("businessType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sole-proprietorship">Sole Proprietorship</SelectItem>
                  <SelectItem value="llc">LLC</SelectItem>
                  <SelectItem value="corporation">Corporation</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="filing-status">Filing Status</Label>
              <Select
                value={settings.filingStatus}
                onValueChange={(value) => handleSettingChange("filingStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married-joint">Married Filing Jointly</SelectItem>
                  <SelectItem value="married-separate">Married Filing Separately</SelectItem>
                  <SelectItem value="head-of-household">Head of Household</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tax Calculations */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-primary" />
            <span>Tax Calculations</span>
          </CardTitle>
          <CardDescription>Configure how taxes are calculated and estimated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tax-year">Tax Year</Label>
              <Select value={settings.taxYear} onValueChange={(value) => handleSettingChange("taxYear", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-rate">Estimated Tax Rate (%)</Label>
              <Input
                id="tax-rate"
                type="number"
                value={settings.estimatedTaxRate}
                onChange={(e) => handleSettingChange("estimatedTaxRate", e.target.value)}
                min="0"
                max="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Automation Settings */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary" />
            <span>Automation Settings</span>
          </CardTitle>
          <CardDescription>Configure automatic features and deductions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-1099s">Auto-generate 1099s</Label>
              <p className="text-sm text-muted-foreground">Automatically create 1099 forms for contractors</p>
            </div>
            <Switch
              id="auto-1099s"
              checked={settings.autoGenerate1099s}
              onCheckedChange={(checked) => handleSettingChange("autoGenerate1099s", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="home-office">Home Office Deduction</Label>
              <p className="text-sm text-muted-foreground">Include home office expenses in deductions</p>
            </div>
            <Switch
              id="home-office"
              checked={settings.homeOfficeDeduction}
              onCheckedChange={(checked) => handleSettingChange("homeOfficeDeduction", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mileage">Mileage Tracking</Label>
              <p className="text-sm text-muted-foreground">Track business mileage for deductions</p>
            </div>
            <Switch
              id="mileage"
              checked={settings.mileageTracking}
              onCheckedChange={(checked) => handleSettingChange("mileageTracking", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-primary" />
            <span>Tax Notifications</span>
          </CardTitle>
          <CardDescription>Configure tax-related alerts and reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quarterly-reminders">Quarterly Payment Reminders</Label>
              <p className="text-sm text-muted-foreground">Get notified before quarterly tax payments are due</p>
            </div>
            <Switch
              id="quarterly-reminders"
              checked={settings.quarterlyReminders}
              onCheckedChange={(checked) => handleSettingChange("quarterlyReminders", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="deadline-alerts">Tax Deadline Alerts</Label>
              <p className="text-sm text-muted-foreground">Receive alerts for important tax deadlines</p>
            </div>
            <Switch
              id="deadline-alerts"
              checked={settings.deadlineAlerts}
              onCheckedChange={(checked) => handleSettingChange("deadlineAlerts", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button size="lg">Save Tax Settings</Button>
      </div>
    </div>
  )
}
