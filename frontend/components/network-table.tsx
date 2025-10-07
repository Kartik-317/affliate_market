"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"

interface Network {
  name: string
  status: "active" | "warning" | "error"
  revenue: number
  commissions: number
  lastSync: string
  conversionRate: number
  logo?: string
  pendingAmount?: number
  lastPayout?: string
}

interface NetworkTableProps {
  networks: Network[]
}

export function NetworkTable({ networks }: NetworkTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            Active
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
            Error
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-3">
      {networks.map((network, index) => (
        <div key={index} className="border border-border rounded-lg overflow-hidden">
          <div
            className="flex items-center justify-between p-3 hover:bg-accent/50 transition-all duration-200 cursor-pointer group"
            onClick={() => toggleRow(index)}
          >
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {expandedRows.has(index) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                {getStatusIcon(network.status)}
                <div>
                  <h4 className="text-base font-semibold text-foreground">{network.name}</h4>
                  <p className="text-sm font-normal text-muted-foreground">Last sync: {network.lastSync}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="font-semibold text-foreground">${network.revenue.toLocaleString()}</p>
                <p className="text-sm font-normal text-muted-foreground">{network.commissions} commissions</p>
              </div>

              <div className="text-right">
                <p className="font-semibold text-foreground">{network.conversionRate}%</p>
                <p className="text-sm font-normal text-muted-foreground">conversion</p>
              </div>

              {getStatusBadge(network.status)}

              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle view details
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {expandedRows.has(index) && (
            <div className="px-6 pb-4 bg-accent/20 border-t border-border">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Amount</p>
                  <p className="text-lg font-semibold text-foreground">
                    ${network.pendingAmount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Payout</p>
                  <p className="text-lg font-semibold text-foreground">{network.lastPayout || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Campaign Health</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusIcon(network.status)}
                    <span className="text-sm font-medium">Good Performance</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Quick Actions</p>
                  <div className="flex space-x-2 mt-1">
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs bg-transparent">
                      Optimize
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
