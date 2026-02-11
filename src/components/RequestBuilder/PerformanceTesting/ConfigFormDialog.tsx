import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

import { Loader2 } from 'lucide-react';
import { PerformanceConfig } from '@/models/performanceTest.model';
import { Checkbox } from '@/components/ui/checkbox';
import { tr } from '@faker-js/faker';


/* ---------------------- Schema ---------------------- */

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100),

    description: z.string().max(500).optional(),

    numRequests: z.coerce.number().min(0).max(1_000_000),

    concurrency: z.coerce.number().min(0).max(1_000),

    delay: z.coerce.number().min(0).max(60_000),

    timeout: z.coerce.number().min(100).max(300_000),

    rateLimitEnabled: z.boolean(),

    stopOnError: z.boolean(),

    rateLimitRequests: z.coerce.number().min(1).max(100_000).optional(),

    rateLimitPeriod: z.coerce.number().min(1).max(3_600).optional(),

    rateLimitType: z.enum(['FIXED_WINDOW', 'SLIDING_WINDOW']),
  })
  .superRefine((data, ctx) => {
    if (data.rateLimitEnabled) {
      if (!data.rateLimitRequests) {
        ctx.addIssue({
          path: ['rateLimitRequests'],
          message: 'Required when rate limiting is enabled',
          code: z.ZodIssueCode.custom,
        });
      }

      if (!data.rateLimitPeriod) {
        ctx.addIssue({
          path: ['rateLimitPeriod'],
          message: 'Required when rate limiting is enabled',
          code: z.ZodIssueCode.custom,
        });
      }
    }
  });

type FormValues = z.infer<typeof formSchema>;

/* ---------------------- Component ---------------------- */

interface ConfigFormDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  config?: PerformanceConfig;
  onSubmit?: (values: any) => Promise<void>;
  isSubmitting?: boolean;
  isLoadingConfig?: boolean;
}


export function ConfigFormDialog({
  open,
  onOpenChange,
  config,
  onSubmit,
  isSubmitting,
}: ConfigFormDialogProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      numRequests: 0,
      concurrency: 0,
      delay: 0,
      timeout: 5000,
      rateLimitEnabled: true,
      stopOnError: true,
      rateLimitRequests: 1,
      rateLimitPeriod: 0,
      rateLimitType: 'FIXED_WINDOW',
    },
  });

  // const rateLimitEnabled = form.watch('rateLimitEnabled');

  /* ---------------------- Reset Logic ---------------------- */



  /* ---------------------- Submit ---------------------- */

  const handleSubmit = async (values: FormValues) => {
    if (!onSubmit) return;

    const payload: Omit<PerformanceConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      name: values.name,
      description: values.description,
      numRequests: values.numRequests,
      concurrency: values.concurrency,
      delay: values.delay,
      timeout: values.timeout,
      rateLimitEnabled: values.rateLimitEnabled,
      stopOnError: values.stopOnError,
      rateLimitRequests: values.rateLimitRequests,
      rateLimitPeriod: values.rateLimitPeriod,
      rateLimitType: values?.rateLimitType
    };

    await onSubmit(payload);
  };



  useEffect(() => {
    if (!open) return;

    if (config) {
      form.reset({
        name: config.name ?? "",
        description: config.description ?? "",
        numRequests: config.numRequests ?? 0,
        concurrency: config.concurrency ?? 0,
        delay: config.delay ?? 0,
        timeout: config.timeout ?? 5000,
        rateLimitEnabled: !!config.rateLimitEnabled,
        stopOnError: !!config.stopOnError,
        rateLimitRequests: config.rateLimitRequests ?? 1,
        rateLimitPeriod: config.rateLimitPeriod ?? 1,
        rateLimitType: (config.rateLimitType as any) ?? "FIXED_WINDOW",
      });
    } else {
      form.reset({
        name: "",
        description: "",
        numRequests: 0,
        concurrency: 0,
        delay: 0,
        timeout: 5000,
        rateLimitEnabled: true,
        rateLimitRequests: 1,
        rateLimitPeriod: 1,
        stopOnError: true,
        rateLimitType: "FIXED_WINDOW",
      });
    }
  }, [open, config, form]);





  /* ---------------------- UI ---------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {config ? 'Edit Configuration' : 'Create New Configuration'}
          </DialogTitle>
          <DialogDescription>
            Create a new performance test configuration with your desired settings.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., API Load Test - High Volume"  {...field} />
                  </FormControl>
                  <FormDescription>A descriptive name for this configuration</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the purpose of this test configuration..." rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
            <h3 className="text-lg font-semibold mb-4">Rate Limiting Settings</h3>
            {/* <FormField
              control={form.control}
              name="rateLimitEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between border p-4 rounded-lg">
                  <div>
                    <FormLabel className="text-base">Enable Rate Limiting</FormLabel>
                    <FormDescription>
                      Limit the number of requests per time window
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch defaultChecked checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            /> */}

            <div className="grid md:grid-cols-2 gap-4">


              {/* <FormField
                control={form.control}
                name="numRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Requests</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Total requests to execute</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* <FormField
                control={form.control}
                name="concurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Concurrency</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Concurrent requests</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              <FormField
                control={form.control}
                name="rateLimitRequests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requests Per Window</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Max requests allowed</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rateLimitPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Window (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Window duration</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delay Between Requests (ms)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Delay in milliseconds</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timeout (ms)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>Request timeout</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>


            <FormField
              control={form.control}
              name="stopOnError"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 border p-4 rounded-lg">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Stop On First Error</FormLabel>
                    <FormDescription>
                      Automatically stop the test execution when a request fails.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="border-t pt-4 space-y-4">


              {/* {rateLimitEnabled && ( */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* <FormField
                    control={form.control}
                    name="rateLimitRequests"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requests Per Window</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Max requests allowed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rateLimitPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Window (seconds)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Window duration</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}




                <FormField
                  control={form.control}
                  name="rateLimitType"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Rate Limit Type</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="FIXED_WINDOW"
                              checked={field.value === 'FIXED_WINDOW'}
                              onChange={field.onChange}
                            />
                            <span className="text-sm">
                              Fixed Window (e.g. 10 req/min starting at full minutes)
                            </span>
                          </label>

                          <label className="flex items-center gap-2">
                            <input
                              type="radio"
                              value="SLIDING_WINDOW"
                              checked={field.value === 'SLIDING_WINDOW'}
                              onChange={field.onChange}
                            />
                            <span className="text-sm">
                              Sliding Window (e.g. 10 requests within any 60s period)
                            </span>
                          </label>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>
              {/* )} */}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {config ? 'Update Configuration' : 'Create Configuration'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
