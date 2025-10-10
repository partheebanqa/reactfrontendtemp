import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StaticVariablesSection from './StaticVariablesSection';
import DynamicVariablesSection from './DynamicVariablesSection';

const VariablesSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('static');

  return (
    <div className='space-y-4 mt-4'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='static'>Static Variables</TabsTrigger>
          <TabsTrigger value='dynamic'>Dynamic Variables</TabsTrigger>
        </TabsList>

        <TabsContent value='static'>
          <StaticVariablesSection />
        </TabsContent>

        <TabsContent value='dynamic'>
          <DynamicVariablesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VariablesSection;
