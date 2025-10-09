"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Download, Calendar, Settings, AlertCircle, CheckCircle, Globe, ExternalLink } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TaxSummary } from "@/components/tax-summary"
import { DocumentGenerator } from "@/components/document-generator"
import { ComplianceChecklist } from "@/components/compliance-checklist"
import { TaxSettings } from "@/components/tax-settings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import SignatureCanvas from "react-signature-canvas"

// Define interfaces for type safety
interface NetworkMetrics {
    name: string
    revenue: number
    pending: number
    commissions: number
    clicks: number
    conversionRate: number
    status: "active" | "warning"
    lastSync: string
    lastPayout?: string
    logo: string
}

interface TaxData {
    profile: {
        filingName: string
        tin: string
        address: string
        cityStateZip: string
    }
    payers: Array<{
        name: string
        ein: string
        ytdTotal: number
        w9Status: string
    }>
    documents: Record<string, number>
    totalIncome: number
    taxableIncome: number
    estimatedTax: number
    deductions: number
    quarterlyPayments: number
    remainingTax: number
}

interface ComplianceItem {
    id: string
    title: string
    description: string
    dueDate: string
    status: "completed" | "pending" | "overdue"
    priority: "high" | "medium" | "low"
}

interface FormData {
    w9: Record<string, string | Blob>
    "1040": Record<string, string>
    "1040-es": Record<string, string>
    "4868": Record<string, string>
    "8829": Record<string, string>
}

// Define the Networks and their URLs for the Dialog
const networksForAction = [
    { name: "Amazon Associates", url: "https://affiliate-program.amazon.in/" },
    { name: "Commission Junction", url: "https://www.cj.com/login" },
    { name: "ShareASale", url: "https://account.shareasale.com/a-plogin.cfm" },
    { name: "Rakuten Advertising", url: "https://pubhelp.rakutenadvertising.com/hc/en-us/sections/360009882472-Login" },
    { name: "ClickBank", url: "https://accounts.clickbank.com/login.htm" },
]

