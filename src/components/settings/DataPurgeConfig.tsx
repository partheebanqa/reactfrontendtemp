import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, Calendar, Database, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function DataPurgeConfig() {
  const { toast } = useToast();
  const [autoDelete, setAutoDelete] = useState(true);
  const [retentionPeriod, setRetentionPeriod] = useState(90);

  const handleExportData = () => {
    toast({
      title: 'Data export started',
      description: 'Your data export will be ready for download shortly.',
    });
  };

  const handlePurgeTestData = () => {
    if (confirm('Are you sure you want to delete all test execution data? This action cannot be undone.')) {
      toast({
        title: 'Test data purged',
        description: 'All test execution data has been permanently deleted.',
      });
    }
  };

  const handlePurgeAllData = () => {
    if (confirm('WARNING: This will permanently delete ALL your data. Type "DELETE" to confirm.')) {
      toast({
        title: 'Complete data purge scheduled',
        description: 'Your account data will be permanently deleted within 24 hours.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Data Retention Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Data Retention Policy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
            <div className="space-y-1">
              <Label className="text-base font-medium">Automatic Data Cleanup</Label>
              <p className="text-sm text-gray-600">
                Automatically delete old execution data to save storage space
              </p>
            </div>
            <Switch 
              checked={autoDelete}
              onCheckedChange={setAutoDelete}
            />
          </div>

          {autoDelete && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium">Retention Settings</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Test Executions</Label>
                  <div className="text-sm text-gray-600">Keep for {retentionPeriod} days</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Request Logs</Label>
                  <div className="text-sm text-gray-600">Keep for 30 days</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Reports</Label>
                  <div className="text-sm text-gray-600">Keep for 1 year</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Export your data before deletion. Includes test suites, environments, execution history, and settings.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Account Data</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Profile, settings, and configuration data
                </p>
                <Button variant="outline" className="w-full" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Account Data
                </Button>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Test Data</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Test suites, requests, and execution history
                </p>
                <Button variant="outline" className="w-full" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Test Data
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Export Information</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Data exported in JSON format</li>
                <li>• Download link valid for 7 days</li>
                <li>• Email notification when ready</li>
                <li>• Includes all accessible data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Data Deletion */}
      {/* <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Data Deletion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-1">
                <h4 className="font-medium">Delete Test Execution Data</h4>
                <p className="text-sm text-gray-600">
                  Remove all execution history and logs while keeping test configurations
                </p>
              </div>
              <Button 
                variant="outline" 
                onClick={handlePurgeTestData}
                className="text-orange-600 hover:text-orange-700"
              >
                Delete Test Data
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="space-y-1">
                <h4 className="font-medium text-red-900">Delete All Data</h4>
                <p className="text-sm text-red-700">
                  Permanently delete your entire account and all associated data
                </p>
              </div>
              <Button 
                variant="destructive" 
                onClick={handlePurgeAllData}
              >
                Delete All Data
              </Button>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">Important Warning</h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Data deletion is permanent and cannot be undone</li>
                    <li>• Export your data before deletion if needed</li>
                    <li>• Active subscriptions will be cancelled</li>
                    <li>• Team members will lose access to shared workspaces</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card> */}

      {/* Current Data Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current Data Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">1,247</div>
              <div className="text-sm text-gray-600">Test Executions</div>
              <Badge variant="secondary" className="mt-1 text-xs">~2.4 MB</Badge>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">42</div>
              <div className="text-sm text-gray-600">Test Suites</div>
              <Badge variant="secondary" className="mt-1 text-xs">~156 KB</Badge>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Environments</div>
              <Badge variant="secondary" className="mt-1 text-xs">~12 KB</Badge>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">234</div>
              <div className="text-sm text-gray-600">Reports</div>
              <Badge variant="secondary" className="mt-1 text-xs">~890 KB</Badge>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-medium">Total Storage Used</h4>
                <p className="text-sm text-gray-600">Across all workspaces and data types</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">3.46 MB</div>
                <div className="text-sm text-gray-600">of 100 MB limit</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}