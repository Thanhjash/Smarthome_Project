import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { auth } from '@/firebase';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const WithAuthComponent: React.FC = (props) => {
    const router = useRouter();

    useEffect(() => {
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (!user) {
          router.push('/login');
        }
      });

      return () => unsubscribe();
    }, [router]);

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
