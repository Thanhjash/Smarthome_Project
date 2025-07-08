// src/components/LightControl.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { useSensorData } from '@/hooks/useSensorData';
import { useDeviceControl } from '@/hooks/useDeviceControl';

export const LightControl: React.FC = () => {
    const { deviceStatus } = useSensorData();
    const [lightOn, setLightOn] = useDeviceControl(deviceStatus.lightStatus, 'light');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Light Control</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            checked={lightOn as boolean}
            onCheckedChange={setLightOn}
          />
          <Label>{lightOn ? 'ON' : 'OFF'}</Label>
        </div>
      </CardContent>
    </Card>
  );
};
