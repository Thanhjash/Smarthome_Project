import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid,
  FormControl,
  FormLabel,
  Input,
  Button,
  Select,
  VStack,
  HStack,
  Text,
  useToast,
  Spinner,
  Box
} from '@chakra-ui/react';
import api from '@/utils/api';
import { isAdmin } from '@/utils/auth';

interface Thresholds {
  temperature?: number;
  humidity?: number;
  co2?: number;
  light?: number;
  co?: number;
  lpg?: number;
  smoke?: number;
  nh3?: number;
}

const ThresholdConfiguration: React.FC = () => {
  const [thresholds, setThresholds] = useState<Thresholds>({});
  const [loading, setLoading] = useState(true);
  const [sensor, setSensor] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const toast = useToast();

  const sensorOptions = [
    { value: 'temperature', label: 'Temperature (°C)', unit: '°C' },
    { value: 'humidity', label: 'Humidity (%)', unit: '%' },
    { value: 'co2', label: 'CO2 (ppm)', unit: 'ppm' },
    { value: 'light', label: 'Light (lux)', unit: 'lux' },
    { value: 'co', label: 'Carbon Monoxide (ppm)', unit: 'ppm' },
    { value: 'lpg', label: 'LPG (ppm)', unit: 'ppm' },
    { value: 'smoke', label: 'Smoke (ppm)', unit: 'ppm' },
    { value: 'nh3', label: 'Ammonia (ppm)', unit: 'ppm' },
  ];

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await api.get('/devices/thresholds', {
          params: { deviceId: 'default' }
        });
        setThresholds(response.data);
      } catch (error) {
        console.error('Error fetching thresholds:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch thresholds',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, [toast]);

  const fetchThresholds = async () => {
    try {
      const response = await api.get('/devices/thresholds', {
        params: { deviceId: 'default' }
      });
      setThresholds(response.data);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch thresholds',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!sensor || !value) return;

    try {
      const response = await api.post('/devices/thresholds', { 
        [sensor]: parseFloat(value),
        deviceId: 'default'
      });
      
      setThresholds(response.data.thresholds);
      setSensor('');
      setValue('');

      toast({
        title: 'Success',
        description: 'Threshold updated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error: any) {
      console.error('Error saving threshold:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save threshold',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (!isAdmin()) {
    return (
      <Card>
        <CardBody>
          <Text>Access denied. Admin privileges required.</Text>
        </CardBody>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <Box display="flex" justifyContent="center">
            <Spinner />
          </Box>
        </CardBody>
      </Card>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <Heading size="md">Update Threshold</Heading>
        </CardHeader>
        <CardBody>
          <HStack spacing={4}>
            <FormControl>
              <FormLabel>Sensor</FormLabel>
              <Select 
                value={sensor} 
                onChange={(e) => setSensor(e.target.value)}
                placeholder="Select sensor"
              >
                {sensorOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Value</FormLabel>
              <Input
                type="number"
                placeholder="Enter threshold value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
            </FormControl>
            <Box>
              <FormLabel>&nbsp;</FormLabel>
              <Button 
                colorScheme="blue"
                onClick={handleSave} 
                isDisabled={!sensor || !value}
              >
                Save
              </Button>
            </Box>
          </HStack>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Current Thresholds</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={2} spacing={4}>
            {sensorOptions.map(option => (
              <Box key={option.value} p={3} bg="gray.50" borderRadius="md">
                <Text fontWeight="bold">{option.label}</Text>
                <Text fontSize="lg" color="blue.600">
                  {thresholds[option.value as keyof Thresholds] || 'Not set'} {option.unit}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </CardBody>
      </Card>
    </VStack>
  );
};

export default ThresholdConfiguration;