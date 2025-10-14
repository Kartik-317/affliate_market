"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  Bell,
  CreditCard,
  FileText,
  Settings,
  User,
  Menu,
  X,
  Home,
  TrendingUp,
  Zap,
  LogOut,
} from "lucide-react"
import Link from "next/link"

interface DashboardLayoutProps {
  children: React.ReactNode
  unreadCount?: number // Make unreadCount an optional prop
}

export function DashboardLayout({ children, unreadCount = 0 }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const [userName, setUserName] = useState<string>("User")
  const [userEmail, setUserEmail] = useState<string>("email@example.com")

  // Load user data from localStorage on component mount
  useEffect(() => {
    const storedName = localStorage.getItem('userName')
    const storedEmail = localStorage.getItem('userEmail')
    if (storedName) setUserName(storedName)
    if (storedEmail) setUserEmail(storedEmail)
  }, [])

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Analytics", href: "/analytics", icon: TrendingUp },
    { name: "Notifications", href: "/notifications", icon: Bell },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Tax Reports", href: "/tax-reports", icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">ACC</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.name === "Notifications" && unreadCount > 0 && (
                  <Badge className="ml-auto bg-primary text-primary-foreground text-xs">{unreadCount}</Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block">
        <div className="flex h-full flex-col bg-sidebar border-r border-sidebar-border">
          <div className="flex h-16 items-center px-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">Affiliate Command Center</span>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
                {item.name === "Notifications" && unreadCount > 0 && (
                  <Badge className="ml-auto bg-primary text-primary-foreground text-xs">{unreadCount}</Badge>
                )}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center space-x-3 px-3 py-2">
              <div className="w-8 h-8 bg-sidebar-accent rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-sidebar-foreground">{userName}</p>
                <p className="text-xs text-sidebar-foreground/60">{userEmail}</p>
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-border/40 bg-background/80 backdrop-blur-sm px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <Link href="/notifications" className="relative">
                <Button variant="ghost" size="sm" className="hover:bg-accent transition-colors">
                  <Bell className="w-5 h-5" />
                </Button>
                {unreadCount > 0 && (
                  <Badge className="absolute -top-2 -right-3 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500 text-white animate-pulse">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
              <Button variant="ghost" size="sm" className="hover:bg-accent transition-colors">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6 px-4 sm:px-6 lg:px-6">{children}</main>
      </div>
    </div>
  )
}