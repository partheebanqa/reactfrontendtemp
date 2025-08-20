import { Calendar, Clock, Globe, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ExecutionMeta {
  environment: string;
  executedAt: string;
  duration: string;
  executedBy: string;
}

interface Stat {
  value: string;
  label: string;
  bgColor: string; // e.g., 'bg-[#F5F8FF]'
  textColor: string; // e.g., 'text-blue-800'
}

export interface AnalyticsReportProps {
  title: string;
  description: string;
  successRate: string;
  meta: ExecutionMeta;
  stats: Stat[];
}

const AnalyticsReport: React.FC<AnalyticsReportProps> = ({
  title,
  description,
  successRate,
  meta,
  stats,
}) => {
  return (
    <div className='border border-gray-200 bg-background mt-5 rounded-lg'>
      <main className='p-6'>
        {/* Report Overview Card */}
        <Card className='mb-6 border border-border rounded-lg shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex justify-between items-start flex-col md:flex-row'>
              <div className='flex-1'>
                <h2 className='text-2xl font-bold text-foreground mb-1'>
                  {title}
                </h2>
                <p className='text-muted-foreground mb-4'>{description}</p>
                <div className='flex flex-wrap items-center gap-6 text-sm text-muted-foreground'>
                  <div className='flex items-center'>
                    <Globe className='h-4 w-4 mr-2' />
                    Environment:{' '}
                    <span className='font-medium ml-1'>{meta.environment}</span>
                  </div>
                  <div className='flex items-center'>
                    <Calendar className='h-4 w-4 mr-2' />
                    Executed:{' '}
                    <span className='font-medium ml-1'>{meta.executedAt}</span>
                  </div>
                  <div className='flex items-center'>
                    <Clock className='h-4 w-4 mr-2' />
                    Duration:{' '}
                    <span className='font-medium ml-1'>{meta.duration}</span>
                  </div>
                  <div className='flex items-center'>
                    <User className='h-4 w-4 mr-2' />
                    By:{' '}
                    <span className='font-medium ml-1'>{meta.executedBy}</span>
                  </div>
                </div>
              </div>

              <div className='mt-4 md:mt-0 md:ml-6'>
                <div className='bg-yellow-100 rounded-lg p-3 text-center w-28'>
                  <div className='text-xl font-bold text-yellow-700'>
                    {successRate}
                  </div>
                  <div className='text-xs text-yellow-700 font-medium'>
                    Success Rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Section */}
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-lg px-4 py-6 text-center ${stat.bgColor}`}
            >
              <div className={`text-3xl font-bold mb-2 ${stat.textColor}`}>
                {stat.value}
              </div>
              <div className={`text-sm font-medium ${stat.textColor}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AnalyticsReport;
