"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { 
  Heading, 
  Box, 
  Card, 
  CardBody, 
  SimpleGrid, 
  Text, 
  Spinner, 
  Center,
  Button,
  VStack
} from '@chakra-ui/react';
import { getCurrentUser, isAuthenticated } from '@/utils/auth';

const UserDashboard: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const user = getCurrentUser();
    setUserInfo(user);
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Layout isAdmin={false}>
      <VStack spacing={6} align="stretch">
        <Card bg='white' color='black' boxShadow="2xl">
          <CardBody>
            <Heading size="lg">User Dashboard</Heading>
            <Text fontSize="md" color="gray.600" mt={2}>
              Welcome back, {userInfo?.username}!
            </Text>
          </CardBody>
        </Card>

        <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(300px, 1fr))'>
          <Card bg='white' color='black' boxShadow="lg" _hover={{ boxShadow: "xl" }}>
            <CardBody>
              <Heading size="md" mb={3}>Quick Actions</Heading>
              <VStack spacing={3}>
                <Button 
                  colorScheme="teal" 
                  w="full"
                  onClick={() => router.push('/dashboard/sensor')}
                >
                  View Sensors
                </Button>
                <Button 
                  colorScheme="blue" 
                  variant="outline"
                  w="full"
                  onClick={() => router.push('/dashboard/history')}
                >
                  View History
                </Button>
                <Button 
                  colorScheme="purple" 
                  variant="outline"
                  w="full"
                  onClick={() => router.push('/profile')}
                >
                  Edit Profile
                </Button>
              </VStack>
            </CardBody>
          </Card>

          <Card bg='white' color='black' boxShadow="lg">
            <CardBody>
              <Heading size="md" mb={3}>Account Info</Heading>
              <VStack align="start" spacing={2}>
                <Text><strong>Username:</strong> {userInfo?.username}</Text>
                <Text><strong>Email:</strong> {userInfo?.email}</Text>
                <Text><strong>Role:</strong> {userInfo?.role}</Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </VStack>
    </Layout>
  );
};

export default UserDashboard;