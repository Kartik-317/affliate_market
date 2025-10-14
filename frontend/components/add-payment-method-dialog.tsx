import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, CreditCard, Landmark, Smartphone, Bitcoin, AlertCircle } from "lucide-react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"

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
    const [accessToken, setAccessToken] = useState<string | null>(null); // State to hold the token
    const stripe = useStripe()
    const elements = useElements()

    // 1. Fetch access token on component mount
    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            setAccessToken(token);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (!accessToken) {
            setError("Authentication token missing. Please log in again.");
            setIsLoading(false);
            return;
        }

        try {
            let requestData: any = {
                // NOTE: The backend should ideally derive user_id from the token,
                // but for Pydantic validation based on your setup, we send it.
                // However, the *actual* user_id in the service should come from the token.
                // We'll keep the placeholder for now but rely on the token for auth.
                user_id: "test_user_123", // Placeholder, will be ignored if backend uses token
                type: paymentType,
                details: {},
                token: "",
            };

            // ... (Stripe, Bank, PayPal logic remains the same) ...
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
                requestData.details = { address: "" };
            }

            console.log("Sending payment method request:", requestData);

            // 2. Include Authorization Header
            const response = await fetch("/.netlify/functions/proxy/payments/method", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`, // FIX: Pass the token
                },
                body: JSON.stringify(requestData),
                signal: AbortSignal.timeout(10000),
            });

            if (!response.ok) {
                const errorText = await response.text(); // Read raw text for better error logging
                console.error("Payment method backend error response:", errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    // Check for standard FastAPI error structure
                    if (errorData.detail && Array.isArray(errorData.detail)) {
                        const validationErrors = errorData.detail.map((d: any) => `${d.loc.join('.')}: ${d.msg}`).join(', ');
                        throw new Error(`Validation Error: ${validationErrors}`);
                    }
                    throw new Error(errorData.detail || "Failed to add payment method");
                } catch {
                    // Fallback for non-JSON or other errors
                    throw new Error(`Server returned status ${response.status}: ${errorText.substring(0, 100)}...`);
                }
            }

            const result = await response.json();
            console.log("Payment method response:", result);

            if (result.onboarding_url) {
                window.location.href = result.onboarding_url;
                return;
            }

            // For PayPal/methods requiring 2FA
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

        if (!accessToken) {
            setError("Authentication token missing for 2FA. Please log in again.");
            setIsLoading(false);
            return;
        }

        try {
            const payload = { user_id: "test_user_123", code: twoFactorCode } // user_id is placeholder
            console.log("Sending 2FA request:", payload)

            const response = await fetch("/.netlify/functions/proxy/payments/method/verify-2fa", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`, // FIX: Pass the token
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(10000),
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.detail || "2FA verification failed")
            }

            const result = await response.json()
            console.log("2FA response:", result)
            
            onAdd({
                id: result.id,
                type: result.type,
                status: "verified",
                name: result.name, 
                details: result.details,
            })
            onClose();
        } catch (err: any) {
            console.error("2FA error:", err)
            setError(err.message || "An error occurred during 2FA verification")
            setIsLoading(false)
        }
    }

    // ... (rest of the component JSX remains the same) ...

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
                             {/* ... (Payment Type Select and forms) ... */}
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