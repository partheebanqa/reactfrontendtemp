'use client';

import type React from 'react';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  RefreshCw,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { allGenerators, getGenerator } from '@/lib/dynamicVariables';

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

interface EditDynamicVariableDialogProps {
  open: boolean;
  setOpen: (val: boolean) => void;
  variable: DynamicVariable | null;
  handleDynamicUpdate: (id: string, payload: any) => void;
}

const EditDynamicVariableDialog: React.FC<EditDynamicVariableDialogProps> = ({
  open,
  setOpen,
  variable,
  handleDynamicUpdate,
}) => {
  const [editedVariable, setEditedVariable] = useState<{
    name: string;
    description: string;
    generatorFunction: string;
    generatorConfig: Record<string, any>;
  }>({
    name: '',
    description: '',
    generatorFunction: '',
    generatorConfig: {},
  });

  const [previewValue, setPreviewValue] = useState<string>('');

  const [errors, setErrors] = useState<{
    name?: string;
  }>({});

  const generatePreview = useCallback(() => {
    try {
      const generator = getGenerator(editedVariable.generatorFunction);
      if (generator) {
        const config = {
          ...(generator.configSchema &&
            Object.fromEntries(
              Object.entries(generator.configSchema).map(
                ([key, schema]: [string, any]) => [
                  key,
                  editedVariable.generatorConfig?.[key] ?? schema.default,
                ]
              )
            )),
          ...editedVariable.generatorConfig,
        };

        const preview = generator.generate(config);
        setPreviewValue(String(preview));
      } else {
        setPreviewValue('Invalid generator');
      }
    } catch (error) {
      setPreviewValue(
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }, [editedVariable.generatorFunction, editedVariable.generatorConfig]);

  useEffect(() => {
    if (open && variable) {
      setEditedVariable({
        name: variable.name,
        description: '',
        generatorFunction: variable.generatorId,
        generatorConfig: variable.parameters || {},
      });
      setErrors({});

      setTimeout(() => {
        try {
          const generator = getGenerator(variable.generatorId);
          if (generator) {
            const config = {
              ...(generator.configSchema &&
                Object.fromEntries(
                  Object.entries(generator.configSchema).map(
                    ([key, schema]: [string, any]) => [
                      key,
                      variable.parameters?.[key] ?? schema.default,
                    ]
                  )
                )),
              ...variable.parameters,
            };
            const preview = generator.generate(config);
            setPreviewValue(String(preview));
          }
        } catch (error) {
          setPreviewValue('Error generating preview');
        }
      }, 0);
    }
  }, [open, variable]);

  useEffect(() => {
    if (editedVariable.generatorFunction) {
      generatePreview();
    }
  }, [editedVariable.generatorFunction, generatePreview]);

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    if (!editedVariable.name.trim()) {
      newErrors.name = 'Variable name is required';
    } else if (editedVariable.name.length < 2) {
      newErrors.name = 'Variable name must be at least 2 characters';
    } else if (!/^[A-Z0-9_]+$/.test(editedVariable.name)) {
      newErrors.name =
        'Variable name can only contain uppercase letters, numbers, and underscores';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!variable || !validateForm()) return;

    const generator = getGenerator(editedVariable.generatorFunction);

    const payload: any = {
      name: editedVariable.name,
      description: editedVariable.description,
      parameters: editedVariable.generatorConfig,
      generatorId: editedVariable.generatorFunction,
      generatorName: generator?.label || variable.generatorName,
    };

    if (generator?.category === 'custom') {
      payload.category = 'Custom';
      const numberGenerators = ['randomInteger', 'price'];
      payload.type = numberGenerators.includes(editedVariable.generatorFunction)
        ? 'number'
        : 'string';
    } else if (generator?.category === 'personal') {
      payload.category = 'Personal';
      payload.type = 'string';
    } else if (generator?.category === 'internet') {
      payload.category = 'Internet';
      payload.type =
        editedVariable.generatorFunction === 'boolean' ? 'boolean' : 'string';
    } else if (generator?.category === 'datetime') {
      payload.category = 'DateTime';
      payload.type =
        editedVariable.generatorFunction === 'year' ? 'number' : 'string';
    } else if (generator?.category === 'location') {
      payload.category = 'Location';
      const numberGenerators = ['latitude', 'longitude'];
      payload.type = numberGenerators.includes(editedVariable.generatorFunction)
        ? 'number'
        : 'string';
    } else if (generator?.category === 'financial') {
      payload.category = 'Financial';
      payload.type = 'string';
    } else if (generator?.category === 'basic') {
      payload.category = 'Basic';
      payload.type =
        editedVariable.generatorFunction === 'timestamp' ? 'number' : 'string';
    } else if (generator?.category === 'random') {
      payload.category = 'Random';
      const numberGenerators = ['random_float'];
      const booleanGenerators = ['random_boolean'];
      if (numberGenerators.includes(editedVariable.generatorFunction)) {
        payload.type = 'number';
      } else if (booleanGenerators.includes(editedVariable.generatorFunction)) {
        payload.type = 'boolean';
      } else {
        payload.type = 'string';
      }
    } else if (generator?.category === 'auth') {
      payload.category = 'Authentication';
      payload.type = 'string';
    } else if (generator?.category === 'network') {
      payload.category = 'Network';
      payload.type =
        editedVariable.generatorFunction === 'random_port'
          ? 'number'
          : 'string';
    } else if (generator?.category === 'date') {
      payload.category = 'DateTime';
      payload.type = 'string';
    }
    handleDynamicUpdate(variable.id, payload);
    setOpen(false);
  };

  if (!variable) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto scrollbar-thin'>
        <DialogHeader>
          <DialogTitle>Edit Dynamic Variable</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Name</label>
            <Input
              placeholder='e.g., USER_ID, API_TOKEN'
              value={editedVariable.name}
              className={errors.name ? 'border-destructive' : ''}
              onChange={(e) => {
                setEditedVariable((prev) => ({
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
                  {'{{' + editedVariable.name + '}}'}
                </code>
              </p>
            )}
          </div>

          <div className='space-y-1'>
            <label className='text-sm font-medium'>Generator Function</label>
            <Select
              value={editedVariable.generatorFunction}
              onValueChange={(value) => {
                setEditedVariable((prev) => ({
                  ...prev,
                  generatorFunction: value,
                  generatorConfig: {},
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder='Choose a generator function' />
              </SelectTrigger>
              <SelectContent className='max-h-[300px]'>
                {/* Group by category */}
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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
                          <div className='font-medium'>{generator.label}</div>
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

          {(() => {
            const generator = getGenerator(editedVariable.generatorFunction);
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
                              editedVariable.generatorConfig?.[key] ??
                              schema.default
                            }
                            onCheckedChange={(checked) => {
                              setEditedVariable((prev) => ({
                                ...prev,
                                generatorConfig: {
                                  ...prev.generatorConfig,
                                  [key]: checked,
                                },
                              }));
                            }}
                          />
                          <span className='text-sm'>
                            {editedVariable.generatorConfig?.[key] ??
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
                            editedVariable.generatorConfig?.[key]?.toString() ||
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
                                  editedVariable.generatorConfig?.[key] ??
                                  schema.default;
                              }
                            }

                            setEditedVariable((prev) => ({
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
                        {editedVariable.generatorConfig?.[key]?.toString() ||
                          schema.default?.toString() ||
                          'Not set'}
                      </p>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className='p-3 bg-muted/50 rounded-lg'>
                <div className='text-sm text-muted-foreground'>
                  This generator has no configurable parameters.
                </div>
              </div>
            );
          })()}

          {editedVariable.generatorFunction && (
            <div className='p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
              <div className='flex items-center justify-between mb-1'>
                <div className='text-xs font-medium text-blue-700 dark:text-blue-300'>
                  Preview
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={generatePreview}
                  className='h-6 px-2 text-xs'
                  title='Generate new preview'
                >
                  <RefreshCw className='w-3 h-3' />
                </Button>
              </div>
              <div className='text-sm font-mono text-blue-800 dark:text-blue-200'>
                {previewValue}
              </div>
              {editedVariable.generatorConfig &&
                Object.keys(editedVariable.generatorConfig).length > 0 && (
                  <div className='text-xs text-blue-600 dark:text-blue-400 mt-2'>
                    Config: {JSON.stringify(editedVariable.generatorConfig)}
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
              value={editedVariable.description}
              onChange={(e) =>
                setEditedVariable((prev) => ({
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
                setErrors({});
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Update Variable</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDynamicVariableDialog;
