import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Info, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CreateScheduleFormProps {
  testSuites: any[];
  requestChains: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const STOP_CONDITIONS = [
  { id: 'first-failure', label: 'Stop on first failure' },
  { id: 'consecutive-failures', label: 'Stop after 3 consecutive failures' },
  {
    id: 'timeout-exceeded',
    label: 'Stop if execution time exceeds 30 minutes',
  },
];
const MONTHLY_DAY_OPTIONS = [
  { value: 'every_monday', label: 'Every Monday' },
  { value: 'every_tuesday', label: 'Every Tuesday' },
  { value: 'every_wednesday', label: 'Every Wednesday' },
  { value: 'every_thursday', label: 'Every Thursday' },
  { value: 'every_friday', label: 'Every Friday' },
  { value: 'every_saturday', label: 'Every Saturday' },
  { value: 'every_sunday', label: 'Every Sunday' },

  { value: 'first_monday', label: 'First Monday of the month' },
  { value: 'first_tuesday', label: 'First Tuesday of the month' },
  { value: 'first_wednesday', label: 'First Wednesday of the month' },
  { value: 'first_thursday', label: 'First Thursday of the month' },
  { value: 'first_friday', label: 'First Friday of the month' },
  { value: 'first_saturday', label: 'First Saturday of the month' },
  { value: 'first_sunday', label: 'First Sunday of the month' },

  { value: 'last_monday', label: 'Last Monday of the month' },
  { value: 'last_tuesday', label: 'Last Tuesday of the month' },
  { value: 'last_wednesday', label: 'Last Wednesday of the month' },
  { value: 'last_thursday', label: 'Last Thursday of the month' },
  { value: 'last_friday', label: 'Last Friday of the month' },
  { value: 'last_saturday', label: 'Last Saturday of the month' },
  { value: 'last_sunday', label: 'Last Sunday of the month' },
];

const RECURRENCE_PATTERNS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'custom', label: 'Custom' },
];

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Mon', fullName: 'Monday' },
  { value: 'tue', label: 'Tue', fullName: 'Tuesday' },
  { value: 'wed', label: 'Wed', fullName: 'Wednesday' },
  { value: 'thu', label: 'Thu', fullName: 'Thursday' },
  { value: 'fri', label: 'Fri', fullName: 'Friday' },
  { value: 'sat', label: 'Sat', fullName: 'Saturday' },
  { value: 'sun', label: 'Sun', fullName: 'Sunday' },
];

