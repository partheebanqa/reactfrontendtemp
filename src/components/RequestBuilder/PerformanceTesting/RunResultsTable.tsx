
import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { PerformanceRunResultDTO } from "@/models/performanceTest.model";


function safeDate(v?: string) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

export function RunResultsTable({ results }: { results: PerformanceRunResultDTO[] }) {
    const [search, setSearch] = useState("");

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return results;

        return results.filter((r) => {
            const hay = [
                r.statusCode,
                r.error,
                r.requestId,
                r.testPhase,
                r.id,
                r.testRunId,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return hay.includes(q);
        });
    }, [results, search]);

    const stats = useMemo(() => {
        const total = results.length;
        const success = results.filter((r) => r.isSuccess).length;
        const rateLimited = results.filter((r) => r.isRateLimited).length;
        const failed = total - success;
        return { total, success, failed, rateLimited };
    }, [results]);

    return (
        <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <CardTitle>Results</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                        Total: {stats.total} • ✅ {stats.success} • ❌ {stats.failed} • ⛔ {stats.rateLimited} rate-limited
                    </div>
                </div>

                <div className="w-full md:w-80">
                    <Input
                        placeholder="Search by status, error, requestId..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>

            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Status</TableHead>
                                <TableHead>Time</TableHead>
                                <TableHead className="hidden md:table-cell">Phase</TableHead>
                                <TableHead className="hidden lg:table-cell">Response Time</TableHead>
                                <TableHead className="hidden lg:table-cell">Size</TableHead>
                                <TableHead className="hidden xl:table-cell">Rate Limited</TableHead>
                                <TableHead>Error</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filtered.map((r) => {
                                const t = safeDate(r.timestamp);
                                const badge =
                                    r.isSuccess ? "secondary" : r.statusCode >= 500 ? "destructive" : "outline";

                                return (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <Badge variant={badge as any}>
                                                {r.statusCode || (r.isSuccess ? "OK" : "ERR")}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-muted-foreground text-sm">
                                            {t ? format(t, "PPp") : "-"}
                                        </TableCell>

                                        <TableCell className="hidden md:table-cell">
                                            {r.testPhase || "-"}
                                        </TableCell>

                                        <TableCell className="hidden lg:table-cell">
                                            {r.responseTime} ms
                                        </TableCell>

                                        <TableCell className="hidden lg:table-cell">
                                            {r.responseSize} bytes
                                        </TableCell>

                                        <TableCell className="hidden xl:table-cell">
                                            {r.isRateLimited ? (
                                                <Badge variant="destructive">Yes</Badge>
                                            ) : (
                                                <Badge variant="outline">No</Badge>
                                            )}
                                        </TableCell>

                                        <TableCell className="max-w-[420px]">
                                            <div className="text-sm line-clamp-2 text-muted-foreground">
                                                {r.error || "-"}
                                            </div>
                                            {r.retryAfter ? (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Retry-After: {r.retryAfter}
                                                </div>
                                            ) : null}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
