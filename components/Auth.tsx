import React, { useState } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

interface AuthProps {
    supabase: SupabaseClient;
}

const Auth: React.FC<AuthProps> = ({ supabase }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'signin' | 'signup'>('signin');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            if (mode === 'signup') {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (error) throw error;
                setMessage('¡Registro exitoso! Revisa tu correo para confirmar la cuenta (si es necesario) o inicia sesión.');
                setMode('signin');
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                // App.tsx will detect session change
            }
        } catch (err: any) {
            setError(err.message || 'Ha ocurrido un error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl border border-gray-700 p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Gestión de Ventas</h1>
                    <p className="text-gray-400">Ingresa para gestionar tus números</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 rounded-lg p-3 mb-4 text-sm">
                        {error}
                    </div>
                )}
                
                {message && (
                    <div className="bg-green-500/10 border border-green-500 text-green-500 rounded-lg p-3 mb-4 text-sm">
                        {message}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Correo Electrónico</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="tu@email.com"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Contraseña</label>
                        <input 
                            type="password" 
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="******"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-indigo-600 text-white p-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Procesando...' : (mode === 'signin' ? 'Iniciar Sesión' : 'Registrarse')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-400 text-sm">
                        {mode === 'signin' ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
                        <button 
                            onClick={() => {
                                setMode(mode === 'signin' ? 'signup' : 'signin');
                                setError('');
                                setMessage('');
                            }}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                        >
                            {mode === 'signin' ? "Regístrate" : "Inicia Sesión"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Auth;