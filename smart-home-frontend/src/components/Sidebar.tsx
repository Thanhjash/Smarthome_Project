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
  { href: '/', icon: Home, label: 'Home' },
  { href: '', icon: Users, label: 'User Management' },
  { href: '', icon: BarChart2, label: 'Analytics' },
  { href: '', icon: Settings, label: 'Settings' },
];

const UserLinks = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/dashboard/sensor', icon: Thermometer, label: 'Sensor Dashboard' },
  { href: '', icon: History, label: 'History' },
];


export const Sidebar: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const pathname = usePathname();
  const router = useRouter();
  const links = isAdmin ? AdminLinks : UserLinks;

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('user');
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
            boxShadow="2xl"
            isActive={pathname == link.href}
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
        boxShadow="2xl"
        onClick={handleLogout}
      >
        Logout
      </Button>

    </Box>
  );
};
