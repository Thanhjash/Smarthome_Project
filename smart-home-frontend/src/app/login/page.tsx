"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Heading,
  Text,
  useToast,
} from '@chakra-ui/react';

const LoginPage: React.FC = () => {
  const toast = useToast();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      // Backend login - returns both tokens
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store both tokens (backend already did Firebase auth)
      localStorage.setItem('token', data.backendToken);
      localStorage.setItem('firebaseToken', data.firebaseToken);
      localStorage.setItem('user', JSON.stringify({
        userId: data.userId,
        username: data.username,
        email: data.email,
        role: data.role
      }));

      toast({
        title: 'Login successful',
        status: 'success',
        duration: 2000,
      });

      setTimeout(() => {
        if (data.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/user');
        }
      }, 1000);

    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error.message,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxWidth="md" mx="auto" mt="10" p="6" borderRadius="lg" boxShadow="md">
      <Heading as="h1" mb="6" textAlign="center">Login</Heading>
      <form onSubmit={handleLogin}>
        <Stack spacing="4">
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </FormControl>
          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormControl>
          <Button 
            type="submit" 
            colorScheme="blue"
            isLoading={loading}
            loadingText="Signing in..."
          >
            Login
          </Button>
          <Text textAlign="center" fontSize="sm">
            Not signed in? <a href="/register" style={{color: 'blue'}}>Sign up</a>
          </Text>
        </Stack>
      </form>
    </Box>
  );
};

export default LoginPage;