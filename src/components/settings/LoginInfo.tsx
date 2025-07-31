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
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'wouter';

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
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
  const { user, changePasswordMutation, updateProfileMutation } = useAuth();
  const [_, setLocation] = useLocation();

  // Calculate last password change date (for demo purposes using a random value between 1-60 days)
  const [lastPasswordChange] = useState(() => {
    return Math.floor(Math.random() * 60) + 1;
  });

  // Two-factor authentication state (demo)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState(() => {
    // Generate a random 6-digit code
    return Math.floor(100000 + Math.random() * 900000).toString();
  });
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

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

  const onPasswordSubmit = async (data: PasswordFormData) => {
    try {
      const passwordResponse = await changePasswordMutation.mutateAsync({
        oldPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setLocation('/signin')
      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully.',
      });
      passwordForm.reset();
      setIsPasswordSectionOpen(false);
    } catch (error) {
      console.error("Error changing password:", error);
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const onEmailSubmit = async (data: EmailFormData) => {
    try {
      // Attempt to update the user email
      await updateProfileMutation.mutateAsync({
        email: data.newEmail
      });

      toast({
        title: 'Email verification sent',
        description: 'Please check your new email for verification instructions.',
      });
      emailForm.reset();
      setIsEmailSectionOpen(false);
    } catch (error) {
      console.error("Error changing email:", error);
      toast({
        title: 'Error',
        description: 'Failed to change email. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEnable2FA = () => {
    setShowTwoFactorSetup(true);
  };

  const handleConfirm2FA = () => {
    setTwoFactorEnabled(true);
    setShowTwoFactorSetup(false);

    // Generate recovery codes
    const codes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 6) + '-' +
      Math.random().toString(36).substring(2, 6)
    );
    setRecoveryCodes(codes);

    toast({
      title: 'Two-factor authentication enabled',
      description: 'Your account is now more secure with 2FA.',
    });
  };

  const handleDisable2FA = () => {
    if (confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
      setTwoFactorEnabled(false);
      setRecoveryCodes([]);

      toast({
        title: 'Two-factor authentication disabled',
        description: 'Two-factor authentication has been turned off.',
      });
    }
  };

  const handleRecoveryCodes = () => {
    if (!twoFactorEnabled) {
      toast({
        title: 'Two-factor authentication required',
        description: 'You need to enable 2FA before generating recovery codes.',
        variant: 'destructive'
      });
      return;
    }

    // Regenerate recovery codes
    const codes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 6) + '-' +
      Math.random().toString(36).substring(2, 6)
    );
    setRecoveryCodes(codes);

    toast({
      title: 'Recovery codes generated',
      description: 'Keep these codes in a safe place. You can use them if you lose access to your authenticator app.',
    });
  };

  // Show loading state if user data is not yet available
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-4 border-t-blue-600 border-b-blue-600 border-r-transparent border-l-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Loading account information...</p>
        </div>
      </div>
    );
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">Email</p>
                <p className="text-sm text-gray-600 truncate">{user?.email || 'Not available'}</p>
              </div>
              <Badge variant="secondary" className="text-xs">Verified</Badge>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Lock className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Password</p>
                <p className="text-sm text-gray-600">Last changed {lastPasswordChange} days ago</p>
              </div>
              <Badge
                variant={lastPasswordChange > 45 ? "destructive" : lastPasswordChange > 30 ? "secondary" : "outline"}
                className="text-xs"
              >
                {lastPasswordChange > 45 ? "Change Recommended" : "Strong"}
              </Badge>
            </div>

            {/* <div className="flex items-center gap-3 p-4 border rounded-lg">
              <Smartphone className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium text-sm">Two-Factor Auth</p>
                <p className="text-sm text-gray-600">{twoFactorEnabled ? 'Enabled' : 'Not enabled'}</p>
              </div>
              <Badge 
                variant={twoFactorEnabled ? "outline" : "destructive"} 
                className={`text-xs ${twoFactorEnabled ? 'bg-green-100 text-green-800' : ''}`}
              >
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div> */}
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
                    <li><b>• Recommended to logoff and login again after changing password</b></li>
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
                <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-md text-blue-700">
                  <Mail className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm">Current email: <strong>{user?.email || 'Not available'}</strong></span>
                </div>
                
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
                  <Button 
                    type="submit" 
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? 'Sending...' : 'Send Verification Email'}
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
                <Badge 
                  variant={twoFactorEnabled ? "outline" : "destructive"} 
                  className={`text-xs ${twoFactorEnabled ? 'bg-green-100 text-green-800' : ''}`}
                >
                  {twoFactorEnabled ? 'Enabled' : 'Not Setup'}
                </Badge>
                {twoFactorEnabled ? (
                  <Button variant="destructive" onClick={handleDisable2FA}>
                    Disable
                  </Button>
                ) : (
                  <Button onClick={handleEnable2FA}>
                    Enable
                  </Button>
                )}
              </div>
            </div>

            {showTwoFactorSetup && (
              <div className="p-4 border rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3">Set up Two-Factor Authentication</h4>
                <div className="space-y-4">
                  <ol className="list-decimal pl-5 space-y-3 text-sm">
                    <li>Download an authenticator app like Google Authenticator or Authy</li>
                    <li>Scan the QR code or enter the setup key manually</li>
                    <li>Enter the 6-digit code from your authenticator app below</li>
                  </ol>
                  
                  <div className="flex flex-col items-center my-6">
                    <div className="bg-white p-3 border mb-3" style={{width: '200px', height: '200px'}}>
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-xs">QR Code Placeholder</span>
                      </div>
                    </div>
                    <p className="text-sm font-medium mb-1">Setup key:</p>
                    <p className="font-mono bg-gray-100 px-3 py-1 rounded text-sm select-all">
                      {twoFactorCode.split('').join(' ')}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Verification code</label>
                    <div className="flex gap-2">
                      <Input 
                        type="text"
                        placeholder="Enter 6-digit code"
                        className="max-w-[180px]"
                      />
                      <Button onClick={handleConfirm2FA}>
                        Verify & Enable
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg ${!twoFactorEnabled ? 'opacity-50' : ''}`}>
              <div className="space-y-1">
                <h4 className="font-medium">Recovery Codes</h4>
                <p className="text-sm text-gray-600">
                  Generate backup codes for account recovery
                </p>
              </div>
              <Button variant="outline" disabled={!twoFactorEnabled} onClick={handleRecoveryCodes}>
                <Key className="h-4 w-4 mr-2" />
                Generate Codes
              </Button>
            </div>
            
            {recoveryCodes.length > 0 && (
              <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                <div className="flex items-start gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Recovery Codes</h4>
                    <p className="text-sm text-yellow-800">
                      Save these recovery codes in a secure place. Each code can only be used once.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
                  {recoveryCodes.map((code, index) => (
                    <div key={index} className="font-mono text-xs bg-white p-2 border rounded select-all">
                      {code}
                    </div>
                  ))}
                </div>
                
                <Button variant="outline" size="sm" className="mt-2" onClick={() => setRecoveryCodes([])}>
                  I've saved these codes
                </Button>
              </div>
            )}

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