import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import { User, Camera, Save, UserIcon } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

const accountInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  bio: z
    .string()
    .max(500, 'Bio must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  company: z.string().optional().or(z.literal('')),
  companyWebsite: z.string().url('Invalid URL').optional().or(z.literal('')),
  sector: z.string().optional().or(z.literal('')),
  jobTitle: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  // Avatar represented as either existing URL or a File for upload
  avatar: z
    .union([
      z.instanceof(File),
      z.string().url().optional(),
      z.literal('').optional(),
    ])
    .optional(),
});

type AccountInfoFormData = z.infer<typeof accountInfoSchema>;

export function AccountInfo() {
  const { toast } = useToast();
  const { user, updateProfileMutation } = useAuth();

  // Local avatar preview
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Derive initials fallback
  const initials = useMemo(() => {
    const fn = user?.firstName || '';
    const ln = user?.lastName || '';
    return `${fn.charAt(0) || ''}${ln.charAt(0) || ''}`.toUpperCase() || 'U';
  }, [user?.firstName, user?.lastName]);

  const form = useForm<AccountInfoFormData>({
    resolver: zodResolver(accountInfoSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      bio: (user as any)?.bio || '',
      company: (user as any)?.company || '',
      companyWebsite: (user as any)?.companyWebsite || '',
      sector: (user as any)?.sector || '',
      jobTitle: (user as any)?.jobTitle || '',
      phone: (user as any)?.phone || '',
      avatar: (user as any)?.avatarUrl || '',
    },
    mode: 'onChange',
  });

  // When user changes (first load/refetch), reset defaults
  useEffect(() => {
    form.reset({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      bio: (user as any)?.bio || '',
      company: (user as any)?.company || '',
      companyWebsite: (user as any)?.companyWebsite || '',
      sector: (user as any)?.sector || '',
      jobTitle: (user as any)?.jobTitle || '',
      phone: (user as any)?.phone || '',
      avatar: (user as any)?.avatarUrl || '',
    });
    setAvatarPreview((user as any)?.avatarUrl || null);
  }, [user, form]);

  // Handle avatar file selection
  const onAvatarChange = (file?: File | null) => {
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const onSubmit = async (data: AccountInfoFormData) => {
    try {
      // If avatar is a File, send via FormData to an upload endpoint or include in profile update as needed
      // For now, demonstrate a two-step: upload avatar -> get URL -> update profile
      let avatarUrl: string | undefined = undefined;

      if (data.avatar instanceof File) {
        // Example stub: replace with actual uploader call
        // const formData = new FormData();
        // formData.append('file', data.avatar);
        // const uploadRes = await apiRequest('POST', API_UPLOAD_AVATAR, { body: formData });
        // avatarUrl = (await uploadRes.json()).url;
        // Demo fallback: pretend upload returns existing preview URL after delay
        avatarUrl = avatarPreview || undefined;
      } else if (typeof data.avatar === 'string') {
        avatarUrl = data.avatar || undefined;
      }

      // Build payload for profile update
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        bio: data.bio || null,
        company: data.company || null,
        companyWebsite: data.companyWebsite || null,
        sector: data.sector || null,
        jobTitle: data.jobTitle || null,
        phone: data.phone || null,
        avatarUrl: avatarUrl || null,
      };

      await updateProfileMutation.mutateAsync(payload);

      toast({
        title: 'Account updated',
        description: 'Your account information has been successfully updated.',
      });
    } catch (err: any) {
      toast({
        title: 'Update failed',
        description: err?.message || 'Unable to update profile right now.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <UserIcon className='h-5 w-5' />
          Account Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className='flex flex-col sm:flex-row gap-6'>
          {/* Avatar Section */}
          <div className='flex flex-col items-center gap-4 sm:w-48'>
            <Avatar className='h-24 w-24'>
              <AvatarImage
                src={avatarPreview || (user as any)?.avatarUrl || ''}
                alt='Profile'
              />
              <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
            </Avatar>
            <Controller
              control={form.control}
              name='avatar'
              render={({ field: { onChange, value, ref } }) => (
                <div className='flex flex-col items-center gap-2 w-full'>
                  <label className='w-full' htmlFor='avatar-input'>
                    <input
                      id='avatar-input'
                      ref={ref}
                      type='file'
                      accept='image/png,image/jpeg,image/jpg,image/gif'
                      className='hidden'
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        onChange(file ?? value ?? '');
                        onAvatarChange(file);
                      }}
                    />
                    <Button
                      asChild
                      variant='outline'
                      size='sm'
                      className='text-xs w-full'
                    >
                      <span>
                        <Camera className='h-3 w-3 mr-2' />
                        Change Photo
                      </span>
                    </Button>
                  </label>
                  <div className='text-center text-xs text-gray-500'>
                    <p>JPG, PNG or GIF</p>
                    <p>Max size: 2MB</p>
                  </div>
                </div>
              )}
            />
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
                          <Input placeholder='Smith' {...field} />
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
                            type='url'
                            {...field}
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

                {/* <div className='flex justify-end pt-4'>
                  <Button
                    type='submit'
                    disabled={updateProfileMutation.isPending}
                  >
                    <Save className='h-4 w-4 mr-2' />
                    {updateProfileMutation.isPending
                      ? 'Saving...'
                      : 'Save Changes'}
                  </Button>
                </div> */}
              </form>
            </Form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
