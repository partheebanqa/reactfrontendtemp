import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Lock, Mail, User, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import LogoFull from '../assests/images/OptraLogo.webp';
import { useToast } from '@/hooks/useToast';

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: '',
    agreedToTerms: false,
  });
  const { toast, error: errorToast } = useToast();
  const { registerMutation } = useAuth();

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const getOS = () => {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    let os = 'Unknown OS';

    if (platform.includes('Win')) {
      os = 'Windows';
    } else if (platform.includes('Mac')) {
      os = 'macOS';
    } else if (platform.includes('Linux')) {
      os = 'Linux';
    } else if (/iPhone|iPad|iPod/.test(userAgent)) {
      os = 'iOS';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    }
    return os;
  };

  const getBrowser = () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown Browser';
    let browserVersion = 'Unknown Version';

    if (
      userAgent.includes('Chrome') &&
      !userAgent.includes('Edg') &&
      !userAgent.includes('Brave')
    ) {
      browserName = 'Google Chrome';
      browserVersion =
        userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || browserVersion;
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion =
        userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || browserVersion;
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      browserVersion =
        userAgent.match(/Version\/([0-9.]+)/)?.[1] || browserVersion;
    } else if (userAgent.includes('Edg')) {
      browserName = 'Microsoft Edge';
      browserVersion = userAgent.match(/Edg\/([0-9.]+)/)?.[1] || browserVersion;
    } else if (userAgent.includes('Brave')) {
      browserName = 'Brave';
      browserVersion =
        userAgent.match(/BraveChrome\/([0-9.]+)/)?.[1] || browserVersion;
    }
    return { name: browserName, version: browserVersion };
  };

  const getTimezone = () => {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (formData.password !== formData.confirmPassword) {
        return;
      }

      if (!formData.agreedToTerms) {
        return;
      }
      const os = getOS();
      const browser = getBrowser();
      const timezone = getTimezone();
      const form = {
        ...formData,
        os,
        browser: browser.name,
        browserVersion: browser.version,
        timezone,
      };
      const response = await registerMutation.mutateAsync(form);
      if (response.message) {
        toast({
          title: 'Registration Successful',
          description: response.message,
          variant: 'success',
        });
        setLocation('/signin');
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      errorToast(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    }
  };

  const passwordsMatch = formData.password === formData.confirmPassword;
  const isEmailValid = emailRegex.test(formData.email);

  const isFormValid =
    formData.firstName &&
    formData.lastName &&
    isEmailValid &&
    formData.password &&
    formData.confirmPassword &&
    formData.organization &&
    passwordsMatch &&
    formData.agreedToTerms;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-bold text-gray-900 dark:text-white'>
            Create your account
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Start testing your APIs with Optraflow
          </p>
        </div>

        <Card>
          <div className='flex justify-center items-center py-4'>
            <a href='/'>
              <img src={LogoFull} alt='Optraflow' className='w-32 h-auto' />
            </a>
          </div>

          <CardHeader>
            <CardTitle>Sign up for Optraflow</CardTitle>
            {/* <CardDescription>
              Create your account and workspace to get started
            </CardDescription> */}
          </CardHeader>
          <CardContent className='space-y-6'>
            {registerMutation.isError && (
              <Alert variant='destructive'>
                <AlertDescription>
                  Failed to create account. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className='space-y-4'
              autoComplete='off'
            >
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='firstName'>First name</Label>
                  <div className='relative'>
                    <User className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                    <Input
                      id='firstName'
                      type='text'
                      required
                      className='pl-10'
                      placeholder='John'
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          firstName: e.target.value.trim(),
                        })
                      }
                      autoComplete='given-name'
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor='lastName'>Last name</Label>
                  <Input
                    id='lastName'
                    type='text'
                    required
                    placeholder='Smith'
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lastName: e.target.value.trim(),
                      })
                    }
                    autoComplete='family-name'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='email'>Email address</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    required
                    className='pl-10'
                    placeholder='john@company.com'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value.trim() })
                    }
                    autoComplete='email'
                  />
                </div>

                {formData.email && !isEmailValid && (
                  <p className='text-sm text-red-600 mt-1'>
                    Please enter a valid email address
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor='organization'>Organization</Label>
                <div className='relative'>
                  <Building className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='organization'
                    type='text'
                    required
                    className='pl-10'
                    placeholder='My Organization Name'
                    value={formData.organization}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        organization: e.target.value,
                      })
                    }
                    autoComplete='off'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='password'>Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    className='pl-10 pr-10'
                    placeholder='Create a password'
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value.trim(),
                      })
                    }
                    autoComplete='new-password'
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor='confirmPassword'>Confirm password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    className='pl-10 pr-10'
                    placeholder='Confirm your password'
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        confirmPassword: e.target.value.trim(),
                      })
                    }
                    autoComplete='new-password'
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && !passwordsMatch && (
                  <p className='text-sm text-red-600 mt-1'>
                    Passwords do not match
                  </p>
                )}
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='terms'
                  checked={formData.agreedToTerms}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      agreedToTerms: checked as boolean,
                    })
                  }
                />
                <Label htmlFor='terms' className='text-sm'>
                  I agree to the{' '}
                  <button
                    type='button'
                    className='text-blue-600 hover:text-blue-500'
                    onClick={() => setLocation('/terms')}
                  >
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button
                    type='button'
                    className='text-blue-600 hover:text-blue-500'
                    onClick={() => setLocation('/privacy')}
                  >
                    Privacy Policy
                  </button>
                </Label>
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={registerMutation.isPending || !isFormValid}
              >
                {registerMutation.isPending
                  ? 'Creating account...'
                  : 'Create account'}
              </Button>
            </form>

            <div className='text-center'>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Already have an account?{' '}
                <button
                  className='text-blue-600 hover:text-blue-500 font-medium'
                  onClick={() => setLocation('/signin')}
                >
                  Sign in
                </button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
