import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { QuickMode } from './routes/QuickMode';
import { AdvancedMode } from './routes/AdvancedMode';
import { BatchQueue } from './routes/BatchQueue';
import { Templates } from './routes/Templates';
import { Settings } from './routes/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('quick');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">YT Beat Video Creator</h1>
        </div>
      </header>

      <main className="container mx-auto py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="quick">Quick Mode</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Mode</TabsTrigger>
            <TabsTrigger value="queue">Batch Queue</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="quick">
            <QuickMode />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedMode />
          </TabsContent>

          <TabsContent value="queue">
            <BatchQueue />
          </TabsContent>

          <TabsContent value="templates">
            <Templates />
          </TabsContent>

          <TabsContent value="settings">
            <Settings />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default App;