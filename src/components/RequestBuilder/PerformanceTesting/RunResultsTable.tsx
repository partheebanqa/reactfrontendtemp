import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, FileDown, Eye } from "lucide-react";
import {
    Table, TableBody, TableCell, TableHead,
    TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function RunResultsTable({ results }: any) {
    const [search, setSearch] = useState("");
    const [selectedBody, setSelectedBody] = useState<string | null>(null);

    const filtered = useMemo(() => {
        const q = search.toLowerCase();
        if (!q) return results;
        return results.filter((r: any) =>
            `${r.statusCode} ${r.id} ${r.testPhase}`.toLowerCase().includes(q)
        );
    }, [results, search]);

    const downloadCSV = () => {
        const header = Object.keys(results[0]).join(",");
        const rows = results.map((r: any) =>
            Object.values(r).map((v) => `"${String(v ?? "")}"`).join(",")
        );
        const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "performance-results.csv";
        a.click();
    };

    return (
        <>
            <div className="flex justify-between mb-3 gap-3">
                <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-xs"
                />
                <Button variant="secondary" onClick={downloadCSV}>
                    <FileDown className="h-4 w-4 mr-2" />
                    Download CSV
                </Button>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Response</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {filtered.map((r: any) => (
                        <TableRow key={r.id}>
                            <TableCell>
                                <Badge variant={r.isSuccess ? "secondary" : "destructive"}>
                                    {r.statusCode}
                                </Badge>
                            </TableCell>

                            <TableCell>
                                {/* {format(new Date(r?.timestamp), "HH:mm:ss")} */}
                            </TableCell>

                            <TableCell>{r.responseTime} ms</TableCell>
                            <TableCell>{r.responseSize} B</TableCell>

                            <TableCell>
                                {r.isRateLimited ? (
                                    <Badge variant="destructive">Yes</Badge>
                                ) : (
                                    <Badge variant="outline">No</Badge>
                                )}
                            </TableCell>

                            <TableCell className="flex gap-2">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => navigator.clipboard.writeText(r.requestCurl)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>

                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setSelectedBody(r.responseBody)}
                                >
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Response Body Modal */}
            <Dialog open={!!selectedBody} onOpenChange={() => setSelectedBody(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Response Body</DialogTitle>
                    </DialogHeader>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-auto max-h-[500px]">
                        {selectedBody}
                    </pre>
                </DialogContent>
            </Dialog>
        </>
    );
}
