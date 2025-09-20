import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Edit,
  Trash2,
  Zap,
  Settings,
  Hash,
  Type,
  ToggleLeft,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';

interface DynamicVariable {
  id: string;
  workspaceId: string;
  name: string;
  generatorId: string;
  generatorName: string;
  parameters: Record<string, any>;
  type: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

interface Environment {
  id: string;
  name: string;
}

interface DynamicVariableCardProps {
  variables: DynamicVariable[];
  environments: Environment[];
  handleCopy: (text: string) => void;
  onEdit: (v: DynamicVariable) => void;
  onDelete: (id: string, label: string) => void;
}

const DynamicVariableCard: React.FC<DynamicVariableCardProps> = ({
  variables,
  environments,
  handleCopy,
  onEdit,
  onDelete,
}) => {
  const getVariableIcon = (type: string) => {
    switch (type) {
      case 'number':
        return <Hash className='w-4 h-4 text-purple-500' />;
      case 'string':
        return <Type className='w-4 h-4 text-blue-500' />;
      case 'boolean':
        return <ToggleLeft className='w-4 h-4 text-green-500' />;
      default:
        return <Zap className='w-4 h-4 text-orange-500' />;
    }
  };

  const getBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'custom':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300';
      case 'system':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'user':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatParameters = (parameters?: Record<string, any> | null) => {
    if (!parameters) return '';
    return Object.entries(parameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
  };

  const generateSampleValue = (variable: DynamicVariable) => {
    switch (variable.generatorId) {
      case 'randomInteger':
        const min = variable.parameters.min || 0;
        const max = variable.parameters.max || 100;
        return Math.floor(Math.random() * (max - min + 1)) + min;
      case 'randomString':
        const length = variable.parameters.length || 8;
        return Math.random()
          .toString(36)
          .substring(2, 2 + length);
      case 'randomBoolean':
        return Math.random() > 0.5;
      default:
        return 'Generated Value';
    }
  };

  return (
    <div className='grid gap-4'>
      {variables.map((variable) => (
        <Card
          key={variable.id}
          className='hover:shadow-md transition-shadow border-l-4 border-l-orange-500'
        >
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4 flex-1'>
                {getVariableIcon(variable.type)}
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-1'>
                    <h4 className='font-semibold flex items-center gap-2'>
                      {variable.name}
                      {/* Copy Variable Name Buttons */}
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleCopy(variable.name)}
                        title='Copy variable name'
                        className='p-1 h-auto'
                      >
                        <Copy className='w-3 h-3' />
                      </Button>
                    </h4>
                    <Badge
                      variant='secondary'
                      className='bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                    >
                      <Zap className='w-3 h-3 mr-1' />
                      Dynamic
                    </Badge>
                    <Badge
                      variant='outline'
                      className={getBadgeColor(variable.category)}
                    >
                      {variable.category}
                    </Badge>
                    <Badge
                      variant='outline'
                      className='text-purple-600 border-purple-600'
                    >
                      {variable.type}
                    </Badge>
                  </div>

                  <div className='space-y-2 mb-2'>
                    <div className='flex items-center space-x-2'>
                      <span className='text-xs text-muted-foreground font-medium'>
                        Generator:
                      </span>
                      <code className='px-2 py-1 rounded text-sm bg-gray-50 dark:bg-gray-950 text-gray-700 dark:text-gray-300'>
                        {variable.generatorName}
                      </code>
                    </div>
                    {Object.keys(variable.parameters ?? {}).length > 0 && (
                      <div className='flex items-center space-x-2'>
                        <span className='text-xs text-muted-foreground font-medium'>
                          Parameters:
                        </span>
                        <code className='px-2 py-1 rounded text-sm bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'>
                          {formatParameters(variable.parameters)}
                        </code>
                      </div>
                    )}

                    {/* <div className='flex items-center space-x-2'>
                      <span className='text-xs text-muted-foreground font-medium'>
                        Sample:
                      </span>
                      <code className='px-2 py-1 rounded text-sm bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'>
                        {generateSampleValue(variable)}
                      </code>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() =>
                          handleCopy(generateSampleValue(variable).toString())
                        }
                        title='Copy sample value'
                      >
                        <Copy className='w-3 h-3' />
                      </Button>
                    </div> */}
                  </div>

                  <div className='text-xs text-muted-foreground'>
                    Created: {new Date(variable.createdAt).toLocaleDateString()}
                    {variable.updatedAt !== variable.createdAt && (
                      <span className='ml-2'>
                        • Updated:{' '}
                        {new Date(variable.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => onEdit(variable)}
                      >
                        <Edit className='w-4 h-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit Dynamic Variable</TooltipContent>
                  </Tooltip>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='text-red-600 hover:text-red-700'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete this variable?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete "{variable.name}". This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <Button
                          variant='destructive'
                          onClick={() => onDelete(variable.id, variable.name)}
                        >
                          Delete
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DynamicVariableCard;
