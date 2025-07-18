import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Smartphone, Key, Mail, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const emailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required to change email'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type EmailFormData = z.infer<typeof emailSchema>;

export function LoginInfo() {
  const { toast } = useToast();
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [isEmailSectionOpen, setIsEmailSectionOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: '',
      password: '',
    },
  });

  const onPasswordSubmit = (data: PasswordFormData) => {
    console.log('Password change:', data);
    toast({
      title: 'Password updated',
      description: 'Your password has been changed successfully.',
    });
    passwordForm.reset();
    setIsPasswordSectionOpen(false);
  };

  const onEmailSubmit = (data: EmailFormData) => {
    console.log('Email change:', data);
    toast({
      title: 'Email verification sent',
      description: 'Please check your new email for verification instructions.',
    });
    emailForm.reset();
    setIsEmailSectionOpen(false);
  };

  const handleEnable2FA = () => {
    toast({
      title: 'Two-factor authentication',
      description: 'Setting up 2FA...',
    });
  };

  const handleRecoveryCodes = () => {
    toast({
      title: 'Recovery codes',
      description: 'Generating new recovery codes...',
    });
  };

  return (
    <div className="space-y-6">
      {/* Login Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Login & Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Email</p>
                <p className="text-sm text-gray-600 truncate">demo@example.com</p>
              </div>
              <Badge variant="secondary" className="text-xs">Verified</Badge>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Lock className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Password</p>
                <p className="text-sm text-gray-600">Last changed 30 days ago</p>
              </div>
              <Badge variant="secondary" className="text-xs">Strong</Badge>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Smartphone className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Two-Factor Auth</p>
                <p className="text-sm text-gray-600">Not enabled</p>
              </div>
              <Badge variant="destructive" className="text-xs">Disabled</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <Button 
              variant="outline"
              onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
            >
              {isPasswordSectionOpen ? 'Cancel' : 'Change Password'}
            </Button>
          </div>
        </CardHeader>
        {isPasswordSectionOpen && (
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showCurrentPassword ? "text" : "password"} 
                            placeholder="Enter current password" 
                            {...field} 
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showNewPassword ? "text" : "password"} 
                              placeholder="Enter new password" 
                              {...field} 
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                              {showNewPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm new password" 
                              {...field} 
                              className="pr-10"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 right-0 pr-3 flex items-center"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Password Requirements</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• At least 8 characters long</li>
                    <li>• Include uppercase and lowercase letters</li>
                    <li>• Include at least one number</li>
                    <li>• Include at least one special character</li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsPasswordSectionOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Update Password
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card>

      {/* Change Email */}
      {/* <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Change Email Address
            </CardTitle>
            <Button 
              variant="outline"
              onClick={() => setIsEmailSectionOpen(!isEmailSectionOpen)}
            >
              {isEmailSectionOpen ? 'Cancel' : 'Change Email'}
            </Button>
          </div>
        </CardHeader>
        {isEmailSectionOpen && (
          <CardContent>
            <Form {...emailForm}>
              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                  control={emailForm.control}
                  name="newEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Email Address</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter new email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={emailForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input 
                            type={showEmailPassword ? "text" : "password"} 
                            placeholder="Enter your password to confirm" 
                            {...field} 
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowEmailPassword(!showEmailPassword)}
                          >
                            {showEmailPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-yellow-900 mb-1">Important Notice</h4>
                      <p className="text-sm text-yellow-800">
                        You'll need to verify your new email address before the change takes effect. 
                        Your current email will remain active until verification is complete.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsEmailSectionOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Send Verification Email
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        )}
      </Card> */}

      {/* Two-Factor Authentication */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Authenticator App</h4>
                <p className="text-sm text-gray-600">
                  Use an authenticator app to generate secure codes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="destructive" className="text-xs">Not Setup</Badge>
                <Button onClick={handleEnable2FA}>
                  Enable
                </Button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg opacity-50">
              <div className="space-y-1">
                <h4 className="font-medium">Recovery Codes</h4>
                <p className="text-sm text-gray-600">
                  Generate backup codes for account recovery
                </p>
              </div>
              <Button variant="outline" disabled>
                <Key className="h-4 w-4 mr-2" />
                Generate Codes
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Why enable 2FA?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Adds an extra layer of security to your account</li>
                <li>• Protects against unauthorized access</li>
                <li>• Required for sensitive operations</li>
                <li>• Compatible with Google Authenticator, Authy, and more</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}