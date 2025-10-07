import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Clock, CheckCircle, TrendingUp } from "lucide-react"

interface WalletData {
  totalBalance: number
  availableBalance: number
  pendingBalance: number
  thisMonth: number
  lastWithdrawal: number
  nextPayoutDate: string
}

interface WalletOverviewProps {
  data: WalletData
}

export function WalletOverview({ data }: WalletOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-effect border-2 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
              <p className="text-3xl font-bold">${data.totalBalance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-sm font-medium text-green-500">+12.5%</span>
            <span className="text-sm text-muted-foreground ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">${data.availableBalance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
          </div>
          <Badge className="mt-4 bg-green-500/10 text-green-500 border-green-500/20">Ready to withdraw</Badge>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">${data.pendingBalance.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
          <Badge className="mt-4 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Processing</Badge>
        </CardContent>
      </Card>

      <Card className="glass-effect">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold">${data.thisMonth.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
          </div>
          <div className="flex items-center mt-4">
            <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
            <span className="text-sm font-medium text-green-500">+8.2%</span>
            <span className="text-sm text-muted-foreground ml-1">vs last month</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
