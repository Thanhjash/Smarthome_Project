"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, logout } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Layout } from '@/components/Layout';
import { Heading, Box, Card, CardHeader, CardBody, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

const UserDashboard: React.FC = () => {
  const [users, setUsers] = useState<{ username: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        localStorage.setItem('user', JSON.stringify(user));
        fetchUsers();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
    <Layout isAdmin={false}>
      <Card bg='white' color='black' boxShadow="2xl">
        <CardBody>
          <Heading>User List</Heading>
          <br></br>
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Username</Th>
                  <Th>Email</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user.email}>
                    <Td>{user.username}</Td>
                    <Td>{user.email}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        </CardBody>
      </Card>
    </Layout>
  );
};

export default UserDashboard;
