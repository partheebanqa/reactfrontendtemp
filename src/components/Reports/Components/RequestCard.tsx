import { Badge } from "@/components/ui/badge";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VariableTable from "./VariableTable";
import CodeBlock from "../CodeBlock";
import { RequestTimelineItem } from "./RequestTimeline";

interface RequestCardProps {
    request: RequestTimelineItem;
    index: number;
}

export default function RequestCard({ request, index }: RequestCardProps) {
    const getMethodColor = (method: string) => {
        switch (method) {
            case "GET":
                return "bg-blue-500/10 text-blue-700 border-blue-500/20";
            case "POST":
                return "bg-green-500/10 text-green-700 border-green-500/20";
            case "PUT":
                return "bg-orange-500/10 text-orange-700 border-orange-500/20";
            case "DELETE":
                return "bg-red-500/10 text-red-700 border-red-500/20";
            case "PATCH":
                return "bg-purple-500/10 text-purple-700 border-purple-500/20";
            default:
                return "bg-muted text-muted-foreground";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "passed":
                return "default";
            case "failed":
                return "destructive";
            case "skipped":
                return "secondary";
            default:
                return "secondary";
        }
    };

    const formatBytes = (bytes: number) => {
        if (!bytes || bytes < 1024) return `${bytes} B`;
        return `${(bytes / 1024).toFixed(2)} KB`;
    };

    const formatResponse = (response: string) => {
        if (!response) return "";
        try {
            return JSON.stringify(JSON.parse(response), null, 2);
        } catch {
            return response;
        }
    };

    const hasSubstituted =
        request.substitutedVariables &&
        request.substitutedVariables.length > 0;
    const hasExtracted =
        request.extractedVariables && request.extractedVariables.length > 0;

    return (
        <div className="relative pl-8" data-testid={`request-card-${index}`}>
            {/* Timeline line + dot */}
            <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border" />
            <div className="absolute left-0 top-6 w-3 h-3 rounded-full bg-primary border-2 border-background -translate-x-[5px]" />

            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value={request.id} className="border-none">
                    <AccordionTrigger
                        className="hover:no-underline py-0 hover-elevate rounded-md"
                        data-testid={`accordion-trigger-${index}`}
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-4 w-full">
                            <div className="flex items-center gap-3 flex-1">
                                <span className="text-sm font-medium text-muted-foreground min-w-[2rem]">
                                    #{request.order}
                                </span>
                                <Badge
                                    className={`text-xs font-mono uppercase border ${getMethodColor(
                                        request.method
                                    )}`}
                                >
                                    {request.method}
                                </Badge>
                                <span
                                    className="font-medium text-foreground"
                                    data-testid={`text-request-name-${index}`}
                                >
                                    {request.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <Badge
                                    variant={getStatusColor(request.status)}
                                    className="text-xs uppercase"
                                    data-testid={`badge-status-${index}`}
                                >
                                    {request.status}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    {request.duration}ms
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {request.responseStatusCode}
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-6">
                        <div className="px-4 space-y-4">
                            {/* Top details grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <span className="text-muted-foreground">URL:</span>
                                    <p
                                        className="font-mono text-xs text-foreground break-all mt-1"
                                        data-testid={`text-url-${index}`}
                                    >
                                        {request.url}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Status Code:</span>
                                    <p className="font-medium text-foreground mt-1">
                                        {request.responseStatusCode}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Response Size:</span>
                                    <p className="font-medium text-foreground mt-1">
                                        {formatBytes(request.responseSize)}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Duration:</span>
                                    <p className="font-medium text-foreground mt-1">
                                        {request.duration}ms
                                    </p>
                                </div>
                            </div>

                            {/* Tabs */}
                            <Tabs defaultValue={request.requestCurl ? "curl" : "response"} className="w-full">
                                <TabsList>
                                    {request.requestCurl && (
                                        <TabsTrigger
                                            value="curl"
                                            data-testid={`tab-curl-${index}`}
                                        >
                                            cURL Command
                                        </TabsTrigger>
                                    )}
                                    <TabsTrigger
                                        value="response"
                                        data-testid={`tab-response-${index}`}
                                    >
                                        Response
                                    </TabsTrigger>
                                    {hasSubstituted && (
                                        <TabsTrigger
                                            value="substituted"
                                            data-testid={`tab-substituted-${index}`}
                                        >
                                            Used Variables ({request.substitutedVariables!.length})
                                        </TabsTrigger>
                                    )}
                                    {hasExtracted && (
                                        <TabsTrigger
                                            value="variables"
                                            data-testid={`tab-variables-${index}`}
                                        >
                                            Extracted Variables ({request.extractedVariables!.length})
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {request.requestCurl && (
                                    <TabsContent value="curl" className="mt-4">
                                        <CodeBlock
                                            code={request.requestCurl}
                                            testId={`code-curl-${index}`}
                                        />
                                    </TabsContent>
                                )}

                                <TabsContent value="response" className="mt-4">
                                    <CodeBlock
                                        code={formatResponse(request.response)}
                                        language="json"
                                        testId={`code-response-${index}`}
                                    />
                                </TabsContent>

                                {hasSubstituted && (
                                    <TabsContent value="substituted" className="mt-4">
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="bg-muted px-4 py-3 border-b">
                                                <h4 className="text-sm font-semibold text-foreground">
                                                    Variable Substitutions
                                                </h4>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Variables from previous requests used in this request
                                                </p>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table
                                                    className="w-full text-sm"
                                                    data-testid={`table-substituted-${index}`}
                                                >
                                                    <thead className="border-b bg-muted/50">
                                                        <tr className="text-left">
                                                            <th className="py-3 px-4 font-medium text-muted-foreground">
                                                                Variable Name
                                                            </th>
                                                            <th className="py-3 px-4 font-medium text-muted-foreground">
                                                                Value
                                                            </th>
                                                            <th className="py-3 px-4 font-medium text-muted-foreground">
                                                                Used In
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {request.substitutedVariables!.map(
                                                            (variable: any, vIndex: any) => (
                                                                <tr
                                                                    key={vIndex}
                                                                    className="border-b last:border-0 hover-elevate"
                                                                    data-testid={`substituted-row-${index}-${vIndex}`}
                                                                >
                                                                    <td className="py-3 px-4 font-mono text-xs text-foreground font-medium">
                                                                        {variable.name}
                                                                    </td>
                                                                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground max-w-md truncate">
                                                                        {variable.value.slice(0, 100)}
                                                                        {variable.value.length > 100 && "..."}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-xs text-muted-foreground">
                                                                        {variable.usedIn}
                                                                    </td>
                                                                </tr>
                                                            )
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </TabsContent>
                                )}

                                {hasExtracted && (
                                    <TabsContent value="variables" className="mt-4">
                                        <VariableTable
                                            variables={request.extractedVariables!}
                                            title="Extracted Variables"
                                            testId={`table-extracted-${index}`}
                                        />
                                    </TabsContent>
                                )}
                            </Tabs>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
