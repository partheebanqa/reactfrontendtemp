import React, { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

function formatMs(ms: number) {
    if (ms < 1000) return `${ms.toFixed(0)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
}

// function statusVariant(status: string) {
//     if (status === "COMPLETED") return "secondary";
//     if (status === "FAILED") return "destructive";
//     if (status === "RUNNING") return "secondary";
//     return "outline";
// }

function statusVariant(status: string) {
    switch (status) {
        case "COMPLETED":
            return "bg-emerald-100 text-emerald-700 border-emerald-200";

        case "FAILED":
            return "bg-rose-100 text-rose-700 border-rose-200";

        case "RUNNING":
            return "bg-blue-500 text-white border-blue-800 animate-pulse shadow-sm";

        default:
            return "bg-gray-100 text-gray-600 border-gray-200";
    }
}

export function RunDetailsInline({
    data,
    loading,
}: {
    data: any;
    loading?: boolean;
}) {
    const errors = useMemo(() => {
        const breakdown = data?.errorBreakdown || {};
        return Object.entries(breakdown)
            .filter(([, count]) => Number(count) > 0)
            .sort((a, b) => Number(b[1]) - Number(a[1]));
    }, [data]);

    const successRate =
        data.totalRequests > 0 ? (data.successfulRequests / data.totalRequests) * 100 : 0;

    console

    return (
        <div className="space-y-4">
            {/* Status Row */}
            <div className="flex items-center gap-2">
                {loading ? (
                    <Badge className={statusVariant(data.status)}>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Updating...
                    </Badge>
                ) : (
                    <Badge
                        className={statusVariant(data.status)}
                    >
                        {data.status}
                    </Badge>
                )}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Requests</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="text-2xl font-semibold">{data.totalRequests}</div>
                        <div className="text-sm text-muted-foreground">
                            ✅ {data.successfulRequests} • ❌ {data.failedRequests}
                        </div>
                        <div className="text-sm">
                            Success rate: <span className="font-medium">{successRate.toFixed(1)}%</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Latency</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="text-2xl font-semibold">{formatMs(data.avgResponseTime)}</div>
                        <div className="text-sm text-muted-foreground">
                            Min {formatMs(data.minResponseTime)} • Max {formatMs(data.maxResponseTime)}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">Throughput</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="text-2xl font-semibold">{Number(data.throughput).toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">req/sec</div>
                    </CardContent>
                </Card>
            </div>

            {/* Rate limit */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Rate limiting</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                    {data.rateLimitDetected ? (
                        <div>
                            Detected — first at #{data.firstRateLimitAt}, count {data.rateLimitedCount}
                        </div>
                    ) : (
                        <div className="text-muted-foreground">Not detected</div>
                    )}
                </CardContent>
            </Card>

            {/* Errors */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-muted-foreground">Error breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    {errors.length === 0 ? (
                        <div className="text-sm text-muted-foreground">No errors recorded.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Error</TableHead>
                                        <TableHead className="text-right">Count</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {errors.map(([key, count]) => (
                                        <TableRow key={key}>
                                            <TableCell className="font-medium">{key}</TableCell>
                                            <TableCell className="text-right">{Number(count)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
