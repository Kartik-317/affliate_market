import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, Calendar, AlertCircle, Loader2 } from "lucide-react"

// --- Interface Definitions (Matching Backend Response Model) ---

interface ForecastMonth {
    month: string;
    predicted: number;
    confidence: number;
    actual: number | null;
}

interface ScenarioQuarter {
    name: string;
    description: string;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    total: number;
    probability: number;
}

interface RevenueForecastResponse {
    forecastData: ForecastMonth[];
    scenarios: ScenarioQuarter[];
    positiveIndicators: string[];
    riskFactors: string[];
}

// Minimal interfaces for component props compatibility (data is now fetched internally)
interface AffiliateEvent {
    event: string;
    network: string;
    amount?: number;
    commissionAmount?: number;
    date?: string;
    campaign?: string;
}

interface CampaignMetrics {
    revenue: number;
    commissions: number;
}

interface RevenueForecastingProps {
    events: AffiliateEvent[]; 
    campaignMetrics: { [key: string]: CampaignMetrics };
}

export function RevenueForecasting({ events, campaignMetrics }: RevenueForecastingProps) {
    const [forecastState, setForecastState] = useState<RevenueForecastResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchForecastData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch structured data from the backend endpoint
                const response = await fetch("/.netlify/functions/proxy/api/affiliate/revenue-forecast");
                
                if (!response.ok) {
                    // Attempt to parse JSON error message if available
                    const errorText = await response.text();
                    try {
                        const errorData = JSON.parse(errorText);
                        throw new Error(errorData.detail || `Server error: ${response.status}`);
                    } catch {
                        throw new Error(`Failed to fetch forecast. Status: ${response.status}`);
                    }
                }
                
                const data: RevenueForecastResponse = await response.json();
                setForecastState(data);

            } catch (err) {
                console.error("API Fetch Error:", err);
                setError((err as Error).message || "An unexpected error occurred while fetching forecast data.");
                setForecastState(null);
            } finally {
                setLoading(false);
            }
        };

        fetchForecastData();
    }, []); 

    const getConfidenceBadge = (confidence: number) => {
        if (confidence >= 90) {
            return (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">
                    High Confidence
                </Badge>
            )
        }
        if (confidence >= 80) {
            return (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    Medium Confidence
                </Badge>
            )
        }
        return (
            <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-red-500/20">
                Low Confidence
            </Badge>
        )
    }

    if (loading) {
        return (
            <Card className="glass-effect">
                <CardContent className="p-8 text-center flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                    <p className="text-lg font-medium text-muted-foreground">Generating financial forecast...</p>
                    <p className="text-sm text-muted-foreground mt-1">Analyzing historical data and running scenario models.</p>
                </CardContent>
            </Card>
        );
    }

    if (error || !forecastState) {
        return (
            <Card className="glass-effect border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-500">Forecast Error</CardTitle>
                    <CardDescription>We couldn't generate the revenue forecast.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-3 text-red-500">
                        <AlertCircle className="w-5 h-5" />
                        <p className="text-sm font-mono break-all">{error || "No forecast data available."}</p>
                    </div>
                    <Button onClick={() => window.location.reload()} className="mt-4">
                        Try Reloading
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Destructure data from the fetched state
    const { forecastData, scenarios, positiveIndicators, riskFactors } = forecastState;

    return (
        <div className="space-y-6">
            {/* Monthly Forecast */}
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle>6-Month Revenue Forecast</CardTitle>
                    <CardDescription>Predictions based on historical campaign performance</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {forecastData.map((forecast: ForecastMonth, index: number) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">{forecast.month}</h4>
                                        <p className="text-sm text-muted-foreground">Predicted Revenue</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-6">
                                    <div className="text-right">
                                        <p className="font-semibold text-lg">${forecast.predicted.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">{forecast.confidence}% confidence</p>
                                    </div>
                                    {getConfidenceBadge(forecast.confidence)}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Scenario Planning */}
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle>Scenario Planning (Next Year)</CardTitle>
                    <CardDescription>Quarterly projections based on growth hypotheses</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-6 lg:grid-cols-3">
                        {scenarios.map((scenario: ScenarioQuarter, index: number) => (
                            <div
                                key={index}
                                className={`p-6 border rounded-xl transition-shadow shadow-md ${
                                    scenario.name === "Optimistic"
                                        ? "border-blue-500/50 bg-blue-500/5 shadow-blue-500/10"
                                        : scenario.name === "Aggressive"
                                        ? "border-green-500/50 bg-green-500/5 shadow-green-500/10"
                                        : "border-border bg-card shadow-gray-500/5"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-semibold text-lg">{scenario.name}</h3>
                                    <Badge
                                        variant="secondary"
                                        className={
                                            scenario.probability >= 80
                                                ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                : scenario.probability >= 60
                                                ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                                : "bg-red-500/10 text-red-500 border-red-500/20"
                                        }
                                    >
                                        {scenario.probability}% likely
                                    </Badge>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span>Q1</span>
                                        <span className="font-medium">${scenario.q1.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Q2</span>
                                        <span className="font-medium">${scenario.q2.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Q3</span>
                                        <span className="font-medium">${scenario.q3.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Q4</span>
                                        <span className="font-medium">${scenario.q4.toLocaleString()}</span>
                                    </div>
                                    <div className="border-t border-border pt-3">
                                        <div className="flex justify-between font-semibold">
                                            <span>Total Year Projection</span>
                                            <span className="text-lg">${scenario.total.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant={scenario.name === "Optimistic" ? "default" : "outline"}
                                    size="sm"
                                    className={`w-full mt-4 ${scenario.name !== "Optimistic" ? "bg-transparent" : ""}`}
                                >
                                    View Strategy
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Key Factors */}
            <Card className="glass-effect">
                <CardHeader>
                    <CardTitle className="text-lg">Key Forecast Factors</CardTitle>
                    <CardDescription>Variables impacting revenue predictions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center space-x-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                <span>Positive Indicators</span>
                            </h4>
                            <ul className="space-y-2 text-sm">
                                {positiveIndicators.map((indicator: string, index: number) => (
                                    <li key={index} className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                                        <span>{indicator}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-3">
                            <h4 className="font-semibold flex items-center space-x-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                <span>Risk Factors</span>
                            </h4>
                            <ul className="space-y-2 text-sm">
                                {riskFactors.map((factor: string, index: number) => (
                                    <li key={index} className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        <span>{factor}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
