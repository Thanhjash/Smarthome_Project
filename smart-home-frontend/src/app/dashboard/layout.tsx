"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Center, Spinner } from '@chakra-ui/react';
import { isAuthenticated, isAdmin } from '@/utils/auth';

// Component Layout chính của bạn (giữ nguyên)
import { Layout } from '@/components/Layout';
// Provider ta đã tạo
import { SensorDataProvider } from '@/contexts/SensorDataProvider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminRole, setAdminRole] = useState(false);

  useEffect(() => {
    // Logic xác thực người dùng được chuyển lên đây
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    setAdminRole(isAdmin());
    setLoading(false);
  }, [router]);

  // Trong khi chờ xác thực, hiển thị spinner
  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  // Sau khi xác thực, hiển thị Layout chính
  // SensorDataProvider được đặt ở đây, nó sẽ chỉ mount MỘT LẦN
  // và tồn tại xuyên suốt khi bạn điều hướng giữa các trang trong dashboard.
  return (
    <SensorDataProvider>
      <Layout isAdmin={adminRole}>
        {children}
      </Layout>
    </SensorDataProvider>
  );
}