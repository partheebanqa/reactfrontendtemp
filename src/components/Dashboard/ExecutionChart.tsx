import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const chartData = [
  { day: "Mon", successful: 85, failed: 15 },
  { day: "Tue", successful: 92, failed: 8 },
  { day: "Wed", successful: 88, failed: 12 },
  { day: "Thu", successful: 94, failed: 6 },
  { day: "Fri", successful: 89, failed: 11 },
  { day: "Sat", successful: 96, failed: 4 },
  { day: "Sun", successful: 91, failed: 9 },
];

export default function ExecutionChart() {
  return (
    <Card className="p-6">
      <CardHeader className="p-0 mb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            Execution Trends
          </CardTitle>
          <Select defaultValue="7days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="day" 
                stroke="#64748b"
                fontSize={11}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={11}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="successful"
                stroke="#10b981"
                strokeWidth={2}
                name="Successful Tests"
                fill="rgba(16, 185, 129, 0.1)"
              />
              <Line
                type="monotone"
                dataKey="failed"
                stroke="#ef4444"
                strokeWidth={2}
                name="Failed Tests"
                fill="rgba(239, 68, 68, 0.1)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
