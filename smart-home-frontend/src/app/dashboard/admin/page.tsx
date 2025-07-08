"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Layout } from '@/components/Layout';
import { Heading, Text, Card, CardBody, SimpleGrid, Box, Button, Table, Thead, Tbody, Tr, Th, Td, CardHeader, Spinner } from '@chakra-ui/react';

interface User {
  username: string;
  email: string;
  _id: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push('/login');
      } else {
        fetchUsers();
      }
    });

    return () => unsubscribe();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
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

  const handleSoftDelete = async (userId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/users/soft-delete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to soft delete user');
      }
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error soft deleting user:', error);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/users/deleteUser`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      setUsers(users.filter(user => user._id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(`/api/users/approveUser`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error data:', errorData);
        throw new Error('Failed to approve user');
      }
      const updatedUser = await response.json();
      setUsers(users.map(user => (user._id === userId ? { ...user, status: 'approved' } : user)));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  return (
    <Layout isAdmin={true}>
      <Card bg='white' color='black' boxShadow="2xl">
        <CardBody>
          <Heading>Dashboard</Heading>
          <Text fontSize="20px">Welcome to admin dashboard</Text>
        </CardBody>
      </Card>
      <br></br>
      <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(400px, 1fr))'>
        <Card bg='white' color='black' boxShadow="2xl">
          <CardBody>
            <Heading>Total Users: {users.length}</Heading>
          </CardBody>
        </Card>
        <Card bg='white' color='black' boxShadow="2xl">
          <CardBody>
            <Heading>Active Users: {users.filter(user => user.status === 'approved').length}</Heading>
          </CardBody>
        </Card>
        <Card bg='white' color='black' boxShadow="2xl">
          <CardBody>
            <Heading>Pending Approvals: {users.filter(user => user.status === 'pending').length}</Heading>
          </CardBody>
        </Card>
      </SimpleGrid>
      <br></br>
      <Card bg='white' color='black' boxShadow="2xl">
      <CardBody>
        <Heading>User Management</Heading>
        <br></br>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="200px">
            <Spinner />
          </Box>
        ) : (
          <Box overflowX="auto">
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Username</Th>
                  <Th>Email</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {users.map((user) => (
                  <Tr key={user._id}>
                    <Td>{user.username}</Td>
                    <Td>{user.email}</Td>
                    <Td>{user.status}</Td>
                    <Td>
                      {user.status === 'pending' && (
                        <Button colorScheme='green' onClick={() => handleApprove(user._id)} mr={2}>
                          Approve
                        </Button>
                      )}
                      <Button onClick={() => handleSoftDelete(user._id)} colorScheme='orange' mr={2}>
                        Soft Delete
                      </Button>
                      <Button onClick={() => handleDelete(user._id)} colorScheme="red">
                        Delete
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </CardBody>
    </Card>
    </Layout>
  );
};

export default AdminDashboard;
