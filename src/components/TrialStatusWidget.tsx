import React from 'react';
import { useTrialManagement } from '@/hooks/useTrialManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Crown, TrendingUp, Zap } from 'lucide-react';

const TrialStatusWidget: React.FC = () => {
  const {
    canStartTrial,
    isTrialActive,
    isTrialExpired,
    trialDaysLeft,
    startTrial,
    convertTrial,
    isStartingTrial,
    isConvertingTrial,
  } = useTrialManagement();

  if (!canStartTrial && !isTrialActive && !isTrialExpired) {
    return null;
  }

  const trialProgress = isTrialActive ? ((15 - trialDaysLeft) / 15) * 100 : 0;

  return (
    <Card className='w-full'>
      <CardHeader className='pb-3'>
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Crown className='w-5 h-5 text-blue-600' />
            Trial Status
          </CardTitle>
          {isTrialActive && (
            <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
              Active
            </Badge>
          )}
          {isTrialExpired && <Badge variant='destructive'>Expired</Badge>}
          {canStartTrial && <Badge variant='outline'>Available</Badge>}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {canStartTrial && (
          <>
            <p className='text-sm text-muted-foreground'>
              Start your free 15-day trial to unlock Pro features
            </p>
            <Button
              onClick={() => startTrial({ planId: 'pro-trial' })}
              disabled={isStartingTrial}
              className='w-full'
              size='sm'
            >
              <Zap className='w-4 h-4 mr-2' />
              {isStartingTrial ? 'Starting...' : 'Start Free Trial'}
            </Button>
          </>
        )}

        {isTrialActive && (
          <>
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>Days remaining</span>
                <span className='font-medium'>{trialDaysLeft} of 15</span>
              </div>
              <Progress value={trialProgress} className='h-2' />
            </div>

            <div className='space-y-2'>
              <p className='text-sm text-muted-foreground'>
                You're enjoying full Pro features during your trial
              </p>
              <div className='flex flex-col sm:grid sm:grid-cols-2 gap-2'>
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => convertTrial('pro')}
                  disabled={isConvertingTrial}
                  className='w-full'
                >
                  <TrendingUp className='w-4 h-4 mr-1' />
                  Upgrade
                </Button>
                <Button size='sm' variant='ghost' className='w-full'>
                  View Plans
                </Button>
              </div>
            </div>
          </>
        )}

        {isTrialExpired && (
          <>
            <p className='text-sm text-muted-foreground'>
              Your trial has ended. Upgrade to continue using Pro features.
            </p>
            <Button
              onClick={() => convertTrial('pro')}
              disabled={isConvertingTrial}
              className='w-full'
              size='sm'
            >
              <Crown className='w-4 h-4 mr-2' />
              {isConvertingTrial ? 'Processing...' : 'Upgrade Now'}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TrialStatusWidget;
