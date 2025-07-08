"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  Select
  } from '@chakra-ui/react';


const RegisterPage: React.FC = () => {
  const toast = useToast()
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      console.log('Registering user:', { username, email, password, role });
      const response = await fetch('/api/users/saveUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      if(response.ok) {
        toast({
          title: 'Signup successful',
          description: 'Please proceed to login',
          status: 'success',
          duration: 2000,
          isClosable: true,
          position: 'top',
        });
        setTimeout(() => {
          router.push('/login');
        }, 2000); // 2000 milliseconds (2 seconds) delay
      }

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: 'Signup failed',
          description: 'Failed to register user please use different username and emails',
          status: 'error',
          duration: 2000,
          isClosable: true,
          position: 'top'
        });
      }
    } catch (error) {
      setError('Registration error: ' + error.message);
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
        Sign Up
      </Heading>
      <form onSubmit={handleRegister}>
        <Stack spacing="4">
            <FormControl>
            <FormLabel htmlFor="username">Username</FormLabel>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              outlineColor="blue.400"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="email">Email</FormLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              outlineColor="blue.400"
            />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="password">Password</FormLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              outlineColor="blue.400"
            />
          </FormControl>

          <Select placeholder='Select role' value={role} onChange={(e) => setRole(e.target.value)}>
            <option value='user'>User</option>
            <option value='admin'>Admin</option>
          </Select>

          <Button type="submit" colorScheme="blue" mt={4}>
            Sign Up
          </Button>
          <Text textAlign="center" mt="2" fontSize="sm">
            Signed in? <a href="/login" style={{color: 'blue'}}>Login</a>
          </Text>
        </Stack>
      </form>
    </Box>
  );
};

export default RegisterPage;
