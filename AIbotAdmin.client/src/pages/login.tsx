import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
} from "@/components/ui/card"
import {
    Field,
    //FieldDescription,
    FieldError,
    FieldGroup
} from "@/components/ui/field"
import { MessageSquare } from 'lucide-react';
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { IconLock, IconLogin, IconUser } from "@tabler/icons-react"
import * as z from "zod";
import { useNavigate } from "react-router"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner"
import { useApp } from '@/hooks/use-app';
import { useSearchParams } from "react-router"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { getMyUrl } from "../utils";

export default function LoginPage() {
    const navigate = useNavigate();
    const [params] = useSearchParams()
    let returnUrl = params.get('returnUrl');
    const { loginUser, authData, fetchUserLocked } = useAuth();
    const { messages } = useApp();
    const [isLock, setIsLock] = useState<boolean>(false);
    const [, setTimeUnLock] = useState<number>();
    const [errors, setErrors] = useState<any>();
    const [isSigning, setIsSigning] = useState<boolean>(false);
    useEffect(() => {
        const init = async () => {
            //const rs = await fetchUser();
            if (authData) {                
                navigate(returnUrl ?? '/', { replace: true })
            }
            //else {
            const rs = await fetchUserLocked();
            if (rs) {
                setErrors(rs.loginLock && messages ? messages.L0006.replace("{timeLock}", rs.loginCountFail).split('\n') : [])
                setIsLock(rs.loginLock);
                setTimeUnLock(rs.timeUnLock);
            }
            //}


        };
        init();
    }, [])
    const formSchema = z.object({
        loginId: z
            .string(),
        password: z
            .string(),
    });

    const form = useForm({
        defaultValues: {
            loginId: '',
            password: ''
        },
        validators: {
            onSubmit: formSchema,
        },
        onSubmit: async ({ value }: { value: any }) => {
            try {
                setErrors([])
                setIsSigning(true)
                const result = await loginUser({
                    loginId: value.loginId,
                    password: value.password,
                })
                setIsSigning(false)
                if (result.status === 'ok') {
                    toast.success('ログインに成功しました。', {
                        style: {
                            '--normal-bg':
                                'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
                            '--normal-text': 'light-dark(var(--color-green-600), var(--color-green-400))',
                            '--normal-border': 'light-dark(var(--color-green-600), var(--color-green-400))'
                        } as React.CSSProperties,
                        position: 'top-center'
                    });
                    if (returnUrl) {
                        console.log(returnUrl);
                        returnUrl = "/" + returnUrl;
                        returnUrl = returnUrl.replace('//', '/')
                        navigate(returnUrl ?? '/', { replace: true })
                    }
                    else {
                        navigate('/', { replace: true })
                    }
                }
                else {
                    if (result.status === 'locked') {
                        setErrors(messages ? messages.L0006.replace("{timeLock}", result.loginCountFail).split('\n') : [])
                        setIsLock(result.loginLock);
                        setTimeUnLock(result.timeUnLock);
                    }
                    setErrors(result.message.split('\n'))
                }
            } catch {
                return null;
            }
        },
    });

    const handleMicrosoftLogin = async () => {
        const url = getMyUrl(`/api/auth/login-microsoft?returnUrl=${encodeURIComponent(returnUrl ?? "/")}`); // endpoint MS hiện có
        window.location.href = url;
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center gap-6 p-6 md:p-10">
            <div className={`flex w-full flex-col gap-6 ${isLock ? 'max-w-md' : 'max-w-md'}`}>

                <div className="flex flex-col gap-6 pt-30">
                    <Card>
                        <div className="flex flex-col items-center self-center font-medium text-2xl">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                                <MessageSquare className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-gray-900 mb-2">
                                AI ChatBot Admin
                            </h1>

                        </div>
                        <CardContent>
                            <form id="form-login" className="m-3" onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
                                {isLock ?
                                    <div className="text-center" style={{ color: 'red' }}>
                                        {errors.map((item: string, index: number) => (
                                            <>{item}{index < errors.length - 1 && <br />}</>
                                        ))}
                                    </div> :
                                    <FieldGroup>
                                        {errors && errors.length > 0 &&
                                            <div className="text-left" style={{ color: 'red' }}>
                                                {errors.map((item: string, index: number) => (
                                                    <><span key={index + 1} style={{ marginLeft: item.startsWith('【') ? -9 : 0 }}>{item}</span>{index < errors.length - 1 && <br />}</>
                                                ))}
                                            </div>
                                        }
                                        <form.Field
                                            name="loginId"
                                            validators={{
                                                onChange: ({ value }) => !value ? { message: messages ? messages.M0001 : '' } : undefined,
                                            }}
                                            children={(field) => {
                                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                    <Field data-invalid={isInvalid} className="gap-1">
                                                        <InputGroup className={isSigning ? 'bg-secondary' : ''}>
                                                            <InputGroupInput
                                                                id={field.name}
                                                                name={field.name}
                                                                value={field.state.value}
                                                                onBlur={field.handleBlur}
                                                                onChange={(e) => field.handleChange(e.target.value)}
                                                                aria-invalid={isInvalid}
                                                                autoComplete="off"
                                                                className="disabled:bg-secondary"
                                                                placeholder={messages ? messages.L0001 : ''}
                                                                disabled={isSigning}
                                                            />
                                                            <InputGroupAddon>
                                                                <IconUser />
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                        {isInvalid && (
                                                            <FieldError errors={field.state.meta.errors} />
                                                        )}
                                                    </Field>
                                                )
                                            }}
                                        />
                                        <form.Field
                                            name="password"
                                            validators={{
                                                onChange: ({ value }) => !value ? { message: messages ? messages.M0002 : '' } : undefined,
                                            }}
                                            children={(field) => {
                                                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                                                return (
                                                    <Field data-invalid={isInvalid} className="gap-1">
                                                        <InputGroup className={isSigning ? 'bg-secondary' : ''}>
                                                            <InputGroupInput
                                                                id={field.name}
                                                                name={field.name}
                                                                value={field.state.value}
                                                                onBlur={field.handleBlur}
                                                                onChange={(e) => field.handleChange(e.target.value)}
                                                                aria-invalid={isInvalid}
                                                                type="password"
                                                                autoComplete="off"
                                                                className="disabled:bg-secondary"
                                                                placeholder={messages ? messages.L0002 : ''}
                                                                disabled={isSigning}
                                                            />
                                                            <InputGroupAddon>
                                                                <IconLock />
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                        {isInvalid && (
                                                            <FieldError errors={field.state.meta.errors} />
                                                        )}
                                                    </Field>
                                                )
                                            }}
                                        />

                                        <Button type="submit" disabled={isSigning}>{isSigning ? <Spinner /> : <IconLogin />}{messages ? messages.L0003 : ''}</Button>
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>
                                            <div className="relative flex justify-center">
                                                <span className="px-4 bg-white text-gray-500">
                                                    Or
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleMicrosoftLogin}
                                            disabled={isSigning}
                                            className="w-full flex items-center justify-center gap-2 py-1 px-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
                                        >
                                            <svg className="w-5 h-5" viewBox="0 0 23 23">
                                                <path fill="#f3f3f3" d="M0 0h23v23H0z" />
                                                <path fill="#f35325" d="M1 1h10v10H1z" />
                                                <path fill="#81bc06" d="M12 1h10v10H12z" />
                                                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                                <path fill="#ffba08" d="M12 12h10v10H12z" />
                                            </svg>
                                            <span className="text-gray-900">
                                                Sign in with Microsoft
                                            </span>
                                        </button>


                                    </FieldGroup>
                                }
                            </form>
                        </CardContent>
                    </Card>
                    {/*<FieldDescription className="px-6 text-center">*/}
                    {/*    © 2025 MEDIA TECH Inc, Ver.{import.meta.env.PACKAGE_VERSION}*/}
                    {/*</FieldDescription>*/}
                </div>
            </div>

        </div>
    )
}
