"use client"

import { Check, User, Link, Settings, CheckCircle } from "lucide-react"

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onStepClick?: (stepIndex: number) => void
}

const stepIcons = [User, Link, Settings, CheckCircle]

export function ProgressBar({ currentStep, totalSteps, stepLabels, onStepClick }: ProgressBarProps) {
  return (
    <div className="bg-sidebar border-r border-sidebar-border h-screen w-64 fixed left-0 top-0 z-50 flex-shrink-0">
      <div className="p-6 h-full">
        <div className="mb-8">
          <div className="w-8 h-8 bg-primary rounded-lg mb-3" />
          <h1 className="text-lg font-semibold text-foreground">Affiliate Setup</h1>
          <p className="text-xs text-muted-foreground">Complete your onboarding</p>
        </div>

        <div className="space-y-2">
          {stepLabels.map((label, index) => {
            const Icon = stepIcons[index]
            const isCompleted = index < currentStep
            const isCurrent = index === currentStep

            return (
              <button
                key={index}
                onClick={() => onStepClick?.(index)}
                disabled={index > currentStep}
                className={`
                  w-full flex items-center space-x-3 p-3 rounded-lg transition-all text-left
                  ${isCurrent ? "bg-primary text-white shadow-sm" : ""}
                  ${isCompleted ? "text-foreground hover:bg-gray-50" : ""}
                  ${index > currentStep ? "text-muted-foreground cursor-not-allowed opacity-60" : ""}
                  ${index <= currentStep && onStepClick ? "cursor-pointer" : ""}
                `}
              >
                <div
                  className={`
                    flex items-center justify-center w-6 h-6 rounded-md transition-all
                    ${isCompleted ? "bg-green-100 text-green-600" : ""}
                    ${isCurrent ? "text-white" : ""}
                    ${index > currentStep ? "text-muted-foreground" : ""}
                  `}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-medium">{label}</div>
                </div>

                <div className={`text-xs ${isCurrent ? "text-white/70" : "text-muted-foreground"}`}>
                  {String(index + 1).padStart(2, "0")}
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground mb-3">
            <span>Progress</span>
            <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
