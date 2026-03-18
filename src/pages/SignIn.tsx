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
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Loader } from '@/components/Loader';
import LogoFull from '../assests/images/OptraLogo.webp';

export default function SignIn() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation, isAuthenticated, user, isLoading } = useAuth();
  const { error: errorToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Redirect if user is already authenticated
  if (isAuthenticated && !isLoading) {
    setLocation('/dashboard');
    return null;
  }

  if (isLoading) {
    return (
      <>
        <Loader message='Loading ' />
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const loginMutationResult = await loginMutation.mutateAsync(formData);

      if (loginMutationResult?.token) {
        setLocation('/dashboard');
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred during login';
      errorToast(message);
    }
  };

  const handleDemoLogin = (
    userType: 'admin' | 'developer' | 'qa' | 'enterprise' | 'pro',
  ) => {
    const demoCredentials = {
      admin: { email: 'admin@optraflow.dev', password: 'admin123' },
      developer: { email: 'dev@optraflow.dev', password: 'dev123' },
      qa: { email: 'qa@optraflow.dev', password: 'qa123' },
      enterprise: { email: 'enterprise@optraflow.dev', password: 'ent123' },
      pro: { email: 'pro@optraflow.dev', password: 'pro123' },
    };

    const credentials = demoCredentials[userType];

    // In case the API isn't available, simulate a successful login for demo accounts
    try {
      setFormData(credentials);

      // First try normal login
      // signInMutation.mutate(credentials);

      // // If using demo accounts and API is not available, simulate login
      // setTimeout(() => {
      //   if (signInMutation.isError) {
      //     console.log("Using demo login fallback");
      //     // Mock token for demo purposes
      //     const mockToken = "demo_token_" + Math.random().toString(36).substring(2);
      //     const mockData = { token: mockToken };

      //     // Manually set the cookie and update auth state
      //     setEncryptedCookie(USER_COOKIE_NAME, {
      //       user: {
      //         firstName: userType,
      //         lastName: "User",
      //         email: credentials.email,
      //         role: userType === "admin" ? "admin" : userType === "enterprise" ? "enterprise" : "user"
      //       },
      //       token: mockToken
      //     });

      //     // Force a page reload to apply the cookie changes
      //     window.location.href = "/dashboard";
      //   }
      // }, 1000); // Give the regular login 1 second to complete or fail
    } catch (error) {
      console.error('Demo login error:', error);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='text-center'>
          <h2 className='mt-6 text-3xl font-bold text-gray-900 dark:text-white'>
            Sign in to Optraflow
          </h2>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            Access your API testing workspace
          </p>
        </div>

        <Card>
          <div className='flex justify-center items-center py-4'>
            <a href='/'>
              <img src={LogoFull} alt='Optraflow' className='w-32 h-auto' />
            </a>
          </div>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <Label htmlFor='email'>Email address</Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='email'
                    type='email'
                    required
                    className='pl-10'
                    placeholder='Enter your email'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value.trim() })
                    }
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
                    placeholder='Enter your password'
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        password: e.target.value.trim(),
                      })
                    }
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

              <div className='flex items-center justify-between'>
                <button
                  type='button'
                  className='text-sm text-blue-600 hover:text-blue-500'
                  onClick={() => setLocation('/forgot-password')}
                >
                  Forgot your password?
                </button>
              </div>

              <Button
                type='submit'
                className='w-full'
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or try demo accounts
                </span>
              </div>
            </div> */}

            {/* <div className="grid grid-cols-1 gap-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDemoLogin("enterprise")}
              >
                <span className="inline-flex items-center gap-2">
                  Enterprise Demo
                  <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                    ENT
                  </span>
                </span>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDemoLogin("pro")}
              >
                <span className="inline-flex items-center gap-2">
                  Pro Demo
                  <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                    PRO
                  </span>
                </span>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleDemoLogin("qa")}
              >
                <span className="inline-flex items-center gap-2">
                  Free Demo
                  <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                    FREE
                  </span>
                </span>
              </Button>
            </div> */}

            <div className='text-center'>
              <span className='text-sm text-gray-600 dark:text-gray-400'>
                Don't have an account?{' '}
                <button
                  className='text-blue-600 hover:text-blue-500 font-medium'
                  onClick={() => setLocation('/signup')}
                >
                  Sign up
                </button>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
