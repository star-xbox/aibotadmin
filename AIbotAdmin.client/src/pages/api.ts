//import axios from 'axios'
//import { toast } from 'sonner'
//import { authStore } from '@/hooks/use-auth-store'

//const api = axios.create({
//    withCredentials: true
//})

//api.interceptors.response.use(
//    res => res,
//    err => {
//        const status = err.response?.status
//        const code = err.response?.data?.error_code

//        if (status === 401 && code === 'SESSION_EXPIRED') {
//            authStore.getState().logout()

//            toast.warning('セッションの有効期限が切れました。再度ログインしてください。', {
//                position: 'top-center'
//            })

//            setTimeout(() => {
//                window.location.href = '/login'
//            }, 500)
//        }

//        return Promise.reject(err)
//    }
//)

//export default api
