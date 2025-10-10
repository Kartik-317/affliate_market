"use client"

import { useState } from "react"
import { WelcomeScreen } from "@/components/onboarding/welcome-screen"
import { ConnectAccountsScreen } from "@/components/onboarding/connect-accounts-screen"
import { PreferencesScreen } from "@/components/onboarding/preferences-screen"
import { ReviewScreen } from "@/components/onboarding/review-screen"
import { ProgressBar } from "@/components/onboarding/progress-bar"
import { CompletionScreen } from "@/components/onboarding/completion-screen"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const [userData, setUserData] = useState({
    email: "",
    password: "",
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

  const handleNext = () => {
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
    // Only allow navigation to completed steps or the next step
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex)
    }
  }

  const handleComplete = () => {
    setIsCompleted(true)
    console.log("Onboarding completed:", userData)
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* MODIFIED: Pass currentStep={steps.length - 1} to display 100% */}
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
        {currentStep === 0 && <WelcomeScreen userData={userData} setUserData={setUserData} onNext={handleNext} />}

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