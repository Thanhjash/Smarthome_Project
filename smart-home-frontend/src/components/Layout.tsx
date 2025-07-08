import React from 'react';
import { Sidebar } from './Sidebar';
import { Box } from '@chakra-ui/react';

interface LayoutProps {
  children: React.ReactNode;
  isAdmin: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ children, isAdmin }) => {
  return (
    <>
    <Box ml="200px" p={4}>
      <Sidebar isAdmin={isAdmin} />
      {children}
    </Box>
    </>
  );
};
