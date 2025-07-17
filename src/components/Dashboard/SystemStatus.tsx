import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const statusItems = [
  { name: 'API Gateway', status: 'operational', color: 'bg-green-500' },
  { name: 'Test Runner', status: 'operational', color: 'bg-green-500' },
  { name: 'CI/CD Hooks', status: 'degraded', color: 'bg-yellow-500' },
  { name: 'Scheduler', status: 'operational', color: 'bg-green-500' },
];

export default function SystemStatus() {
  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return { text: 'Operational', color: 'text-green-600' };
      case 'degraded':
        return { text: 'Degraded', color: 'text-yellow-600' };
      case 'down':
        return { text: 'Down', color: 'text-red-600' };
      default:
        return { text: 'Unknown', color: 'text-slate-600' };
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg font-semibold text-slate-900'>
          System Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {statusItems.map((item) => {
            const statusInfo = getStatusText(item.status);
            return (
              <div
                key={item.name}
                className='flex items-center justify-between'
              >
                <div className='flex items-center space-x-3'>
                  <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                  <span className='text-sm text-slate-700'>{item.name}</span>
                </div>
                <span className={`text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.text}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
