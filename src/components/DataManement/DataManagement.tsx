// DataManagement.tsx
import React, { useState } from 'react';
import { Search, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EnvironmentsSection from './EnvironmentsSection';
import VariablesSection from './VariablesSection';
import { Environment, Variable } from '@/shared/types/datamanagement';
import { useToast } from '@/hooks/useToast';
import { useDataManagement } from '@/hooks/useDataManagement';

const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('environments');
  const [searchTerm, setSearchTerm] = useState('');
  const { environments } = useDataManagement();

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
           
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;
