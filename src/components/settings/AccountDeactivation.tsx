import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { UserMinus, AlertTriangle, Shield, Download, Trash2, FileText } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const deactivationSchema = z.object({
  password: z.string().min(1, 'Password is required for verification'),
  reason: z.enum([
    'no_longer_needed',
    'found_alternative',
    'too_expensive',
    'poor_experience',
    'technical_issues',
    'temporary_break',
    'other'
  ], {
    required_error: 'Please select a reason',
  }),
  feedback: z.string().optional(),
  dataHandling: z.enum(['delete_immediately', 'keep_30_days', 'keep_90_days'], {
    required_error: 'Please select data handling preference',
  }),
  confirmations: z.object({
    dataLoss: z.boolean().refine(val => val === true, 'You must acknowledge data loss'),
    subscriptionCancellation: z.boolean().refine(val => val === true, 'You must acknowledge subscription cancellation'),
    irreversible: z.boolean().refine(val => val === true, 'You must acknowledge this action is irreversible'),
  }),
});

type DeactivationFormData = z.infer<typeof deactivationSchema>;

export function AccountDeactivation() {
  const { toast } = useToast();
  const [isDeactivationDialogOpen, setIsDeactivationDialogOpen] = useState(false);
  const [step, setStep] = useState(1);

  const form = useForm<DeactivationFormData>({
    resolver: zodResolver(deactivationSchema),
    defaultValues: {
      password: '',
      reason: 'no_longer_needed',
      feedback: '',
      dataHandling: 'keep_30_days',
      confirmations: {
        dataLoss: false,
        subscriptionCancellation: false,
        irreversible: false,
      },
    },
  });

  const deactivationMutation = useMutation({
    mutationFn: async (data: DeactivationFormData) => {
      const response = await apiRequest('POST', '/api/auth/deactivate', data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to deactivate account');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Account deactivated',
        description: 'Your account has been successfully deactivated.',
      });
      setIsDeactivationDialogOpen(false);
      // Redirect to login or home page
      window.location.href = '/';
    },
    onError: (error: Error) => {
      toast({
        title: 'Deactivation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDataExport = () => {
    toast({
      title: 'Export started',
      description: 'Your data export has been queued. You will receive an email when ready.',
    });
  };

  const onSubmit = (data: DeactivationFormData) => {
    deactivationMutation.mutate(data);
  };

  const reasonLabels = {
    no_longer_needed: "I no longer need this service",
    found_alternative: "I found a better alternative",
    too_expensive: "It's too expensive",
    poor_experience: "Poor user experience",
    technical_issues: "Technical issues",
    temporary_break: "Taking a temporary break",
    other: "Other reason"
  };

  const dataHandlingLabels = {
    delete_immediately: "Delete all data immediately",
    keep_30_days: "Keep data for 30 days (allows account recovery)",
    keep_90_days: "Keep data for 90 days (extended recovery period)"
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <UserMinus className="h-5 w-5" />
          Deactivate Your Account
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Notice */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Account Deactivation Warning
              </p>
              <div className="text-sm text-red-700 mt-1 space-y-1">
                <p>• All your API tests, schedules, and execution history will be affected</p>
                <p>• Your subscription will be immediately cancelled</p>
                <p>• Team members will lose access to shared workspaces</p>
                <p>• This action may not be reversible depending on your data retention choice</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Export Option */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Your Data
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Before deactivating, you can export all your data including test suites, 
            execution results, and settings for your records.
          </p>
          <Button variant="outline" onClick={handleDataExport}>
            <Download className="h-4 w-4 mr-2" />
            Export All Data
          </Button>
        </div>

        {/* Alternative Actions */}
        <div className="border rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">
            Consider These Alternatives
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Downgrade your plan</p>
                <p className="text-gray-600">Switch to a lower tier to reduce costs while keeping your data</p>
              </div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <FileText className="h-4 w-4 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium">Pause your subscription</p>
                <p className="text-gray-600">Temporarily suspend billing while preserving your account</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deactivation Dialog */}
        <Dialog open={isDeactivationDialogOpen} onOpenChange={setIsDeactivationDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive" className="w-full">
              <UserMinus className="h-4 w-4 mr-2" />
              Proceed with Account Deactivation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-red-600">Deactivate Account</DialogTitle>
              <DialogDescription>
                Please complete the following steps to deactivate your account.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {step === 1 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Step 1: Reason & Feedback</h4>
                    
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Why are you leaving?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(reasonLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="feedback"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional feedback (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Help us improve by sharing your experience..." 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="button" onClick={() => setStep(2)} className="w-full">
                      Continue to Data Handling
                    </Button>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Step 2: Data Handling</h4>
                    
                    <FormField
                      control={form.control}
                      name="dataHandling"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>What should we do with your data?</FormLabel>
                          <div className="space-y-3">
                            {Object.entries(dataHandlingLabels).map(([value, label]) => (
                              <div key={value} className="flex items-center space-x-2">
                                <input
                                  type="radio"
                                  id={value}
                                  value={value}
                                  checked={field.value === value}
                                  onChange={() => field.onChange(value)}
                                  className="w-4 h-4 text-red-600"
                                />
                                <label htmlFor={value} className="text-sm">
                                  {label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button type="button" onClick={() => setStep(3)} className="flex-1">
                        Continue to Confirmation
                      </Button>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Step 3: Final Confirmation</h4>
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm your password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="confirmations.dataLoss"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                I understand that I will lose access to all my data
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmations.subscriptionCancellation"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                I understand my subscription will be cancelled
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmations.irreversible"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm">
                                I understand this action may be irreversible
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        variant="destructive" 
                        className="flex-1"
                        disabled={deactivationMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deactivationMutation.isPending ? 'Deactivating...' : 'Deactivate Account'}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Support Contact */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Need help or have questions?{' '}
            <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-500">
              Contact our support team
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}