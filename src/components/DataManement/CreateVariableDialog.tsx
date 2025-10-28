'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
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
import type { Variable } from '@/shared/types/datamanagement';
import {
  Calendar,
  Code2,
  FileText,
  Shield,
  Wifi,
  Zap,
  User,
  Globe,
  MapPin,
  CreditCard,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { allGenerators, getGenerator } from '@/lib/dynamicVariables';
import { useWorkspace } from '@/hooks/useWorkspace';

interface VariableCreateDialogProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  newVariable: Variable;
  setNewVariable: React.Dispatch<React.SetStateAction<Variable>>;
  handleCreate: (payload: any) => void;
  type: 'static' | 'dynamic';
}

const VariableCreateDialog: React.FC<VariableCreateDialogProps> = ({
  open,
  setOpen,
  newVariable,
  setNewVariable,
  handleCreate,
  type,
}) => {
  const { currentWorkspace } = useWorkspace();
  const [errors, setErrors] = useState<{
    name?: string;
    environmentId?: string;
    type?: string;
    initialValue?: string;
  }>({});

  useEffect(() => {
    if (open) {
      setNewVariable((prev) => ({
        ...prev,
        type, // force from prop
        initialValue: type === 'static' ? prev.initialValue : '',
        generatorFunction: type === 'dynamic' ? prev.generatorFunction : '',
      }));
    }
  }, [open, type, setNewVariable]);

  const resetForm = () => {
    setNewVariable({
      name: '',
      description: '',
      type: type,
      initialValue: '',
      currentValue: '',
      generatorFunction: '',
      generatorConfig: {},
      isSecret: false,
      environmentId: '',
    } as Variable);
    setErrors({});
  };

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

    // Validate type (should already be set by default, but just in case)
    if (!newVariable.type) {
      newErrors.type = 'Variable type is required';
    }

    // Validate initial value (can be optional for some types)
    if (newVariable.type !== 'dynamic' && !newVariable.initialValue.trim()) {
      newErrors.initialValue = 'Initial value is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = () => {
    if (validateForm()) {
      const payload: any = {
        workspaceId: currentWorkspace?.id,
        name: newVariable.name,
        description: newVariable.description,
        type: newVariable.type,
        initialValue: newVariable.initialValue,
        currentValue: newVariable.currentValue,
      };

      // Handle dynamic variables
      if (newVariable.type === 'dynamic' && newVariable.generatorFunction) {
        const generator = getGenerator(newVariable.generatorFunction);

        if (generator?.configSchema) {
          const finalConfig = {
            ...Object.fromEntries(
              Object.entries(generator.configSchema).map(
                ([key, schema]: [string, any]) => [key, schema.default]
              )
            ),
            ...newVariable.generatorConfig,
          };
          setNewVariable((prev) => ({
            ...prev,
            generatorConfig: finalConfig,
          }));

          payload.parameters = finalConfig;
        } else {
          payload.parameters = newVariable.generatorConfig || {};
        }

        payload.generatorId = newVariable.generatorFunction;

        // Add generatorName from the generator's label
        payload.generatorName = generator?.label;

        // Set category and type based on generator category
        if (generator?.category === 'custom') {
          payload.category = 'Custom';
          // Set type based on generator - number generators vs string generators
          const numberGenerators = ['randomInteger', 'price'];
          payload.type = numberGenerators.includes(
            newVariable.generatorFunction
          )
            ? 'number'
            : 'string';
        } else if (generator?.category === 'personal') {
          payload.category = 'Personal';
          payload.type = 'string';
        } else if (generator?.category === 'internet') {
          payload.category = 'Internet';
          // Set type based on specific generators
          payload.type =
            newVariable.generatorFunction === 'boolean' ? 'boolean' : 'string';
        } else if (generator?.category === 'datetime') {
          payload.category = 'DateTime';
          // Set type based on specific generators
          payload.type =
            newVariable.generatorFunction === 'year' ? 'number' : 'string';
        } else if (generator?.category === 'location') {
          payload.category = 'Location';
          // Set type based on specific generators
          const numberGenerators = ['latitude', 'longitude'];
          payload.type = numberGenerators.includes(
            newVariable.generatorFunction
          )
            ? 'number'
            : 'string';
        } else if (generator?.category === 'financial') {
          payload.category = 'Financial';
          payload.type = 'string';
        } else if (generator?.category === 'basic') {
          payload.category = 'Basic';
          // Set type based on specific generators
          payload.type =
            newVariable.generatorFunction === 'timestamp' ? 'number' : 'string';
        } else if (generator?.category === 'random') {
          payload.category = 'Random';
          // Set type based on specific generators
          const numberGenerators = ['random_float'];
          const booleanGenerators = ['random_boolean'];
          if (numberGenerators.includes(newVariable.generatorFunction)) {
            payload.type = 'number';
          } else if (
            booleanGenerators.includes(newVariable.generatorFunction)
          ) {
            payload.type = 'boolean';
          } else {
            payload.type = 'string';
          }
        } else if (generator?.category === 'auth') {
          payload.category = 'Authentication';
          payload.type = 'string';
        } else if (generator?.category === 'network') {
          payload.category = 'Network';
          // Set type based on specific generators
          payload.type =
            newVariable.generatorFunction === 'random_port'
              ? 'number'
              : 'string';
        } else if (generator?.category === 'date') {
          payload.category = 'DateTime';
          payload.type = 'string';
        }
      }

      console.log('Creating variable with payload:', payload);

      handleCreate(payload);

      // Reset form and close dialog after successful creation
      resetForm();
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Variable</Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            {type === 'static' ? (
              <>
                <FileText className='w-5 h-5 text-muted-foreground' />
                <span>Create Static Variable</span>
                <span className='text-xs text-muted-foreground ml-2'>
                  Fixed value that doesn't change
                </span>
              </>
            ) : (
              <>
                <Zap className='w-5 h-5 text-muted-foreground' />
                <span>Create Dynamic Variable</span>
                <span className='text-xs text-muted-foreground ml-2'>
                  Generated at runtime
                </span>
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Name</label>
            <Input
              placeholder='e.g., USER_ID, API_TOKEN'
              value={newVariable.name}
              className={errors.name ? 'border-destructive' : ''}
              onChange={(e) => {
                setNewVariable((prev) => ({
                  ...prev,
                  name: e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9_]/g, '_'),
                }));
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
            />
            {errors.name ? (
              <p className='text-xs text-destructive mt-1'>{errors.name}</p>
            ) : (
              <p className='text-xs text-muted-foreground mt-1'>
                Use in requests as:{' '}
                <code className='bg-muted px-1 rounded'>
                  {'{{' + newVariable.name + '}}'}
                </code>
              </p>
            )}
          </div>

          {newVariable.type === 'static' && (
            <div className='space-y-3'>
              <div>
                <label className='text-sm font-medium'>Static Value</label>
                <Input
                  placeholder='Enter fixed value'
                  type={newVariable.isSecret ? 'password' : 'text'}
                  value={newVariable.initialValue}
                  className={errors.initialValue ? 'border-destructive' : ''}
                  onChange={(e) => {
                    setNewVariable((prev) => ({
                      ...prev,
                      initialValue: e.target.value,
                      currentValue: e.target.value,
                    }));
                    if (errors.initialValue) {
                      setErrors((prev) => ({
                        ...prev,
                        initialValue: undefined,
                      }));
                    }
                  }}
                />
                {errors.initialValue && (
                  <p className='text-xs text-destructive mt-1'>
                    {errors.initialValue}
                  </p>
                )}

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
                    <div className='px-2 py-1.5 text-xs font-semibold text-muted-foreground'>
                      Custom Generators
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'custom')
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
                      Personal Data
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'personal')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <User className='w-4 h-4' />
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
                      Internet
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'internet')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <Globe className='w-4 h-4' />
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
                      .filter((g) => g.category === 'datetime')
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
                      Location
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'location')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <MapPin className='w-4 h-4' />
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
                      Financial
                    </div>
                    {allGenerators
                      .filter((g) => g.category === 'financial')
                      .map((generator) => (
                        <SelectItem key={generator.name} value={generator.name}>
                          <div className='flex items-center gap-2'>
                            <CreditCard className='w-4 h-4' />
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
                              {schema.min !== undefined &&
                                schema.max !== undefined && (
                                  <span className='text-muted-foreground ml-1'>
                                    ({schema.min} - {schema.max})
                                  </span>
                                )}
                            </label>
                            {schema.type === 'boolean' ? (
                              <div className='flex items-center space-x-2'>
                                <Switch
                                  checked={
                                    newVariable.generatorConfig?.[key] ??
                                    schema.default
                                  }
                                  onCheckedChange={(checked) => {
                                    setNewVariable((prev) => ({
                                      ...prev,
                                      generatorConfig: {
                                        ...prev.generatorConfig,
                                        [key]: checked,
                                      },
                                    }));
                                  }}
                                />
                                <span className='text-sm'>
                                  {newVariable.generatorConfig?.[key] ??
                                  schema.default
                                    ? 'Yes'
                                    : 'No'}
                                </span>
                              </div>
                            ) : (
                              <Input
                                type={schema.type}
                                placeholder={schema.default?.toString() || ''}
                                value={
                                  newVariable.generatorConfig?.[
                                    key
                                  ]?.toString() ||
                                  schema.default?.toString() ||
                                  ''
                                }
                                onChange={(e) => {
                                  let value: any = e.target.value;

                                  if (schema.type === 'number') {
                                    const numValue = Number.parseFloat(value);
                                    if (!isNaN(numValue)) {
                                      if (
                                        schema.min !== undefined &&
                                        numValue < schema.min
                                      ) {
                                        value = schema.min;
                                      } else if (
                                        schema.max !== undefined &&
                                        numValue > schema.max
                                      ) {
                                        value = schema.max;
                                      } else {
                                        value = numValue;
                                      }
                                    } else {
                                      value =
                                        newVariable.generatorConfig?.[key] ??
                                        schema.default;
                                    }
                                  }

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
                            )}
                            <p className='text-xs text-muted-foreground'>
                              Current:{' '}
                              {newVariable.generatorConfig?.[key]?.toString() ||
                                schema.default?.toString() ||
                                'Not set'}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : null;
                })()}

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
                          const config = {
                            ...(generator.configSchema &&
                              Object.fromEntries(
                                Object.entries(generator.configSchema).map(
                                  ([key, schema]: [string, any]) => [
                                    key,
                                    newVariable.generatorConfig?.[key] ??
                                      schema.default,
                                  ]
                                )
                              )),
                            ...newVariable.generatorConfig,
                          };

                          const preview = generator.generate(config);
                          return String(preview);
                        }
                        return 'Invalid generator';
                      } catch (error) {
                        return `Error: ${
                          error instanceof Error
                            ? error.message
                            : 'Unknown error'
                        }`;
                      }
                    })()}
                  </div>
                  {newVariable.generatorConfig &&
                    Object.keys(newVariable.generatorConfig).length > 0 && (
                      <div className='text-xs text-blue-600 dark:text-blue-400 mt-2'>
                        Config: {JSON.stringify(newVariable.generatorConfig)}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

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
                resetForm();
                setOpen(false);
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
