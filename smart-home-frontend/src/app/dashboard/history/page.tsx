"use client";

import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const HistoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('data');

  return (
    <Layout isAdmin={false}>
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">History</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList selected={activeTab} setSelected={setActiveTab}>
          <TabsTrigger value="data">Data History</TabsTrigger>
          <TabsTrigger value="control">Device Control History</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data" selected={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Sensor Data History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add table or chart for sensor data history */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="control" selected={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Device Control History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add table for device control history */}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="alerts" selected={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>Alert History</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add table for alert history */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Layout>
  );
};

export default HistoryPage;
