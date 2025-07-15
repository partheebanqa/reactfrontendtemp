// DataManagement.tsx
import React, { useState } from 'react';
import { Search, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnvironmentsSection from './EnvironmentsSection';
import VariablesSection from './VariablesSection';
import { Environment, Variable } from '@/models/datamanagement';
import { useToast } from '@/hooks/useToast';

const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('environments');
  const [searchTerm, setSearchTerm] = useState('');

  const [environments, setEnvironments] = useState<Environment[]>([
    {
      id: '1',
      name: 'Development',
      description: 'Dev env',
      baseUrl: 'https://api-dev.company.com',
      variables: {},
      isDefault: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [variables, setVariables] = useState<Variable[]>([
    {
      id: "1",
      key: "USER_ID",
      value: "{{random_uuid}}",
      type: "dynamic",
      scope: "global",
      isSecret: false,
      description: "Generates a random UUID for each API request",
      environmentId: '',
      isGlobal: true
    },
    {
      id: "2", 
      key: "API_TOKEN",
      value: "bearer_abc123xyz789",
      type: "static",
      scope: "global",
      isSecret: true,
      description: "Fixed authentication token for API requests",
      environmentId: null,
      isGlobal: true
    },
    {
      id: "3",
      key: "TIMESTAMP", 
      value: "{{timestamp}}",
      type: "dynamic",
      scope: "global",
      isSecret: false,
      description: "Current Unix timestamp for each request",
      environmentId: '',
      isGlobal: true
    },
    {
      id: "4",
      key: "BASE_URL",
      value: "https://api.staging.com",
      type: "static", 
      scope: "environment",
      isSecret: false,
      description: "Base URL for staging environment",
      environmentId: "staging",
      isGlobal: false
    },
    {
      id: "5",
      key: "EMAIL_TEST",
      value: "{{random_email}}",
      type: "dynamic",
      scope: "project",
      isSecret: false,
      description: "Random email for testing",
      environmentId: "development",
      isGlobal: false
    }
  ]);

  return (
    <div className='p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Data Management</h1>
          <p className='text-muted-foreground mt-1'>
            Manage environments, variables, and test datasets
          </p>
        </div>

      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='environments'>Environments</TabsTrigger>
          <TabsTrigger value='variables'>Variables</TabsTrigger>
        </TabsList>

        <TabsContent value='environments'>
          <EnvironmentsSection />
        </TabsContent>

        <TabsContent value='variables'>
          <VariablesSection
            variables={variables}
            setVariables={setVariables}
            environments={environments}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;
