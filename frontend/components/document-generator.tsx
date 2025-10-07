import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, Eye, Plus, CheckCircle, Clock } from "lucide-react"

interface DocumentGeneratorProps {
  documents: Record<string, number>
  year: string
}

export function DocumentGenerator({ documents, year }: DocumentGeneratorProps) {
  const documentTypes = [
    {
      name: "1099-MISC",
      description: "Miscellaneous income forms for contractors",
      count: documents["1099-MISC"] || 0,
      status: "ready",
      required: true,
    },
    {
      name: "1099-NEC",
      description: "Non-employee compensation forms",
      count: documents["1099-NEC"] || 0,
      status: "ready",
      required: true,
    },
    {
      name: "Schedule C",
      description: "Profit or loss from business",
      count: documents["Schedule C"] || 0,
      status: "draft",
      required: true,
    },
    {
      name: "Form 8829",
      description: "Expenses for business use of home",
      count: documents["Form 8829"] || 0,
      status: "ready",
      required: false,
    },
    {
      name: "Schedule SE",
      description: "Self-employment tax calculation",
      count: 0,
      status: "pending",
      required: true,
    },
    {
      name: "Form 4562",
      description: "Depreciation and amortization",
      count: 0,
      status: "pending",
      required: false,
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "draft":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "pending":
        return <Clock className="w-4 h-4 text-muted-foreground" />
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
            Ready
          </Badge>
        )
      case "draft":
        return (
          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Draft
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-gray-500/10 text-gray-500 border-gray-500/20">
            Pending
          </Badge>
        )
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Tax Documents for {year}</CardTitle>
          <CardDescription>Generate and download your required tax forms and schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {documentTypes.map((doc, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg transition-colors hover:border-primary/50 ${
                  doc.required ? "border-primary/20 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      {getStatusIcon(doc.status)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold">{doc.name}</h4>
                        {doc.required && <Badge variant="outline">Required</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{doc.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {doc.count > 0 ? `${doc.count} document${doc.count > 1 ? "s" : ""}` : "Not generated"}
                  </div>
                  <div className="flex items-center space-x-2">
                    {doc.status === "ready" && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    {doc.status === "pending" && (
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Plus className="w-4 h-4 mr-1" />
                        Generate
                      </Button>
                    )}
                    {doc.status === "draft" && (
                      <Button variant="outline" size="sm" className="bg-transparent">
                        <Eye className="w-4 h-4 mr-1" />
                        Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="text-lg">Bulk Actions</CardTitle>
          <CardDescription>Generate and export multiple documents at once</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Generate All Required
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Download className="w-4 h-4 mr-2" />
              Download ZIP
            </Button>
            <Button variant="outline" className="bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Custom Document
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
