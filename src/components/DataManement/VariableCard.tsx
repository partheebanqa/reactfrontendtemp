import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Copy,
  Edit,
  Trash2,
  Key,
  FileText,
  Settings,
  Zap,
  Globe,
} from 'lucide-react';
import { Variable, Environment } from '@/models/datamanagement';

interface VariableListProps {
  variables: Variable[];
  environments: Environment[];
  handleCopy: (text: string) => void;
  onEdit: (v: Variable) => void;
  onDelete: (id: string, label: string) => void;
}

const VariableCard: React.FC<VariableListProps> = ({
  variables,
  environments,
  handleCopy,
  onEdit,
  onDelete,
}) => {
  const getVariableIcon = (type: string) => {
    switch (type) {
      case 'secret':
        return <Key className='w-4 h-4 text-red-500' />;
      case 'string':
        return <FileText className='w-4 h-4 text-blue-500' />;
      case 'number':
        return <span className='text-purple-500 font-bold'>#</span>;
      case 'boolean':
        return <span className='text-green-500 font-bold'>✓</span>;
      case 'dynamic':
        return <Zap className='w-5 h-5 text-blue-500' />;
      case 'environment':
        return <Globe className='w-5 h-5 text-purple-500' />;
      default:
        return <Settings className='w-4 h-4 text-gray-500' />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'dynamic':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'static':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'environment':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className='grid gap-4'>
      {variables.map((variable) => (
        <Card key={variable.id} className='hover:shadow-md transition-shadow'>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-4 flex-1'>
                {getVariableIcon(variable.type)}
                <div className='flex-1'>
                  <div className='flex items-center space-x-3 mb-1'>
                    <h4 className='font-semibold flex items-center gap-2'>
                      {variable.key}
                      {/* Copy Variable Name Button */}
                      <Button
                        variant='ghost'
                        size='sm'
                        // onClick={() => copyToClipboard(variable.key, "Variable name")}/
                        onClick={() =>
                          handleCopy(
                            variable.type === 'secret'
                              ? '••••••••'
                              : variable.value
                          )
                        }
                        title='Copy variable name'
                        className='p-1 h-auto'
                      >
                        <Copy className='w-3 h-3' />
                      </Button>
                    </h4>
                    <Badge variant={variable.isGlobal ? 'default' : 'outline'}>
                      {variable.isGlobal
                        ? 'Global'
                        : environments.find(
                            (e) => e.id === variable.environmentId
                          )?.name || 'Environment'}
                    </Badge>
                    <Badge
                      variant='secondary'
                      className={getBadgeColor(variable.type)}
                    >
                      {variable.type}
                    </Badge>
                    {variable.isSecret && (
                      <Badge
                        variant='outline'
                        className='text-orange-600 border-orange-600'
                      >
                        <Key className='w-3 h-3 mr-1' />
                        Secret
                      </Badge>
                    )}
                  </div>
                  <div className='flex items-center space-x-2 mb-2'>
                    <code
                      className={`px-2 py-1 rounded text-sm ${
                        variable.type === 'dynamic'
                          ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                          : variable.type === 'static'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                      }`}
                    >
                      {variable.isSecret ? '••••••••' : variable.value}
                    </code>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() =>
                        handleCopy(
                          variable.type === 'secret'
                            ? '••••••••'
                            : variable.value
                        )
                      }
                    >
                      <Copy className='w-3 h-3' />
                    </Button>
                  </div>
                  {variable.description && (
                    <p className='text-xs text-muted-foreground'>
                      {variable.description}
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => onEdit(variable)}
                >
                  <Edit className='w-4 h-4' />
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => onDelete(variable.id, variable.key)}
                >
                  <Trash2 className='w-4 h-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default VariableCard;
