'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Box, Heading, Text, Button, VStack, Spinner, Center } from '@chakra-ui/react';
import { getCurrentUser, isAdmin } from '@/utils/auth';

const Home: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const backendToken = localStorage.getItem('token');
      
      if (firebaseUser && backendToken) {
        setUser(firebaseUser);
      } else if (!firebaseUser && !backendToken) {
        // Only redirect if both Firebase and backend tokens are missing
        router.push('/login');
        return;
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleDashboardRedirect = () => {
    const userInfo = getCurrentUser();
    if (userInfo && isAdmin()) {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/user');
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  if (!user) {
    return (
      <Box p={8} textAlign="center" minH="100vh" bg="gray.50">
        <VStack spacing={6} maxW="md" mx="auto" mt={20}>
          <Heading size="xl">Smart Home Dashboard</Heading>
          <Text fontSize="lg" color="gray.600">
            Monitor and control your smart home devices
          </Text>
          <VStack spacing={4} w="full">
            <Button colorScheme="teal" size="lg" w="full" onClick={() => router.push('/login')}>
              Login
            </Button>
            <Button variant="outline" size="lg" w="full" onClick={() => router.push('/register')}>
              Register
            </Button>
          </VStack>
        </VStack>
      </Box>
    );
  }

  return (
    <Box p={8} textAlign="center" minH="100vh" bg="gray.50">
      <VStack spacing={6} maxW="md" mx="auto" mt={20}>
        <Heading size="xl" color="gray.800">
          Welcome to Smart Home Dashboard
        </Heading>
        <Text fontSize="lg" color="gray.600">
          Monitor and control your smart home devices
        </Text>
        
        <VStack spacing={4} w="full">
          <Button 
            colorScheme="teal" 
            size="lg" 
            w="full"
            onClick={handleDashboardRedirect}
          >
            Go to Dashboard
          </Button>
          
          <Button 
            colorScheme="blue" 
            variant="outline"
            size="lg" 
            w="full"
            onClick={() => router.push('/dashboard/sensor')}
          >
            Sensor Dashboard
          </Button>
          
          {isAdmin() && (
            <Button 
              colorScheme="purple" 
              variant="outline"
              size="lg" 
              w="full"
              onClick={() => router.push('/admin/user-management')}
            >
              User Management
            </Button>
          )}
          
          <Button 
            colorScheme="gray" 
            variant="outline"
            size="lg" 
            w="full"
            onClick={() => router.push('/profile')}
          >
            Profile
          </Button>
          
          <Button 
            colorScheme="red" 
            variant="ghost"
            size="md"
            onClick={handleLogout}
          >
            Logout
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default Home;