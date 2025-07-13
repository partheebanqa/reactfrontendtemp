import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Link, Clock } from "lucide-react";

export default function QuickActions() {
  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-4">
        <CardTitle className="text-lg font-semibold text-slate-900">
          Quick Create
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Plus className="text-blue-600" size={14} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">New Test Suite</p>
                <p className="text-xs text-slate-500">Create a collection of tests</p>
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Link className="text-purple-600" size={14} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Request Chain</p>
                <p className="text-xs text-slate-500">Link multiple API calls</p>
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start h-auto p-4 border border-slate-200 hover:bg-slate-50"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="text-green-600" size={14} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-slate-900">Schedule</p>
                <p className="text-xs text-slate-500">Set up automated runs</p>
              </div>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
