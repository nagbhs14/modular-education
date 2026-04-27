import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { School, ArrowRight } from 'lucide-react';

const GlobalLanding = () => {
  const [tenants, setTenants] = useState([]);
  const [formData, setFormData] = useState({ name: '', subdomain: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Fetch global tenants list
    axios.get('http://localhost:3000/tenants')
      .then(res => setTenants(res.data))
      .catch(err => console.error("Ensure backend is running on 3000.", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:3000/tenants', formData);
      setMessage(`Success! Created ${res.data.name}. Redirecting...`);
      setTimeout(() => {
        window.location.href = `http://${res.data.subdomain}.localhost:${window.location.port || 5173}`;
      }, 1500);
    } catch(err) {
      setMessage(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl text-center mt-12 mb-16">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">EduCore OS Platform</h1>
        <p className="text-xl text-slate-400">Launch your own digital campus instantly.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 w-full max-w-5xl">
        {/* Create Store (Tenant) */}
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <School className="text-purple-400" /> Register Institution
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Institution Name</label>
              <input 
                type="text" required 
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-purple-500"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="E.g. XYZ College" 
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Subdomain</label>
              <input 
                type="text" required 
                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-lg focus:outline-none focus:border-purple-500"
                value={formData.subdomain} onChange={e => setFormData({...formData, subdomain: e.target.value})} 
                placeholder="xyzcollege" 
              />
              <p className="text-xs text-slate-500 mt-1">Will be hosted at {formData.subdomain || '...'}.localhost</p>
            </div>
            <button className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
              Launch Campus
            </button>
            {message && <p className="text-center mt-4 text-pink-400">{message}</p>}
          </form>
        </div>

        {/* List of active Tenants */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Active Institutions</h2>
          <div className="flex flex-col gap-4">
            {tenants.map(t => (
              <div key={t.id} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50 flex justify-between items-center hover:bg-slate-800 transition">
                <div>
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <a href={`http://${t.subdomain}.localhost:${window.location.port || 5173}`} className="text-purple-400 text-sm hover:underline">
                    {t.subdomain}.educore.os
                  </a>
                </div>
                <a href={`http://${t.subdomain}.localhost:${window.location.port || 5173}`} className="p-3 bg-slate-700 hover:bg-purple-600 rounded-full transition">
                  <ArrowRight size={20} />
                </a>
              </div>
            ))}
            {tenants.length === 0 && <p className="text-slate-500 italic">No institutions generated yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLanding;
