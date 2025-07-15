import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MethodBadgeProps {
  method: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'POST':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PUT':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELETE':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PATCH':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge
      variant='outline'
      className={`${getMethodColor(method)} font-mono text-xs font-semibold`}
    >
      {method.toUpperCase()}
    </Badge>
  );
};
