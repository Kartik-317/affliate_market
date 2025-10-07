"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, ArrowRight, ArrowLeft, Check, Upload, Bell, Eye, EyeOff, Shield, Users, Lock, Mail, Smartphone, Globe, TrendingUp, ShoppingCart, Link2, Zap, Briefcase, Target, DollarSign } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import type { LucideIcon } from "lucide-react"

interface UserData {
  email: string
  password: string
  connectedAccounts: { id: string; name: string; apiKey?: string; affiliateId?: string; fileName?: string; wsConnected?: boolean }[]
  preferences: {
    notifications: { email: boolean; push: boolean }
    timezone: string
    currency: string
    phone: string
    monthlyRevenue: string
  }
}

interface AffiliateNetwork {
  id: string
  name: string
  icon: LucideIcon
}

const affiliateNetworks: AffiliateNetwork[] = [
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

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    email: "",
    password: "",
    connectedAccounts: [],
    preferences: {
      notifications: { email: true, push: false },
      timezone: "",
      currency: "",
      phone: "",
      monthlyRevenue: "",
    },
  })
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<AffiliateNetwork | null>(null)
  const [apiKey, setApiKey] = useState("")
  const [affiliateId, setAffiliateId] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalSteps = 4

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      let isValid = true
      if (!validateEmail(userData.email)) {
        setEmailError("Please enter a valid email address")
        isValid = false
      } else {
        setEmailError("")
      }
      if (!validatePassword(userData.password)) {
        setPasswordError("Password must be at least 8 characters long")
        isValid = false
      } else {
        setPasswordError("")
      }
      if (!isValid) return
    }

    if (currentStep === 3) {
      if (!userData.preferences.timezone || !userData.preferences.currency) {
        return
      }
    }

    if (currentStep < totalSteps) {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setCurrentStep(currentStep + 1)
      setIsLoading(false)
    } else {
      console.log("Onboarding completed:", userData)
      sessionStorage.setItem("userData", JSON.stringify(userData))
      window.location.href = "/dashboard"
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConnectNetwork = (network: AffiliateNetwork) => {
    setSelectedNetwork(network)
    setApiKey("")
    setAffiliateId("")
    setDialogOpen(true)
  }

  const handleSaveNetwork = () => {
    if (selectedNetwork && apiKey) {
      const newAccount = {
        id: selectedNetwork.id,
        name: selectedNetwork.name,
        apiKey,
        affiliateId,
        wsConnected: selectedNetwork.id === "amazon"
      }
      setUserData({
        ...userData,
        connectedAccounts: [
          ...userData.connectedAccounts.filter((acc) => acc.id !== selectedNetwork.id),
          newAccount,
        ],
      })
      setDialogOpen(false)
      setSelectedNetwork(null)
      setApiKey("")
      setAffiliateId("")
    }
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "text/csv") {
      setUserData({
        ...userData,
        connectedAccounts: [
          ...userData.connectedAccounts.filter((acc) => acc.id !== "csv-upload"),
          { id: "csv-upload", name: "CSV Upload", fileName: file.name },
        ],
      })
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCsvClick = () => {
    fileInputRef.current?.click()
  }

  const getTimezoneLabel = (value: string) => {
    return timezones.find((tz) => tz.value === value)?.label || value
  }

  const getCurrencyLabel = (value: string) => {
    return currencies.find((curr) => curr.value === value)?.label || value
  }

  const getRevenueLabel = (value: string) => {
    return revenueRanges.find((range) => range.value === value)?.label || value
  }

  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">Affiliate Command Center</span>
          </div>
          <Badge variant="secondary">
            Setup Progress: Step {currentStep} of {totalSteps}
          </Badge>
          <Progress value={progressPercentage} className="mt-4 max-w-md mx-auto" />
        </div>

        <Card className="glass-effect">
          {currentStep === 1 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                  <Users className="w-6 h-6 text-primary" />
                  <span>Create Your Account</span>
                </CardTitle>
                <CardDescription>Manage all your affiliate programs from one dashboard.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Button variant="outline" className="w-full h-12 text-base bg-transparent" type="button">
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continue with Google
                  </Button>
                  <Button variant="outline" className="w-full h-12 text-base bg-transparent" type="button">
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    Continue with LinkedIn
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      className={emailError ? "border-destructive" : ""}
                    />
                    {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={userData.password}
                        onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                        className={passwordError ? "border-destructive" : ""}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                    {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
                    <p className="text-xs text-muted-foreground">Password must be at least 8 characters long</p>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                  <Upload className="w-6 h-6 text-primary" />
                  <span>Connect Your Networks</span>
                </CardTitle>
                <CardDescription>Add your affiliate networks to start tracking everything in one place</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <div className="grid grid-cols-3 gap-4 w-full px-4">
                  {affiliateNetworks.map((network) => (
                    <Card
                      key={network.id}
                      className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer h-32 flex items-center justify-center"
                      onClick={() => handleConnectNetwork(network)}
                    >
                      <CardContent className="flex flex-col items-center justify-center space-y-2 p-0 w-full h-full">
                        <div className="flex items-center justify-center w-16 h-16">
                          {network.id === "amazon" && (
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Amazon" className="w-full h-full object-contain" />
                          )}
                          {network.id === "cj" && (
                            <img src="https://www.cj.com/assets/images/cj-logo.png" alt="Commission Junction" className="w-full h-full object-contain" />
                          )}
                          {network.id === "impact" && (
                            <img src="https://www.impact.com/etc.clientlibs/impact/clientlibs/clientlib-site/resources/images/impact-logo-blue.png" alt="Impact" className="w-full h-full object-contain" />
                          )}
                          {network.id === "shareasale" && (
                            <img src="https://www.shareasale.com/images/logo.png" alt="ShareASale" className="w-full h-full object-contain" />
                          )}
                          {network.id === "rakuten" && (
                            <img src="https://www.rakutenadvertising.com/hs-fs/hubfs/Rakuten_Advertising_Logo_Black.png" alt="Rakuten" className="w-full h-full object-contain" />
                          )}
                          {network.id === "clickbank" && (
                            <img src="https://www.clickbank.com/wp-content/uploads/2020/04/clickbank-logo.png" alt="ClickBank" className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="text-center">
                          <h4 className="font-semibold text-sm">{network.name}</h4>
                          <p className="text-xs text-muted-foreground">Automatic sync with real-time data</p>
                        </div>
                        <Switch
                          checked={userData.connectedAccounts.some(acc => acc.id === network.id)}
                          onCheckedChange={(checked) => {
                            if (checked) handleConnectNetwork(network);
                          }}
                          className="mt-2"
                        />
                      </CardContent>
                    </Card>
                  ))}
                  <Card
                    className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer h-32 flex items-center justify-center"
                    onClick={handleCsvClick}
                  >
                    <CardContent className="flex flex-col items-center justify-center space-y-2 p-0 w-full h-full">
                      <div className="flex items-center justify-center w-16 h-16">
                        <Upload className="h-10 w-10 text-primary" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-semibold text-sm">CSV Upload</h4>
                        <p className="text-xs text-muted-foreground">Import existing data manually</p>
                      </div>
                      <Switch
                        checked={userData.connectedAccounts.some(acc => acc.id === "csv-upload")}
                        onCheckedChange={(checked) => {
                          if (checked) handleCsvClick();
                        }}
                        className="mt-2"
                      />
                    </CardContent>
                  </Card>
                  <input
                    type="file"
                    accept=".csv"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleCsvUpload}
                  />
                </div>
              </CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Connect {selectedNetwork?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">API Key *</Label>
                      <Input
                        id="api-key"
                        placeholder="Enter your API key"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="affiliate-id">Affiliate ID (Optional)</Label>
                      <Input
                        id="affiliate-id"
                        placeholder="Enter your affiliate ID"
                        value={affiliateId}
                        onChange={(e) => setAffiliateId(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveNetwork} disabled={!apiKey}>
                      Connect
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          {currentStep === 3 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                  <Bell className="w-6 h-6 text-primary" />
                  <span>Notification Preferences</span>
                </CardTitle>
                <CardDescription>Choose how and when you want to be notified about important events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">Receive updates about your affiliate performance</p>
                    </div>
                    <Switch
                      checked={userData.preferences.notifications.email}
                      onCheckedChange={(checked) =>
                        setUserData({
                          ...userData,
                          preferences: {
                            ...userData.preferences,
                            notifications: { ...userData.preferences.notifications, email: checked },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">Get instant alerts for important events</p>
                    </div>
                    <Switch
                      checked={userData.preferences.notifications.push}
                      onCheckedChange={(checked) =>
                        setUserData({
                          ...userData,
                          preferences: {
                            ...userData.preferences,
                            notifications: { ...userData.preferences.notifications, push: checked },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Default Timezone *</Label>
                    <Select
                      value={userData.preferences.timezone}
                      onValueChange={(value) =>
                        setUserData({ ...userData, preferences: { ...userData.preferences, timezone: value } })
                      }
                    >
                      <SelectTrigger>
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
                    <Label htmlFor="currency">Currency Preference *</Label>
                    <Select
                      value={userData.preferences.currency}
                      onValueChange={(value) =>
                        setUserData({ ...userData, preferences: { ...userData.preferences, currency: value } })
                      }
                    >
                      <SelectTrigger>
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
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={userData.preferences.phone}
                      onChange={(e) =>
                        setUserData({ ...userData, preferences: { ...userData.preferences, phone: e.target.value } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthly-revenue">Average Monthly Revenue (Optional)</Label>
                    <Select
                      value={userData.preferences.monthlyRevenue}
                      onValueChange={(value) =>
                        setUserData({ ...userData, preferences: { ...userData.preferences, monthlyRevenue: value } })
                      }
                    >
                      <SelectTrigger>
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
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 4 && (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                  <Check className="w-6 h-6 text-primary" />
                  <span>Review & Finish</span>
                </CardTitle>
                <CardDescription>
                  Review your setup and complete your onboarding to start managing your affiliate programs.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-8">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span className="font-medium text-lg">{userData.email}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Connected Accounts</h3>
                      <Badge variant="secondary">{userData.connectedAccounts.length} connected</Badge>
                    </div>
                    {userData.connectedAccounts.map((acc) => {
                      const network = affiliateNetworks.find(n => n.id === acc.id)
                      return (
                        <div key={acc.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            {network ? (
                              <network.icon className="h-5 w-5 text-primary" />
                            ) : (
                              <Upload className="h-5 w-5 text-primary" />
                            )}
                            <div>
                              <span className="font-medium text-base">{acc.name}</span>
                              {acc.fileName && (
                                <p className="text-sm text-muted-foreground">File: {acc.fileName}</p>
                              )}
                              {acc.wsConnected && (
                                <p className="text-sm text-green-500">Real-time updates enabled</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="default">
                            <Check className="h-3 w-3 mr-1" />
                            {acc.fileName ? "Uploaded" : "Connected"}
                          </Badge>
                        </div>
                      )
                    })}
                    {userData.connectedAccounts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No accounts connected yet</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-semibold">Your Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Bell className="h-5 w-5 text-primary" />
                          <span className="font-medium">Notifications</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span>Email notifications</span>
                            <Badge variant={userData.preferences.notifications.email ? "default" : "secondary"}>
                              {userData.preferences.notifications.email ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Push notifications</span>
                            <Badge variant={userData.preferences.notifications.push ? "default" : "secondary"}>
                              {userData.preferences.push ? "Enabled" : "Disabled"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Globe className="h-5 w-5 text-primary" />
                          <span className="font-medium">Regional Settings</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Timezone:</span>
                            <p className="font-medium">{getTimezoneLabel(userData.preferences.timezone)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Currency:</span>
                            <p className="font-medium">{getCurrencyLabel(userData.preferences.currency)}</p>
                          </div>
                        </div>
                      </div>
                      {userData.preferences.phone && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Smartphone className="h-5 w-5 text-primary" />
                            <span className="font-medium">Contact Information</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Phone:</span>
                            <p className="font-medium">{userData.preferences.phone}</p>
                          </div>
                        </div>
                      )}
                      {userData.preferences.monthlyRevenue && (
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            <span className="font-medium">Business Information</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Monthly Revenue:</span>
                            <p className="font-medium">{getRevenueLabel(userData.preferences.monthlyRevenue)}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <div className="flex items-start space-x-4">
                      <Shield className="h-6 w-6 text-primary mt-1" />
                      <div className="space-y-3">
                        <h4 className="font-medium">Your data is secure</h4>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li>• All connections use secure OAuth protocols</li>
                          <li>• We never store your affiliate network passwords</li>
                          <li>• Your data is encrypted both in transit and at rest</li>
                          <li>• We comply with SOC 2 and GDPR standards</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

          <div className="p-6 border-t border-border">
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack} disabled={currentStep === 1}>
                <ArrowLeft className="mr-2 w-4 h-4" />
                Back
              </Button>
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading ? (
                  "Processing..."
                ) : currentStep === totalSteps ? (
                  <>
                    Complete Setup <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}