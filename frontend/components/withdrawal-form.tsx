"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, CreditCard, DollarSign, AlertCircle } from "lucide-react"

interface PaymentMethod {
  id: string
  type: string
  name: string
  isDefault: boolean
  status: string
}

interface WithdrawalFormProps {
  availableBalance: number
  paymentMethods: PaymentMethod[]
  onClose: () => void
  onWithdrawalSuccess?: (amount: number) => void
}

export function WithdrawalForm({ availableBalance, paymentMethods, onClose, onWithdrawalSuccess }: WithdrawalFormProps) {
  const [amount, setAmount] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const withdrawalAmount = Number.parseFloat(amount);
    console.log("Withdrawal Request:", {
      amount: withdrawalAmount,
      method: selectedMethod,
    });

    try {
      const response = await fetch("/.netlify/functions/proxy/payments/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: withdrawalAmount,
          method: selectedMethod,
        }),
      });

      console.log("Response Status:", response.status, response.statusText);
      console.log("Response Headers:", Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Response Error Data:", errorData);
        throw new Error(errorData.detail || "Failed to process withdrawal");
      }

      const result = await response.json();
      console.log("Withdrawal Success:", result);
      alert(result.message); // Replace with toast notification in production
      onWithdrawalSuccess?.(withdrawalAmount);
      setIsLoading(false);
      onClose();
    } catch (err: any) {
      console.error("Withdrawal Error:", {
        message: err.message,
        stack: err.stack,
      });
      setError(err.message);
      setIsLoading(false);
    }
  }

  const withdrawalAmount = Number.parseFloat(amount) || 0
  const fee = withdrawalAmount * 0.01 // 1% fee
  const netAmount = withdrawalAmount - fee

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md glass-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Withdraw Funds</span>
              </CardTitle>
              <CardDescription>Transfer money to your preferred payment method</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Available Balance</span>
                <span className="text-lg font-bold">${availableBalance.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10"
                  min="100"
                  max={availableBalance}
                  step="0.01"
                  required
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Minimum: $100</span>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => setAmount(availableBalance.toString())}
                >
                  Withdraw All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={selectedMethod} onValueChange={setSelectedMethod} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods
                    .filter((method) => method.status === "verified")
                    .map((method) => (
                      <SelectItem key={method.id} value={method.id}>
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-4 h-4" />
                          <span>{method.name}</span>
                          {method.isDefault && <Badge variant="secondary">Default</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {withdrawalAmount > 0 && (
              <div className="p-4 bg-muted/20 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Withdrawal Amount</span>
                  <span>${withdrawalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Processing Fee (1%)</span>
                  <span>-${fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Net Amount</span>
                    <span>${netAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                <p className="text-sm text-red-500">{error}</p>
              </div>
            )}

            <div className="flex items-start space-x-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-500">Processing Time</p>
                <p className="text-muted-foreground">Bank transfers typically take 1-3 business days to complete.</p>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !amount || !selectedMethod}>
              {isLoading ? "Processing..." : `Withdraw $${withdrawalAmount.toFixed(2)}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}