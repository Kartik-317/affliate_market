import { User, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-primary">AffiliateHub</div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <HelpCircle className="h-4 w-4 mr-1" />
              Help
            </Button>

            <div className="p-2 rounded-full hover:bg-muted transition-colors">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
