import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CreditCard, Crown, Zap, Star, Check, ArrowUp, Calendar, Users, Download, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';

interface PlanFeature {
  name: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  period: 'month' | 'year';
  description: string;
  features: PlanFeature[];
  popular?: boolean;
  current?: boolean;
}

export function PlanManagement() {
  const { toast } = useToast();
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [showBillingHistory, setShowBillingHistory] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [billingAddress, setBillingAddress] = useState({
    street: '123 Business Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    country: 'United States'
  });

  // Fetch billing history with TanStack Query
  const { data: billingHistory = [], isLoading: isLoadingBilling } = useQuery({
    queryKey: ['/api/billing/history'],
    enabled: showBillingHistory,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Mock billing history data
  const mockBillingHistory = [
    {
      id: '1',
      date: '2024-01-15',
      amount: 20.00,
      plan: 'Pro Plan',
      status: 'paid',
      invoiceUrl: '#'
    },
    {
      id: '2',
      date: '2023-12-15',
      amount: 20.00,
      plan: 'Pro Plan',
      status: 'paid',
      invoiceUrl: '#'
    },
    {
      id: '3',
      date: '2023-11-15',
      amount: 20.00,
      plan: 'Pro Plan',
      status: 'paid',
      invoiceUrl: '#'
    },
  ];

  // Current subscription data
  const currentSubscription = {
    planName: 'Pro Plan',
    price: 20,
    period: 'month' as const,
    billingDate: '2024-02-15',
    status: 'active' as const,
    usage: {
      tests: { used: 1250, limit: 5000 },
      workspaces: { used: 3, limit: 10 },
      teamMembers: { used: 8, limit: 25 },
      executions: { used: 2890, limit: 10000 },
    }
  };

  const plans: Plan[] = [
    {
      id: 'trial',
      name: 'Trial',
      price: 0,
      period: 'month',
      description: '15-day free trial',
      features: [
        { name: 'Up to 100 API tests', included: true },
        { name: '1 workspace', included: true },
        { name: 'Basic reporting', included: true },
        { name: 'Email support', included: true },
        { name: 'Advanced scheduling', included: false },
        { name: 'Team collaboration', included: false },
        { name: 'CI/CD integrations', included: false },
        { name: 'Priority support', included: false },
      ]
    },
    {
      id: 'beginner',
      name: 'Beginner',
      price: 5,
      period: 'month',
      description: 'Perfect for individuals',
      features: [
        { name: 'Up to 500 API tests', included: true },
        { name: '3 workspaces', included: true },
        { name: 'Basic reporting', included: true },
        { name: 'Email support', included: true },
        { name: 'Advanced scheduling', included: false },
        { name: 'Team collaboration', included: false },
        { name: 'CI/CD integrations', included: false },
        { name: 'Priority support', included: false },
      ]
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 20,
      period: 'month',
      description: 'Great for growing teams',
      popular: true,
      current: true,
      features: [
        { name: 'Up to 5,000 API tests', included: true },
        { name: '10 workspaces', included: true },
        { name: 'Advanced reporting', included: true },
        { name: 'Email & chat support', included: true },
        { name: 'Advanced scheduling', included: true },
        { name: 'Team collaboration (25 members)', included: true },
        { name: 'CI/CD integrations', included: false },
        { name: 'Priority support', included: false },
      ]
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 50,
      period: 'month',
      description: 'For large organizations',
      features: [
        { name: 'Unlimited API tests', included: true },
        { name: 'Unlimited workspaces', included: true },
        { name: 'Custom reporting & analytics', included: true },
        { name: 'Dedicated support manager', included: true },
        { name: 'Advanced scheduling', included: true },
        { name: 'Unlimited team members', included: true },
        { name: 'Full CI/CD integrations', included: true },
        { name: '24/7 priority support', included: true },
      ]
    }
  ];

  const handleUpgrade = (planId: string) => {
    toast({
      title: 'Upgrade initiated',
      description: 'Redirecting to checkout...',
    });
    // Here you would typically redirect to a payment flow
  };

  const handleDowngrade = (planId: string) => {
    toast({
      title: 'Plan change scheduled',
      description: 'Your plan will change at the end of your current billing cycle.',
    });
  };

  const handleSaveAddress = () => {
    setIsEditingAddress(false);
    toast({
      title: 'Address updated',
      description: 'Your billing address has been updated successfully.',
    });
  };

  const handleCancelEditAddress = () => {
    setIsEditingAddress(false);
    // Reset to original values if needed
    setBillingAddress({
      street: '123 Business Street',
      city: 'San Francisco',
      state: 'CA',
      zip: '94105',
      country: 'United States'
    });
  };;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleCancelSubscription = () => {
    // Implement subscription cancellation logic here
    toast({
      title: "Subscription Cancelled",
      description: "Your subscription has been cancelled. You'll retain access until the end of your current billing period.",
      variant: "destructive"
    });
    setShowCancelDialog(false);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Current Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {currentSubscription.planName}
                </h3>
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                </Badge>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                ${currentSubscription.price}/{currentSubscription.period}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Next billing: {formatDate(currentSubscription.billingDate)}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Dialog open={showBillingHistory} onOpenChange={setShowBillingHistory}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Billing History</span>
                    <span className="sm:hidden">History</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Billing History</DialogTitle>
                    <DialogDescription>
                      View your payment history and download invoices
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    {isLoadingBilling ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invoice</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mockBillingHistory.map((invoice) => (
                            <TableRow key={invoice.id}>
                              <TableCell>{formatDate(invoice.date)}</TableCell>
                              <TableCell>{invoice.plan}</TableCell>
                              <TableCell>${invoice.amount.toFixed(2)}</TableCell>
                              <TableCell>
                                <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                                  {invoice.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="text-sm">
                    <span className="hidden sm:inline">Cancel Subscription</span>
                    <span className="sm:hidden">Cancel</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      Cancel Subscription
                    </DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel your subscription? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>What happens when you cancel:</strong>
                      </p>
                      <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                        <li>• Your subscription will remain active until {formatDate(currentSubscription.billingDate)}</li>
                        <li>• You'll lose access to pro features after the current billing period</li>
                        <li>• Your data will be preserved for 30 days</li>
                        <li>• You can reactivate anytime before data deletion</li>
                      </ul>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                        Keep Subscription
                      </Button>
                      <Button variant="destructive" onClick={handleCancelSubscription}>
                        Cancel Subscription
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Usage Statistics */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">API Tests</span>
                <span className={`text-sm ${getUsageColor(getUsagePercentage(currentSubscription.usage.tests.used, currentSubscription.usage.tests.limit))}`}>
                  {currentSubscription.usage.tests.used}/{currentSubscription.usage.tests.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(currentSubscription.usage.tests.used, currentSubscription.usage.tests.limit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Workspaces</span>
                <span className={`text-sm ${getUsageColor(getUsagePercentage(currentSubscription.usage.workspaces.used, currentSubscription.usage.workspaces.limit))}`}>
                  {currentSubscription.usage.workspaces.used}/{currentSubscription.usage.workspaces.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(currentSubscription.usage.workspaces.used, currentSubscription.usage.workspaces.limit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Team Members</span>
                <span className={`text-sm ${getUsageColor(getUsagePercentage(currentSubscription.usage.teamMembers.used, currentSubscription.usage.teamMembers.limit))}`}>
                  {currentSubscription.usage.teamMembers.used}/{currentSubscription.usage.teamMembers.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(currentSubscription.usage.teamMembers.used, currentSubscription.usage.teamMembers.limit)} 
                className="h-2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Executions</span>
                <span className={`text-sm ${getUsageColor(getUsagePercentage(currentSubscription.usage.executions.used, currentSubscription.usage.executions.limit))}`}>
                  {currentSubscription.usage.executions.used}/{currentSubscription.usage.executions.limit}
                </span>
              </div>
              <Progress 
                value={getUsagePercentage(currentSubscription.usage.executions.used, currentSubscription.usage.executions.limit)} 
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Choose the plan that best fits your needs. Upgrade or downgrade anytime.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative border rounded-lg p-4 sm:p-6 hover:shadow-lg transition-shadow ${
                  plan.popular ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
                } ${
                  plan.current ? 'ring-2 ring-green-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {plan.current && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white px-3 py-1">
                      <Check className="h-3 w-3 mr-1" />
                      Current Plan
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                    ${plan.price}
                    <span className="text-xs sm:text-sm font-normal text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs sm:text-sm">
                      <Check className={`h-3 w-3 sm:h-4 sm:w-4 mt-0.5 flex-shrink-0 ${
                        feature.included ? 'text-green-600' : 'text-gray-300'
                      }`} />
                      <span className={feature.included ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {plan.current ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : plan.price > currentSubscription.price ? (
                    <Button 
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Upgrade
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDowngrade(plan.id)}
                    >
                      Switch to {plan.name}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Payment Method</h4>
              <div className="flex items-center gap-3 p-4 border rounded-lg">
                <div className="w-10 h-6 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">VISA</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                  <p className="text-xs text-gray-500">Expires 12/25</p>
                </div>
                <Button variant="outline" size="sm">
                  Edit
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">Billing Address</h4>
              <div className="p-4 border rounded-lg">
                {isEditingAddress ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress({...billingAddress, street: e.target.value})}
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Street Address"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress({...billingAddress, city: e.target.value})}
                        className="p-2 border rounded text-sm"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress({...billingAddress, state: e.target.value})}
                        className="p-2 border rounded text-sm"
                        placeholder="State"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={billingAddress.zip}
                        onChange={(e) => setBillingAddress({...billingAddress, zip: e.target.value})}
                        className="p-2 border rounded text-sm"
                        placeholder="ZIP Code"
                      />
                      <input
                        type="text"
                        value={billingAddress.country}
                        onChange={(e) => setBillingAddress({...billingAddress, country: e.target.value})}
                        className="p-2 border rounded text-sm"
                        placeholder="Country"
                      />
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button onClick={handleSaveAddress} size="sm">
                        Save
                      </Button>
                      <Button variant="outline" onClick={handleCancelEditAddress} size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm">{billingAddress.street}</p>
                    <p className="text-sm">{billingAddress.city}, {billingAddress.state} {billingAddress.zip}</p>
                    <p className="text-sm">{billingAddress.country}</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsEditingAddress(true)}>
                      Edit Address
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}