// EnvironmentCard.tsx
import React from 'react';
import { Environment } from '@/shared/types/datamanagement';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Edit, Trash2, Copy, Database } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useDataManagement } from '@/hooks/useDataManagement';

type Props = {
  environment: Environment;
  onEdit: (env: Environment) => void;
  onDelete: (id: string) => void;
};

const EnvironmentCard: React.FC<Props> = ({
  environment,
  onEdit,
  onDelete,
}) => {
  const { toast } = useToast();
  const { variables } = useDataManagement();
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied to clipboard',
      description: `${label} has been copied: ${text}`,
      variant: 'success',
    });
  };

  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-4 flex-1'>
           <Database className="bg-[#fff4e6] p-2 rounded" color="#f97316" size={40} />

            <div className='flex-1'>
              <div className='flex items-center space-x-3 mb-2'>
                <h3 className="font-semibold text-lg">{environment.name}</h3>
                {environment?.isDefault && (
                  <Badge className='bg-green-100 text-green-700'>Default</Badge>
                )}
              </div>

              <p className='text-sm text-muted-foreground mb-3'>
                {environment.description}
              </p>

              {environment?.name != 'No Environment' && (
                <div className='space-y-2'>
                  <div className='flex items-center space-x-2'>
                    <span className='text-sm font-medium'>Base URL:</span>
                    <code className='bg-gray-100 px-2 py-1 rounded text-sm'>
                      {environment.baseUrl}
                    </code>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        handleCopy(environment.baseUrl, 'Base URL')
                      }
                    >
                      <Copy className='w-3 h-3' />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* <div className='flex items-center space-x-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => onEdit(environment)}
                  >
                    <Edit className='w-4 h-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit Environment</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size='sm'
                    variant='ghost'
                    onClick={() => onDelete(environment.id)}
                  >
                    <Trash2 className='w-4 h-4' />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete Environment</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div> */}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnvironmentCard;
