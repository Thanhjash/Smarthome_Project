"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import ThresholdConfiguration from '@/components/ThresholdConfiguration';
import { isAuthenticated, isAdmin } from '@/utils/auth';
import { Center, Spinner } from '@chakra-ui/react';

const AnalyticsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Layout isAdmin={isAdmin()}>
      <ThresholdConfiguration />
    </Layout>
  );
};

export default AnalyticsPage;