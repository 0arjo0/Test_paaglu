
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { IconShield, IconSamLogo } from './ui/Icons';
import { loginUser } from '../services/openApiService';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginUser(username, password);
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFD] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 border border-slate-100 relative overflow-hidden">
         
         <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-600 to-indigo-600"></div>
         
         <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 mb-4">
                <IconSamLogo size={36} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SAM-AI</h1>
            <p className="text-slate-500 text-sm mt-2">Where Business Meets Intelligence</p>
         </div>

         <form onSubmit={handleSubmit} className="space-y-6">
            <Input 
                label="Username" 
                placeholder="Enter username" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <Input 
                label="Password" 
                type="password"
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                    <IconShield size={16} /> {error}
                </div>
            )}

            <Button className="w-full h-11" isLoading={loading} disabled={!username || !password}>
                Sign In
            </Button>
         </form>

         {/* <div className="mt-8 text-center text-xs text-slate-400">
            <p>Default Login: <b>admin</b> / <b>password123</b></p>
         </div> */}
      </div>
    </div>
  );
};