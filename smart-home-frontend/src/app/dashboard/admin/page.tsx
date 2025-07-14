"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { Heading, Text, Card, CardBody, SimpleGrid, Box, Button, Table, Thead, Tbody, Tr, Th, Td, CardHeader, Spinner, useToast } from '@chakra-ui/react';

interface User {
  username: string;
  email: string;
  _id: string;
  status: string;
}

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🔥 FIXED: Check JWT token instead of Firebase
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      router.push('/login');
      return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'admin') {
      router.push('/dashboard/user');
      return;
    }

    const fetchUsers = async () => {
      try {
        // 🔥 FIXED: Use backend endpoint with JWT token
        const response = await fetch('http://localhost:3001/api/users', {
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
        toast({
          title: 'Error',
          description: 'Failed to fetch users',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router, toast]);

  // 🔥 REMOVED: Soft delete (not in backend API)
  
  const handleDelete = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      // 🔥 FIXED: Use correct endpoint and method
      const response = await fetch('http://localhost:3001/api/users/delete', {
        method: 'POST',
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
      toast({
        title: 'Success',
        description: 'User deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const token = localStorage.getItem('token');
      // 🔥 FIXED: Use correct endpoint and method
      const response = await fetch('http://localhost:3001/api/users/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ id: userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve user');
      }
      
      setUsers(users.map(user => (user._id === userId ? { ...user, status: 'approved' } : user)));
      toast({
        title: 'Success',
        description: 'User approved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve user',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
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