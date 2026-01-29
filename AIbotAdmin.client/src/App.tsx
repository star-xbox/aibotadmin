import { Link, Route, Routes } from 'react-router';
import { AuthProvider } from "./hooks/use-auth"
import PrivateRoute from './components/private-route';
import AdminRoute from './components/admin-route';
import LoginPage from './pages/login';
import HomePage from './pages/home';
import { useEffect } from 'react';
import { useApp } from './hooks/use-app';
import { useAuth } from '@/hooks/use-auth';
import { getMyUrl } from '@/utils';
import LoginErr from './pages/login-err';
function NoMatch() {
    return (
        <div>
            <h2>ここには何も見るものはありません!</h2>
            <p>
                <Link to="/">ホームページへ</Link>
            </p>
        </div>
    );
}
function TempPage() {
    const { fetchUser } = useAuth();
    useEffect(() => {
        const init = async () => {
            await fetchUser();
            window.location.href = getMyUrl( `/`);
        };
        init();
    }, [])

    //window.location.reload();
    return <div></div>;
}

function App() {
    const { fetchMessages } = useApp();
    useEffect(() => {
        setTimeout(async () => {
            await fetchMessages();
        }, 50);
    }, []);
    return (
        <AuthProvider>
            <Routes>
                <Route path="login" element={<LoginPage />} />                
                <Route path="/home" element={<TempPage />} />
                <Route path="/loginerr" element={<LoginErr />} />
                {/* <Route path="saml2-login" element={<Saml2LoginPage />} /> */}
                <Route path="" element={<PrivateRoute />}>
                    <Route path="" element={<HomePage />} />
                    <Route path="/" element={<HomePage />} />
                    <Route element={<AdminRoute />}>
                    </Route>
                </Route>
                <Route path="*" element={<NoMatch />} />
            </Routes>
        </AuthProvider>
    );
}
export default App;