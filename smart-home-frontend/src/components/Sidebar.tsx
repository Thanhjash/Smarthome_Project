"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NextLink from 'next/link';
import { auth, logout } from '@/firebase';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { Home, BarChart2, Settings, HelpCircle, History, Thermometer, Users } from 'lucide-react';
import { Box, Flex, VStack, Text, Button, Link as ChakraLink } from '@chakra-ui/react';
import { MdDashboard } from "react-icons/md";

const AdminLinks = [
  { href: '/dashboard/admin', icon: Home, label: 'Home' },
  { href: '/admin/user-management', icon: Users, label: 'User Management' },
  { href: '/dashboard/analytics', icon: BarChart2, label: 'Analytics' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

const UserLinks = [
  { href: '/dashboard/user', icon: Home, label: 'Home' },
  { href: '/dashboard/sensor', icon: Thermometer, label: 'Sensor Dashboard' },
  { href: '/dashboard/history', icon: History, label: 'History' },
  { href: '/profile', icon: Settings, label: 'Profile' },
];

export const Sidebar: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const pathname = usePathname();
  const router = useRouter();
  const links = isAdmin ? AdminLinks : UserLinks;

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  return (
    <Box
      as="nav"
      pos="fixed"
      left="0"
      top="0"
      w="200px"
      h="100vh"
      bg="white"
      color="black"
      boxShadow="2xl"
      p={4}
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      zIndex="1000"
    >
      <VStack spacing={5} align="stretch">
        <Flex align="center">
          <MdDashboard size={"24"} color="black" />
          <Text ml={2} fontSize="x-large" color="black">
            Dashboard
          </Text>
        </Flex>
        {links.map((link) => (
          <NextLink key={link.href} href={link.href} passHref>
            <Button
              leftIcon={<link.icon />}
              variant="ghost"
              width="100%"
              boxShadow="md"
              bg={pathname === link.href ? "gray.100" : "transparent"}
              _hover={{ bg: "gray.50" }}
            >
              {link.label}
            </Button>
          </NextLink>
        ))}
      </VStack>
      <Button
        leftIcon={<FiLogOut />}
        colorScheme="red"
        variant="ghost"
        boxShadow="md"
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Box>
  );
};