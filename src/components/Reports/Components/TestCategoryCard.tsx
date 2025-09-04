import { ReactNode } from 'react';

interface TestCategoryCardProps {
  icon: ReactNode;
  title: string;
  total: number;
  passed: number;
  failed: number;
  warning: number;
  bgColor?: string; // e.g., bg-yellow-50
  borderColor?: string; // optional border for some boxes
}

const TestCategoryCard = ({
  icon,
  title,
  total,
  passed,
  failed,
  warning,
  bgColor = 'bg-white',
  borderColor = 'border border-gray-200',
}: TestCategoryCardProps) => {
  const progressPercent = Math.round((passed / total) * 100);

  return (
    <div
      className={`rounded-lg p-10 ${bgColor} ${borderColor} shadow-sm w-full`}
    >
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center space-x-2'>
          <div className='text-primary'>{icon}</div>
          <h3 className='text-md font-semibold'>{title}</h3>
        </div>
        <div className='text-sm text-muted-foreground font-medium'>{total}</div>
      </div>

      <div className='flex justify-between text-xs font-medium mb-1'>
        <span className='text-green-600'>{passed} Passed</span>
        <span className='text-red-500'>{failed} Failed</span>
        <span className='text-yellow-600'>{warning} Warning</span>
      </div>

      <div className='w-full bg-gray-200 h-2 rounded-full overflow-hidden'>
        <div
          className='bg-green-500 h-full'
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default TestCategoryCard;
