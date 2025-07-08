import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { useDeviceControl } from '@/hooks/useDeviceControl';
import { useSensorData } from '@/hooks/useSensorData';

export const LightControl: React.FC = () => {
  const { deviceStatus } = useSensorData();
  const [fanSpeed, setFanSpeed] = useDeviceControl(deviceStatus.fanSpeed, 'fan');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fan Control</CardTitle>
      </CardHeader>
      <CardContent>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[fanSpeed as number]}
          onValueChange={(value) => setFanSpeed(value[0])}
        />
        <div className="mt-2">Speed: {fanSpeed}%</div>
      </CardContent>
    </Card>
  );
};
