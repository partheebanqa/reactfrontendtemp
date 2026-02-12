import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RunSummaryCard({ summary }: { summary: any }) {
    return (
        <Card className="space-y-4">
            <CardContent className="p-4 space-y-4">
                {/* Top Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <Metric label="Total Requests" value={summary.totalRequests} />
                    <Metric label="Avg Response" value={`${summary.avgResponseTime} ms`} />
                    <Metric label="P95" value={`${summary.p95ResponseTime} ms`} />
                    <Metric label="Throughput" value={`${summary.throughput.toFixed(2)} req/s`} />
                    <Metric label="Duration" value={`${summary.totalDuration.toFixed(2)} s`} />
                </div>

                {/* Status */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">✅ {summary.successfulRequests}</Badge>
                    <Badge variant="destructive">❌ {summary.failedRequests}</Badge>
                    {summary.rateLimitDetected && (
                        <Badge variant="outline">⛔ Rate Limited</Badge>
                    )}
                </div>

                {/* Error Breakdown */}
                {summary.errorBreakdown &&
                    Object.entries(summary.errorBreakdown).map(([code, count]) => (
                        <Badge key={code} variant="destructive">
                            {code}: {count as number}
                        </Badge>
                    ))}
            </CardContent>
        </Card>
    );
}

function Metric({ label, value }: any) {
    return (
        <div>
            <div className="text-muted-foreground">{label}</div>
            <div className="font-semibold">{value}</div>
        </div>
    );
}
