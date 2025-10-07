import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react"

interface TaxData {
  totalIncome: number
  taxableIncome: number
  estimatedTax: number
  deductions: number
  quarterlyPayments: number
  remainingTax: number
  documents: Record<string, number>
}

interface TaxSummaryProps {
  data: TaxData
  year: string
}

export function TaxSummary({ data, year }: TaxSummaryProps) {
  const taxRate = (data.estimatedTax / data.taxableIncome) * 100

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-effect border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
              <p className="text-3xl font-bold">${data.totalIncome.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-sm font-medium text-green-500">+18.2%</span>
            <span className="text-sm text-muted-foreground ml-1">vs {Number.parseInt(year) - 1}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Estimated Tax</p>
              <p className="text-2xl font-bold">${data.estimatedTax.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
          </div>
          <Badge className="mt-4 bg-red-500/10 text-red-500 border-red-500/20">
            {taxRate.toFixed(1)}% effective rate
          </Badge>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Paid to Date</p>
              <p className="text-2xl font-bold">${data.quarterlyPayments.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <Badge className="mt-4 bg-green-500/10 text-green-500 border-green-500/20">
            {((data.quarterlyPayments / data.estimatedTax) * 100).toFixed(0)}% complete
          </Badge>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className="text-2xl font-bold">${data.remainingTax.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <span className="text-sm text-muted-foreground">Due by Apr 15, 2024</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
