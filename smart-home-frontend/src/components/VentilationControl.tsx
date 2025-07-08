import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Slider } from '@/components/ui/Slider';
import { useDeviceControl } from '@/hooks/useDeviceControl';
import { useSensorData } from '@/hooks/useSensorData';

export const LightControl: React.FC = () => {
  const { deviceStatus } = useSensorData();
  const [ventilationSpeed, setVentilationSpeed] = useDeviceControl(deviceStatus.ventilationSpeed, 'ventilation');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ventilation Control</CardTitle>
      </CardHeader>
      <CardContent>
        <Slider
          min={0}
          max={100}
          step={1}
          value={[Number(ventilationSpeed)]}
          onValueChange={(value) => setVentilationSpeed(value[0])}
        />
        <div className="mt-2">Speed: {ventilationSpeed}%</div>
      </CardContent>
    </Card>
  );
};