export default function TaxReportsPage() {
    const [activeTab, setActiveTab] = useState("overview")
    const [selectedYear, setSelectedYear] = useState("2025")
    const [unreadCount, setUnreadCount] = useState(0)
    // New state for the Network Action Dialog
    const [showNetworkDialog, setShowNetworkDialog] = useState(false)
    const [selectedComplianceAction, setSelectedComplianceAction] = useState<ComplianceItem | null>(null)
    const [selectedNetworkUrl, setSelectedNetworkUrl] = useState<string>("")
    const [taxData, setTaxData] = useState<TaxData>({
        profile: {
            filingName: "John Doe",
            tin: "123-45-6789",
            address: "123 Main St",
            cityStateZip: "Anytown, CA 12345",
        },
        payers: [
            { name: "Amazon Associates", ein: "12-3456789", ytdTotal: 2007.71, w9Status: "submitted" },
            { name: "ShareASale", ein: "98-7654321", ytdTotal: 1313.49, w9Status: "pending" },
            { name: "Commission Junction", ein: "56-7891234", ytdTotal: 1817.61, w9Status: "submitted" },
            { name: "ClickBank", ein: "34-5678901", ytdTotal: 2286.01, w9Status: "pending" },
        ],
        documents: {
            "1099-MISC": 4,
            "1099-NEC": 2,
            "Schedule C": 1,
            "Form 8829": 1,
        },
        totalIncome: 0,
        taxableIncome: 0,
        estimatedTax: 0,
        deductions: 0,
        quarterlyPayments: 0,
        remainingTax: 0,
    })
    const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
    const signatureRef = useRef<SignatureCanvas>(null)
    const { toast } = useToast()

    // Function to handle the click on the "Action" button in the checklist
    const handleActionClick = (item: ComplianceItem) => {
        setSelectedComplianceAction(item)
        setShowNetworkDialog(true)
        setSelectedNetworkUrl("") // Reset selected URL when opening
    }

    // Function to handle network selection and immediate redirection
    const handleNetworkSelectAndRedirect = (url: string) => {
        setSelectedNetworkUrl(url); // Store the URL for immediate action
        if (url) {
            window.open(url, "_blank")
            setShowNetworkDialog(false)
            toast({
                title: "Redirecting...",
                description: `Opening login page for the selected network.`,
            })
        }
    }


    // Fetch unread count and network events for tax calculations
    useEffect(() => {
        async function fetchData() {
            try {
                const notificationsResponse = await fetch("/.netlify/functions/proxy/api/affiliate/notifications")
                if (!notificationsResponse.ok) {
                    throw new Error("Failed to fetch notifications")
                }
                const notificationsData = await notificationsResponse.json()
                const unread = notificationsData.notifications.filter((n: any) => !n.read).length
                setUnreadCount(unread)

                const eventsResponse = await fetch("/.netlify/functions/proxy/api/affiliate/events")
                if (!eventsResponse.ok) {
                    throw new Error("Failed to fetch events")
                }
                const eventsData = await eventsResponse.json()

                // FIX: Calculate totalIncome using both commission and conversion amounts
                const totalIncome = eventsData.events
                    .filter((event: any) => event.event === "commission" || event.event === "conversion")
                    .reduce((sum: number, event: any) => {
                        const amount = event.commissionAmount ?? event.amount; // Use commissionAmount first, then fall back to amount
                        return typeof amount === "number" ? sum + amount : sum;
                    }, 0)

                const estimatedTax = totalIncome * 0.25
                const quarterlyPayments = estimatedTax * 0.8
                const remainingTax = estimatedTax - quarterlyPayments
                const taxableIncome = totalIncome

                setTaxData((prev) => ({
                    ...prev,
                    totalIncome,
                    taxableIncome,
                    estimatedTax,
                    deductions: 0,
                    quarterlyPayments,
                    remainingTax,
                }))
            } catch (error) {
                console.error("Error fetching data:", error)
                toast({
                    title: "Error",
                    description: "Failed to fetch tax data. Please try again.",
                    variant: "destructive",
                })
            }
        }
        fetchData()
    }, [toast])

    async function handleFillForm(formType: string) {
        let formData: Record<string, string | Blob> = {};

        // Prepare form data based on form type
        switch (formType) {
            case "w9":
                setIsSignatureDialogOpen(true);
                return; // Signature handled separately
            case "1040":
                const [firstName, ...lastNameParts] = taxData.profile.filingName.split(" ");
                const lastName = lastNameParts.join(" ");

                // Split city, state, zip
                const cityStateZipMatch = taxData.profile.cityStateZip.match(/^(.*),\s*([A-Z]{2})\s*(\d{5})$/);
                const city = cityStateZipMatch ? cityStateZipMatch[1] : "";
                const state = cityStateZipMatch ? cityStateZipMatch[2] : "";
                const zip = cityStateZipMatch ? cityStateZipMatch[3] : "";

                formData = {
                    f1_04: firstName, // First name + middle initial
                    f1_05: lastName, // Last name
                    f1_06: taxData.profile.tin,
                    f1_10: taxData.profile.address, // Street address
                    f1_12: city, // City
                    f1_13: state, // State
                    f1_14: zip,
                    "c1_3[0]": "1", // ZIP - placeholder index based on typical PDF forms
                };
                break;


            case "1040-es":
                formData = {
                    f1_01: taxData.profile.filingName,
                    f1_07: taxData.profile.address,
                    f1_08: taxData.profile.cityStateZip,
                    f2_1: String(taxData.estimatedTax), // Example: Estimated tax amount
                };
                break;
            case "4868":
                formData = {
                    f1_01: taxData.profile.filingName,
                    f1_07: taxData.profile.address,
                    f1_08: taxData.profile.cityStateZip,
                    f1_11: taxData.profile.tin.split("-")[0],
                    f1_12: taxData.profile.tin.split("-")[1],
                    f1_13: taxData.profile.tin.split("-")[2],
                };
                break;
            case "8829":
                formData = {
                    f1_01: taxData.profile.filingName,
                    f1_07: taxData.profile.address,
                    f1_08: taxData.profile.cityStateZip,
                    f2_1: String(taxData.deductions), // Example: Deduction amount
                };
                break;
            default:
                toast({
                    title: "Error",
                    description: `Form type ${formType} not supported.`,
                    variant: "destructive",
                });
                return;
        }

        try {
            const formBody = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                formBody.append(key, value);
            });

            const response = await fetch(`/.netlify/functions/proxy/api/tax/fill-pdf/${formType}`, {
                method: "POST",
                body: formBody,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to fill PDF: ${errorText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `filled_${formType}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast({
                title: "Success",
                description: `Successfully generated ${formType.toUpperCase()} form.`,
            });
        } catch (error) {
            console.error("Error filling PDF:", error);
            toast({
                title: "Error",
                description: `Failed to generate ${formType.toUpperCase()} form. Please try again.`,
                variant: "destructive",
            });
        }
    }

    const handleSignatureSubmit = async () => {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
            toast({
                title: "No Signature",
                description: "Please provide a signature before continuing.",
                variant: "destructive",
            });
            return;
        }

        let signatureDataUrl: string;
        try {
            if (typeof signatureRef.current.getTrimmedCanvas === "function") {
                signatureDataUrl = signatureRef.current.getTrimmedCanvas().toDataURL("image/png");
            } else {
                console.warn("getTrimmedCanvas not available, falling back to toDataURL");
                signatureDataUrl = signatureRef.current.toDataURL("image/png");
            }
        } catch (error) {
            console.error("Error capturing signature:", error);
            toast({
                title: "Error",
                description: "Failed to capture signature. Please try again.",
                variant: "destructive",
            });
            return;
        }

        const signatureBlob = await (await fetch(signatureDataUrl)).blob();

        const formData = {
            w9: {
                f1_01: taxData.profile.filingName,
                f1_02: "",
                f1_07: taxData.profile.address,
                f1_08: taxData.profile.cityStateZip,
                f1_11: taxData.profile.tin.split("-")[0],
                f1_12: taxData.profile.tin.split("-")[1],
                f1_13: taxData.profile.tin.split("-")[2],
                c1_1: "Yes",
                signature: signatureBlob,
                date: new Date().toISOString().split("T")[0],
            },
        };

        try {
            const formBody = new FormData();
            Object.entries(formData.w9).forEach(([key, value]) => {
                if (value instanceof Blob) {
                    formBody.append(key, value, "signature.png");
                } else {
                    formBody.append(key, value);
                }
            });

            const response = await fetch("/.netlify/functions/proxy/api/tax/fill-pdf/w9", {
                method: "POST",
                body: formBody,
            });
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`Server responded with ${response.status}: ${errorText}`);
                throw new Error(`Failed to fill W-9 PDF: ${errorText}`);
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "filled_w9.pdf");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast({
                title: "Success",
                description: "Successfully generated W-9 form.",
            });
        } catch (error) {
            console.error("Error filling W-9 PDF:", error);
            toast({
                title: "Error",
                description: "Failed to generate W-9 form. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSignatureDialogOpen(false);
            if (signatureRef.current) {
                signatureRef.current.clear();
            }
        }
    }

    const clearSignature = () => {
        if (signatureRef.current) {
            signatureRef.current.clear();
        }
    }

    const complianceItems: ComplianceItem[] = [
        {
            id: "1",
            title: "Submit W-9 to Payers",
            description: "Provide W-9 to all affiliate networks for tax reporting",
            dueDate: "2025-12-31",
            status: "pending",
            priority: "high",
        },
        {
            id: "2",
            title: "Form 1040 (with Schedule C & SE)",
            description: "Annual income tax return and self-employment tax",
            dueDate: "2026-04-15",
            status: "pending",
            priority: "high",
        },
        {
            id: "3",
            title: "Form 1040-ES",
            description: "Quarterly estimated tax payments (Q4 2025 due Jan 15, 2026)",
            dueDate: "2026-01-15",
            status: "pending",
            priority: "high",
        },
        {
            id: "4",
            title: "Form 4868",
            description: "Extension for filing 2025 tax return (if needed)",
            dueDate: "2026-04-15",
            status: "pending",
            priority: "medium",
        },
        {
            id: "5",
            title: "Form 8829",
            description: "Home office deduction (if applicable)",
            dueDate: "2026-04-15",
            status: "pending",
            priority: "low",
        },
        {
            id: "6",
            title: "State Tax Forms",
            description: "State-specific tax return (e.g., CA Form 540)",
            dueDate: "2026-04-15",
            status: "pending",
            priority: "medium",
        },
        {
            id: "7",
            title: "Business License Renewal",
            description: "Annual business license renewal required",
            dueDate: "2025-12-31",
            status: "pending",
            priority: "medium",
        },
        {
            id: "8",
            title: "Sales Tax Filing",
            description: "Monthly sales tax return filing",
            dueDate: "2025-10-20",
            status: "pending",
            priority: "high",
        },
        {
            id: "9",
            title: "Record Keeping Review",
            description: "Annual review of business records and receipts",
            dueDate: "2025-12-31",
            status: "pending",
            priority: "low",
        },
    ]

    return (
        <DashboardLayout unreadCount={unreadCount}>
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3 text-balance">
                            <FileText className="w-8 h-8 text-primary" />
                            Tax & Compliance
                            {unreadCount > 0 && <Badge className="bg-primary text-primary-foreground">{unreadCount} new</Badge>}
                        </h1>
                        <p className="text-muted-foreground">Automated tax reporting and compliance management</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Calendar className="w-4 h-4 mr-2" />
                            {selectedYear}
                        </Button>
                        <Button variant="outline" size="sm">
                            <Settings className="w-4 h-4 mr-2" />
                            Settings
                        </Button>
                        <Button size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export All
                        </Button>
                    </div>
                </div>

                <TaxSummary data={taxData} year={selectedYear} />

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="compliance">Compliance</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle>Tax Breakdown by Quarter</CardTitle>
                                        <CardDescription>Your tax obligations and payments throughout the year</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {["Q1", "Q2", "Q3", "Q4"].map((quarter, index) => {
                                                const income = taxData.totalIncome / 4
                                                const tax = taxData.estimatedTax / 4
                                                const paid = index < 2 ? tax : index === 2 ? tax * 0.8 : 0
                                                const remaining = tax - paid

                                                return (
                                                    <div
                                                        key={quarter}
                                                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                                                    >
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                                                <span className="font-bold text-primary">{quarter}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold">{quarter} 2025</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Income: ${income.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-semibold">
                                                                ${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </p>
                                                            <div className="flex items-center space-x-2 text-sm">
                                                                {remaining > 0 ? (
                                                                    <>
                                                                        <span className="text-red-500">
                                                                            Due: ${remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                        </span>
                                                                        <AlertCircle className="w-4 h-4 text-red-500" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-green-500">Paid</span>
                                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button className="w-full justify-start" onClick={() => handleFillForm("w9")}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Fill W-9
                                        </Button>
                                        <Button className="w-full justify-start" onClick={() => handleFillForm("1040")}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Form 1040
                                        </Button>
                                        <Button className="w-full justify-start" onClick={() => handleFillForm("1040-es")}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Form 1040-ES
                                        </Button>
                                        <Button className="w-full justify-start" onClick={() => handleFillForm("4868")}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Form 4868
                                        </Button>
                                        <Button className="w-full justify-start" onClick={() => handleFillForm("8829")}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Form 8829
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start bg-transparent">
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export Tax Summary
                                        </Button>
                                        <Button variant="outline" className="w-full justify-start bg-transparent">
                                            <Calendar className="w-4 h-4 mr-2" />
                                            Schedule Consultation
                                        </Button>
                                    </CardContent>
                                </Card>

                                <Card className="glass-effect">
                                    <CardHeader>
                                        <CardTitle className="text-lg">Next Deadline</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center">
                                            <p className="text-2xl font-bold text-red-500">2025-10-20</p>
                                            <p className="text-sm text-muted-foreground mt-1">Sales Tax Filing</p>
                                            <Badge variant="secondary" className="mt-3 bg-red-500/10 text-red-500 border-red-500/20">
                                                21 days remaining
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6">
                        <DocumentGenerator documents={taxData.documents} year={selectedYear} />
                    </TabsContent>

                    <TabsContent value="compliance" className="space-y-6">
                        <ComplianceChecklist items={complianceItems} onActionClick={handleActionClick} />
                    </TabsContent>

                    <TabsContent value="settings" className="space-y-6">
                        <TaxSettings />
                    </TabsContent>
                </Tabs>

                <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Sign Your W-9</DialogTitle>
                            <DialogDescription>
                                Please draw your signature below to include in the W-9 form certification section.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="border border-gray-300 rounded-md">
                                <SignatureCanvas
                                    ref={signatureRef}
                                    canvasProps={{
                                        className: "w-full h-32",
                                        style: { background: "#fff" },
                                    }}
                                    penColor="black"
                                />
                            </div>
                            <Button variant="outline" onClick={clearSignature}>
                                Clear Signature
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSignatureSubmit}>
                                Continue
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                {/* UPDATED: Network List Dialog */}
                <Dialog open={showNetworkDialog} onOpenChange={setShowNetworkDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Action: {selectedComplianceAction?.title || 'External Action'}</DialogTitle>
                            <DialogDescription>
                                Select an affiliate network below to be instantly redirected to its login page and perform this task.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                            {networksForAction.map((network) => (
                                <Card
                                    key={network.name}
                                    className="cursor-pointer hover:bg-muted transition-colors"
                                    onClick={() => handleNetworkSelectAndRedirect(network.url)}
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Globe className="w-5 h-5 text-primary" />
                                            <div>
                                                <p className="font-semibold text-sm">{network.name}</p>
                                                <p className="text-xs text-muted-foreground">{new URL(network.url).hostname}</p>
                                            </div>
                                        </div>
                                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowNetworkDialog(false)}>
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    )
}