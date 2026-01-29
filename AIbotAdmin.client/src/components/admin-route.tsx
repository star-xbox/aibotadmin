import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Outlet, useNavigate } from 'react-router';
import { sleep } from '@/utils/index'



const AdminRoute = () => {
    const { isAcc, isAdmin } = useAuth();
    const navigate = useNavigate();

    if (isAdmin || isAcc) {
        return <Outlet />
    } else {
        toast.warning("このページにアクセスする権限がありません。");
        sleep(10)
        navigate("/")
        //return <Navigate to="/" />;
    }
};

export default AdminRoute;
