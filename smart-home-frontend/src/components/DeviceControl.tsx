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
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Button,
} from '@chakra-ui/react';
import { useSensorContext } from '@/contexts/SensorDataProvider';

export const DeviceControl: React.FC = () => {
  const { deviceStatus, refreshDeviceStatus } = useSensorContext();
  const toast = useToast();

  // Extract all device states and mode flags from context
  const {
    led,
    buzzer, 
    motorA,
    motorB,
    autoMode,
    // Add these if available in your context
    emergencyMode = false,
    manualLed = false,
    manualMotorA = false, 
    manualMotorB = false,
    manualBuzzer = false,
  } = deviceStatus;

  // Local state for immediate UI feedback
  const [localStates, setLocalStates] = useState({
    lightOn: led,
    fanSpeed: motorB,
    ventilationSpeed: motorA,
    autoMode: autoMode,
    buzzerOn: buzzer,
  });

  // Sync local state with context updates
  useEffect(() => {
    setLocalStates({
      lightOn: led,
      fanSpeed: motorB, 
      ventilationSpeed: motorA,
      autoMode: autoMode,
      buzzerOn: buzzer,
    });
  }, [led, motorB, motorA, autoMode, buzzer]);

  // Mode checking functions
  const isEmergencyActive = emergencyMode;
  const isAutoModeActive = autoMode && !emergencyMode;
  const canControlDevice = (deviceType: string) => {
    if (isEmergencyActive) {
      // In emergency, only buzzer can be controlled
      return deviceType === 'buzzer';
    }
    if (isAutoModeActive) {
      // In auto mode, no manual controls allowed
      return false;
    }
    return true; // Manual mode - all controls allowed
  };

  const updateDeviceState = async (device: string, value: boolean | number) => {
    try {
      const token = localStorage.getItem('token');
      
      // Special handling for emergency buzzer
      const endpoint = isEmergencyActive && device === 'buzzer' 
        ? 'emergency/buzzer'
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

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 400 && data.message?.includes('emergency')) {
          toast({ 
            title: 'Emergency Mode Active', 
            description: 'Device is in emergency mode. Only buzzer can be controlled.',
            status: 'warning',
            duration: 4000,
            isClosable: true,
          });
        } else {
          throw new Error(data.message || 'Failed to update device state');
        }
        return;
      }

      toast({ 
        title: data.message || `${device} updated successfully`, 
        status: 'success',
        duration: 2000,
        isClosable: true,
      });

      // Refresh device status after successful command
      setTimeout(() => refreshDeviceStatus(), 500);

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
    if (!canControlDevice('light')) return;
    const newState = !localStates.lightOn;
    setLocalStates(prev => ({ ...prev, lightOn: newState }));
    await updateDeviceState('light', newState);
  };

  const handleFanSpeedChange = async (value: number) => {
    if (!canControlDevice('fan')) return;
    setLocalStates(prev => ({ ...prev, fanSpeed: value }));
    await updateDeviceState('fan', value);
  };

  const handleVentilationSpeedChange = async (value: number) => {
    if (!canControlDevice('ventilation')) return;
    setLocalStates(prev => ({ ...prev, ventilationSpeed: value }));
    await updateDeviceState('ventilation', value);
  };

  const handleAutoModeToggle = async () => {
    if (isEmergencyActive) return;
    const newState = !localStates.autoMode;
    setLocalStates(prev => ({ ...prev, autoMode: newState }));
    await updateDeviceState('autoMode', newState);
  };

  const handleBuzzerToggle = async () => {
    if (!canControlDevice('buzzer')) return;
    const newState = !localStates.buzzerOn;
    setLocalStates(prev => ({ ...prev, buzzerOn: newState }));
    await updateDeviceState('buzzer', newState);
  };

  const resetManualControls = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/devices/resetManual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId: 'default' }),
      });

      if (response.ok) {
        toast({ 
          title: 'Manual controls reset successfully', 
          status: 'success',
          duration: 2000,
        });
        refreshDeviceStatus();
      }
    } catch (error) {
      console.error('Error resetting manual controls:', error);
    }
  };

  return (
    <VStack spacing={4} align="stretch">
      {/* Mode Status Alert */}
      {isEmergencyActive && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <AlertTitle>Emergency Mode Active!</AlertTitle>
            <AlertDescription>
              Device is in emergency mode. Only buzzer can be controlled.
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {isAutoModeActive && (
        <Alert status="info">
          <AlertIcon />
          <Box>
            <AlertTitle>Auto Mode Enabled</AlertTitle>
            <AlertDescription>
              Device is in automatic control mode. Manual controls are disabled.
              <Button size="sm" ml={2} onClick={resetManualControls}>
                Reset Manual Overrides
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Manual Mode Indicators */}
      {!isEmergencyActive && !isAutoModeActive && (manualLed || manualMotorA || manualMotorB || manualBuzzer) && (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <AlertTitle>Manual Overrides Active</AlertTitle>
            <AlertDescription>
              Some devices have manual overrides: 
              {manualLed && <Badge ml={1} colorScheme="orange">LED</Badge>}
              {manualMotorA && <Badge ml={1} colorScheme="orange">Ventilation</Badge>}
              {manualMotorB && <Badge ml={1} colorScheme="orange">Fan</Badge>}
              {manualBuzzer && <Badge ml={1} colorScheme="orange">Buzzer</Badge>}
              <Button size="sm" ml={2} onClick={resetManualControls}>
                Reset All
              </Button>
            </AlertDescription>
          </Box>
        </Alert>
      )}

      {/* Auto Mode Control */}
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">Auto Mode</Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch 
              isChecked={localStates.autoMode} 
              onChange={handleAutoModeToggle}
              isDisabled={isEmergencyActive}
            />
            <FormLabel ml={2}>
              {localStates.autoMode ? 'ENABLED' : 'DISABLED'}
              {manualLed || manualMotorA || manualMotorB ? ' (Manual overrides active)' : ''}
            </FormLabel>
          </Box>
        </CardBody>
      </Card>

      {/* Light Control */}
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">
            Light Control
            {manualLed && <Badge ml={2} colorScheme="orange">Manual</Badge>}
          </Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch 
              isChecked={localStates.lightOn} 
              onChange={handleLightToggle} 
              isDisabled={!canControlDevice('light')}
            />
            <FormLabel ml={2}>{localStates.lightOn ? 'ON' : 'OFF'}</FormLabel>
          </Box>
        </CardBody>
      </Card>

      {/* Fan Control */}
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">
            Fan Control
            {manualMotorB && <Badge ml={2} colorScheme="orange">Manual</Badge>}
          </Heading>
        </CardHeader>
        <CardBody>
          <Slider
            min={0}
            max={255}
            step={1}
            value={localStates.fanSpeed}
            onChange={handleFanSpeedChange}
            isDisabled={!canControlDevice('fan')}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={2}>Speed: {localStates.fanSpeed}</Text>
        </CardBody>
      </Card>

      {/* Ventilation Control */}
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">
            Ventilation Control
            {manualMotorA && <Badge ml={2} colorScheme="orange">Manual</Badge>}
          </Heading>
        </CardHeader>
        <CardBody>
          <Slider
            min={0}
            max={255}
            step={1}
            value={localStates.ventilationSpeed}
            onChange={handleVentilationSpeedChange}
            isDisabled={!canControlDevice('ventilation')}
          >
            <SliderTrack>
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb />
          </Slider>
          <Text mt={2}>Speed: {localStates.ventilationSpeed}</Text>
        </CardBody>
      </Card>

      {/* Buzzer Control */}
      <Card bg='white' color='black' boxShadow="2xl">
        <CardHeader>
          <Heading size="md">
            Buzzer Control
            {manualBuzzer && <Badge ml={2} colorScheme="orange">Manual</Badge>}
            {isEmergencyActive && <Badge ml={2} colorScheme="red">Emergency</Badge>}
          </Heading>
        </CardHeader>
        <CardBody>
          <Box display="flex" alignItems="center">
            <Switch 
              isChecked={localStates.buzzerOn} 
              onChange={handleBuzzerToggle}
              isDisabled={!canControlDevice('buzzer')}
            />
            <FormLabel ml={2}>{localStates.buzzerOn ? 'ON' : 'OFF'}</FormLabel>
          </Box>
        </CardBody>
      </Card>
    </VStack>
  );
};