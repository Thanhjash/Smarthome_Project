'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { Box, Heading, Text, Button, VStack } from '@chakra-ui/react';


const Home: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  return (
    <>
      {user ? (
        <Box p={4} textAlign="center">
        <VStack spacing={4}>
          <Heading>Welcome to Smart Home Dashboard</Heading>
          <Text>Click any button to enter the site</Text>
          <Button colorScheme="teal" onClick={() => router.push('/dashboard/admin')}>
          Admin Dashboard
          </Button>
          <Button colorScheme="teal" onClick={() => router.push('/dashboard/user')}>
          User Dashboard
          </Button>
          <Button colorScheme="teal" onClick={() => router.push('/dashboard/sensor')}>
          Sensor Dashboard
          </Button>
          <Button colorScheme="red"  onClick={handleLogout}>
            Logout
          </Button>
        </VStack>
      </Box>
      ) : (
        <p></p>
      )}
    </>
  );
};

export default Home;
