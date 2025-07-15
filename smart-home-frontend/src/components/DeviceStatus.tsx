import React from 'react';
import { LightbulbIcon, Fan, Wind, AlertCircle, Settings, Shield, User } from 'lucide-react';
import { useSensorContext } from '@/contexts/SensorDataProvider';
import { Heading, Text, Card, CardBody, SimpleGrid, Box, Badge, HStack } from '@chakra-ui/react';

export const DeviceStatus: React.FC = () => {
  const { deviceStatus } = useSensorContext();

  const {
    led,
    buzzer,
    motorA,
    motorB, 
    autoMode,
    emergencyMode = false,
    manualLed = false,
    manualMotorA = false,
    manualMotorB = false,
    manualBuzzer = false,
  } = deviceStatus;

  // Determine current mode
  const getCurrentMode = () => {
    if (emergencyMode) return { mode: 'Emergency', color: 'red', icon: Shield };
    if (autoMode) return { mode: 'Auto', color: 'blue', icon: Settings };
    return { mode: 'Manual', color: 'green', icon: User };
  };

  const currentMode = getCurrentMode();

  const statusItems = [
    { 
      name: 'System Mode', 
      icon: currentMode.icon, 
      value: currentMode.mode,
      badge: currentMode.color,
      extra: emergencyMode ? 'Dangerous conditions detected' : 
             autoMode ? 'Automatic control active' : 
             'Manual control enabled'
    },
    { 
      name: 'Light', 
      icon: LightbulbIcon, 
      value: led ? 'ON' : 'OFF',
      badge: led ? 'green' : 'gray',
      extra: manualLed ? 'Manual override' : null
    },
    { 
      name: 'Fan', 
      icon: Fan, 
      value: `Speed: ${motorB}`,
      badge: motorB > 0 ? 'blue' : 'gray',
      extra: manualMotorB ? 'Manual override' : null
    },
    { 
      name: 'Ventilation', 
      icon: Wind, 
      value: `Speed: ${motorA}`,
      badge: motorA > 0 ? 'blue' : 'gray',
      extra: manualMotorA ? 'Manual override' : null
    },
    { 
      name: 'Buzzer', 
      icon: AlertCircle, 
      value: buzzer ? 'ON' : 'OFF',
      badge: buzzer ? 'red' : 'gray',
      extra: manualBuzzer ? 'Manual override' : emergencyMode ? 'Emergency control' : null
    },
  ];

  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(250px, 1fr))'>
      {statusItems.map((item, index) => (
        <Card key={index} bg='white' color='black' boxShadow="2xl">
          <CardBody>
            <HStack justify="space-between" mb={2}>
              <Box display="flex" alignItems="center">
                <item.icon size='20px' />
                <Heading size="sm" ml={2}>{item.name}</Heading>
              </Box>
              <Badge colorScheme={item.badge}>{item.value}</Badge>
            </HStack>
            {item.extra && (
              <Text fontSize="xs" color="gray.600" mt={1}>
                {item.extra}
              </Text>
            )}
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
};