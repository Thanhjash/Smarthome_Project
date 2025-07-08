import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Switch,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  VStack,
  FormLabel,
  useToast,
} from '@chakra-ui/react';
import { useSensorData } from '@/hooks/useSensorData';

export const DeviceControl: React.FC = () => {
  const { deviceStatus } = useSensorData();
  const [lightOn, setLightOn] = useState(deviceStatus.led);
  const [fanSpeed, setFanSpeed] = useState(deviceStatus.motorB);
  const [ventilationSpeed, setVentilationSpeed] = useState(deviceStatus.motorA);
  const toast = useToast();

  useEffect(() => {
    setLightOn(deviceStatus.led);
    setFanSpeed(deviceStatus.motorB);
    setVentilationSpeed(deviceStatus.motorA);
  }, [deviceStatus]);

  const updateDeviceState = async (device: string, value: boolean | number) => {
    try {
      const response = await fetch(`/api/devices/${device}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ state: value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update device state');
      }

      toast({ title: `${device} updated successfully`, status: 'success' });
    } catch (error) {
      console.error(`Error updating ${device}:`, error);
      toast({ title: `Failed to update ${device}`, status: 'error' });
    }
  };

  const handleLightToggle = async () => {
    const newState = !lightOn;
    await updateDeviceState('light', newState);
    setLightOn(newState);
  };

  const handleFanSpeedChange = async (value: number) => {
    await updateDeviceState('fan', value);
    setFanSpeed(value);
  };

  const handleVentilationSpeedChange = async (value: number) => {
    await updateDeviceState('ventilation', value);
    setVentilationSpeed(value);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Light Control</Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch isChecked={lightOn} onChange={handleLightToggle} />
            <FormLabel ml={2}>{lightOn ? 'ON' : 'OFF'}</FormLabel>
          </Box>
        </CardBody>
      </Card>
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Fan Control</Heading>
        </CardHeader>
        <CardBody>
          <Slider
            min={0}
            max={255}
            step={1}
            value={fanSpeed}
            onChange={(value) => handleFanSpeedChange(value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={2}>Speed: {fanSpeed}</Text>
        </CardBody>
      </Card>
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Ventilation Control</Heading>
        </CardHeader>
        <CardBody>
          <Slider
            min={0}
            max={255}
            step={1}
            value={ventilationSpeed}
            onChange={(value) => handleVentilationSpeedChange(value)}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={2}>Speed: {ventilationSpeed}</Text>
        </CardBody>
      </Card>
    </VStack>
  );
};