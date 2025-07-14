"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Settings, User } from 'lucide-react';
import { Box, Flex, Link as ChakraLink, Button, Text, Spacer } from '@chakra-ui/react';
import NextLink from 'next/link';
import { getCurrentUser, isAuthenticated, isAdmin } from '@/utils/auth';

export const Navbar: React.FC = () => {
  const router = useRouter();
  const authenticated = isAuthenticated();
  const userInfo = getCurrentUser();

  return (
    <Box bg="white" p={4} boxShadow="sm" borderBottom="1px" borderColor="gray.200">
      <Flex align="center">
        <NextLink href="/" passHref>
          <ChakraLink fontSize="xl" fontWeight="bold" color="teal.500">
            Smart Home
          </ChakraLink>
        </NextLink>
        
        <Spacer />
        
        <Flex gap={4} align="center">
          {!authenticated ? (
            <>
              <NextLink href="/login" passHref>
                <ChakraLink color="gray.600" _hover={{ color: "teal.500" }}>
                  Login
                </ChakraLink>
              </NextLink>
              <NextLink href="/register" passHref>
                <Button colorScheme="teal" size="sm">
                  Register
                </Button>
              </NextLink>
            </>
          ) : (
            <>
              <Text fontSize="sm" color="gray.600">
                Welcome, {userInfo?.username}
              </Text>
              <NextLink href="/dashboard" passHref>
                <ChakraLink color="gray.600" _hover={{ color: "teal.500" }}>
                  Dashboard
                </ChakraLink>
              </NextLink>
              {isAdmin() && (
                <NextLink href="/admin/user-management" passHref>
                  <ChakraLink color="gray.600" _hover={{ color: "teal.500" }}>
                    Admin
                  </ChakraLink>
                </NextLink>
              )}
              <NextLink href="/profile" passHref>
                <ChakraLink color="gray.600" _hover={{ color: "teal.500" }}>
                  Profile
                </ChakraLink>
              </NextLink>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};