import React from 'react';
import { Sidebar } from './Sidebar';
import { Box } from '@chakra-ui/react';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAdmin }) => {
  return (
    <Box display="flex" minH="100vh">
      <Sidebar isAdmin={isAdmin} />
      <Box 
        ml="200px" 
        p={4} 
        flex="1" 
        bg="gray.50" 
        minH="100vh"
        w="calc(100vw - 200px)"
      >
        {children}
      </Box>
    </Box>
  );
};