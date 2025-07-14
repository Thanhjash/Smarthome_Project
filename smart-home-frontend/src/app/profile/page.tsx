"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layout } from '@/components/Layout';
import { 
  Box, 
  Card, 
  CardBody, 
  CardHeader,
  Heading, 
  Text, 
  Button, 
  VStack, 
  Input, 
  FormControl, 
  FormLabel,
  useToast,
  SimpleGrid,
  Spinner,
  Center
} from '@chakra-ui/react';
import { getCurrentUser, isAuthenticated, isAdmin } from '@/utils/auth';
import api from '@/utils/api';

const Profile: React.FC = () => {
  const router = useRouter();
  const toast = useToast();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    const userInfo = getCurrentUser();
    setUser(userInfo);
    setLoading(false);
  }, [router]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      await api.post('/users/change-password', {
        oldPassword,
        newPassword
      });

      toast({
        title: 'Success',
        description: 'Password changed successfully',
        status: 'success',
        duration: 3000,
      });

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to change password',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        await api.post('/users/delete-account');
        localStorage.clear();
        router.push('/login');
        toast({
          title: 'Account Deleted',
          description: 'Your account has been deleted successfully',
          status: 'info',
          duration: 3000,
        });
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to delete account',
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Layout isAdmin={isAdmin()}>
      <VStack spacing={6} align="stretch">
        <Card>
          <CardHeader>
            <Heading size="lg">Profile Information</Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={2} spacing={4}>
              <Box>
                <Text fontWeight="bold">Username:</Text>
                <Text>{user?.username}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Email:</Text>
                <Text>{user?.email}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">Role:</Text>
                <Text>{user?.role}</Text>
              </Box>
              <Box>
                <Text fontWeight="bold">User ID:</Text>
                <Text>{user?.userId}</Text>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md">Change Password</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Current Password</FormLabel>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormControl>
              <Button
                colorScheme="blue"
                onClick={handleChangePassword}
                isDisabled={!oldPassword || !newPassword || !confirmPassword}
              >
                Change Password
              </Button>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <Heading size="md" color="red.500">Danger Zone</Heading>
          </CardHeader>
          <CardBody>
            <Text mb={4} color="gray.600">
              Once you delete your account, there is no going back. Please be certain.
            </Text>
            <Button colorScheme="red" onClick={handleDeleteAccount}>
              Delete Account
            </Button>
          </CardBody>
        </Card>
      </VStack>
    </Layout>
  );
};

export default Profile;