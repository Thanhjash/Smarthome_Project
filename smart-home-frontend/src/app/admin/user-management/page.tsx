"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const UserManagement: React.FC = () => {
  const router = useRouter();
  const [users, setUsers] = useState<{ username: string; email: string; id: string; status: string }[]>([]);
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

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/deleteUser`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/approveUser`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: userId }),
      });
      if (!response.ok) {
        throw new Error('Failed to approve user');
      }
      setUsers(users.map(user => (user.id === userId ? { ...user, status: 'approved' } : user)));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  return (
    <div>
      <h1>User Management</h1>
      <p>Manage users, settings, and configurations.</p>
      {isLoading ? (
        <p>Loading users...</p>
      ) : (
        <ul>
          {users.map((user) => (
            <li key={user.id}>
              {user.username} - {user.email} - {user.status}
              <button onClick={() => handleDelete(user.id)}>Delete</button>
              {user.status === 'pending' && <button onClick={() => handleApprove(user.id)}>Approve</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserManagement;
