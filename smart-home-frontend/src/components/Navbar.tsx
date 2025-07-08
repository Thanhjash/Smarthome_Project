import React from 'react';
import Link from 'next/link';
import { Bell, Settings, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Notifications } from './Notifications';
import Image from 'next/image';
import { Box, Flex, Link as ChakraLink } from '@chakra-ui/react';
import NextLink from 'next/link';

export const Navbar: React.FC = () => {
  return (
    <Box bg="white" p={4}>
      <Flex justify="space-between">
        <NextLink href="/" passHref>
          <ChakraLink color="blue.300">Home</ChakraLink>
        </NextLink>
        <NextLink href="/login" passHref>
          <ChakraLink color="white">Login</ChakraLink>
        </NextLink>
        <NextLink href="/dashboard" passHref>
          <ChakraLink color="white">Dashboard</ChakraLink>
        </NextLink>
      </Flex>
    </Box>
  );
};
