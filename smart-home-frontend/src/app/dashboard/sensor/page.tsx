"use client";

import React from 'react';
import { Layout } from '@/components/Layout';
import { SensorOverview } from '@/components/SensorOverview';
import { SensorMQ2Charts } from '@/components/SensorMQ2Charts';
import { SensorMQ135Charts } from '@/components/SensorMQ135Charts';
import { DeviceStatus } from '@/components/DeviceStatus';
import { DeviceControl } from '@/components/DeviceControl';

const SensorDashboard: React.FC = () => {
  return (
    <Layout isAdmin={false}>
          <SensorOverview />
          <br></br>
          <SensorMQ2Charts />
          <br></br>
          <SensorMQ135Charts />
          <br></br>
          <DeviceControl />
          <br></br>
          <DeviceStatus />
    </Layout>
  );
};

export default SensorDashboard;
