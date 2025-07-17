import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  iconBgColor?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  description,
  iconBgColor = 'bg-blue-100',
}: StatsCardProps) {
  return (
    <Card className='p-6 hover:shadow-md transition-shadow'>
      <CardContent className='p-0'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-slate-600'>{title}</p>
            <p className='text-3xl font-bold text-slate-900 mt-2'>{value}</p>
          </div>
          <div
            className={`w-12 h-12 ${iconBgColor} rounded-lg flex items-center justify-center text-xl`}
          >
            {icon}
          </div>
        </div>
        {(change || description) && (
          <div className='mt-4 flex items-center text-sm'>
            {change && (
              <span
                className={
                  changeType === 'positive'
                    ? 'text-green-600 font-medium'
                    : changeType === 'negative'
                    ? 'text-red-600 font-medium'
                    : 'text-slate-600 font-medium'
                }
              >
                {change}
              </span>
            )}
            {description && (
              <span className={`text-slate-500 ${change ? 'ml-2' : ''}`}>
                {description}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
