import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, Play, Pause } from "lucide-react";
import { useSchedules } from "@/hooks/use-api";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { format } from "date-fns";

export default function ActiveSchedules() {
  const { currentWorkspace } = useWorkspace();
  const { data: schedules = [], isLoading } = useSchedules(currentWorkspace?.id);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-100 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeSchedules = schedules.filter((schedule: any) => schedule.isActive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Active Schedules
          </div>
          <Badge variant="secondary">{activeSchedules.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeSchedules.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No active schedules</p>
            <p className="text-sm text-gray-400">Create a schedule to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeSchedules.map((schedule: any) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{schedule.testSuite?.name || 'Unknown Test Suite'}</h4>
                    <Badge 
                      variant={schedule.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {schedule.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{schedule.cronExpression}</span>
                    </div>
                    {schedule.scheduledDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Next: {format(new Date(schedule.scheduledDate), 'MMM d, HH:mm')}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8 w-8 p-0"
                  >
                    {schedule.isActive ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}