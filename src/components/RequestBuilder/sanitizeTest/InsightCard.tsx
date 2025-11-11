import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import type { Insight } from '@/shared/types/testInsights';

interface InsightCardProps {
  type: Insight['type'];
  message: string;
  severity: Insight['severity'];
}

export function InsightCard({ type, message, severity }: InsightCardProps) {
  const icons = {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
  };

  const bgColors = {
    error: 'bg-red-50 dark:bg-red-900/20',
    warning: 'bg-orange-50 dark:bg-orange-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-green-50 dark:bg-green-900/20',
  };

  const iconColors = {
    error: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500',
    success: 'text-green-500',
  };

  const severityColors = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    medium:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };

  const Icon = icons[type];

  return (
    <div
      className={`${bgColors[type]} rounded-lg p-4 border border-${
        type === 'error'
          ? 'red'
          : type === 'warning'
          ? 'orange'
          : type === 'info'
          ? 'blue'
          : 'green'
      }-200 dark:border-${
        type === 'error'
          ? 'red'
          : type === 'warning'
          ? 'orange'
          : type === 'info'
          ? 'blue'
          : 'green'
      }-800`}
    >
      <div className='flex gap-3'>
        <Icon className={`w-5 h-5 ${iconColors[type]} flex-shrink-0 mt-0.5`} />
        <div className='flex-1 space-y-2'>
          <p className='text-sm text-gray-800 dark:text-gray-200'>{message}</p>
          <span
            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${severityColors[severity]} capitalize`}
          >
            {severity}
          </span>
        </div>
      </div>
    </div>
  );
}
