import React from 'react';
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
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  FileText,
  Zap,
  Globe,
  Code2,
  Shield,
  Calendar,
  Wifi,
} from 'lucide-react';
import { allGenerators, getGenerator } from '@/lib/dynamicVariables';
import { Variable, Environment } from '@/models/datamanagement';

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
              value={newVariable.key}
              onChange={(e) =>
                setNewVariable((prev) => ({
                  ...prev,
                  key: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'),
                }))
              }
            />
            <p className='text-xs text-muted-foreground mt-1'>
              Use in requests as: <code>{'{{' + newVariable.key + '}}'}</code>
            </p>
          </div>

          {/* Type */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Variable Type</label>
            <Select
              value={newVariable.type}
              onValueChange={(value) =>
                setNewVariable((prev) => ({
                  ...prev,
                  type: value as
                    | 'string'
                    | 'number'
                    | 'boolean'
                    | 'secret'
                    | 'environment'
                    | 'dynamic',
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
                <SelectItem value='environment'>
                  <div className='flex items-center gap-2'>
                    <Globe className='w-4 h-4' />
                    <div>
                      <div className='font-medium'>Environment Variable</div>
                      <div className='text-xs text-muted-foreground'>
                        From system environment
                      </div>
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Static */}
          {newVariable.type === 'string' && (
            <div className='space-y-3'>
              <div className='space-y-1'>
                <label className='text-sm font-medium'>Static Value</label>
                <Input
                  placeholder='Enter fixed value'
                  type={newVariable.isSecret ? 'password' : 'text'}
                  value={newVariable.value}
                  onChange={(e) =>
                    setNewVariable((prev) => ({
                      ...prev,
                      value: e.target.value,
                    }))
                  }
                />
              </div>

              <div className='flex items-center space-x-2'>
                <Switch
                  id='secret-toggle'
                  checked={newVariable.isSecret}
                  onCheckedChange={(checked) =>
                    setNewVariable((prev) => ({ ...prev, isSecret: checked }))
                  }
                />
                <label
                  htmlFor='secret-toggle'
                  className='text-sm font-medium cursor-pointer'
                >
                  Mark as secret variable
                </label>
              </div>
            </div>
          )}

          {/* Dynamic */}
          {newVariable.type === 'dynamic' && (
            <div className='space-y-4'>
              <label className='text-sm font-medium'>Generator Function</label>
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
                  {allGenerators.map((g) => (
                    <SelectItem key={g.name} value={g.name}>
                      <div className='flex items-center gap-2'>
                        {g.category === 'basic' && (
                          <Code2 className='w-4 h-4' />
                        )}
                        {g.category === 'random' && <Zap className='w-4 h-4' />}
                        {g.category === 'auth' && (
                          <Shield className='w-4 h-4' />
                        )}
                        {g.category === 'date' && (
                          <Calendar className='w-4 h-4' />
                        )}
                        {g.category === 'network' && (
                          <Wifi className='w-4 h-4' />
                        )}
                        <div>
                          <div className='font-medium'>{g.label}</div>
                          <div className='text-xs text-muted-foreground'>
                            {g.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Config */}
              {newVariable.generatorFunction &&
                (() => {
                  const generator = getGenerator(newVariable.generatorFunction);
                  return generator?.configSchema ? (
                    <div className='space-y-2 p-3 bg-muted/50 rounded-lg'>
                      <div className='text-sm font-medium'>
                        Generator Configuration
                      </div>
                      {Object.entries(generator.configSchema).map(
                        ([key, schema]) => (
                          <div key={key} className='space-y-1'>
                            <label className='text-xs font-medium'>{key}</label>
                            <Input
                              type={(schema as { type: string }).type}
                              value={newVariable.generatorConfig?.[key] || ''}
                              onChange={(e) =>
                                setNewVariable((prev) => ({
                                  ...prev,
                                  generatorConfig: {
                                    ...prev.generatorConfig,
                                    [key]:
                                      (schema as { type: string }).type ===
                                      'number'
                                        ? Number(e.target.value)
                                        : e.target.value,
                                  },
                                }))
                              }
                            />
                          </div>
                        )
                      )}
                    </div>
                  ) : null;
                })()}

              {newVariable.generatorFunction && (
                <div className='p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg'>
                  <div className='text-xs font-medium mb-1'>Preview</div>
                  <div className='text-sm font-mono'>
                    {(() => {
                      try {
                        const generator = getGenerator(
                          newVariable.generatorFunction
                        );
                        return (
                          generator?.generate(newVariable.generatorConfig) || ''
                        );
                      } catch (e) {
                        return 'Error generating preview.';
                      }
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Environment */}
          {newVariable.type === 'environment' && (
            <div className='space-y-1'>
              <label className='text-sm font-medium'>
                Environment Variable Key
              </label>
              <Input
                placeholder='e.g. API_URL'
                value={newVariable.value}
                onChange={(e) =>
                  setNewVariable((prev) => ({ ...prev, value: e.target.value }))
                }
              />
            </div>
          )}

          {/* Scope */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Scope</label>
            <Select
              value={newVariable.scope}
              onValueChange={(value) =>
                setNewVariable((prev) => ({
                  ...prev,
                  scope: value as
                    | 'environment'
                    | 'global'
                    | 'project'
                    | undefined,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='global'>Global</SelectItem>
                <SelectItem value='project'>Project Specific</SelectItem>
                <SelectItem value='environment'>
                  Environment Specific
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className='space-y-1'>
            <label className='text-sm font-medium'>Description</label>
            <Textarea
              placeholder='Describe how this variable is used.'
              value={newVariable.description}
              onChange={(e) =>
                setNewVariable((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>

          <div className='flex justify-end space-x-2 border-t pt-4'>
            <Button variant='outline' onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Variable</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariableCreateDialog;
