import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Label } from '@/components/ui/Label';
import { toast } from 'react-hot-toast';
import { useSensorData } from '@/hooks/useSensorData';

export const ControlPanel: React.FC = () => {
  const { deviceStatus, refreshDeviceStatus } = useSensorData();
  const [lightOn, setLightOn] = useState(deviceStatus.lightStatus);
  const [fanSpeed, setFanSpeed] = useState(deviceStatus.fanSpeed);
  const [ventilationSpeed, setVentilationSpeed] = useState(deviceStatus.ventilationSpeed);
  const [autoMode, setAutoMode] = useState(deviceStatus.autoMode);

  useEffect(() => {
    refreshDeviceStatus();
  }, [refreshDeviceStatus]);

  useEffect(() => {
    setLightOn(deviceStatus.lightStatus);
    setFanSpeed(deviceStatus.fanSpeed);
    setVentilationSpeed(deviceStatus.ventilationSpeed);
    setAutoMode(deviceStatus.autoMode);
  }, [deviceStatus]);

  // 🔥 FIXED: Updated endpoints and request structure
  const updateDeviceState = async (device: string, value: boolean | number) => {
    try {
      const token = localStorage.getItem('token');
      
      // Map device names to correct endpoints
      const endpoint = device === 'light' ? 'light' 
                    : device === 'fan' ? 'fan'
                    : device === 'ventilation' ? 'ventilation'
                    : device === 'autoMode' ? 'autoMode'
                    : device;

      const response = await fetch(`http://localhost:3001/api/devices/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          state: value,
          deviceId: 'default'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update device state');
      }

      const data = await response.json();
      toast.success(data.message || `${device} updated successfully`);
      refreshDeviceStatus();
    } catch (error: any) {
      console.error(`Error updating ${device}:`, error);
      toast.error(error.message || `Failed to update ${device}`);
    }
  };

  const handleLightToggle = async () => {
    const newState = !lightOn;
    await updateDeviceState('light', newState);
    setLightOn(newState);
  };

  const handleFanSpeedChange = async (value: number) => {
    // Convert percentage to 0-255 range
    const speed = Math.round((value / 100) * 255);
    await updateDeviceState('fan', speed);
    setFanSpeed(value);
  };

  const handleVentilationSpeedChange = async (value: number) => {
    // Convert percentage to 0-255 range
    const speed = Math.round((value / 100) * 255);
    await updateDeviceState('ventilation', speed);
    setVentilationSpeed(value);
  };

  const handleAutoModeToggle = async () => {
    const newState = !autoMode;
    await updateDeviceState('autoMode', newState);
    setAutoMode(newState);
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-white">Device Control</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-medium text-white">Light</Label>
          <Switch
            checked={lightOn}
            onCheckedChange={handleLightToggle}
            disabled={autoMode}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-white">
            <Label className="text-lg font-medium">Fan Speed</Label>
            <span>{fanSpeed}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[fanSpeed]}
            onValueChange={(value) => handleFanSpeedChange(value[0])}
            disabled={autoMode}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-white">
            <Label className="text-lg font-medium">Ventilation Speed</Label>
            <span>{ventilationSpeed}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[ventilationSpeed]}
            onValueChange={(value) => handleVentilationSpeedChange(value[0])}
            disabled={autoMode}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="text-lg font-medium text-white">Auto Mode</Label>
          <Switch
            checked={autoMode}
            onCheckedChange={handleAutoModeToggle}
          />
        </div>
      </CardContent>
    </Card>
  );
};