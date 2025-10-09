"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, CreditCard, Landmark, Smartphone } from "lucide-react"

// Define the interfaces needed for the component
interface PaymentMethod {
    id: string
    type: string
    name: string
    isDefault: boolean
    status: string
}

interface ModifyAutoWithdrawalDialogProps {
    onClose: () => void
    paymentMethods: PaymentMethod[]
    currentSettings: {
        paymentMethodId: string;
        frequency: string;
        minimumAmount: number;
        dayOfMonth: number;
    };
    onSave: (newSettings: any) => void;
}

// Function to get the correct icon component
const getPaymentMethodIcon = (type: string) => {
    switch (type) {
        case "bank":
            return Landmark;
        case "paypal":
            return Smartphone;
        case "card":
            return CreditCard;
        default:
            return CreditCard;
    }
};

export function ModifyAutoWithdrawalDialog({ onClose, paymentMethods, currentSettings, onSave }: ModifyAutoWithdrawalDialogProps) {
    const [selectedMethodId, setSelectedMethodId] = useState(currentSettings.paymentMethodId);
    const [dayOfMonth, setDayOfMonth] = useState(currentSettings.dayOfMonth);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Simulate an API call to save the new settings
        console.log("Saving new auto-withdrawal settings:", {
            ...currentSettings,
            paymentMethodId: selectedMethodId,
            dayOfMonth: Number(dayOfMonth)
        });

        // In a real application, you would make an API call here.
        // await fetch('/.netlify/functions/proxy/payments/auto-withdrawal/update', { ... });
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

        // Call the onSave prop with the updated settings
        onSave({ ...currentSettings, paymentMethodId: selectedMethodId, dayOfMonth: Number(dayOfMonth) });

        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-effect">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Modify Auto-Withdrawal</CardTitle>
                            <CardDescription>Update your automatic payment schedule and method.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSave} className="space-y-6">
                        {/* Current Settings */}
                        <div className="space-y-2">
                            <Label>Current Method</Label>
                            <div className="p-4 border rounded-lg bg-muted/30">
                                {
                                    (() => {
                                        const currentMethod = paymentMethods.find(m => m.id === currentSettings.paymentMethodId);
                                        if (!currentMethod) return <p className="text-muted-foreground">No method selected.</p>;
                                        const IconComponent = getPaymentMethodIcon(currentMethod.type);
                                        return (
                                            <div className="flex items-center space-x-3">
                                                <IconComponent className="w-5 h-5 text-primary" />
                                                <span className="font-medium">{currentMethod.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    Current
                                                </Badge>
                                            </div>
                                        );
                                    })()
                                }
                            </div>
                        </div>

                        {/* Select New Method */}
                        <div className="space-y-2">
                            <Label htmlFor="new-method">Select New Payment Method</Label>
                            <Select value={selectedMethodId} onValueChange={setSelectedMethodId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Choose a payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    {paymentMethods.filter(method => method.status === "verified").map((method) => {
                                        const IconComponent = getPaymentMethodIcon(method.type);
                                        return (
                                            <SelectItem key={method.id} value={method.id}>
                                                <div className="flex items-center space-x-2">
                                                    <IconComponent className="w-4 h-4" />
                                                    <span>{method.name}</span>
                                                    {method.isDefault && <Badge variant="secondary">Default</Badge>}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Select Day of Month */}
                        <div className="space-y-2">
                            <Label htmlFor="day-of-month">Day of Month for Withdrawal</Label>
                            <Input
                                id="day-of-month"
                                type="number"
                                min="1"
                                max="28"
                                value={dayOfMonth}
                                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                                placeholder="Enter day of month (1-28)"
                                required
                            />
                            <p className="text-sm text-muted-foreground">
                                Choose a day between 1 and 28 for the auto-withdrawal.
                            </p>
                        </div>

                        {/* Save Button */}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSaving || (selectedMethodId === currentSettings.paymentMethodId && dayOfMonth === currentSettings.dayOfMonth)}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}