// LightControl.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { useSensorContext } from '@/contexts/SensorDataProvider';
import { toast } from 'react-hot-toast';

export const LightControl: React.FC = () => {
  const { deviceStatus, refreshDeviceStatus } = useSensorContext();
  const [lightOn, setLightOn] = useState(deviceStatus.led || false);

  useEffect(() => {
    setLightOn(deviceStatus.led || false);
  }, [deviceStatus.led]);

  const updateDevice = async (value: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/devices/light', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ state: value, deviceId: 'default' }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      const data = await response.json();
      toast.success(data.message || 'Light updated');
      
      // Refresh device status after successful update
      setTimeout(() => refreshDeviceStatus(), 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update light');
    }
  };

  const handleChange = (checked: boolean) => {
    setLightOn(checked);
    updateDevice(checked);
  };

  const isDisabled = deviceStatus.emergencyMode || deviceStatus.autoMode;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Light Control
          {deviceStatus.manualLed && <span className="ml-2 text-sm text-orange-500">(Manual)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch
            checked={lightOn}
            onCheckedChange={handleChange}
            disabled={isDisabled}
          />
          <Label>{lightOn ? 'ON' : 'OFF'}</Label>
        </div>
        {isDisabled && (
          <div className="text-sm text-gray-500 mt-2">
            {deviceStatus.emergencyMode ? 'Emergency mode active' : 'Auto mode enabled'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};