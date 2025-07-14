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
  const [autoMode, setAutoMode] = useState(deviceStatus.autoMode);
  const [buzzerOn, setBuzzerOn] = useState(deviceStatus.buzzer);
  const toast = useToast();

  useEffect(() => {
    setLightOn(deviceStatus.led);
    setFanSpeed(deviceStatus.motorB);
    setVentilationSpeed(deviceStatus.motorA);
    setAutoMode(deviceStatus.autoMode);
    setBuzzerOn(deviceStatus.buzzer);
  }, [deviceStatus]);

  const updateDeviceState = async (device: string, value: boolean | number) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:3001/api/devices/${device}`, {
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
      toast({ 
        title: data.message || `${device} updated successfully`, 
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error: any) {
      console.error(`Error updating ${device}:`, error);
      toast({ 
        title: error.message || `Failed to update ${device}`, 
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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

  const handleAutoModeToggle = async () => {
    const newState = !autoMode;
    await updateDeviceState('autoMode', newState);
    setAutoMode(newState);
  };

  const handleBuzzerToggle = async () => {
    const newState = !buzzerOn;
    await updateDeviceState('buzzer', newState);
    setBuzzerOn(newState);
  };

  return (
    <VStack spacing={4} align="stretch">
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Light Control</Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch isChecked={lightOn} onChange={handleLightToggle} isDisabled={autoMode} />
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
            isDisabled={autoMode}
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
            isDisabled={autoMode}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={2}>Speed: {ventilationSpeed}</Text>
        </CardBody>
      </Card>

      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Auto Mode</Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch isChecked={autoMode} onChange={handleAutoModeToggle} />
            <FormLabel ml={2}>{autoMode ? 'ENABLED' : 'DISABLED'}</FormLabel>
          </Box>
        </CardBody>
      </Card>

      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Buzzer Control</Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch isChecked={buzzerOn} onChange={handleBuzzerToggle} />
            <FormLabel ml={2}>{buzzerOn ? 'ON' : 'OFF'}</FormLabel>
          </Box>
        </CardBody>
      </Card>
    </VStack>
  );
};