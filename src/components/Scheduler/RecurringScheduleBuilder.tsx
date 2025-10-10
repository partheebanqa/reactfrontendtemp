'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface RecurringScheduleBuilderProps {
  value?: string;
  onChange?: (cronExpression: string, description: string) => void;
  onRecurringDataChange?: (data: {
    frequencyMode: number;
    daysOfWeek?: number[];
  }) => void;
  timezone?: string;
  time?: string;
  onTimeChange?: (time: string) => void;
}

const RECURRENCE_PATTERNS = [
  { id: 'daily', name: 'Daily' },
  { id: 'weekdays', name: 'Weekdays' },
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' },
  { id: 'hourly', name: 'Hourly' },
  { id: 'custom', name: 'Custom' },
];

const WEEKDAYS = [
  { id: '1', name: 'Monday', short: 'Mon' },
  { id: '2', name: 'Tuesday', short: 'Tue' },
  { id: '3', name: 'Wednesday', short: 'Wed' },
  { id: '4', name: 'Thursday', short: 'Thu' },
  { id: '5', name: 'Friday', short: 'Fri' },
  { id: '6', name: 'Saturday', short: 'Sat' },
  { id: '0', name: 'Sunday', short: 'Sun' },
];

const MONTHLY_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  id: (i + 1).toString(),
  name: `${i + 1}${getOrdinalSuffix(i + 1)}`,
}));

const MONTHLY_WEEKDAY_OPTIONS = [
  { id: 'first-monday', name: 'First Monday of the month', value: '1' },
  { id: 'first-tuesday', name: 'First Tuesday of the month', value: '2' },
  { id: 'first-wednesday', name: 'First Wednesday of the month', value: '3' },
  { id: 'first-thursday', name: 'First Thursday of the month', value: '4' },
  { id: 'first-friday', name: 'First Friday of the month', value: '5' },
  { id: 'first-saturday', name: 'First Saturday of the month', value: '6' },
  { id: 'first-sunday', name: 'First Sunday of the month', value: '0' },
  { id: 'last-monday', name: 'Last Monday of the month', value: '1' },
  { id: 'last-tuesday', name: 'Last Tuesday of the month', value: '2' },
  { id: 'last-wednesday', name: 'Last Wednesday of the month', value: '3' },
  { id: 'last-thursday', name: 'Last Thursday of the month', value: '4' },
  { id: 'last-friday', name: 'Last Friday of the month', value: '5' },
  { id: 'last-saturday', name: 'Last Saturday of the month', value: '6' },
  { id: 'last-sunday', name: 'Last Sunday of the month', value: '0' },
];

function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) return 'st';
  if (j === 2 && k !== 12) return 'nd';
  if (j === 3 && k !== 13) return 'rd';
  return 'th';
}

