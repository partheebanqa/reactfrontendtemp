import RequestCard from "./RequestCard";

export interface VariableSubstitution {
    name: string;
    value: string;
    usedIn: string;
}

export interface ExtractedVarMapped {
    name: string;
    value: string;
    usedIn?: string;
}

export interface RequestTimelineItem {
    id: string;
    order: number;
    method: string;
    name: string;
    url: string;
    status: "passed" | "failed" | "skipped" | string;
    duration: number; // ms
    responseStatusCode: number;
    responseSize: number; // bytes
    requestCurl: string;
    response: string;
    substitutedVariables?: VariableSubstitution[];
    extractedVariables?: ExtractedVarMapped[];
}

interface RequestTimelineProps {
    requests: RequestTimelineItem[];
}

export default function RequestTimeline({ requests }: RequestTimelineProps) {
    const sortedRequests = [...requests].sort((a, b) => a.order - b.order);

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 bg-white rounded-lg shadow-sm mt-3 border border-gray-200">
            <h2 className="text-lg font-semibold text-foreground mb-6">
                Request Chain Execution
            </h2>
            <div className="space-y-0">
                {sortedRequests.map((request, index) => (
                    <RequestCard key={request.id} request={request} index={index} />
                ))}
            </div>
        </div>
    );
}
