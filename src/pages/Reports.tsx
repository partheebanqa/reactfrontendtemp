import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ReportsHeader from '@/components/Report/ReportsHeader';
import AnalyticsTab from '@/components/Report/AnalyticsTab';
import PerformanceTab from '@/components/Report/PerformanceTab';
import SavedReportsTab from '@/components/Report/SavedReportsTab';

export default function Reports() {
  return (
    <div className='min-h-screen bg-background'>
      <ReportsHeader />

      <div className='flex-1 overflow-auto p-6'>
        <Tabs defaultValue='analytics' className='space-y-6'>
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='analytics' className='hover-scale'>
              Analytics
            </TabsTrigger>
            <TabsTrigger value='performance' className='hover-scale'>
              Performance
            </TabsTrigger>
            <TabsTrigger value='saved' className='hover-scale'>
              Saved Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value='analytics' className='animate-fade-in'>
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value='performance' className='animate-fade-in'>
            <PerformanceTab />
          </TabsContent>

          <TabsContent value='saved' className='animate-fade-in'>
            <SavedReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
