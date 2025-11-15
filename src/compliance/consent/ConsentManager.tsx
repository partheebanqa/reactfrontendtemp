import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Shield,
  Eye,
  Cookie,
  UserCheck,
  FileText,
  Download,
} from 'lucide-react';

interface ConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  consentType:
    | 'cookies'
    | 'analytics'
    | 'marketing'
    | 'data-processing'
    | 'third-party';
  granted: boolean;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  version: string;
}

interface ConsentPolicy {
  id: string;
  name: string;
  type:
    | 'cookies'
    | 'analytics'
    | 'marketing'
    | 'data-processing'
    | 'third-party';
  description: string;
  required: boolean;
  enabled: boolean;
  version: string;
  lastUpdated: string;
}

export default function ConsentManager() {
  const [activeTab, setActiveTab] = useState('policies');
  const [consentDialogOpen, setConsentDialogOpen] = useState(false);

  const [consentPolicies, setConsentPolicies] = useState<ConsentPolicy[]>([
    {
      id: '1',
      name: 'Essential Cookies',
      type: 'cookies',
      description:
        'Necessary cookies for basic website functionality and security',
      required: true,
      enabled: true,
      version: '1.0',
      lastUpdated: '2024-01-15',
    },
    {
      id: '2',
      name: 'Analytics & Performance',
      type: 'analytics',
      description:
        'Track usage patterns to improve user experience and performance',
      required: false,
      enabled: true,
      version: '2.1',
      lastUpdated: '2024-01-18',
    },
    {
      id: '3',
      name: 'Marketing & Advertising',
      type: 'marketing',
      description:
        'Personalized content and targeted advertising based on preferences',
      required: false,
      enabled: false,
      version: '1.5',
      lastUpdated: '2024-01-10',
    },
    {
      id: '4',
      name: 'Data Processing',
      type: 'data-processing',
      description: 'Processing of personal data for service functionality',
      required: true,
      enabled: true,
      version: '3.0',
      lastUpdated: '2024-01-20',
    },
    {
      id: '5',
      name: 'Third-party Integrations',
      type: 'third-party',
      description: 'Sharing data with integrated third-party services',
      required: false,
      enabled: true,
      version: '1.2',
      lastUpdated: '2024-01-12',
    },
  ]);

  const [consentRecords] = useState<ConsentRecord[]>([
    {
      id: '1',
      userId: 'user123',
      userEmail: 'john.smith@example.com',
      consentType: 'analytics',
      granted: true,
      timestamp: '2024-01-19 14:30:00',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      version: '2.1',
    },
    {
      id: '2',
      userId: 'user456',
      userEmail: 'jane.smith@example.com',
      consentType: 'marketing',
      granted: false,
      timestamp: '2024-01-19 13:15:00',
      ipAddress: '192.168.1.101',
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      version: '1.5',
    },
    {
      id: '3',
      userId: 'user123',
      userEmail: 'john.smith@example.com',
      consentType: 'cookies',
      granted: true,
      timestamp: '2024-01-18 09:20:00',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      version: '1.0',
    },
  ]);

  const getConsentIcon = (type: ConsentPolicy['type']) => {
    switch (type) {
      case 'cookies':
        return <Cookie className='h-5 w-5' />;
      case 'analytics':
        return <Eye className='h-5 w-5' />;
      case 'marketing':
        return <UserCheck className='h-5 w-5' />;
      case 'data-processing':
        return <Shield className='h-5 w-5' />;
      case 'third-party':
        return <FileText className='h-5 w-5' />;
      default:
        return <Shield className='h-5 w-5' />;
    }
  };

  const getTypeColor = (type: ConsentPolicy['type']) => {
    switch (type) {
      case 'cookies':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'analytics':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'marketing':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'data-processing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'third-party':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const togglePolicy = (id: string) => {
    setConsentPolicies((prev) =>
      prev.map((policy) =>
        policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
      )
    );
  };

  const consentStats = {
    totalRecords: consentRecords.length,
    grantedConsents: consentRecords.filter((r) => r.granted).length,
    deniedConsents: consentRecords.filter((r) => !r.granted).length,
    uniqueUsers: new Set(consentRecords.map((r) => r.userId)).size,
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Consent Management</h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Manage user consent and privacy compliance
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export Records
          </Button>
          <Dialog open={consentDialogOpen} onOpenChange={setConsentDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Shield className='mr-2 h-4 w-4' />
                Privacy Settings
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Privacy & Consent Settings</DialogTitle>
                <DialogDescription>
                  Configure your privacy preferences and consent settings
                </DialogDescription>
              </DialogHeader>
              <div className='space-y-4'>
                {consentPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className='flex items-center justify-between p-4 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      {getConsentIcon(policy.type)}
                      <div>
                        <h4 className='font-medium'>{policy.name}</h4>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {policy.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={policy.enabled}
                      disabled={policy.required}
                      onCheckedChange={() =>
                        !policy.required && togglePolicy(policy.id)
                      }
                    />
                  </div>
                ))}
                <div className='flex justify-end gap-2 pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => setConsentDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setConsentDialogOpen(false)}>
                    Save Preferences
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>
              {consentStats.totalRecords}
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Total Consent Records
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold text-green-600'>
              {consentStats.grantedConsents}
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Granted Consents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold text-red-600'>
              {consentStats.deniedConsents}
            </div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Denied Consents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='p-6'>
            <div className='text-2xl font-bold'>{consentStats.uniqueUsers}</div>
            <p className='text-sm text-gray-600 dark:text-gray-400'>
              Unique Users
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList>
          <TabsTrigger value='policies'>Consent Policies</TabsTrigger>
          <TabsTrigger value='records'>Consent Records</TabsTrigger>
          <TabsTrigger value='compliance'>Compliance Report</TabsTrigger>
        </TabsList>

        {/* Consent Policies */}
        <TabsContent value='policies'>
          <div className='space-y-4'>
            {consentPolicies.map((policy) => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {getConsentIcon(policy.type)}
                      <div>
                        <CardTitle>{policy.name}</CardTitle>
                        <CardDescription>{policy.description}</CardDescription>
                      </div>
                    </div>
                    <div className='flex items-center gap-4'>
                      <Badge className={getTypeColor(policy.type)}>
                        {policy.type.replace('-', ' ')}
                      </Badge>
                      {policy.required && (
                        <Badge variant='outline'>Required</Badge>
                      )}
                      <Switch
                        checked={policy.enabled}
                        disabled={policy.required}
                        onCheckedChange={() =>
                          !policy.required && togglePolicy(policy.id)
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='flex items-center justify-between text-sm text-gray-600 dark:text-gray-400'>
                    <span>Version {policy.version}</span>
                    <span>
                      Last updated:{' '}
                      {new Date(policy.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Consent Records */}
        <TabsContent value='records'>
          <Card>
            <CardHeader>
              <CardTitle>Consent Records</CardTitle>
              <CardDescription>
                Detailed log of all consent decisions and changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className='h-[400px]'>
                <div className='space-y-4'>
                  {consentRecords.map((record) => (
                    <div
                      key={record.id}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div className='flex items-center gap-4'>
                        {getConsentIcon(record.consentType)}
                        <div>
                          <h4 className='font-medium'>{record.userEmail}</h4>
                          <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                            <Badge className={getTypeColor(record.consentType)}>
                              {record.consentType.replace('-', ' ')}
                            </Badge>
                            <span>•</span>
                            <span>
                              {new Date(record.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>
                            IP: {record.ipAddress} • Version: {record.version}
                          </div>
                        </div>
                      </div>

                      <div className='text-right'>
                        <Badge
                          variant={record.granted ? 'default' : 'secondary'}
                        >
                          {record.granted ? 'Granted' : 'Denied'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Report */}
        <TabsContent value='compliance'>
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>GDPR Compliance Status</CardTitle>
                <CardDescription>
                  Overview of GDPR compliance requirements and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      requirement: 'Consent Management System',
                      status: 'compliant',
                      description: 'Active consent tracking and management',
                    },
                    {
                      requirement: 'Data Subject Rights',
                      status: 'compliant',
                      description: 'User can view and delete their data',
                    },
                    {
                      requirement: 'Privacy Policy',
                      status: 'compliant',
                      description: 'Clear and accessible privacy policy',
                    },
                    {
                      requirement: 'Cookie Consent',
                      status: 'compliant',
                      description: 'Granular cookie consent options',
                    },
                    {
                      requirement: 'Data Breach Notification',
                      status: 'pending',
                      description:
                        'Automated notification system in development',
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-4 border rounded-lg'
                    >
                      <div>
                        <h4 className='font-medium'>{item.requirement}</h4>
                        <p className='text-sm text-gray-600 dark:text-gray-400'>
                          {item.description}
                        </p>
                      </div>
                      <Badge
                        variant={
                          item.status === 'compliant' ? 'default' : 'secondary'
                        }
                      >
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Processing Activities</CardTitle>
                <CardDescription>
                  Record of processing activities as required by GDPR Article 30
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      activity: 'User Authentication',
                      purpose: 'Service access and security',
                      dataTypes: 'Email, password hash',
                      retention: 'Account lifetime',
                    },
                    {
                      activity: 'API Usage Analytics',
                      purpose: 'Service improvement',
                      dataTypes: 'Usage patterns, performance metrics',
                      retention: '90 days',
                    },
                    {
                      activity: 'Error Logging',
                      purpose: 'System debugging',
                      dataTypes: 'Error logs, system state',
                      retention: '30 days',
                    },
                  ].map((activity, index) => (
                    <div key={index} className='p-4 border rounded-lg'>
                      <h4 className='font-medium mb-2'>{activity.activity}</h4>
                      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                        <div>
                          <span className='font-medium'>Purpose:</span>
                          <p className='text-gray-600 dark:text-gray-400'>
                            {activity.purpose}
                          </p>
                        </div>
                        <div>
                          <span className='font-medium'>Data Types:</span>
                          <p className='text-gray-600 dark:text-gray-400'>
                            {activity.dataTypes}
                          </p>
                        </div>
                        <div>
                          <span className='font-medium'>Retention:</span>
                          <p className='text-gray-600 dark:text-gray-400'>
                            {activity.retention}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
