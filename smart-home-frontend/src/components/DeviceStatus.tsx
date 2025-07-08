import React from 'react';
import { LightbulbIcon, Fan, Wind, AlertCircle, Settings } from 'lucide-react';
import { useSensorData } from '@/hooks/useSensorData';
import { Heading, Text, Card, CardBody, SimpleGrid, Box } from '@chakra-ui/react';

export const DeviceStatus: React.FC = () => {
  const { deviceStatus } = useSensorData();

  const statusItems = [
    { name: 'Light', icon: LightbulbIcon, value: deviceStatus.led ? 'ON' : 'OFF' },
    { name: 'Fan', icon: Fan, value: `${deviceStatus.motorB}` },
    { name: 'Ventilation', icon: Wind, value: `${deviceStatus.motorA}` },
    { name: 'Buzzer', icon: AlertCircle, value: deviceStatus.buzzer ? 'ON' : 'OFF' },
    { name: 'Auto Mode', icon: Settings, value: deviceStatus.autoMode ? 'Enabled' : 'Disabled' },
  ];

  return (
    <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(200px, 1fr))'>
      {statusItems.map((item, index) => (
        <Card key={index} bg='white' color='black' boxShadow="2xl">
          <CardBody>
            <Box display="flex" alignItems="center">
              <Heading size="md" mr={2}>{item.name}</Heading>
              <item.icon size='24px' />
            </Box>
            <Text mt={4} fontSize="xl">{item.value}</Text>
          </CardBody>
        </Card>
      ))}
    </SimpleGrid>
  );
};