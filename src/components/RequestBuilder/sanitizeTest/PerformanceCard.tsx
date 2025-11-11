import { Zap, Clock, AlertTriangle, TrendingUp } from 'lucide-react';

interface PerformanceCardProps {
  title: string;
  value: string;
  subtitle?: string;
  variant: 'fastest' | 'slowest' | 'failed' | 'time';
}

export function PerformanceCard({
  title,
  value,
  subtitle,
  variant,
}: PerformanceCardProps) {
  const variants = {
    fastest: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      icon: Zap,
      iconColor: 'text-blue-500',
      border: 'border-blue-200 dark:border-blue-800',
    },
    slowest: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      icon: Clock,
      iconColor: 'text-orange-500',
      border: 'border-orange-200 dark:border-orange-800',
    },
    failed: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      border: 'border-red-200 dark:border-red-800',
    },
    time: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      icon: TrendingUp,
      iconColor: 'text-green-500',
      border: 'border-green-200 dark:border-green-800',
    },
  };

  const { bg, icon: Icon, iconColor, border } = variants[variant];

  return (
    <div className={`${bg} ${border} rounded-lg p-4 border`}>
      <div className='flex items-start gap-3'>
        <div className={`${iconColor} mt-0.5`}>
          <Icon className='w-5 h-5' />
        </div>
        <div className='flex-1 min-w-0'>
          <p className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
            {title}
          </p>
          <p className='text-lg font-semibold text-gray-900 dark:text-white truncate'>
            {value}
          </p>
          {subtitle && (
            <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
