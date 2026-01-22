"use client";

import { useAuth } from "@/context/AuthContext";

export default function Login() {
    const { signInWithGoogle } = useAuth();

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 px-8 py-12 shadow-2xl">
                {/* Background glow effect */}
                <div className="absolute -left-20 -top-20 h-64 w-64 bg-emerald-500/10 blur-[100px]" />
                <div className="absolute -right-20 -bottom-20 h-64 w-64 bg-indigo-500/10 blur-[100px]" />

                <div className="relative z-10 text-center">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-950 shadow-inner ring-1 ring-zinc-800">
                        <span className="h-8 w-1.5 bg-emerald-500" />
                        <span className="ml-1.5 h-8 w-1.5 bg-indigo-500" />
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                        Ops Intelligence
                    </h1>
                    <p className="mt-2 text-sm text-zinc-400">
                        Internal monitoring dashboard for operational records. Please sign in to continue.
                    </p>

                    <button
                        onClick={signInWithGoogle}
                        className="group mt-10 flex w-full items-center justify-center gap-3 rounded-xl bg-white px-5 py-4 text-sm font-bold tracking-tight text-zinc-950 transition-all hover:bg-zinc-100 hover:scale-[1.02] active:scale-95"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 48 48">
                            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                        Sign in with Google
                    </button>

                    <div className="mt-12 border-t border-zinc-800 pt-8">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Authorized Personnel Only
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
