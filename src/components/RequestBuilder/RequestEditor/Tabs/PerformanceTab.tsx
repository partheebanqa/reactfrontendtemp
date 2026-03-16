import React from 'react';
import { Save, Rocket } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import type { RequestSettings } from '@/lib/requestBreadCrumb';

interface PerformanceTabProps {
  settings: RequestSettings;
  setSettings: React.Dispatch<React.SetStateAction<RequestSettings>>;
  performanceTestId: string;
  onCreatePerformanceTest: () => void;
  isCreatePending: boolean;
  isUpdatePending: boolean;
  onSaveGeneralSettings: () => void;
}

const PerformanceTab = React.memo(
  ({
    settings,
    setSettings,
    performanceTestId,
    onCreatePerformanceTest,
    isCreatePending,
    isUpdatePending,
    onSaveGeneralSettings,
  }: PerformanceTabProps) => {
    return (
      <div className='space-y-6'>
        <Tabs defaultValue='performance'>
          <TabsList className='mb-4'>
            <TabsTrigger value='performance'>Performance Test</TabsTrigger>
            <TabsTrigger value='general'>General Settings</TabsTrigger>
          </TabsList>

          <TabsContent value='performance'>
            <div className='space-y-6'>
              <div>
                <h3 className='font-medium text-gray-800 dark:text-gray-200 mb-2'>
                  Performance Test Settings
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Number of Requests
                    </Label>
                    <Input
                      type='number'
                      min={1}
                      value={settings.performanceTest.numRequests}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          performanceTest: {
                            ...prev.performanceTest,
                            numRequests: Number(e.target.value) || 1,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Concurrency
                    </Label>
                    <Input
                      type='number'
                      min={1}
                      value={settings.performanceTest.concurrency}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          performanceTest: {
                            ...prev.performanceTest,
                            concurrency: Number(e.target.value) || 1,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Delay Between Requests (ms)
                    </Label>
                    <Input
                      type='number'
                      min={0}
                      value={settings.performanceTest.delay}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          performanceTest: {
                            ...prev.performanceTest,
                            delay: Number(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                      Timeout (ms)
                    </Label>
                    <Input
                      type='number'
                      min={0}
                      value={settings.performanceTest.timeout}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          performanceTest: {
                            ...prev.performanceTest,
                            timeout: Number(e.target.value) || 0,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator className='my-4' />

              <div>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-medium text-gray-800 dark:text-gray-200'>
                    Rate Limiting Settings
                  </h3>
                  <div className='flex items-center space-x-2'>
                    <Label
                      htmlFor='rate-limit-enabled'
                      className='text-sm text-gray-700 dark:text-gray-300'
                    >
                      Enable Rate Limiting
                    </Label>
                    <Switch
                      id='rate-limit-enabled'
                      checked={settings.rateLimit.enabled}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          rateLimit: {
                            ...prev.rateLimit,
                            enabled: checked,
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                {settings.rateLimit.enabled && (
                  <div className='space-y-4'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <div>
                        <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                          Requests per Period
                        </Label>
                        <Input
                          type='number'
                          min={1}
                          value={settings.rateLimit.requestsPerPeriod}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              rateLimit: {
                                ...prev.rateLimit,
                                requestsPerPeriod: Number(e.target.value) || 1,
                              },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>
                          Period (seconds)
                        </Label>
                        <Input
                          type='number'
                          min={1}
                          value={settings.rateLimit.periodInSeconds}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              rateLimit: {
                                ...prev.rateLimit,
                                periodInSeconds: Number(e.target.value) || 1,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div>
                      <Label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                        Rate Limit Type
                      </Label>
                      <RadioGroup
                        value={settings.rateLimit.type}
                        onValueChange={(value) =>
                          setSettings((prev) => ({
                            ...prev,
                            rateLimit: {
                              ...prev.rateLimit,
                              type: value as 'fixed' | 'sliding',
                            },
                          }))
                        }
                      >
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='fixed' id='fixed' />
                          <Label htmlFor='fixed' className='text-sm'>
                            Fixed Window (e.g., 10 req/min starting at full
                            minutes)
                          </Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='sliding' id='sliding' />
                          <Label htmlFor='sliding' className='text-sm'>
                            Sliding Window (e.g., 10 req within any 60s period)
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                )}
              </div>

              <div className='mt-6 bg-gray-50 dark:bg-dark-300 p-4 rounded-lg border border-gray-200 dark:border-dark-100'>
                <h3 className='font-medium text-gray-800 dark:text-gray-200 mb-4'>
                  Current Settings Summary
                </h3>
                <div className='space-y-2 text-sm'>
                  <div className='flex flex-col'>
                    <div className='font-medium'>Performance Test:</div>
                    <ul className='list-disc list-inside ml-4'>
                      <li>Requests: {settings.performanceTest.numRequests}</li>
                      <li>
                        Concurrency: {settings.performanceTest.concurrency}
                      </li>
                      <li>Delay: {settings.performanceTest.delay}ms</li>
                      <li>Timeout: {settings.performanceTest.timeout}ms</li>
                    </ul>
                  </div>

                  <div className='flex flex-col'>
                    <div className='font-medium'>Rate Limiting:</div>
                    <ul className='list-disc list-inside ml-4 text-gray-600 dark:text-gray-400'>
                      <ul className='list-disc list-inside ml-4'>
                        <li>
                          Enabled: {settings.rateLimit.enabled ? 'Yes' : 'No'}
                        </li>
                        {settings.rateLimit.enabled && (
                          <>
                            <li>
                              Requests per period:{' '}
                              {settings.rateLimit.requestsPerPeriod}
                            </li>
                            <li>
                              Period: {settings.rateLimit.periodInSeconds}s
                            </li>
                            <li>Type: {settings.rateLimit.type}</li>
                          </>
                        )}
                      </ul>
                    </ul>
                  </div>
                </div>
              </div>

              <div className='mt-6 flex justify-end'>
                <Button
                  variant='default'
                  onClick={onCreatePerformanceTest}
                  disabled={isCreatePending || isUpdatePending}
                  className='flex items-center gap-2'
                >
                  <Rocket size={16} />
                  {performanceTestId
                    ? isUpdatePending
                      ? 'Updating...'
                      : 'Update Performance Test'
                    : isCreatePending
                      ? 'Creating...'
                      : 'Create Performance Test'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='general'>
            <div className='space-y-6'>
              <div>
                <h3 className='font-medium text-gray-800 dark:text-gray-200 mb-4'>
                  General Settings
                </h3>

                <div className='space-y-4'>
                  <div className='flex flex-wrap items-center gap-6'>
                    <div className='flex items-center'>
                      <Checkbox
                        id='follow-redirects-general'
                        checked={settings.options.followRedirects}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            options: {
                              ...prev.options,
                              followRedirects: Boolean(checked),
                            },
                          }))
                        }
                        className='rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-100 dark:bg-dark-300'
                      />
                      <Label
                        htmlFor='follow-redirects-general'
                        className='ml-2 text-sm text-gray-700 dark:text-gray-300'
                      >
                        Follow Redirects
                      </Label>
                    </div>

                    <div className='flex items-center'>
                      <Checkbox
                        id='stop-on-error-general'
                        checked={settings.options.stopOnError}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            options: {
                              ...prev.options,
                              stopOnError: Boolean(checked),
                            },
                          }))
                        }
                        className='rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-100 dark:bg-dark-300'
                      />
                      <Label
                        htmlFor='stop-on-error-general'
                        className='ml-2 text-sm text-gray-700 dark:text-gray-300'
                      >
                        Stop on Error
                      </Label>
                    </div>

                    <div className='flex items-center'>
                      <Checkbox
                        id='save-responses-general'
                        checked={settings.options.saveResponses}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({
                            ...prev,
                            options: {
                              ...prev.options,
                              saveResponses: Boolean(checked),
                            },
                          }))
                        }
                        className='rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-dark-100 dark:bg-dark-300'
                      />
                      <Label
                        htmlFor='save-responses-general'
                        className='ml-2 text-sm text-gray-700 dark:text-gray-300'
                      >
                        Save All Responses
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              <div className='mt-6 flex justify-end'>
                <Button
                  variant='default'
                  onClick={onSaveGeneralSettings}
                  className='flex items-center gap-2'
                >
                  <Save size={16} />
                  Save Settings
                </Button>
              </div>

              <div className='mt-6 bg-gray-50 dark:bg-dark-300 p-4 rounded-lg border border-gray-200 dark:border-dark-100'>
                <h3 className='font-medium text-gray-800 dark:text-gray-200 mb-4'>
                  Options Summary
                </h3>
                <ul className='list-disc list-inside ml-4 text-gray-600 dark:text-gray-400'>
                  <li>
                    Follow Redirects:{' '}
                    {settings.options.followRedirects ? 'Yes' : 'No'}
                  </li>
                  <li>
                    Stop on Error: {settings.options.stopOnError ? 'Yes' : 'No'}
                  </li>
                  <li>
                    Save All Responses:{' '}
                    {settings.options.saveResponses ? 'Yes' : 'No'}
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  },
);

PerformanceTab.displayName = 'PerformanceTab';

export default PerformanceTab;
