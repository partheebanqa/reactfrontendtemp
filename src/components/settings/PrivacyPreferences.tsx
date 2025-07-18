import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, Cookie, Shield, Bell } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function PrivacyPreferences() {
  const { toast } = useToast();

  const handleToggle = (setting: string, value: boolean) => {
    toast({
      title: 'Privacy setting updated',
      description: `${setting} has been ${value ? 'enabled' : 'disabled'}.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Data Collection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Collection & Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Usage Analytics</Label>
              <p className="text-sm text-gray-600">
                Help us improve by sharing anonymous usage data
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              onCheckedChange={(checked) => handleToggle('Usage Analytics', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Performance Monitoring</Label>
              <p className="text-sm text-gray-600">
                Allow performance and error monitoring
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              onCheckedChange={(checked) => handleToggle('Performance Monitoring', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Feature Usage Tracking</Label>
              <p className="text-sm text-gray-600">
                Track which features you use to personalize your experience
              </p>
            </div>
            <Switch 
              defaultChecked={false}
              onCheckedChange={(checked) => handleToggle('Feature Usage Tracking', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Communication Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Communication Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Product Updates</Label>
              <p className="text-sm text-gray-600">
                Receive emails about new features and improvements
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              onCheckedChange={(checked) => handleToggle('Product Updates', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Marketing Communications</Label>
              <p className="text-sm text-gray-600">
                Receive marketing emails and promotional offers
              </p>
            </div>
            <Switch 
              defaultChecked={false}
              onCheckedChange={(checked) => handleToggle('Marketing Communications', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Security Alerts</Label>
              <p className="text-sm text-gray-600">
                Important security and account notifications
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              onCheckedChange={(checked) => handleToggle('Security Alerts', checked)}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cookie className="h-5 w-5" />
            Cookie Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Essential Cookies</Label>
              <p className="text-sm text-gray-600">
                Required for the website to function properly
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              disabled
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Analytics Cookies</Label>
              <p className="text-sm text-gray-600">
                Help us understand how visitors interact with our website
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              onCheckedChange={(checked) => handleToggle('Analytics Cookies', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Marketing Cookies</Label>
              <p className="text-sm text-gray-600">
                Used to track visitors for personalized advertising
              </p>
            </div>
            <Switch 
              defaultChecked={false}
              onCheckedChange={(checked) => handleToggle('Marketing Cookies', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Profile Visibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Public Profile</Label>
              <p className="text-sm text-gray-600">
                Allow others to find and view your profile
              </p>
            </div>
            <Switch 
              defaultChecked={false}
              onCheckedChange={(checked) => handleToggle('Public Profile', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Activity Status</Label>
              <p className="text-sm text-gray-600">
                Show when you're online or recently active
              </p>
            </div>
            <Switch 
              defaultChecked={true}
              onCheckedChange={(checked) => handleToggle('Activity Status', checked)}
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Test Results Sharing</Label>
              <p className="text-sm text-gray-600">
                Allow sharing of anonymized test results for research
              </p>
            </div>
            <Switch 
              defaultChecked={false}
              onCheckedChange={(checked) => handleToggle('Test Results Sharing', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}