const MONTHLY_DATES = Array.from({ length: 31 }, (_, i) => ({
  value: (i + 1).toString(),
  label: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

const FREQUENCY_OPTIONS = [
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'days', label: 'Days' },
];

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default function CreateScheduleForm({
  testSuites,
  requestChains,
  onSubmit,
  onCancel,
}: CreateScheduleFormProps) {
  const [targetType, setTargetType] = useState<'testSuite' | 'requestChain'>(
    'testSuite'
  );
  const [formData, setFormData] = useState({
    selectedDay: 'Monday',
    name: '',
    description: '',
    testSuiteId: '',
    requestChainId: '',
    scheduleType: 'recurring',
    scheduledDate: undefined as Date | undefined,
    scheduledTime: '08:00',
    recurrencePattern: 'weekly',
    selectedDays: ['fri'] as string[],
    monthlyType: 'date', // 'date' or 'day'
    monthlyDate: '1', // 1st, 2nd, etc.
    customRepeatEvery: 2,
    customFrequency: 'weeks',
    customEndCondition: 'after', // 'never', 'after', 'on'
    customEndCount: 50,
    customEndDate: undefined as Date | undefined,
    isActive: true,
    environment: 'development',
    timezone: 'UTC',
    cronExpression: '0 9 * * *',
    retryAttempts: 3,
    email: '',
    stopConditions: [] as string[],
    monthlyDayPattern: 'First Monday of the month',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      targetType,
      targetId:
        targetType === 'testSuite'
          ? formData.testSuiteId
          : formData.requestChainId,
    };
    onSubmit(submitData);
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleDay = (day: string) => {
    const currentDays = formData.selectedDays;
    if (currentDays.includes(day)) {
      updateFormData(
        'selectedDays',
        currentDays.filter((d) => d !== day)
      );
    } else {
      updateFormData('selectedDays', [...currentDays, day]);
    }
  };

  const getScheduleSummary = () => {
    if (formData.scheduleType === 'one-time') return null;

    const time = formData.scheduledTime;
    const pattern = formData.recurrencePattern;

    if (pattern === 'daily') {
      return `Every day at ${time}`;
    } else if (pattern === 'weekdays') {
      return `Every weekday at ${time}`;
    } else if (pattern === 'weekly' && formData.selectedDays.length > 0) {
      const dayNames = formData.selectedDays
        .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.fullName)
        .join(', ');
      return `Every ${dayNames} at ${time}`;
    } else if (pattern === 'monthly') {
      if (formData.monthlyType === 'date') {
        const dateOrdinal =
          MONTHLY_DATES.find((d) => d.value === formData.monthlyDate)?.label ||
          '1st';
        return `${dateOrdinal} of every month at ${time}`;
      }
      return `Monthly at ${time}`;
    } else if (formData.monthlyType === 'day') {
      const selectedOption = MONTHLY_DAY_OPTIONS.find(
        (d) => d.value === formData.monthlyDayPattern
      );
      return `${selectedOption?.label || 'Selected day'} at ${time}`;
    } else if (pattern === 'hourly') {
      return `Every hour`;
    } else if (pattern === 'custom') {
      const freq = formData.customFrequency;
      const every = formData.customRepeatEvery;
      const dayNames =
        formData.selectedDays.length > 0
          ? ` on ${formData.selectedDays
              .map((day) => DAYS_OF_WEEK.find((d) => d.value === day)?.fullName)
              .join(' and ')}`
          : '';

      let endText = '';
      if (formData.customEndCondition === 'after') {
        endText = `, ending after ${formData.customEndCount} occurrences`;
      } else if (
        formData.customEndCondition === 'on' &&
        formData.customEndDate
      ) {
        endText = `, ending on ${format(formData.customEndDate, 'PPP')}`;
      }

      return `Every ${every} ${freq}${dayNames} at ${time}${endText}`;
    }
    return null;
  };

  return (
    <div className='max-w-2xl max-h-[90vh] overflow-y-auto'>
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold'>Create New Schedule</h2>
        <Button
          variant='ghost'
          size='sm'
          className='text-primary hover:text-primary/90 hover:bg-primary/10'
        >
          <Info size={16} className='mr-2' />
          Quick Guide
        </Button>
      </div>

      <TooltipProvider>
        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Schedule Name */}
          <div className='space-y-2'>
            <Label htmlFor='name' className='text-base font-medium'>
              Schedule Name
            </Label>
            <Input
              id='name'
              placeholder='Daily API Health Check'
              value={formData.name}
              onChange={(e) => updateFormData('name', e.target.value)}
              required
            />
          </div>

          {/* Schedule Description */}
          <div className='space-y-2'>
            <Label htmlFor='description' className='text-base font-medium'>
              Schedule Description (Optional)
            </Label>
            <Textarea
              id='description'
              placeholder='Enter description'
              className='min-h-[80px]'
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
            />
          </div>

          {/* Target */}
          <div className='space-y-4'>
            <Label className='text-base font-medium'>Target</Label>
            <div className='grid grid-cols-2 gap-4'>
              <Select
                value={targetType}
                onValueChange={(value: 'testSuite' | 'requestChain') =>
                  setTargetType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='testSuite'>Test Suite</SelectItem>
                  <SelectItem value='requestChain'>Request Chain</SelectItem>
                </SelectContent>
              </Select>

              {targetType === 'testSuite' ? (
                <Select
                  value={formData.testSuiteId}
                  onValueChange={(value) =>
                    updateFormData('testSuiteId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select test suite' />
                  </SelectTrigger>
                  <SelectContent>
                    {testSuites.map((suite) => (
                      <SelectItem key={suite.id} value={suite.id.toString()}>
                        {suite.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={formData.requestChainId}
                  onValueChange={(value) =>
                    updateFormData('requestChainId', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select request chain' />
                  </SelectTrigger>
                  <SelectContent>
                    {requestChains.map((chain) => (
                      <SelectItem key={chain.id} value={chain.id.toString()}>
                        {chain.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Execution Mode */}
          <div className='space-y-3'>
            <Label className='text-base font-medium'>Execution Mode</Label>
            <RadioGroup
              value={formData.scheduleType}
              onValueChange={(value) => updateFormData('scheduleType', value)}
              className='flex flex-row space-x-6'
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='one-time' id='one-time' />
                <Label htmlFor='one-time'>One-time</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='recurring' id='recurring' />
                <Label htmlFor='recurring'>Recurring</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date and Time - Only for one-time schedules */}
          {formData.scheduleType === 'one-time' && (
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-base font-medium'>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-full pl-3 text-left font-normal',
                        !formData.scheduledDate && 'text-muted-foreground'
                      )}
                    >
                      {formData.scheduledDate ? (
                        format(formData.scheduledDate, 'PPP')
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={formData.scheduledDate}
                      onSelect={(date) => updateFormData('scheduledDate', date)}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className='p-3 pointer-events-auto'
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2'>
                <Label className='text-base font-medium'>Time</Label>
                <Select
                  value={formData.scheduledTime}
                  onValueChange={(value) =>
                    updateFormData('scheduledTime', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Select time' />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, hour) =>
                      ['00', '15', '30', '45'].map((minute) => (
                        <SelectItem
                          key={`${hour.toString().padStart(2, '0')}:${minute}`}
                          value={`${hour
                            .toString()
                            .padStart(2, '0')}:${minute}`}
                        >
                          {`${hour.toString().padStart(2, '0')}:${minute}`}
                        </SelectItem>
                      ))
                    ).flat()}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Recurring Schedule Configuration */}
          {formData.scheduleType === 'recurring' && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label className='text-base font-medium'>
                    Recurrence Pattern
                  </Label>
                  <Select
                    value={formData.recurrencePattern}
                    onValueChange={(value) =>
                      updateFormData('recurrencePattern', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRENCE_PATTERNS.map((pattern) => (
                        <SelectItem key={pattern.value} value={pattern.value}>
                          {pattern.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label className='text-base font-medium'>Time</Label>
                  <Select
                    value={formData.scheduledTime}
                    onValueChange={(value) =>
                      updateFormData('scheduledTime', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select time' />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, hour) =>
                        ['00', '15', '30', '45'].map((minute) => (
                          <SelectItem
                            key={`${hour
                              .toString()
                              .padStart(2, '0')}:${minute}`}
                            value={`${hour
                              .toString()
                              .padStart(2, '0')}:${minute}`}
                          >
                            {`${hour.toString().padStart(2, '0')}:${minute}`}
                          </SelectItem>
                        ))
                      ).flat()}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Day Selection for Weekly Pattern */}
              {formData.recurrencePattern === 'weekly' && (
                <div className='space-y-3'>
                  <Label className='text-base font-medium'>
                    Select Days of Week
                  </Label>
                  <div className='flex gap-2'>
                    {DAYS_OF_WEEK.map((day) => (
                      <Button
                        key={day.value}
                        type='button'
                        variant={
                          formData.selectedDays.includes(day.value)
                            ? 'default'
                            : 'outline'
                        }
                        size='sm'
                        className='px-3 py-2 min-w-[50px]'
                        onClick={() => toggleDay(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monthly Pattern Configuration */}
              {formData.recurrencePattern === 'monthly' && (
                <div className='space-y-4'>
                  <Tabs
                    value={formData.monthlyType}
                    onValueChange={(value) =>
                      updateFormData('monthlyType', value)
                    }
                    className='w-full'
                  >
                    <TabsList className='grid w-full grid-cols-2'>
                      <TabsTrigger value='date'>Select by Date</TabsTrigger>
                      <TabsTrigger value='day'>Select by Day</TabsTrigger>
                    </TabsList>

                    <TabsContent value='date' className='space-y-3'>
                      <div className='space-y-2'>
                        <Label className='text-base font-medium'>
                          Day of Month
                        </Label>
                        <Select
                          value={formData.monthlyDate}
                          onValueChange={(value) =>
                            updateFormData('monthlyDate', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHLY_DATES.map((date) => (
                              <SelectItem key={date.value} value={date.value}>
                                {date.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>

                    <TabsContent value='day' className='space-y-4'>
                      <Label className='text-base font-medium'>
                        Select Days of Week
                      </Label>
                      <div className='flex gap-2'>
                        {DAYS_OF_WEEK.map((day) => (
                          <Button
                            key={day.value}
                            type='button'
                            variant={
                              formData.selectedDay === day.value
                                ? 'default'
                                : 'outline'
                            }
                            size='sm'
                            className='px-3 py-2 min-w-[50px]'
                            onClick={() =>
                              updateFormData('selectedDay', day.value)
                            }
                          >
                            {day.label}
                          </Button>
                        ))}
                      </div>

                      <div className='space-y-2'>
                        <Label className='text-base font-medium'>
                          Day Pattern
                        </Label>
                        <Select
                          value={formData.monthlyDayPattern}
                          onValueChange={(value) =>
                            updateFormData('monthlyDayPattern', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder='Select pattern' />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.selectedDay &&
                              [
                                `First ${formData.selectedDay} of the month`,
                                `Last ${formData.selectedDay} of the month`,
                              ].map((pattern) => (
                                <SelectItem key={pattern} value={pattern}>
                                  {pattern}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}

              {/* Custom Pattern Configuration */}
              {formData.recurrencePattern === 'custom' && (
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label className='text-base font-medium'>
                        Repeat Every
                      </Label>
                      <Input
                        type='number'
                        min='1'
                        max='999'
                        value={formData.customRepeatEvery}
                        onChange={(e) =>
                          updateFormData(
                            'customRepeatEvery',
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label className='text-base font-medium'>Frequency</Label>
                      <Select
                        value={formData.customFrequency}
                        onValueChange={(value) =>
                          updateFormData('customFrequency', value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Days of Week for Custom */}
                  <div className='space-y-3'>
                    <Label className='text-base font-medium'>
                      Days of Week
                    </Label>
                    <div className='flex gap-2'>
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type='button'
                          variant={
                            formData.selectedDays.includes(day.value)
                              ? 'default'
                              : 'outline'
                          }
                          size='sm'
                          className='px-3 py-2 min-w-[50px]'
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* End Condition */}
                  <div className='space-y-3'>
                    <Label className='text-base font-medium'>
                      End Condition
                    </Label>
                    <RadioGroup
                      value={formData.customEndCondition}
                      onValueChange={(value) =>
                        updateFormData('customEndCondition', value)
                      }
                      className='space-y-3'
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='never' id='never' />
                        <Label htmlFor='never'>Never</Label>
                      </div>

                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='after' id='after' />
                          <Label htmlFor='after'>After</Label>
                        </div>
                        <Input
                          type='number'
                          min='1'
                          max='9999'
                          value={formData.customEndCount}
                          onChange={(e) =>
                            updateFormData(
                              'customEndCount',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className='w-20'
                          disabled={formData.customEndCondition !== 'after'}
                        />
                        <span className='text-sm text-muted-foreground'>
                          occurrences
                        </span>
                      </div>

                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center space-x-2'>
                          <RadioGroupItem value='on' id='on' />
                          <Label htmlFor='on'>On</Label>
                        </div>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-[200px] pl-3 text-left font-normal',
                                !formData.customEndDate &&
                                  'text-muted-foreground'
                              )}
                              disabled={formData.customEndCondition !== 'on'}
                            >
                              {formData.customEndDate ? (
                                format(formData.customEndDate, 'PPP')
                              ) : (
                                <span>dd/mm/yyyy</span>
                              )}
                              <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={formData.customEndDate}
                              onSelect={(date) =>
                                updateFormData('customEndDate', date)
                              }
                              disabled={(date) => date < new Date()}
                              initialFocus
                              className='p-3 pointer-events-auto'
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {/* Schedule Summary */}
              {getScheduleSummary() && (
                <div className='p-3 bg-muted/50 rounded-md'>
                  <p className='text-sm text-muted-foreground'>
                    {getScheduleSummary()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Environment and Timezone */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label className='text-base font-medium'>Environment</Label>
              <Select
                value={formData.environment}
                onValueChange={(value) => updateFormData('environment', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='development'>Development</SelectItem>
                  <SelectItem value='staging'>Staging</SelectItem>
                  <SelectItem value='production'>Production</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label className='text-base font-medium'>Timezone</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => updateFormData('timezone', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='UTC'>UTC</SelectItem>
                  <SelectItem value='America/New_York'>
                    Eastern Time (ET)
                  </SelectItem>
                  <SelectItem value='America/Chicago'>
                    Central Time (CT)
                  </SelectItem>
                  <SelectItem value='America/Denver'>
                    Mountain Time (MT)
                  </SelectItem>
                  <SelectItem value='America/Los_Angeles'>
                    Pacific Time (PT)
                  </SelectItem>
                  <SelectItem value='Europe/London'>London (GMT)</SelectItem>
                  <SelectItem value='Europe/Paris'>Paris (CET)</SelectItem>
                  <SelectItem value='Asia/Tokyo'>Tokyo (JST)</SelectItem>
                  <SelectItem value='Asia/Shanghai'>Shanghai (CST)</SelectItem>
                  <SelectItem value='Asia/Kolkata'>Mumbai (IST)</SelectItem>
                  <SelectItem value='Australia/Sydney'>
                    Sydney (AEDT)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className='space-y-4'>
            <Label className='text-base font-medium'>Advanced Settings</Label>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label className='text-sm font-medium'>Retry Attempts</Label>
                <Input
                  type='number'
                  min='0'
                  max='5'
                  value={formData.retryAttempts}
                  onChange={(e) =>
                    updateFormData(
                      'retryAttempts',
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>

              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Label className='text-sm font-medium'>
                    Email Notifications
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='h-4 w-4 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter multiple email addresses separated by commas</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type='text'
                  placeholder='email1@example.com, email2@example.com'
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                />
              </div>
            </div>

            {/* Stop Execution Conditions */}
            <div className='space-y-3'>
              <Label className='text-base font-medium'>
                Stop execution (Optional)
              </Label>
              <div className='space-y-3'>
                {STOP_CONDITIONS.map((condition) => (
                  <div
                    key={condition.id}
                    className='flex items-center space-x-2'
                  >
                    <Checkbox
                      id={condition.id}
                      checked={formData.stopConditions.includes(condition.id)}
                      onCheckedChange={(checked) => {
                        const currentConditions = formData.stopConditions;
                        if (checked) {
                          updateFormData('stopConditions', [
                            ...currentConditions,
                            condition.id,
                          ]);
                        } else {
                          updateFormData(
                            'stopConditions',
                            currentConditions.filter(
                              (id) => id !== condition.id
                            )
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={condition.id}
                      className='text-sm font-normal'
                    >
                      {condition.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Schedule Toggle */}
            <div className='flex items-center justify-between'>
              <Label className='text-base font-medium'>Active Schedule</Label>
              <div className='relative'>
                <input
                  type='checkbox'
                  id='enable-schedule'
                  checked={formData.isActive}
                  onChange={(e) => updateFormData('isActive', e.target.checked)}
                  className='sr-only'
                />
                <label
                  htmlFor='enable-schedule'
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                    formData.isActive ? 'bg-primary' : 'bg-muted'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-background transition-transform',
                      formData.isActive ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className='flex justify-end gap-3 pt-6 mt-8 border-t'>
            <Button type='button' variant='outline' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' className='bg-primary hover:bg-primary/90'>
              Create
            </Button>
          </div>
        </form>
      </TooltipProvider>
    </div>
  );
}
