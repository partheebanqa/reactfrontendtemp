import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Camera, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const accountInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  company: z.string().optional(),
  companyWebsite: z.string().optional(),
  sector: z.string().optional(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

type AccountInfoFormData = z.infer<typeof accountInfoSchema>;

export function AccountInfo() {
  const { toast } = useToast();

  const form = useForm<AccountInfoFormData>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'demo@example.com',
      bio: 'API testing enthusiast with 5+ years of experience in software development.',
      company: 'Tech Solutions Inc.',
      companyWebsite: 'https://techsolutions.com',
      sector: 'Technology',
      jobTitle: 'Senior Developer',
      phone: '+1 (555) 123-4567',
    },
  });

  const onSubmit = (data: AccountInfoFormData) => {
    toast({
      title: 'Account updated',
      description: 'Your account information has been successfully updated.',
    });
  };

  const handleAvatarUpload = () => {
    toast({
      title: 'Feature coming soon',
      description: 'Avatar upload functionality will be available soon.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <User className='h-5 w-5' />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col sm:flex-row gap-6'>
          {/* Avatar Section */}
          <div className='flex flex-col items-center gap-4 sm:w-48'>
            <Avatar className='h-24 w-24'>
              <AvatarImage src='/api/placeholder/150/150' alt='Profile' />
              <AvatarFallback className='text-lg'>JD</AvatarFallback>
            </Avatar>
            <Button
              variant='outline'
              size='sm'
              onClick={handleAvatarUpload}
              className='text-xs'
            >
              <Camera className='h-3 w-3 mr-2' />
              Change Photo
            </Button>
            <div className='text-center text-xs text-gray-500'>
              <p>JPG, PNG or GIF</p>
              <p>Max size: 2MB</p>
            </div>
          </div>

          {/* Form Section */}
          <div className='flex-1'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-4'
              >
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='firstName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder='John' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='lastName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Doe' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='email'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='john@example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='company'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder='Your Company' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='jobTitle'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder='Software Developer' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='companyWebsite'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Website (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='https://example.com'
                            {...field}
                            type='url'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name='sector'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='e.g., Technology, Healthcare, Finance'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='phone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder='+1 (555) 123-4567' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='bio'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Tell us about yourself...'
                          rows={3}
                          className='resize-none'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end pt-4 border-t'>
                  <Button type='submit'>
                    <Save className='h-4 w-4 mr-2' />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
