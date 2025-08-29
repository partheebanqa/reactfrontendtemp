import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Variable, Environment } from '@/shared/types/datamanagement';
import {
  Calendar,
  Code2,
  FileText,
  Globe,
  Shield,
  Wifi,
  Zap,
} from 'lucide-react';
import { Switch } from '../ui/switch';
import { allGenerators, getGenerator } from '@/lib/dynamicVariables';

interface VariableCreateDialogProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  newVariable: Variable;
  setNewVariable: React.Dispatch<React.SetStateAction<Variable>>;
  handleCreate: () => void;
  environments: Environment[];
}

const VariableCreateDialog: React.FC<VariableCreateDialogProps> = ({
  open,
  setOpen,
  newVariable,
  setNewVariable,
  handleCreate,
  environments,
}) => {
  const [errors, setErrors] = useState<{
    name?: string;
    environmentId?: string;
    type?: string;
    initialValue?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: {
      name?: string;
      environmentId?: string;
      type?: string;
      initialValue?: string;
    } = {};

    if (!newVariable.name.trim()) {
      newErrors.name = 'Variable name is required';
    } else if (newVariable.name.length < 2) {
      newErrors.name = 'Variable name must be at least 2 characters';
    } else if (!/^[A-Z0-9_]+$/.test(newVariable.name)) {
      newErrors.name =
        'Variable name can only contain uppercase letters, numbers, and underscores';
    }

    // Validate environment
    if (!newVariable.environmentId) {
      newErrors.environmentId = 'Please select an environment';
    }

    // Validate type (should already be set by default, but just in case)
    if (!newVariable.type) {
      newErrors.type = 'Variable type is required';
    }

    // Validate initial value (can be optional for some types)
    if (newVariable.type !== 'dynamic' && !newVariable.initialValue.trim()) {
      newErrors.initialValue = 'Initial value is required';
    } else if (
      newVariable.type === 'number' &&
      isNaN(Number(newVariable.initialValue))
    ) {
      newErrors.initialValue = 'Initial value must be a valid number';
    } else if (
      newVariable.type === 'boolean' &&
      !['true', 'false', '0', '1'].includes(
        newVariable.initialValue.toLowerCase()
      )
    ) {
      newErrors.initialValue =
        'Initial value must be a valid boolean (true/false)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = () => {
    if (validateForm()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Variable</Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Create Variable</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Variable Name */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Name</label>
            <Input
              placeholder='e.g., USER_ID, API_TOKEN'
              value={newVariable.name}
              className={errors.name ? 'border-red-500' : ''}
              onChange={(e) => {
                setNewVariable((prev) => ({
                  ...prev,
                  name: e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9_]/g, '_'),
                }));
                // Clear error when user types
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
            />
            {errors.name ? (
              <p className='text-xs text-red-500 mt-1'>{errors.name}</p>
            ) : (
              <p className='text-xs text-muted-foreground mt-1'>
                Use in requests as:{' '}
                <code>{'{{' + newVariable.name + '}}'}</code>
              </p>
            )}
          </div>

          {/* Environment */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Environment</label>
            <Select
              value={newVariable.environmentId}
              onValueChange={(value) => {
                setNewVariable((prev) => ({ ...prev, environmentId: value }));
                // Clear error when user selects
                if (errors.environmentId) {
                  setErrors((prev) => ({ ...prev, environmentId: undefined }));
                }
              }}
            >
              <SelectTrigger
                className={errors.environmentId ? 'border-red-500' : ''}
              >
                <SelectValue placeholder='Select environment' />
              </SelectTrigger>
              <SelectContent>
                {environments.map((env) => (
                  <SelectItem key={env.id} value={env.id}>
                    {env.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.environmentId && (
              <p className='text-xs text-red-500 mt-1'>
                {errors.environmentId}
              </p>
            )}
          </div>

          {/* Type */}
          {/* <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Type</label>
            <Select
              value={newVariable.type}
              onValueChange={(value) => {
                setNewVariable((prev) => ({
                  ...prev,
                  type: value,
                  initialValue: '',
                  currentValue: '',
                }));
                // Clear error when user selects
                if (errors.type) {
                  setErrors(prev => ({ ...prev, type: undefined }));
                }
              }}
            >
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='string'>String</SelectItem>
                <SelectItem value='number'>Number</SelectItem>
                <SelectItem value='boolean'>Boolean</SelectItem>
                <SelectItem value='secret'>Secret</SelectItem>
                <SelectItem value='environment'>Environment</SelectItem>
                <SelectItem value='dynamic'>Dynamic</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className='text-xs text-red-500 mt-1'>{errors.type}</p>
            )}
          </div> */}

          <div>
            <label className='text-sm font-medium'>Variable Type</label>
            <Select
              value={newVariable.type}
              onValueChange={(value: any) =>
                setNewVariable((prev) => ({
                  ...prev,
                  type: value,
                  value: value === 'static' ? prev.value : '',
                  generatorFunction:
                    value === 'dynamic' ? prev.generatorFunction : '',
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='static'>
                  <div className='flex items-center gap-2'>
                    <FileText className='w-4 h-4' />
                    <div>
                      <div className='font-medium'>Static Variable</div>
                      <div className='text-xs text-muted-foreground'>
                        Fixed value that doesn't change
                      </div>
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value='dynamic'>
                  <div className='flex items-center gap-2'>
                    <Zap className='w-4 h-4' />
                    <div>
                      <div className='font-medium'>Dynamic Variable</div>
                      <div className='text-xs text-muted-foreground'>
                        Generated at runtime
                      </div>
                    </div>
                  </div>
                </SelectItem>
                {/* <SelectItem value='environment'>
                  <div className='flex items-center gap-2'>
                    <Globe className='w-4 h-4' />
                    <div>
                      <div className='font-medium'>Environment Variable</div>
                      <div className='text-xs text-muted-foreground'>
                        From system environment
                      </div>
                    </div>
                  </div>
                </SelectItem> */}
              </SelectContent>
            </Select>
          </div>

          {/* Static Variable Value with Secret Toggle */}
          {newVariable.type === 'static' && (
            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium'>Static Value</label>
                <Input
                  placeholder='Enter fixed value'
                  type={newVariable.isSecret ? 'password' : 'text'}
                  value={newVariable.initialValue}
                  onChange={(e) =>
                    setNewVariable((prev) => ({
                      ...prev,
                      initialValue: e.target.value,
                      currentValue: e.target.value,
                    }))
                  }
                />

                <p className='text-xs text-muted-foreground mt-1'>
                  This value will remain constant for all requests
                </p>
              </div>

              <div className='flex items-center space-x-2'>
                <Switch
                  id='edit-secret-toggle'
                  checked={newVariable.isSecret}
                  disabled
                  onCheckedChange={(checked) =>
                    setNewVariable((prev) => ({ ...prev, isSecret: checked }))
                  }
                />
                <label
                  htmlFor='edit-secret-toggle'
                  className='text-sm font-medium cursor-not-allowed opacity-50'
                >
                  Mark as secret variable
                </label>
                <span className='text-xs text-muted-foreground italic'>
                  (Upcoming)
                </span>
              </div>

              {newVariable.isSecret && (
                <p className='text-xs text-orange-600 dark:text-orange-400'>
                  Secret variables will be hidden in the UI and logs for
                  security
                </p>
              )}
            </div>
          )}

          {/* Dynamic Variable Generator */}
          {newVariable.type === 'dynamic' && (
            <div className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>
                  Generator Function
                </label>
                <Select
                  value={newVariable.generatorFunction}
                  onValueChange={(value) =>
                    setNewVariable((prev) => ({
                      ...prev,
                      generatorFunction: value,
                      generatorConfig: {},
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Choose a generator function' />
                  </SelectTrigger>
                  <SelectContent className='max-h-[300px]'>
                    {/* Group by category */}
                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
                      Basic
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'basic')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <Code2 className='w-4 h-4' />
                            <div>
                              <div className='font-medium'>
                                {generator.label}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {generator.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}

                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2'>
                      Random Data
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'random')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <Zap className='w-4 h-4' />
                            <div>
                              <div className='font-medium'>
                                {generator.label}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {generator.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}

                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2'>
                      Authentication
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'auth')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <Shield className='w-4 h-4' />
                            <div>
                              <div className='font-medium'>
                                {generator.label}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {generator.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}

                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2'>
                      Date & Time
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'date')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <Calendar className='w-4 h-4' />
                            <div>
                              <div className='font-medium'>
                                {generator.label}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {generator.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}

                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground border-t mt-2 pt-2'>
                      Network
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'network')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <Wifi className='w-4 h-4' />
                            <div>
                              <div className='font-medium'>
                                {generator.label}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {generator.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Generator Configuration */}
              {newVariable.generatorFunction &&
                (() => {
                  const generator = getGenerator(newVariable.generatorFunction);
                  return generator?.configSchema ? (
                    <div className='space-y-3 p-3 bg-muted/50 rounded-lg'>
                      <div className='text-sm font-medium'>
                        Generator Configuration
                      </div>
                      {Object.entries(generator.configSchema).map(
                        ([key, schema]: [string, any]) => (
                          <div key={key} className='space-y-1'>
                            <label className='text-xs font-medium capitalize'>
                              {key.replace(/_/g, ' ')}
                            </label>
                            <Input
                              type={schema.type}
                              placeholder={schema.default?.toString() || ''}
                              value={
                                (newVariable.generatorConfig?.[key] ??
                                  schema.default) ||
                                ''
                              }
                              onChange={(e) => {
                                const value =
                                  schema.type === 'number'
                                    ? parseInt(e.target.value) || schema.default
                                    : e.target.value;
                                setNewVariable((prev) => ({
                                  ...prev,
                                  generatorConfig: {
                                    ...prev.generatorConfig,
                                    [key]: value,
                                  },
                                }));
                              }}
                              min={schema.min}
                              max={schema.max}
                            />
                          </div>
                        )
                      )}
                    </div>
                  ) : null;
                })()}

              {/* Preview */}
              {newVariable.generatorFunction && (
                <div className='p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
                  <div className='text-xs font-medium text-blue-700 dark:text-blue-300 mb-1'>
                    Preview
                  </div>
                  <div className='text-sm font-mono text-blue-800 dark:text-blue-200'>
                    {(() => {
                      try {
                        const generator = getGenerator(
                          newVariable.generatorFunction
                        );
                        if (generator) {
                          const preview = generator.generate(
                            newVariable.generatorConfig
                          );
                          return String(preview);
                        }
                        return 'Invalid generator';
                      } catch (error) {
                        return 'Error generating preview';
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Environment Variable */}
          {newVariable.type === 'environment' && (
            <div>
              <label className='text-sm font-medium'>
                Environment Variable Key
              </label>
              <Input
                placeholder='e.g., API_BASE_URL, DATABASE_URL'
                value={newVariable.value}
                onChange={(e) =>
                  setNewVariable((prev) => ({ ...prev, value: e.target.value }))
                }
              />
              <p className='text-xs text-muted-foreground mt-1'>
                This will read the value from your system environment variables
              </p>
            </div>
          )}

          {/* <div>
            <label className="text-sm font-medium">Scope</label>
            <Select
              value={newVariable.scope}
              onValueChange={(value: any) =>
                setNewVariable((prev) => ({ ...prev, scope: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global (All Projects)</SelectItem>
                <SelectItem value="project">Project Specific</SelectItem>
                <SelectItem value="environment">
                  Environment Specific
                </SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          {/* Initial Value */}
          {/* <div className='space-y-1'>
            <label className='text-sm font-medium'>Initial Value</label>
            <Input
              placeholder='Enter initial value'
              value={newVariable.initialValue}
              className={errors.initialValue ? 'border-red-500' : ''}
              onChange={(e) => {
                setNewVariable((prev) => ({
                  ...prev,
                  initialValue: e.target.value,
                  currentValue: e.target.value,
                }));
                // Clear error when user types
                if (errors.initialValue) {
                  setErrors((prev) => ({ ...prev, initialValue: undefined }));
                }
              }}
            />
            {errors.initialValue && (
              <p className='text-xs text-red-500 mt-1'>{errors.initialValue}</p>
            )}
          </div> */}

          {/* Description */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>
              Description (optional)
            </label>
            <Textarea
              placeholder='Enter a description for this variable'
              value={newVariable.description}
              onChange={(e) =>
                setNewVariable((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              variant='outline'
              onClick={() => {
                setOpen(false);
                // Clear all errors when closing the dialog
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Create Variable</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariableCreateDialog;
