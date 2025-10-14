// pages/OnboardingPage.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { WelcomeScreen } from "@/components/onboarding/welcome-screen"
import { ConnectAccountsScreen } from "@/components/onboarding/connect-accounts-screen"
import { PreferencesScreen } from "@/components/onboarding/preferences-screen"
import { ReviewScreen } from "@/components/onboarding/review-screen"
import { ProgressBar } from "@/components/onboarding/progress-bar"
import { CompletionScreen } from "@/components/onboarding/completion-screen"

// Define the argument type for authentication function
interface AuthParams {
    email: string;
    password: string;
    name: string;
    type: 'register' | 'login';
}

// Define the base URL for your FastAPI backend
const API_BASE_URL = "/.netlify/functions/proxy"

export default function OnboardingPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isCompleted, setIsCompleted] = useState(false)
    const [tenantId, setTenantId] = useState<string | null>(null)
    const [accessToken, setAccessToken] = useState<string | null>(null)

    const [userData, setUserData] = useState({
        email: "",
        password: "",
        name: "",
        connectedAccounts: [] as string[],
        preferences: {
            notifications: { email: true, push: false },
            timezone: "",
            currency: "",
            phone: "",
            monthlyRevenue: "",
        },
    })

    const steps = ["Welcome & Sign-Up", "Connect Accounts", "Preferences Setup", "Review & Finish"]

    const handleNext = (newTenantId?: string) => {
        if (newTenantId) {
            setTenantId(newTenantId)
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1)
        }
    }

    const handleStepClick = (stepIndex: number) => {
        if (stepIndex <= currentStep) {
            setCurrentStep(stepIndex)
        }
    }

    const handleComplete = () => {
        setIsCompleted(true)
        console.log("Onboarding completed:", { ...userData, tenantId, accessToken })
        // Use router.replace to prevent going back to onboarding via the browser back button
        router.replace('/dashboard') 
    }

    const handleAuthentication = async ({ email, password, name, type }: AuthParams): Promise<boolean> => {
        setUserData(prev => ({ ...prev, email, password, name }))

        try {
            let response
            let data

            if (type === 'register') {
                // --- 1. SIGN-UP LOGIC ---
                response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name: name || "User" }),
                })
                data = await response.json()

                if (!response.ok) {
                    throw new Error(data.detail || data.message || "Registration failed")
                }
                
                // --- REGISTRATION SUCCESS: PERSIST DATA & MOVE TO NEXT STEP ---
                const { access_token, tenant_id, user_name } = data; // Assuming backend returns user_name/name
                const finalUserName = user_name || name || "User";

                // Save token and necessary user data to localStorage
                localStorage.setItem('accessToken', access_token)
                localStorage.setItem('tenantId', tenant_id)
                localStorage.setItem('userName', finalUserName)
                localStorage.setItem('userEmail', email)

                console.log(`User registered and token saved. Tenant ID: ${tenant_id}`)

                // Update state and proceed to the next onboarding step
                setAccessToken(access_token)
                setTenantId(tenant_id)
                handleNext(tenant_id)
                return true

            } else if (type === 'login') {
                // --- 2. LOGIN LOGIC ---
                const formBody = new URLSearchParams()
                formBody.append("username", email)
                formBody.append("password", password)

                response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formBody.toString(),
                })
                data = await response.json()

                if (!response.ok) {
                    throw new Error(data.detail || "Login failed. Check email and password.")
                }
                
                // --- LOGIN SUCCESS: PERSIST DATA & REDIRECT TO DASHBOARD ---
                const { access_token, tenant_id, name: loggedInName } = data;

                // Save token and necessary user data to localStorage
                localStorage.setItem('accessToken', access_token)
                localStorage.setItem('tenantId', tenant_id)
                localStorage.setItem('userName', loggedInName || name || "User")
                localStorage.setItem('userEmail', email)
                
                setAccessToken(access_token)
                setTenantId(tenant_id)

                // Direct redirection to the main dashboard
                console.log("Login successful. Redirecting to dashboard.")
                router.replace('/dashboard')
                return true
            }

            // Fallback return for unexpected cases
            return false
        } catch (error) {
            console.error("Authentication Error:", (error as Error).message)
            alert((error as Error).message)
            return false
        }
    }

    if (isCompleted) {
        return (
            <div className="min-h-screen bg-background flex">
                <ProgressBar currentStep={steps.length - 1} totalSteps={steps.length} stepLabels={steps} />
                <div className="flex-1 min-h-screen bg-background lg:ml-0 overflow-x-hidden">
                    <CompletionScreen userData={userData} />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex">
            {currentStep > 0 && (
                <ProgressBar
                    currentStep={currentStep}
                    totalSteps={steps.length}
                    stepLabels={steps}
                    onStepClick={handleStepClick}
                />
            )}

            <div className={`flex-1 min-h-screen overflow-x-hidden ${currentStep > 0 ? "lg:ml-0" : ""}`}>
                {currentStep === 0 && (
                    <WelcomeScreen
                        userData={userData}
                        setUserData={setUserData}
                        onAuthenticate={handleAuthentication}
                    />
                )}

                {currentStep === 1 && (
                    <ConnectAccountsScreen
                        userData={userData}
                        setUserData={setUserData}
                        onNext={handleNext}
                        onBack={handleBack}
                    />
                )}

                {currentStep === 2 && (
                    <PreferencesScreen userData={userData} setUserData={setUserData} onNext={handleNext} onBack={handleBack} />
                )}

                {currentStep === 3 && <ReviewScreen userData={userData} onBack={handleBack} onComplete={handleComplete} />}
            </div>
        </div>
    )
}