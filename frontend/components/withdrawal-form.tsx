// withdrawal-form.tsx

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowUpRight, DollarSign, AlertCircle, X } from "lucide-react"

interface PaymentMethod {
    id: string
    type: string
    name: string
    details: string
}

interface WithdrawalFormProps {
    availableBalance: number
    paymentMethods: PaymentMethod[]
    onClose: () => void
}

export function WithdrawalForm({ availableBalance, paymentMethods, onClose }: WithdrawalFormProps) {
    const [amount, setAmount] = useState<string>("")
    const [selectedMethodId, setSelectedMethodId] = useState<string>(paymentMethods[0]?.id || "")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Calculate parsedAmount here, accessible to both requestWithdrawal and JSX
    const currentParsedAmount = parseFloat(amount);

    useEffect(() => {
        // Automatically select the first method if available
        if (paymentMethods.length > 0 && !selectedMethodId) {
            setSelectedMethodId(paymentMethods[0].id)
        }
    }, [paymentMethods, selectedMethodId])

    const getAuthHeaders = () => {
        const token = localStorage.getItem("accessToken")
        if (!token) {
            setError("Authentication token is missing. Please log in again.")
            return null
        }
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        }
    }

    const requestWithdrawal = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const parsedAmount = currentParsedAmount; // Use the currently parsed value

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Please enter a valid amount.")
            setIsLoading(false)
            return
        }
        if (parsedAmount > availableBalance) {
            setError(`Withdrawal amount exceeds available balance of $${availableBalance.toLocaleString()}.`)
            setIsLoading(false)
            return
        }

        const headers = getAuthHeaders();
        if (!headers) {
            setIsLoading(false);
            return;
        }

        const withdrawalPayload = {
            amount: parsedAmount,
            method: selectedMethodId,
        }

        try {
            console.log("Sending withdrawal request:", withdrawalPayload)

            // API CALL WITH AUTH HEADER
            const response = await fetch("/.netlify/functions/proxy/payments/withdraw", {
                method: "POST",
                headers: headers, // <-- Use authenticated headers
                body: JSON.stringify(withdrawalPayload),
                signal: AbortSignal.timeout(20000), // Increased timeout for external transaction simulation
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "Withdrawal failed due to processing error.")
            }

            const result = await response.json()
            console.log("Withdrawal response:", result)
            setSuccess(result.message || `Withdrawal of $${parsedAmount.toLocaleString()} initiated successfully.`)

        } catch (err: any) {
            console.error("Withdrawal error:", err)
            setError(err.message || "An unexpected error occurred during withdrawal.")
        } finally {
            setIsLoading(false)
        }
    }

    const selectedMethod = paymentMethods.find(m => m.id === selectedMethodId)

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg glass-effect">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <ArrowUpRight className="w-5 h-5 text-primary" />
                                <span>Request Withdrawal</span>
                            </CardTitle>
                            <CardDescription>Transfer funds from your available balance to a payment method.</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={requestWithdrawal} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="amount">Available Balance</Label>
                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                <span className="text-xl font-bold text-primary">${availableBalance.toLocaleString()}</span>
                                <span className="text-sm text-muted-foreground">Max Withdrawal</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="amount">Withdrawal Amount</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="amount"
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter amount"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="pl-10 text-lg"
                                    required
                                    min="0.01"
                                    max={availableBalance}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="method">Withdrawal Method</Label>
                            {paymentMethods.length > 0 ? (
                                <Select value={selectedMethodId} onValueChange={setSelectedMethodId} required>
                                    <SelectTrigger id="method">
                                        <SelectValue placeholder="Select a payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method.id} value={method.id}>
                                                <div className="flex items-center space-x-2">
                                                    <span>{method.name}</span>
                                                    <span className="text-muted-foreground text-sm">({method.details})</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input readOnly value="No verified methods available" className="text-red-500" />
                            )}
                            {selectedMethod && (
                                <p className="text-sm text-muted-foreground mt-1">
                                    Processing time: {selectedMethod.type === 'bank' ? '1-3 business days' : 'Instant (simulated)'}
                                </p>
                            )}
                        </div>

                        {(error || success) && (
                            <div className={`flex items-start space-x-2 p-3 rounded-lg ${
                                error ? 'bg-red-500/10 border border-red-500/20' : 'bg-green-500/10 border border-green-500/20'
                            }`}>
                                <AlertCircle className={`w-4 h-4 mt-0.5 ${error ? 'text-red-500' : 'text-green-500'}`} />
                                <p className={`text-sm ${error ? 'text-red-500' : 'text-green-500'}`}>
                                    {error || success}
                                </p>
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full" 
                            size="lg" 
                            disabled={isLoading || !selectedMethodId || !amount || currentParsedAmount <= 0 || currentParsedAmount > availableBalance}
                        >
                            {isLoading ? "Initiating Transfer..." : `Withdraw $${currentParsedAmount > 0 ? currentParsedAmount.toLocaleString() : '0.00'}`}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}