import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MethodBadgeProps {
  method: string;
  className?: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({
  method,
  className,
}) => {
  const getMethodStyles = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'bg-success/10 text-success border-success/20 hover:bg-success/20';
      case 'POST':
        return 'bg-info/10 text-info border-info/20 hover:bg-info/20';
      case 'PUT':
        return 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20';
      case 'DELETE':
        return 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20';
      default:
        return 'bg-muted/10 text-muted-foreground border-muted/20 hover:bg-muted/20';
    }
  };

  return (
    <Badge
      variant='outline'
      className={cn(
        'font-mono text-xs font-semibold',
        getMethodStyles(method),
        className
      )}
    >
      {method.toUpperCase()}
    </Badge>
  );
};
