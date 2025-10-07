import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Plus, Settings, CheckCircle, Clock, AlertCircle, Landmark, Smartphone, Bitcoin } from "lucide-react"
import React from 'react';

// Interfaces match the structured data passed from PaymentsPage
interface PaymentMethod {
    id: string
    type: string
    name: string
    isDefault: boolean
    status: string
    details: string
    minimumAmount: number
    processingTime: string
    fees: string
    icon: React.ElementType 
}

interface PaymentMethodsProps {
    methods: PaymentMethod[]
    setShowAddPaymentMethod: (show: boolean) => void 
}

export function PaymentMethods({ methods, setShowAddPaymentMethod }: PaymentMethodsProps) {
    
    // NOTE: This getIcon function is for displaying icons based on the stored 'type'.
    const getIcon = (type: string): React.ReactNode => {
        switch (type) {
            case "bank":
                return <Landmark className="w-5 h-5 text-blue-500" />
            case "paypal":
                return <Smartphone className="w-5 h-5 text-blue-600" />
            case "crypto":
                return <Bitcoin className="w-5 h-5 text-orange-500" />
            case "card":
                return <CreditCard className="w-5 h-5 text-indigo-500" />
            default:
                return <CreditCard className="w-5 h-5 text-muted-foreground" />
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "verified":
                return <CheckCircle className="w-4 h-4 text-green-500" />
            case "pending":
                return <Clock className="w-4 h-4 text-yellow-500" />
            case "failed":
                return <AlertCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-muted-foreground" />
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "verified":
                return (
                    <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Verified
                    </Badge>
                )
            case "pending":
                return (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Pending
                    </Badge>
                )
            case "failed":
                return (
                    <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                        Failed
                    </Badge>
                )
            default:
                return <Badge variant="secondary">Unknown</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle>Payment Methods</CardTitle>
                    <CardDescription>Manage your withdrawal methods and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {methods.length > 0 ? (
                            methods.map((method) => (
                                <div
                                    key={method.id}
                                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:border-primary/50 ${
                                        method.isDefault ? "border-primary/30 bg-primary/5" : "border-border"
                                    }`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex items-center justify-center w-12 h-12 bg-muted rounded-lg">
                                            {getIcon(method.type)}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-semibold">{method.name}</h4>
                                                {method.isDefault && <Badge variant="secondary">Default</Badge>}
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                {getStatusIcon(method.status)}
                                                <span className="text-sm text-muted-foreground capitalize">{method.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                        {getStatusBadge(method.status)}
                                        <Button variant="ghost" size="sm">
                                            <Settings className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-muted-foreground text-center p-8">No payment methods added yet. Click below to add your first one.</p>
                        )}

                        {/* Add New Method Button */}
                        <div 
                            className="flex items-center justify-center p-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer"
                            onClick={() => setShowAddPaymentMethod(true)}
                        >
                            <div className="text-center">
                                <Plus className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                <h4 className="font-semibold mb-1">Add Payment Method</h4>
                                <p className="text-sm text-muted-foreground">Connect a new bank account, PayPal, or crypto wallet</p>
                                <Button variant="outline" size="sm" className="mt-3 bg-transparent">
                                    Add Method
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}