import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { Outlet, Navigate  } from 'react-router';


const PrivateRoute = () => {
  const { authData , fetchUser } = useAuth();
  useEffect(() => {
    const init = async () => {
      await fetchUser(); 
    };
    init();
  }, [])
  if(!authData) {
    return <Navigate to="/login" />;
  }
  return <Outlet />
};

export default PrivateRoute;