export default function RecurringScheduleBuilder({
  value,
  onChange,
  onRecurringDataChange,
  timezone = 'UTC',
  time = '08:00',
  onTimeChange,
}: RecurringScheduleBuilderProps) {
  const [pattern, setPattern] = useState('weekly');
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>(['5']);
  const [monthlyType, setMonthlyType] = useState<'date' | 'day'>('date');
  const [monthlyDate, setMonthlyDate] = useState('1');
  const [monthlyWeekday, setMonthlyWeekday] = useState('first-monday');

  const [customInterval, setCustomInterval] = useState('2');
  const [customFrequency, setCustomFrequency] = useState('weeks');
  const [customWeekdays, setCustomWeekdays] = useState<string[]>(['2', '4']);
  const [customEndType, setCustomEndType] = useState<'never' | 'after' | 'on'>(
    'after'
  );
  const [customEndCount, setCustomEndCount] = useState('50');
  const [customEndDate, setCustomEndDate] = useState('');

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = Number.parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getFrequencyMode = () => {
    switch (pattern) {
      case 'hourly':
        return 1; // FrequencyHourly
      case 'daily':
        return 2; // FrequencyDaily
      case 'weekly':
        return 3; // FrequencyWeekly
      case 'weekdays':
        return 4; // FrequencyWeekdays
      case 'monthly':
        return 5; // FrequencyMonthly
      case 'custom':
        return 3; // Default to weekly for custom
      default:
        return 2; // Default to daily
    }
  };

  const getDaysOfWeek = () => {
    if (pattern === 'weekly') {
      // Convert string IDs to numbers and map Sunday (0) to 7
      return selectedWeekdays.map((id) =>
        id === '0' ? 7 : Number.parseInt(id)
      );
    } else if (pattern === 'custom') {
      // Convert string IDs to numbers and map Sunday (0) to 7
      return customWeekdays.map((id) => (id === '0' ? 7 : Number.parseInt(id)));
    }
    return undefined;
  };

  const buildCronExpression = () => {
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours);
    const minute = Number.parseInt(minutes);

    let cron = '';
    let description = '';

    switch (pattern) {
      case 'daily':
        cron = `${minute} ${hour} * * *`;
        description = `Runs every day at ${formatTime(time)}`;
        break;

      case 'weekdays':
        cron = `${minute} ${hour} * * 1-5`;
        description = `Every weekday at ${formatTime(time)}`;
        break;

      case 'weekly':
        const weekdayStr = selectedWeekdays.sort().join(',');
        cron = `${minute} ${hour} * * ${weekdayStr}`;
        const weeklyDayNames = selectedWeekdays
          .map((id) => WEEKDAYS.find((w) => w.id === id)?.name)
          .join(' and ');
        description = `Every ${weeklyDayNames} at ${formatTime(time)}`;
        break;

      case 'monthly':
        if (monthlyType === 'date') {
          cron = `${minute} ${hour} ${monthlyDate} * *`;
          description = `${monthlyDate}${getOrdinalSuffix(
            Number.parseInt(monthlyDate)
          )} of every month at ${formatTime(time)}`;
        } else {
          const weekdayOption = MONTHLY_WEEKDAY_OPTIONS.find(
            (opt) => opt.id === monthlyWeekday
          );
          if (weekdayOption) {
            cron = `${minute} ${hour} * * ${weekdayOption.value}`;
            description = `Every ${weekdayOption.name.toLowerCase()} at ${formatTime(
              time
            )}`;
          }
        }
        break;

      case 'hourly':
        cron = `${minute} * * * *`;
        description = `Every hour at minute ${minute}`;
        break;

      case 'custom':
        const customWeekdayStr = customWeekdays.sort().join(',');
        cron = `${minute} ${hour} * * ${customWeekdayStr}`;
        const interval = Number.parseInt(customInterval);
        const customDayNames = customWeekdays
          .map((id) => WEEKDAYS.find((w) => w.id === id)?.name)
          .join(' and ');
        description = `Every ${interval} ${customFrequency} on ${customDayNames} at ${formatTime(
          time
        )}${
          customEndType === 'after'
            ? `, ending after ${customEndCount} occurrences`
            : ''
        }`;
        break;

      default:
        cron = `${minute} ${hour} * * 1-5`;
        description = `Every weekday at ${formatTime(time)}`;
    }

    return { cron, description };
  };

  const toggleWeekday = (weekdayId: string) => {
    setSelectedWeekdays((prev) => {
      const newSelection = prev.includes(weekdayId)
        ? prev.filter((id) => id !== weekdayId)
        : [...prev, weekdayId];
      return newSelection.length > 0 ? newSelection : prev;
    });
  };

  const toggleCustomWeekday = (weekdayId: string) => {
    setCustomWeekdays((prev) => {
      const newSelection = prev.includes(weekdayId)
        ? prev.filter((id) => id !== weekdayId)
        : [...prev, weekdayId];
      return newSelection.length > 0 ? newSelection : prev;
    });
  };

  useEffect(() => {
    const { cron, description } = buildCronExpression();
    const frequencyMode = getFrequencyMode();
    const daysOfWeek = getDaysOfWeek();

    if (onChange) {
      onChange(cron, description);
    }

    if (onRecurringDataChange) {
      onRecurringDataChange({
        frequencyMode,
        ...(daysOfWeek && { daysOfWeek }),
      });
    }
  }, [
    pattern,
    selectedWeekdays,
    monthlyType,
    monthlyDate,
    monthlyWeekday,
    customInterval,
    customFrequency,
    customWeekdays,
    customEndType,
    customEndCount,
    time,
  ]);

  return (
    <div className='space-y-6'>
      {/* Recurrence Pattern and Time Selection */}
      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label className='text-base font-medium'>Recurrence Pattern</Label>
          <Select value={pattern} onValueChange={setPattern}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_PATTERNS.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className='space-y-2'>
          <Label className='text-base font-medium'>Time</Label>
          <Select value={time} onValueChange={(value) => onTimeChange?.(value)}>
            <SelectTrigger>
              <SelectValue placeholder='Select time' />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 24 }, (_, hour) =>
                ['00', '15', '30', '45'].map((minute) => {
                  const timeString = `${hour
                    .toString()
                    .padStart(2, '0')}:${minute}`;

                  return (
                    <SelectItem key={timeString} value={timeString}>
                      {timeString}
                    </SelectItem>
                  );
                })
              ).flat()}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pattern-specific configurations */}
      {pattern === 'weekly' && (
        <div className='space-y-3'>
          <Label>Select Days of Week</Label>
          <div className='grid grid-cols-7 gap-2'>
            {WEEKDAYS.map((day) => (
              <Button
                key={day.id}
                type='button'
                variant={
                  selectedWeekdays.includes(day.id) ? 'default' : 'outline'
                }
                size='sm'
                onClick={() => toggleWeekday(day.id)}
                className='text-xs'
              >
                {day.short}
              </Button>
            ))}
          </div>
          <p className='text-sm text-gray-600'>
            Every{' '}
            {selectedWeekdays
              .map((id) => WEEKDAYS.find((w) => w.id === id)?.name)
              .join(' and ')}{' '}
            at {formatTime(time)}
          </p>
        </div>
      )}

      {pattern === 'monthly' && (
        <div className='space-y-4'>
          <div className='flex space-x-4 border-b'>
            <button
              type='button'
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                monthlyType === 'date'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setMonthlyType('date')}
            >
              Select by Date
            </button>
            <button
              type='button'
              className={`pb-2 px-1 text-sm font-medium border-b-2 ${
                monthlyType === 'day'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setMonthlyType('day')}
            >
              Select by Day
            </button>
          </div>

          {monthlyType === 'date' ? (
            <div className='space-y-2'>
              <Label>Day of Month</Label>
              <Select value={monthlyDate} onValueChange={setMonthlyDate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHLY_DAY_OPTIONS.map((day) => (
                    <SelectItem key={day.id} value={day.id}>
                      {day.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-sm text-gray-600'>
                {monthlyDate}
                {getOrdinalSuffix(Number.parseInt(monthlyDate))} of every month
                at {formatTime(time)}
              </p>
            </div>
          ) : (
            <div className='space-y-3'>
              <div className='grid grid-cols-7 gap-2'>
                {WEEKDAYS.map((day) => {
                  const isSelected = MONTHLY_WEEKDAY_OPTIONS.find(
                    (opt) => opt.id === monthlyWeekday
                  )?.value.includes(day.id);
                  return (
                    <Button
                      key={day.id}
                      type='button'
                      variant={isSelected ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => {
                        if (isSelected) {
                          // If currently selected, find a different default option that doesn't include this day
                          const defaultOption = MONTHLY_WEEKDAY_OPTIONS.find(
                            (opt) => !opt.value.includes(day.id)
                          );
                          if (defaultOption) {
                            setMonthlyWeekday(defaultOption.id);
                          }
                        } else {
                          // Find the first weekday option for this day
                          const weekdayOption = MONTHLY_WEEKDAY_OPTIONS.find(
                            (opt) => opt.value.includes(day.id)
                          );
                          if (weekdayOption) {
                            setMonthlyWeekday(weekdayOption.id);
                          }
                        }
                      }}
                      className='text-xs'
                    >
                      {day.short}
                    </Button>
                  );
                })}
              </div>
              <Select value={monthlyWeekday} onValueChange={setMonthlyWeekday}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHLY_WEEKDAY_OPTIONS.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className='text-sm text-gray-600'>
                Every{' '}
                {MONTHLY_WEEKDAY_OPTIONS.find(
                  (opt) => opt.id === monthlyWeekday
                )?.name.toLowerCase()}{' '}
                at {formatTime(time)}
              </p>
            </div>
          )}
        </div>
      )}

      {pattern === 'custom' && (
        <div className='space-y-4 p-4 bg-gray-50 rounded-lg'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Repeat Every</Label>
              <Input
                type='number'
                min='1'
                max='52'
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label>Frequency</Label>
              <Select
                value={customFrequency}
                onValueChange={setCustomFrequency}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='weeks'>Weeks</SelectItem>
                  <SelectItem value='months'>Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-3'>
            <Label>Days of Week</Label>
            <div className='grid grid-cols-7 gap-2'>
              {WEEKDAYS.map((day) => (
                <Button
                  key={day.id}
                  type='button'
                  variant={
                    customWeekdays.includes(day.id) ? 'default' : 'outline'
                  }
                  size='sm'
                  onClick={() => toggleCustomWeekday(day.id)}
                  className='text-xs'
                >
                  {day.short}
                </Button>
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <Label>End Condition</Label>
            <RadioGroup
              value={customEndType}
              onValueChange={(value: 'never' | 'after' | 'on') =>
                setCustomEndType(value)
              }
            >
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='never' id='never' />
                <Label htmlFor='never'>Never</Label>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='after' id='after' />
                <Label htmlFor='after'>After</Label>
                <Input
                  type='number'
                  min='1'
                  max='999'
                  value={customEndCount}
                  onChange={(e) => setCustomEndCount(e.target.value)}
                  className='w-20 ml-2'
                  disabled={customEndType !== 'after'}
                />
                <span className='text-sm text-gray-600'>occurrences</span>
              </div>
              <div className='flex items-center space-x-2'>
                <RadioGroupItem value='on' id='on' />
                <Label htmlFor='on'>On</Label>
                <Input
                  type='date'
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className='w-40 ml-2'
                  disabled={customEndType !== 'on'}
                />
              </div>
            </RadioGroup>
          </div>

          <p className='text-sm text-gray-500 italic'>
            Every {customInterval} {customFrequency} on{' '}
            {customWeekdays
              .map((id) => WEEKDAYS.find((w) => w.id === id)?.name)
              .join(' and ')}{' '}
            at {formatTime(time)}
            {customEndType === 'after'
              ? `, ending after ${customEndCount} occurrences`
              : ''}
          </p>
        </div>
      )}

      {pattern === 'daily' && (
        <p className='text-sm text-gray-600'>
          Runs every day at {formatTime(time)}
        </p>
      )}

      {pattern === 'weekdays' && (
        <p className='text-sm text-gray-600'>
          Every weekday at {formatTime(time)}
        </p>
      )}

      {pattern === 'hourly' && (
        <p className='text-sm text-gray-600'>
          Every hour at minute {time.split(':')[1]}
        </p>
      )}
    </div>
  );
}
