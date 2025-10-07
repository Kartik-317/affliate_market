import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, AlertCircle, Calendar, ExternalLink, Globe } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ComplianceItem {
    id: string
    title: string
    description: string
    dueDate: string
    status: "completed" | "pending" | "overdue"
    priority: "high" | "medium" | "low"
}

// Define the Networks for the Dialog
const networksForAction = [
    { name: "Amazon Associates", url: "https://affiliate.amazon.com/login" },
    { name: "Commission Junction", url: "https://www.cj.com/login" },
    { name: "ShareASale", url: "https://account.shareasale.com/a-plogin.cfm" },
    { name: "Rakuten Advertising", url: "https://pub.rakutenmarketing.com/login" },
    { name: "ClickBank", url: "https://accounts.clickbank.com/login" },
]

interface ComplianceChecklistProps {
    items: ComplianceItem[]
    // New prop to trigger the Network Selection Dialog in the parent
    onActionClick: (item: ComplianceItem) => void
}

export function ComplianceChecklist({ items, onActionClick }: ComplianceChecklistProps) {
    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case "pending":
                return <Clock className="w-5 h-5 text-yellow-500" />
            case "overdue":
                return <AlertCircle className="w-5 h-5 text-red-500" />
            default:
                return <Clock className="w-5 h-5 text-muted-foreground" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Completed
                    </Badge>
                )
            case "pending":
                return (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Pending
                    </Badge>
                )
            case "overdue":
                return (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                        Overdue
                    </Badge>
                )
            default:
                return <Badge variant="secondary">Unknown</Badge>
        }
    }

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case "high":
                return (
                    <Badge variant="outline" className="border-red-500/20 text-red-500">
                        High
                    </Badge>
                )
            case "medium":
                return (
                    <Badge variant="outline" className="border-yellow-500/20 text-yellow-500">
                        Medium
                    </Badge>
                )
            case "low":
                return (
                    <Badge variant="outline" className="border-green-500/20 text-green-500">
                        Low
                    </Badge>
                )
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    const getDaysUntilDue = (dateString: string) => {
        const dueDate = new Date(dateString)
        const today = new Date()
        const diffTime = dueDate.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return diffDays
    }

    const completedItems = items.filter((item) => item.status === "completed")
    const pendingItems = items.filter((item) => item.status === "pending")
    const overdueItems = items.filter((item) => item.status === "overdue")

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="glass-effect">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Items</p>
                                <p className="text-2xl font-bold">{items.length}</p>
                            </div>
                            <Calendar className="w-8 h-8 text-primary/60" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                <p className="text-2xl font-bold">{completedItems.length}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500/60" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{pendingItems.length}</p>
                            </div>
                            <Clock className="w-8 h-8 text-yellow-500/60" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-effect">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                                <p className="text-2xl font-bold">{overdueItems.length}</p>
                            </div>
                            <AlertCircle className="w-8 h-8 text-red-500/60" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Compliance Items */}
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle>Compliance Checklist</CardTitle>
                    <CardDescription>Track your tax and regulatory compliance requirements</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {items.map((item) => {
                            const daysUntilDue = getDaysUntilDue(item.dueDate)

                            return (
                                <div
                                    key={item.id}
                                    className={`flex items-start justify-between p-4 border rounded-lg transition-colors hover:border-primary/50 ${
                                        item.status === "overdue"
                                            ? "border-red-500/30 bg-red-500/5"
                                            : item.status === "completed"
                                              ? "border-green-500/30 bg-green-500/5"
                                              : "border-border"
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className="mt-1">{getStatusIcon(item.status)}</div>
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <h4 className="font-semibold">{item.title}</h4>
                                                {getPriorityBadge(item.priority)}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                                            <div className="flex items-center space-x-4 text-sm">
                                                <span className="text-muted-foreground">Due: {formatDate(item.dueDate)}</span>
                                                {item.status !== "completed" && (
                                                    <span
                                                        className={
                                                            daysUntilDue < 0
                                                                ? "text-red-500 font-medium"
                                                                : daysUntilDue <= 7
                                                                    ? "text-yellow-500 font-medium"
                                                                    : "text-muted-foreground"
                                                        }
                                                    >
                                                        {daysUntilDue < 0
                                                            ? `${Math.abs(daysUntilDue)} days overdue`
                                                            : daysUntilDue === 0
                                                                ? "Due today"
                                                                : `${daysUntilDue} days remaining`}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {getStatusBadge(item.status)}
                                        {item.status !== "completed" && (
                                            <Button variant="outline" size="sm" className="bg-transparent" onClick={() => onActionClick(item)}>
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                Action
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
