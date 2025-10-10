"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Upload, CheckCircle, Loader2, AlertCircle, ExternalLink } from "lucide-react"

interface ConnectAccountsScreenProps {
  userData: any
  setUserData: (data: any) => void
  onNext: () => void
  onBack: () => void
}

const affiliateNetworks = [
  {
    id: "amazon",
    name: "Amazon Associates",
    description: "World's largest affiliate program",
    icon: () => (
      <div className="w-10 h-10 bg-orange-500 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-sm">A</span>
      </div>
    ),
  },
  {
    id: "cj",
    name: "Commission Junction",
    description: "Premium affiliate network",
    icon: () => (
      <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-xs">CJ</span>
      </div>
    ),
  },
  {
    id: "impact",
    name: "Impact",
    description: "Performance marketing platform",
    icon: () => (
      <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-sm">I</span>
      </div>
    ),
  },
  {
    id: "shareasale",
    name: "ShareASale",
    description: "Trusted affiliate network",
    icon: () => (
      <div className="w-10 h-10 bg-green-600 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-sm">S</span>
      </div>
    ),
  },
  {
    id: "rakuten",
    name: "Rakuten Advertising",
    description: "Global advertising platform",
    icon: () => (
      <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-sm">R</span>
      </div>
    ),
  },
  {
    id: "clickbank",
    name: "ClickBank",
    description: "Digital product marketplace",
    icon: () => (
      <div className="w-10 h-10 bg-indigo-600 rounded-md flex items-center justify-center">
        <span className="text-white font-bold text-xs">CB</span>
      </div>
    ),
  },
]

export function ConnectAccountsScreen({ userData, setUserData, onNext, onBack }: ConnectAccountsScreenProps) {
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>(userData.connectedAccounts || [])
  const [connectingAccount, setConnectingAccount] = useState<string | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [csvError, setCsvError] = useState("")
  const [csvUploading, setCsvUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleConnect = async (networkId: string) => {
    setConnectingAccount(networkId)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setConnectedAccounts([...connectedAccounts, networkId])
    setConnectingAccount(null)
  }

  const handleDisconnect = (networkId: string) => {
    setConnectedAccounts(connectedAccounts.filter((id) => id !== networkId))
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setCsvError("Please upload a CSV file")
      return
    }

    setCsvFile(file)
    setCsvError("")
    setCsvUploading(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setCsvUploading(false)
    setConnectedAccounts([...connectedAccounts, "csv-upload"])
  }

  const handleNext = () => {
    setUserData({ ...userData, connectedAccounts })
    onNext()
  }

  const canProceed = connectedAccounts.length > 0

  return (
    <div className="ml-64 min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-foreground mb-2">Connect accounts</h1>
          <p className="text-muted-foreground">Connect your affiliate accounts to start tracking performance.</p>
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-lg font-medium mb-6 text-foreground">Affiliate networks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {affiliateNetworks.map((network) => {
                const isConnected = connectedAccounts.includes(network.id)
                const isConnecting = connectingAccount === network.id

                return (
                  <Card
                    key={network.id}
                    className={`card-professional transition-all hover:border-ring/50 ${
                      isConnected ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {network.icon()}
                          <div>
                            <h3 className="text-sm font-medium text-card-foreground">{network.name}</h3>
                            <p className="text-xs text-muted-foreground">{network.description}</p>
                          </div>
                        </div>

                        {isConnected ? (
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Connected
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisconnect(network.id)}
                              className="text-xs h-7 px-2"
                            >
                              Disconnect
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleConnect(network.id)}
                            disabled={isConnecting}
                            className="text-xs h-7 px-3"
                          >
                            {isConnecting ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Connecting
                              </>
                            ) : (
                              <>
                                Connect
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-6 text-foreground">Import data</h2>
            <Card className={`card-professional border-dashed ${dragActive ? "border-primary bg-primary/5" : ""}`}>
              <CardContent
                className="p-8 text-center"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground">Upload CSV file</h3>
                  <p className="text-xs text-muted-foreground">Drag and drop your affiliate data or click to browse</p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    className="hidden"
                    id="csv-upload"
                  />
                  <Button variant="outline" asChild className="mt-4 text-xs bg-transparent">
                    <label htmlFor="csv-upload" className="cursor-pointer">
                      Browse files
                    </label>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {csvError && (
              <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-3 rounded-md mt-4">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{csvError}</span>
              </div>
            )}

            {csvUploading && (
              <div className="flex items-center space-x-2 text-primary bg-primary/10 p-3 rounded-md mt-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processing file...</span>
              </div>
            )}

            {csvFile && !csvUploading && (
              <div className="flex items-center space-x-2 text-primary bg-primary/10 p-3 rounded-md mt-4">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">File uploaded: {csvFile.name}</span>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-8 border-t border-border">
            <Button variant="outline" onClick={onBack} className="bg-transparent">
              Back
            </Button>
            <Button onClick={handleNext} disabled={!canProceed}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
