import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
//import { FieldDescription } from "@/components/ui/field";
import { MessageSquare } from 'lucide-react';

export default function LoginErr() {
    const navigate = useNavigate();

    const handleBackToLogin = () => {
        navigate("/login", { replace: true });
    };

    return (
        <div className="bg-muted flex min-h-svh flex-col items-center gap-6 p-6 md:p-10">
            <div className="flex w-full max-w-md flex-col gap-6">
                <div className="flex flex-col items-center self-center font-medium text-2xl">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <MessageSquare className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-gray-900 mb-2">
                        AI ChatBot Admin
                    </h1>
                </div>

                <div className="flex flex-col gap-6">
                    <Card className="border-red-200">
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-600" />
                                </div>
                            </div>
                            <CardTitle className="text-xl text-red-600">
                                Login Error
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                Microsoft account login failed
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-6">
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <p className="text-red-800 text-center">
                                    There is no Microsoft account information registered in the system.
                                    <br />
                                    Please contact your administrator.
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 text-sm">1</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">
                                        This Microsoft account may not be registered in our system.
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 text-sm">2</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">
                                        Please contact your administrator to register your account
                                    </p>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-blue-600 text-sm">3</span>
                                    </div>
                                    <p className="text-gray-700 text-sm">
                                        Please try a different login method
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    onClick={handleBackToLogin}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    variant="default"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Return to the Login Page
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/*<FieldDescription className="px-6 text-center">*/}
                    {/*    © 2025 MEDIA TECH Inc, Ver.{import.meta.env.PACKAGE_VERSION}*/}
                    {/*</FieldDescription>*/}
                </div>
            </div>
        </div>
    );
}