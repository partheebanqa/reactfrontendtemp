import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dot } from "lucide-react";
import { RequestChain } from "@/shared/types/requestChain.model";

type PreviewProps = {
  open: boolean;
  onClose: () => void;
  chain: RequestChain | null;
};

const envClasses = (name?: string) => {
  const n = (name ?? "").toLowerCase();
  if (!name || name === "No Environment") return "bg-gray-100 text-gray-700 border-gray-200";
  if (n.includes("prod")) return "bg-green-100 text-green-800 border-green-200";
  if (n.includes("stage")) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (n.includes("dev")) return "bg-blue-100 text-blue-800 border-blue-200";
  return "bg-slate-100 text-slate-800 border-slate-200";
};

const envDot = (name?: string) => {
  const n = (name ?? "").toLowerCase();
  if (!name || name === "No Environment") return "bg-gray-500";
  if (n.includes("prod")) return "bg-green-600";
  if (n.includes("stage")) return "bg-yellow-600";
  if (n.includes("dev")) return "bg-blue-600";
  return "bg-slate-600";
};

const methodBadge = (method?: string) => {
  const m = (method ?? "").toUpperCase();
  switch (m) {
    case "GET": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "POST": return "bg-blue-100 text-blue-800 border-blue-200";
    case "PUT": return "bg-amber-100 text-amber-800 border-amber-200";
    case "DELETE": return "bg-rose-100 text-rose-800 border-rose-200";
    default: return "bg-slate-100 text-slate-800 border-slate-200";
  }
};

export function RequestChainPreviewDialog({ open, onClose, chain }: PreviewProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {chain ? `View Request Chain: ${chain.name}` : "View Request Chain"}
          </DialogTitle>
          <DialogDescription />
        </DialogHeader>

        {chain && (
          <div className="space-y-6">
            {/* Top meta row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Name</p>
                <p className="font-medium">{chain.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Status</p>
                <Badge
                  variant={chain.enabled ? "default" : "secondary"}
                  className={chain.enabled ? "bg-green-100 text-green-800" : ""}
                >
                  {chain.enabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-muted-foreground mb-1">Environment</p>
                <Badge variant="outline" className={`inline-flex items-center gap-1 ${envClasses(chain.environment?.name)}`}>
                  <span className={`h-2 w-2 rounded-full ${envDot(chain.environment?.name)}`} />
                  {chain.environment?.name || "No Environment"}
                </Badge>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm">{chain.description || "-"}</p>
            </div>

            {/* Request sequence */}
           <div>
  <p className="text-sm font-medium mb-3">Request Sequence</p>
  <div className="space-y-3 max-h-64 overflow-auto pr-2">
    {chain.chainRequests?.map((req, idx) => {
      const method = req?.method;
      const url = req?.url ?? "";
      return (
        <div key={req.id ?? idx} className="flex items-start gap-3">
          {/* Index pill */}
          <div className="h-6 w-6 flex items-center justify-center rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mt-0.5">
            {idx + 1}
          </div>

          {/* Row content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={methodBadge(method)}>
                {method?.toUpperCase() || "REQ"}
              </Badge>
              <p className="font-medium truncate">
                {req.name || "Untitled step"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[550px]">
  {url}
</p>

          </div>
        </div>
      );
    })}

    {(!chain.chainRequests || chain.chainRequests.length === 0) && (
      <p className="text-xs text-muted-foreground">
        No steps in this chain.
      </p>
    )}
  </div>
</div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
