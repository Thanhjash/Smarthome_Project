"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, isAuthenticated, isAdmin } from '@/utils/auth';
import { Center, Spinner } from '@chakra-ui/react';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Redirect based on role
    const userInfo = getCurrentUser();
    if (userInfo) {
      if (isAdmin()) {
        router.push('/dashboard/admin');
      } else {
        router.push('/dashboard/user');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <Center h="100vh">
      <Spinner size="xl" />
    </Center>
  );
};

export default DashboardPage;