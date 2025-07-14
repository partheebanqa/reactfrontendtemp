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
      id: '1',
      key: 'API_TOKEN',
      value: '••••••••••••••••',
      type: 'secret',
      description: 'Authentication token for API access',
      isGlobal: true,
    },
    {
      id: '2',
      key: 'USER_EMAIL',
      value: 'test@example.com',
      type: 'string',
      description: 'Test user email for authentication flows',
      environmentId: '1',
      isGlobal: false,
    },
    {
      id: '3',
      key: 'MAX_RETRIES',
      value: '3',
      type: 'number',
      description: 'Maximum number of retry attempts',
      isGlobal: true,
    },
    {
      id: '4',
      key: 'DEBUG_MODE',
      value: 'true',
      type: 'boolean',
      description: 'Enable debug logging',
      environmentId: '1',
      isGlobal: false,
    },
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

        {/* <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div> */}
      </div>

      {/* <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search data..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div> */}

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
