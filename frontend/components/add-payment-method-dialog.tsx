import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, CreditCard, Landmark, Smartphone, Bitcoin, AlertCircle } from "lucide-react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

// This component relies on <Elements> wrapper in PaymentsPage

interface AddPaymentMethodDialogProps {
    onClose: () => void
    onAdd: (method: any) => void
}

export function AddPaymentMethodDialog({ onClose, onAdd }: AddPaymentMethodDialogProps) {
    const [paymentType, setPaymentType] = useState("")
    const [cardDetails, setCardDetails] = useState({ complete: false })
    const [bankDetails, setBankDetails] = useState({
        account_number: "",
        routing_number: "",
        account_holder_name: "",
    })
    const [paypalDetails, setPaypalDetails] = useState({ email: "" })
    const [isLoading, setIsLoading] = useState(false)
    const [twoFactorCode, setTwoFactorCode] = useState("")
    const [showTwoFactor, setShowTwoFactor] = useState(false)
    const [error, setError] = useState("")
    const [requestData, setRequestData] = useState<any>(null)
    const stripe = useStripe()
    const elements = useElements()

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
        let requestData: any = {
            user_id: "test_user_123",
            type: paymentType,
            details: {},
            token: "",
        };

        if (paymentType === "card") {
            if (!stripe || !elements) throw new Error("Stripe not initialized");
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not found");

            const { token, error } = await stripe.createToken(cardElement);
            if (error) throw new Error(error.message);
            if (!token) throw new Error("Failed to create token");

            requestData.token = token.id;
            requestData.details = {
                last4: token.card?.last4,
                brand: token.card?.brand,
                exp_month: token.card?.exp_month,
                exp_year: token.card?.exp_year,
            };
        } else if (paymentType === "bank") {
            requestData.details = bankDetails;
        } else if (paymentType === "paypal") {
            if (!paypalDetails.email) throw new Error("PayPal email is required");
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(paypalDetails.email)) throw new Error("Invalid email format");
            requestData.details = { email: paypalDetails.email };
        } else if (paymentType === "crypto") {
            // Keep this placeholder disabled logic
            requestData.details = { address: "" };
        }

        console.log("Sending payment method request:", requestData);

        const response = await fetch("/.netlify/functions/proxy/payments/method", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestData),
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || "Failed to add payment method");
        }

        const result = await response.json();
        console.log("Payment method response:", result);

        // Check for the onboarding URL from the backend
        if (result.onboarding_url) {
            // Redirect the user to Stripe's hosted onboarding flow
            window.location.href = result.onboarding_url;
            return; // Exit the function to prevent further state changes
        }

        setRequestData(requestData);
        setShowTwoFactor(true);
        setIsLoading(false);

    } catch (err: any) {
        console.error("Payment method error:", err);
        setError(err.message || "An error occurred while adding the payment method");
        setIsLoading(false);
    }
};

    const handleTwoFactorSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError("")

        try {
            const payload = { user_id: "test_user_123", code: twoFactorCode }
            console.log("Sending 2FA request:", payload)

            const response = await fetch("/.netlify/functions/proxy/payments/method/verify-2fa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10000),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "2FA verification failed")
            }

            const result = await response.json()
            console.log("2FA response:", result)
            
            // FIX: The backend now correctly sets the status to 'verified' and returns the final method details.
            // Ensure we use the returned details/name in onAdd for the parent component to update the UI correctly.
            onAdd({
                id: result.id,
                type: result.type,
                status: "verified", // The UI update assumes 'verified' here
                name: result.name, 
                details: result.details, // Use the details returned from the server (e.g., last4 for card)
            })
            onClose();
        } catch (err: any) {
            console.error("2FA error:", err)
            setError(err.message || "An error occurred during 2FA verification")
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md glass-effect">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center space-x-2">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <span>Add Payment Method</span>
                            </CardTitle>
                            <CardDescription>Choose a method to receive your payments</CardDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClose}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {!showTwoFactor ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="payment-type">Payment Type</Label>
                                <Select value={paymentType} onValueChange={setPaymentType} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="card">
                                            <div className="flex items-center space-x-2">
                                                <CreditCard className="w-4 h-4" />
                                                <span>Card</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="bank">
                                            <div className="flex items-center space-x-2">
                                                <Landmark className="w-4 h-4" />
                                                <span>Bank Account</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="paypal">
                                            <div className="flex items-center space-x-2">
                                                <Smartphone className="w-4 h-4" />
                                                <span>PayPal</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="crypto">
                                            <div className="flex items-center space-x-2">
                                                <Bitcoin className="w-4 h-4" />
                                                <span>Cryptocurrency</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {paymentType === "card" && (
                                <div className="space-y-2">
                                    <Label>Card Details</Label>
                                    <div className="p-3 border rounded-lg">
                                        <CardElement
                                            options={{
                                                style: {
                                                    base: {
                                                        fontSize: "16px",
                                                        color: "#000",
                                                        "::placeholder": { color: "#6b7280" },
                                                    },
                                                },
                                            }}
                                            onChange={(e) => setCardDetails({ complete: e.complete })}
                                        />
                                    </div>
                                </div>
                            )}

                            {paymentType === "bank" && (
                                <div className="space-y-2">
                                    <div>
                                        <Label htmlFor="account-number">Account Number</Label>
                                        <Input
                                            id="account-number"
                                            value={bankDetails.account_number}
                                            onChange={(e) =>
                                                setBankDetails({ ...bankDetails, account_number: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="routing-number">Routing Number</Label>
                                        <Input
                                            id="routing-number"
                                            value={bankDetails.routing_number}
                                            onChange={(e) =>
                                                setBankDetails({ ...bankDetails, routing_number: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="account-holder-name">Account Holder Name</Label>
                                        <Input
                                            id="account-holder-name"
                                            value={bankDetails.account_holder_name}
                                            onChange={(e) =>
                                                setBankDetails({ ...bankDetails, account_holder_name: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {paymentType === "paypal" && (
                                <div className="space-y-2">
                                    <Label htmlFor="paypal-email">PayPal Email</Label>
                                    <Input
                                        id="paypal-email"
                                        type="email"
                                        value={paypalDetails.email}
                                        onChange={(e) => setPaypalDetails({ ...paypalDetails, email: e.target.value })}
                                        placeholder="Enter your PayPal email"
                                        required
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Please ensure this email is associated with a valid PayPal account.
                                    </p>
                                </div>
                            )}

                            {paymentType === "crypto" && (
                                <div className="space-y-2">
                                    <Label htmlFor="crypto-address">Cryptocurrency Address</Label>
                                    <Input
                                        id="crypto-address"
                                        placeholder="Enter your wallet address"
                                        disabled
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Cryptocurrency support coming soon
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={
                                    isLoading ||
                                    !paymentType ||
                                    (paymentType === "card" && !cardDetails.complete) ||
                                    (paymentType === "paypal" && !paypalDetails.email) ||
                                    (paymentType === "bank" && (!bankDetails.account_number || !bankDetails.routing_number || !bankDetails.account_holder_name))
                                }
                            >
                                {isLoading ? "Processing..." : "Add Payment Method"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleTwoFactorSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="two-factor-code">Two-Factor Authentication Code</Label>
                                <Input
                                    id="two-factor-code"
                                    value={twoFactorCode}
                                    onChange={(e) => setTwoFactorCode(e.target.value)}
                                    placeholder="Enter 2FA code"
                                    required
                                />
                                <p className="text-sm text-muted-foreground">
                                    For testing, enter any code (e.g., 123456).
                                </p>
                            </div>

                            {error && (
                                <div className="flex items-start space-x-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                                    <p className="text-sm text-red-500">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full" size="lg" disabled={isLoading || !twoFactorCode}>
                                {isLoading ? "Verifying..." : "Verify Payment Method"}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}