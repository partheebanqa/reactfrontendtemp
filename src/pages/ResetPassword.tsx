import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  Eye,
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { resetPasswordApi } from '@/services/auth.service';

const ResetPassword: React.FC = () => {
  const [location, setLocation] = useLocation();

  const { toast } = useToast();

  const getToken = () => {
    const sessionToken = sessionStorage.getItem('resetPasswordToken');
    if (sessionToken) {
      return sessionToken;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');

    if (urlToken) {
      sessionStorage.setItem('resetPasswordToken', urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      return urlToken;
    }

    return null;
  };

  const [token] = useState(getToken());

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    newPassword: false,
    confirmPassword: false,
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Clean up sessionStorage when component unmounts
  useEffect(() => {
    // Clean up the token from sessionStorage when leaving the page
    // (except when successfully resetting password)
    const timeoutId = setTimeout(() => {
      sessionStorage.removeItem('resetPasswordToken');
    }, 100);

    return () => clearTimeout(timeoutId);
  }, []);

  // Redirect to login if no token
  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid Link',
        description: 'This password reset link is invalid or missing a token.',
        variant: 'destructive',
      });
      setLocation('/login');
    }
  }, [token, setLocation, toast]);

  // Mock API request function (replace with your actual API call)
  const apiRequest = async (method: string, url: string, data: any) => {
    // This is a mock - replace with your actual API implementation
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    return response.json();
  };

  // Verify token validity
  const {
    data: tokenVerification,
    isLoading: isVerifyingToken,
    error: tokenError,
  } = useQuery({
    queryKey: [`/api/auth/verify-reset-token/${token}`],
    enabled: !!token,
    retry: false,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: ({
      token,
      newPassword,
    }: {
      token: string;
      newPassword: string;
    }) => resetPasswordApi({ token, newPassword }),

    onSuccess: () => {
      // Clear the token from sessionStorage on successful reset
      sessionStorage.removeItem('resetPasswordToken');

      toast({
        title: 'Password Reset Successful',
        description:
          'Your password has been updated. You can now sign in with your new password.',
      });

      setTimeout(() => setLocation('/login'), 2000);
    },

    onError: (error: any) => {
      toast({
        title: 'Reset Failed',
        description:
          error.message || 'Failed to reset password. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Password validation
  const validatePasswords = () => {
    const errors: string[] = [];

    if (passwords.newPassword.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])/.test(passwords.newPassword)) {
      errors.push('Password must contain both uppercase and lowercase letters');
    }

    if (!/(?=.*\d)/.test(passwords.newPassword)) {
      errors.push('Password must contain at least one number');
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      errors.push('Passwords do not match');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handlePasswordChange = (
    field: 'newPassword' | 'confirmPassword',
    value: string
  ) => {
    setPasswords((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswords() || !token) return;

    resetPasswordMutation.mutate({
      token,
      newPassword: passwords.newPassword,
    });
  };

  const togglePasswordVisibility = (
    field: 'newPassword' | 'confirmPassword'
  ) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Loading state for token verification
  if (isVerifyingToken) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardContent className='p-8'>
            <div className='flex flex-col items-center space-y-4'>
              <div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin'></div>
              <p className='text-muted-foreground'>Verifying reset token...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for invalid token
  //   if (tokenError || !(tokenVerification as any)?.success) {
  //     return (
  //       <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4'>
  //         <Card className='w-full max-w-md'>
  //           <CardHeader className='text-center pb-4'>
  //             <div className='w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4'>
  //               <AlertCircle className='w-8 h-8 text-red-600 dark:text-red-400' />
  //             </div>
  //             <CardTitle className='text-xl font-semibold text-red-600 dark:text-red-400'>
  //               Invalid Reset Link
  //             </CardTitle>
  //           </CardHeader>
  //           <CardContent className='text-center space-y-4'>
  //             <p className='text-muted-foreground'>
  //               This password reset link is invalid or has expired. Please request
  //               a new one.
  //             </p>
  //             <Button
  //               variant='outline'
  //             onClick={() => navigate('/login')}
  //               className='w-full'
  //             >
  //               <ArrowLeft className='w-4 h-4 mr-2' />
  //               Back to Login
  //             </Button>
  //           </CardContent>
  //         </Card>
  //       </div>
  //     );
  //   }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md shadow-xl'>
        <CardHeader className='text-center pb-4'>
          <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Shield className='w-8 h-8 text-primary' />
          </div>
          <CardTitle className='text-2xl font-bold'>
            Reset Your Password
          </CardTitle>
          <p className='text-muted-foreground'>
            Enter your new password for{' '}
            <strong>{(tokenVerification as any)?.email}</strong>
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* New Password Field */}
            <div className='space-y-2'>
              <Label htmlFor='newPassword' className='text-sm font-medium'>
                New Password
              </Label>
              <div className='relative'>
                <Input
                  id='newPassword'
                  type={showPasswords.newPassword ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) =>
                    handlePasswordChange('newPassword', e.target.value)
                  }
                  placeholder='Enter new password'
                  className='pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showPasswords.newPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-sm font-medium'>
                Confirm Password
              </Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) =>
                    handlePasswordChange('confirmPassword', e.target.value)
                  }
                  placeholder='Confirm new password'
                  className='pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                >
                  {showPasswords.confirmPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2'>
              <h4 className='text-sm font-medium text-muted-foreground mb-2'>
                Password Requirements:
              </h4>
              <div className='space-y-1 text-xs'>
                <div
                  className={`flex items-center space-x-2 ${
                    passwords.newPassword.length >= 6
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CheckCircle className='w-3 h-3' />
                  <span>At least 6 characters</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    /(?=.*[a-z])(?=.*[A-Z])/.test(passwords.newPassword)
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CheckCircle className='w-3 h-3' />
                  <span>Both uppercase and lowercase letters</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    /(?=.*\d)/.test(passwords.newPassword)
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CheckCircle className='w-3 h-3' />
                  <span>At least one number</span>
                </div>
                <div
                  className={`flex items-center space-x-2 ${
                    passwords.newPassword &&
                    passwords.confirmPassword &&
                    passwords.newPassword === passwords.confirmPassword
                      ? 'text-green-600'
                      : 'text-muted-foreground'
                  }`}
                >
                  <CheckCircle className='w-3 h-3' />
                  <span>Passwords match</span>
                </div>
              </div>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  <ul className='list-disc list-inside space-y-1'>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              className='w-full'
              disabled={
                resetPasswordMutation.isPending || validationErrors.length > 0
              }
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock className='w-4 h-4 mr-2' />
                  Reset Password
                </>
              )}
            </Button>

            {/* Back to Login */}
            <Button
              type='button'
              variant='ghost'
              onClick={() => setLocation('/login')}
              className='w-full'
            >
              <ArrowLeft className='w-4 h-4 mr-2' />
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;
