import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    
    // Check for your specific credentials
    if (email === 'muyser@gmail.com' && password === '1234') {
      // Save mock session data
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userRole', 'admin'); // Grant admin access for the dashboard
      
      // Redirect to dashboard
      navigate('/dashboard');
    } else {
      setError('Invalid email or password. Use muyser@gmail.com / 1234');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <form onSubmit={handleLogin} className="p-8 bg-white rounded-xl shadow-md w-96 border border-slate-200">
        <h2 className="text-xl font-bold mb-6 text-slate-900">Local Frontend Login</h2>
        
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded border-slate-300 text-sm"
            placeholder="muyser@gmail.com"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded border-slate-300 text-sm"
            placeholder="1234"
            required
          />
        </div>
        
        <button type="submit" className="w-full bg-slate-900 text-white p-2 rounded text-sm font-medium hover:bg-slate-800">
          Sign In
        </button>
      </form>
    </div>
  );
}