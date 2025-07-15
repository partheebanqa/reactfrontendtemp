import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface EditScheduleFormProps {
  schedule: any;
  testSuites: any[];
  requestChains: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function EditScheduleForm({
  schedule,
  testSuites,
  requestChains,
  onSubmit,
  onCancel,
}: EditScheduleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    testSuiteId: '',
    scheduleType: 'recurring',
    isActive: true,
    environment: 'development',
    scheduledTime: '09:00',
    timezone: 'UTC',
    cronExpression: '0 9 * * *',
    retryAttempts: 3,
    emailNotifications: '',
    requestDelay: 0,
  });

  useEffect(() => {
    if (schedule) {
      setFormData({
        name: schedule.name || '',
        description: schedule.description || '',
        testSuiteId: schedule.testSuite?.id?.toString() || '',
        scheduleType: schedule.scheduleType || 'recurring',
        isActive: schedule.isActive ?? true,
        environment: schedule.environment || 'development',
        scheduledTime: schedule.scheduledTime || '09:00',
        timezone: schedule.timezone || 'UTC',
        cronExpression: schedule.cronExpression || '0 9 * * *',
        retryAttempts: schedule.retryAttempts || 3,
        emailNotifications: schedule.emailNotifications || '',
        requestDelay: schedule.requestDelay || 0,
      });
    }
  }, [schedule]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Schedule Name</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='environment'>Environment</Label>
          <Select
            value={formData.environment}
            onValueChange={(value) =>
              setFormData({ ...formData, environment: value })
            }
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
      </div>

      <div className='space-y-2'>
        <Label htmlFor='description'>Description</Label>
        <Textarea
          id='description'
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='testSuite'>Test Suite</Label>
        <Select
          value={formData.testSuiteId}
          onValueChange={(value) =>
            setFormData({ ...formData, testSuiteId: value })
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
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='scheduleType'>Schedule Type</Label>
          <Select
            value={formData.scheduleType}
            onValueChange={(value) =>
              setFormData({ ...formData, scheduleType: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='recurring'>Recurring</SelectItem>
              <SelectItem value='one-time'>One-Time</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='scheduledTime'>Scheduled Time</Label>
          <Input
            id='scheduledTime'
            type='time'
            value={formData.scheduledTime}
            onChange={(e) =>
              setFormData({ ...formData, scheduledTime: e.target.value })
            }
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label htmlFor='timezone'>Timezone</Label>
          <Select
            value={formData.timezone}
            onValueChange={(value) =>
              setFormData({ ...formData, timezone: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='UTC'>UTC</SelectItem>
              <SelectItem value='America/New_York'>America/New_York</SelectItem>
              <SelectItem value='America/Los_Angeles'>
                America/Los_Angeles
              </SelectItem>
              <SelectItem value='Europe/London'>Europe/London</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label htmlFor='retryAttempts'>Retry Attempts</Label>
          <Input
            id='retryAttempts'
            type='number'
            min='0'
            max='5'
            value={formData.retryAttempts}
            onChange={(e) =>
              setFormData({
                ...formData,
                retryAttempts: parseInt(e.target.value),
              })
            }
          />
        </div>
      </div>

      <div className='space-y-2'>
        <Label htmlFor='emailNotifications'>Email Notifications</Label>
        <Input
          id='emailNotifications'
          type='email'
          placeholder='user@example.com'
          value={formData.emailNotifications}
          onChange={(e) =>
            setFormData({ ...formData, emailNotifications: e.target.value })
          }
        />
      </div>

      <div className='flex items-center space-x-2'>
        <Switch
          id='isActive'
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <Label htmlFor='isActive'>Schedule is active</Label>
      </div>

      <div className='flex justify-end space-x-2 pt-4'>
        <Button type='button' variant='outline' onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type='submit'
          className='bg-gray-900 hover:bg-gray-800 text-white'
        >
          Update Schedule
        </Button>
      </div>
    </form>
  );
}
