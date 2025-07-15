// FanControl.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { useSensorContext } from '@/contexts/SensorDataProvider';
import { toast } from 'react-hot-toast';

export const FanControl: React.FC = () => {
  const { deviceStatus, refreshDeviceStatus } = useSensorContext();
  const [fanSpeed, setFanSpeed] = useState(deviceStatus.motorB || 0);

  useEffect(() => {
    setFanSpeed(deviceStatus.motorB || 0);
  }, [deviceStatus.motorB]);

  const updateDevice = async (value: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/devices/fan', {
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
      toast.success(data.message || 'Fan updated');
      
      // Refresh device status after successful update
      setTimeout(() => refreshDeviceStatus(), 500);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update fan');
    }
  };

  const handleChange = (value: number[]) => {
    const speed = value[0];
    setFanSpeed(speed);
    updateDevice(speed);
  };

  const isDisabled = deviceStatus.emergencyMode || deviceStatus.autoMode;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Fan Control
          {deviceStatus.manualMotorB && <span className="ml-2 text-sm text-orange-500">(Manual)</span>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Slider
          min={0}
          max={255}
          step={1}
          value={[fanSpeed]}
          onValueChange={handleChange}
          disabled={isDisabled}
        />
        <div className="mt-2">Speed: {fanSpeed}</div>
        {isDisabled && (
          <div className="text-sm text-gray-500 mt-1">
            {deviceStatus.emergencyMode ? 'Emergency mode active' : 'Auto mode enabled'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
