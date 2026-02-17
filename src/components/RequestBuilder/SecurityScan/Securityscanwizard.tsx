'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Play,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Settings,
  ChevronRight,
  Lock,
  Unlock,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useSecurityScanFlow } from '@/store/securityScan';

export interface SecurityScanWizardProps {
  request: {
    id: string;
    name: string;
    method: string;
    url: string;
  };
  workspaceId: string;
  environmentId?: string;
  preRequestId?: string;
  onClose: () => void;
  onComplete?: () => void;
}

type WizardStep =
  | 'initial'
  | 'authCheck'
  | 'authRequired'
  | 'setupAutoAuth'
  | 'scanning';

export default function SecurityScanWizard({
  request,
  workspaceId,
  environmentId,
  preRequestId,
  onClose,
  onComplete,
}: SecurityScanWizardProps) {
  const [step, setStep] = useState<WizardStep>('initial');
  const { toast } = useToast();
  const { currentWorkspace } = useWorkspace();
  const { executeScan, isLoading } = useSecurityScanFlow(
    currentWorkspace?.id || '',
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const hasAutoAuth = !!preRequestId;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInitialize = () => {
    setStep('authCheck');
  };

  const handleAuthResponse = async (requiresAuth: boolean) => {
    if (hasAutoAuth) {
      if (requiresAuth) {
        setStep('authRequired');
        // Wait a moment to show the message
        setTimeout(() => {
          startActualScan();
        }, 2000);
      } else {
        startActualScan();
      }
    } else {
      if (requiresAuth) {
        setStep('setupAutoAuth');
      } else {
        startActualScan();
      }
    }
  };

  const handleAutoAuthSetup = (action: 'setup' | 'skip') => {
    if (action === 'setup') {
      toast({
        title: 'Setup Required',
        description: 'Please configure Auto-Auth in your collection settings',
      });
      onClose();
    } else if (action === 'skip') {
      startActualScan();
    }
  };

  const startActualScan = async () => {
    try {
      setStep('scanning');
      abortControllerRef.current = new AbortController();

      const result = await executeScan(
        request.id,
        (status) => {
          if (abortControllerRef.current?.signal.aborted) {
            throw new Error('Scan cancelled');
          }
        },
        abortControllerRef.current.signal,
        environmentId,
        preRequestId,
      );

      toast({
        title: 'Scan Complete',
        description: `Found ${result.totalIssues} security issues`,
      });

      onComplete?.();
    } catch (error: any) {
      if (error.message === 'Scan cancelled') {
        return;
      }

      console.error('Security scan failed:', error);
      toast({
        title: 'Scan Failed',
        description: error.message || 'Failed to complete security scan',
        variant: 'destructive',
      });
      onClose();
    } finally {
      abortControllerRef.current = null;
    }
  };

  // Initial screen - ready to scan
  if (step === 'initial') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden'>
        {/* Animated background orb */}
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse' />
        </div>

        <div className='relative w-full max-w-lg'>
          <div className='bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl'>
            {/* Icon */}
            <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30'>
              <Shield className='w-10 h-10 sm:w-12 sm:h-12 text-white' />
            </div>

            {/* Content */}
            <h1 className='text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-50 mb-4 text-center tracking-tight'>
              Security Scan Ready
            </h1>
            <p className='text-slate-400 text-center mb-2 text-sm sm:text-base leading-relaxed px-2'>
              <span className='font-medium text-slate-300'>
                {request.method}
              </span>{' '}
              <span className='text-violet-400'>{request.name}</span>
            </p>
            <p className='text-slate-500 text-center mb-8 text-xs sm:text-sm leading-relaxed px-2 break-all'>
              {request.url}
            </p>

            {/* Primary button */}
            <button
              onClick={handleInitialize}
              className='w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center gap-3 text-base sm:text-lg group'
            >
              <span>Initialize Scan</span>
              <ChevronRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
            </button>

            {/* Status badge */}
            {hasAutoAuth && (
              <div className='mt-6 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl'>
                <CheckCircle className='w-5 h-5 text-emerald-400 flex-shrink-0' />
                <span className='text-emerald-400 text-sm font-medium'>
                  Auto Auth Configured
                </span>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className='absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors'
            >
              <X className='w-5 h-5 text-slate-400' />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authentication check prompt
  if (step === 'authCheck') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse' />
        </div>

        <div className='relative w-full max-w-lg'>
          <div className='bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl'>
            {/* Icon */}
            <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30'>
              <Lock className='w-10 h-10 sm:w-12 sm:h-12 text-white' />
            </div>

            {/* Content */}
            <h2 className='text-2xl sm:text-3xl font-bold text-slate-50 mb-4 text-center tracking-tight'>
              Authentication Check
            </h2>
            <p className='text-slate-400 text-center mb-8 text-sm sm:text-base leading-relaxed px-2'>
              Does your API require authentication headers, tokens, or
              credentials to access endpoints?
            </p>

            {/* Choice buttons */}
            <div className='space-y-3 sm:space-y-4'>
              <button
                onClick={() => handleAuthResponse(true)}
                className='w-full p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700/70 border-2 border-emerald-500/30 hover:border-emerald-500/50 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 active:translate-y-0 flex items-start gap-4 group'
              >
                <div className='w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors'>
                  <CheckCircle className='w-6 h-6 sm:w-7 sm:h-7 text-emerald-400' />
                </div>
                <div className='flex-1 text-left'>
                  <div className='text-slate-50 font-semibold text-base sm:text-lg mb-1'>
                    Yes, Authentication Required
                  </div>
                  <div className='text-slate-400 text-xs sm:text-sm'>
                    API needs auth headers or tokens
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleAuthResponse(false)}
                className='w-full p-4 sm:p-5 bg-slate-700/50 hover:bg-slate-700/70 border-2 border-indigo-500/30 hover:border-indigo-500/50 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/20 active:translate-y-0 flex items-start gap-4 group'
              >
                <div className='w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/30 transition-colors'>
                  <Unlock className='w-6 h-6 sm:w-7 sm:h-7 text-indigo-400' />
                </div>
                <div className='flex-1 text-left'>
                  <div className='text-slate-50 font-semibold text-base sm:text-lg mb-1'>
                    No Authentication Needed
                  </div>
                  <div className='text-slate-400 text-xs sm:text-sm'>
                    Public API, no auth required
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={onClose}
              className='absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors'
            >
              <X className='w-5 h-5 text-slate-400' />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Auto Auth enabled - will use configured auth
  if (step === 'authRequired') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-emerald-500/10 rounded-full blur-3xl animate-pulse' />
        </div>

        <div className='relative w-full max-w-lg'>
          <div className='bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl'>
            <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/30'>
              <CheckCircle className='w-10 h-10 sm:w-12 sm:h-12 text-white' />
            </div>

            <h2 className='text-2xl sm:text-3xl font-bold text-slate-50 mb-4 text-center tracking-tight'>
              Using Configured Authentication
            </h2>
            <p className='text-slate-400 text-center mb-8 text-sm sm:text-base leading-relaxed px-2'>
              We'll use your Auto Auth configuration to authenticate requests
              during the security scan. This ensures accurate results for
              protected endpoints.
            </p>

            <div className='p-4 sm:p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl'>
              <div className='flex items-center gap-3'>
                <CheckCircle className='w-6 h-6 text-emerald-400 flex-shrink-0' />
                <span className='text-slate-200 font-medium text-sm sm:text-base'>
                  Auto Auth Enabled
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Auto Auth NOT configured - prompt user
  if (step === 'setupAutoAuth') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-amber-500/10 rounded-full blur-3xl animate-pulse' />
        </div>

        <div className='relative w-full max-w-2xl'>
          <div className='bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl'>
            <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/30'>
              <AlertCircle className='w-10 h-10 sm:w-12 sm:h-12 text-white' />
            </div>

            <h2 className='text-2xl sm:text-3xl font-bold text-slate-50 mb-4 text-center tracking-tight'>
              Auto Auth Not Configured
            </h2>
            <p className='text-slate-400 text-center mb-8 text-sm sm:text-base leading-relaxed px-2'>
              Your API requires authentication, but Auto Auth isn't set up yet.
              Setting it up will ensure more accurate security scan results for
              protected endpoints.
            </p>

            {/* Action cards grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6'>
              {/* Setup card */}
              <button
                onClick={() => handleAutoAuthSetup('setup')}
                className='p-5 sm:p-6 bg-slate-700/50 hover:bg-slate-700/70 border-2 border-violet-500/30 hover:border-violet-500/50 rounded-2xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-violet-500/30 active:translate-y-0 text-center group'
              >
                <div className='w-14 h-14 sm:w-16 sm:h-16 bg-violet-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-violet-500/30 transition-colors'>
                  <Settings className='w-7 h-7 sm:w-8 sm:h-8 text-violet-400' />
                </div>
                <h3 className='text-slate-50 font-semibold text-base sm:text-lg mb-2'>
                  Setup Auto Auth
                </h3>
                <p className='text-slate-400 text-xs sm:text-sm mb-3 leading-relaxed'>
                  Configure authentication for accurate scan results
                </p>
                <span className='inline-block px-3 py-1.5 bg-violet-500/20 rounded-lg text-violet-300 text-xs font-semibold'>
                  Recommended
                </span>
              </button>

              {/* Skip card */}
              <button
                onClick={() => handleAutoAuthSetup('skip')}
                className='p-5 sm:p-6 bg-slate-700/50 hover:bg-slate-700/70 border-2 border-slate-600/30 hover:border-slate-600/50 rounded-2xl transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-600/20 active:translate-y-0 text-center group'
              >
                <div className='w-14 h-14 sm:w-16 sm:h-16 bg-slate-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-slate-600/30 transition-colors'>
                  <ChevronRight className='w-7 h-7 sm:w-8 sm:h-8 text-slate-400' />
                </div>
                <h3 className='text-slate-50 font-semibold text-base sm:text-lg mb-2'>
                  Continue Without Auth
                </h3>
                <p className='text-slate-400 text-xs sm:text-sm mb-3 leading-relaxed'>
                  Scan public endpoints only, may miss protected routes
                </p>
                <span className='inline-block px-3 py-1.5 bg-slate-600/20 rounded-lg text-slate-400 text-xs font-semibold'>
                  Limited Results
                </span>
              </button>
            </div>

            {/* Info box */}
            <div className='p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex gap-3 items-start'>
              <AlertCircle className='w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5' />
              <p className='text-slate-300 text-xs sm:text-sm leading-relaxed'>
                Without authentication, the scan may report false positives for
                protected endpoints and miss authentication-specific
                vulnerabilities.
              </p>
            </div>

            <button
              onClick={onClose}
              className='absolute top-4 right-4 p-2 hover:bg-slate-700/50 rounded-lg transition-colors'
            >
              <X className='w-5 h-5 text-slate-400' />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Scanning in progress
  if (step === 'scanning') {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden'>
        <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
          <div className='w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-violet-500/10 rounded-full blur-3xl animate-pulse' />
        </div>

        <div className='relative w-full max-w-lg'>
          <div className='bg-slate-800/70 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-6 sm:p-10 shadow-2xl'>
            <div className='w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/30'>
              <Loader2 className='w-10 h-10 sm:w-12 sm:h-12 text-white animate-spin' />
            </div>

            <h2 className='text-2xl sm:text-3xl font-bold text-slate-50 mb-4 text-center tracking-tight'>
              Security Scan in Progress
            </h2>
            <p className='text-slate-400 text-center mb-8 text-sm sm:text-base leading-relaxed px-2'>
              Analyzing your API endpoints for vulnerabilities and security
              issues...
            </p>

            {/* Progress bar */}
            <div className='h-2 bg-slate-700/50 rounded-full overflow-hidden mb-8'>
              <div className='h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full w-3/4 animate-pulse' />
            </div>

            {/* Status list */}
            <div className='space-y-4'>
              <div className='flex items-center gap-3'>
                <div className='w-3 h-3 bg-violet-500 rounded-full animate-pulse flex-shrink-0' />
                <span className='text-slate-300 text-sm sm:text-base'>
                  Scanning endpoints...
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-3 h-3 bg-slate-600 rounded-full flex-shrink-0' />
                <span className='text-slate-500 text-sm sm:text-base'>
                  Checking authentication flows...
                </span>
              </div>
              <div className='flex items-center gap-3'>
                <div className='w-3 h-3 bg-slate-600 rounded-full flex-shrink-0' />
                <span className='text-slate-500 text-sm sm:text-base'>
                  Analyzing vulnerabilities...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
