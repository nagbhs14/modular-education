import React, { useState, useContext } from 'react';
import axios from 'axios';
import { TenantContext, AuthContext } from '../App';
import { GraduationCap } from 'lucide-react';

const TenantPortal = () => {
  const tenant = useContext(TenantContext);
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { username, password });
      login(res.data.token);
    } catch(err) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between">
      {/* Dynamic Header */}
      <nav className="bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {tenant.logo_url ? (
              <img src={`http://localhost:3000${tenant.logo_url}`} alt="Logo" className="w-10 h-10 rounded-full" />
            ) : (
              <GraduationCap className="w-8 h-8 text-purple-400" />
            )}
            <h1 className="text-2xl font-bold text-slate-100">{tenant.name || 'Institution Portal'}</h1>
          </div>
          <div className="text-slate-400 text-sm">
            Powered by EduCore OS
          </div>
        </div>
      </nav>

      <main className="flex-grow flex items-center justify-center p-8">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
          
          {/* About Section */}
          <div className="order-2 md:order-1">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Welcome to our Campus</h2>
            <div className="prose prose-invert">
              <h3 className="text-xl text-slate-200">About Us</h3>
              <p className="text-slate-400 whitespace-pre-line">
                {tenant.about_us || "We are a premier institution focused on excellence. Contact the admin to configure this page."}
              </p>
              
              <h3 className="text-xl text-slate-200 mt-6">Tuition & Fees</h3>
              <p className="text-slate-400 whitespace-pre-line">
                {tenant.fees_structure || "Fee structure not published yet."}
              </p>
            </div>
          </div>

          {/* Login Panel */}
          <div className="order-1 md:order-2 bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">Portal Login</h2>
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Username</label>
                <input 
                  type="text" required 
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-purple-500"
                  value={username} onChange={e => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input 
                  type="password" required 
                  className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-purple-500"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
              <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                Login
              </button>
              {error && <p className="text-center mt-4 text-pink-400">{error}</p>}
            </form>
          </div>

        </div>
      </main>
      
      <footer className="text-center p-4 text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} {tenant.name}. Hosted on EduCore OS Platform.
      </footer>
    </div>
  );
};

export default TenantPortal;
