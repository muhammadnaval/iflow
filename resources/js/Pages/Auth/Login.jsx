import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import MadrasahLogo from '@/Components/MadrasahLogo';
import { ArrowRight, Lock, Mail, CheckCircle } from 'lucide-react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const submit = (e) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-madrasah-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <Head title="Masuk - I-FLOW MTsN 3 Kota Padang" />

            {/* Header / Logo */}
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <div className="flex justify-center mb-3">
                    <MadrasahLogo className="w-14 h-14" />
                </div>
                <h1 className="text-2xl font-extrabold text-brand-primary tracking-tight">
                    I-<span className="text-brand-accent">FLOW</span>
                </h1>
                <p className="mt-1 text-xs font-semibold text-stone-600 uppercase tracking-wider">
                    MTsN 3 Kota Padang
                </p>
                <p className="text-xs text-madrasah-muted mt-0.5">
                    Ibadah Fast, Logged, On-time, and Online-Way
                </p>
            </div>

            {/* Card Form */}
            <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
                <div className="bg-white py-7 px-5 sm:px-8 border border-madrasah-border rounded-2xl shadow-xs">
                    {status && (
                        <div className="mb-4 text-xs font-medium text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4" />
                            {status}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-madrasah-fg uppercase tracking-wider mb-1.5">
                                Email Pengguna
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={data.email}
                                    placeholder="nama@mtsn3padang.sch.id"
                                    className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border-madrasah-border focus:border-brand-primary focus:ring-brand-primary"
                                    autoComplete="username"
                                    required
                                    onChange={(e) => setData('email', e.target.value)}
                                />
                            </div>
                            {errors.email && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-madrasah-fg uppercase tracking-wider mb-1.5">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    value={data.password}
                                    placeholder="••••••••"
                                    className="block w-full pl-9 pr-3 py-2 text-sm rounded-lg border-madrasah-border focus:border-brand-primary focus:ring-brand-primary"
                                    autoComplete="current-password"
                                    required
                                    onChange={(e) => setData('password', e.target.value)}
                                />
                            </div>
                            {errors.password && <p className="mt-1 text-xs text-rose-600 font-medium">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    className="rounded border-madrasah-border text-brand-primary focus:ring-brand-primary h-4 w-4"
                                    onChange={(e) => setData('remember', e.target.checked)}
                                />
                                <span className="text-stone-600 font-medium">Ingat saya</span>
                            </label>
                            <span className="text-madrasah-muted text-[11px]">Sesi aktif 120 menit</span>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-accent hover:bg-brand-accent-hover text-stone-950 font-bold text-sm shadow-sm transition active:scale-98"
                        >
                            <span>Masuk ke Sistem</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </form>
                </div>

                <p className="text-center text-[11px] text-madrasah-muted mt-4">
                    © 2025/2026 MTsN 3 Kota Padang. All rights reserved.
                </p>
            </div>
        </div>
    );
}
