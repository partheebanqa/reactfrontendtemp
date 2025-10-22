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
import HelpLink from '../HelpModal/HelpLink';
import { Environments } from './Environments';
import { StaticVariables } from './StaticVariables';
import { DynamicVariables } from './DynamicVariables';

export type VariableType = 'static' | 'dynamic';

const DataManagement: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('environments');
  const [searchTerm, setSearchTerm] = useState('');
  const { environments } = useDataManagement();

  const [variableType, setVariableType] = useState<VariableType>('static');

  return (
    <div className='space-y-4 mt-4'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='environments'>Environments</TabsTrigger>
          <TabsTrigger value='variables'>Variables</TabsTrigger>
        </TabsList>

        <TabsContent value='environments'>
          <Environments />

          {/* <EnvironmentsSection /> */}
        </TabsContent>

        <TabsContent value='variables'>
          <>
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex px-3">
                <button
                  onClick={() => setVariableType('static')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${variableType === 'static'
                    ? 'text-gray-900 border-b-2 border-gray-900 -mb-[1px]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Static Variables
                </button>
                <button
                  onClick={() => setVariableType('dynamic')}
                  className={`px-4 py-3 text-sm font-medium transition-colors ${variableType === 'dynamic'
                    ? 'text-gray-900 border-b-2 border-gray-900 -mb-[1px]'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  Dynamic Variables
                </button>
              </nav>
            </div>

            <div className="p-3">
              {variableType === 'static' ? <StaticVariables /> : <DynamicVariables />}
            </div>
          </>

          {/* <VariablesSection /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataManagement;
