"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';

const LoginPage: React.FC = () => {
  const toast = useToast()
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const response = await fetch('/api/users/getUserByUsername', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error('User not found');
      }

      const data = await response.json();
      console.log('Email received from API:', data.email);

      // Log in with email and password using Firebase Auth
      await signInWithEmailAndPassword(auth, data.email, password);
      toast({
        title: 'Login successful',
        description: 'Redirecting to dashboard...',
        status: 'success',
        duration: 2000,
        isClosable: true,
        position: 'top',
      });
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error) {
      setError('Login failed: ' + error.message);
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 2000,
        isClosable: true,
        position: 'top'
      });
    }
  };
  

  return (
    <Box
    maxWidth="md"
    mx="auto"
    mt="10"
    p="6"
    borderRadius="lg"
    boxShadow="md"
  >
    <Heading as="h1" mb="6" textAlign="center">
      Login
    </Heading>
    <form onSubmit={handleLogin}>
      <Stack spacing="4">
        <FormControl>
          <FormLabel htmlFor="usernam">Username</FormLabel>
          <Input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        <Button type="submit" colorScheme="blue">
          Login
        </Button>
        <Text textAlign="center" mt="2" fontSize="sm">
          Not signed in? <a href="/register" style={{color: 'blue'}}>Sign up</a>
        </Text>
      </Stack>
    </form>
  </Box>
  );
};

export default LoginPage;
