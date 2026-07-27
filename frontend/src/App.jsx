import { useState, useEffect } from 'react';

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  // check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
      setPage('dashboard');
    }
  }, []);

  const handleSignup = async () => {
    const res = await fetch('http://localhost:5000/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    alert(data.message);
    if (res.ok) setPage('login');
  };

  const handleLogin = async () => {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.email, password: form.password })
    });
    const data = await res.json();
    
    if (res.ok) {
      // SAVE BOTH TOKENS
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setPage('dashboard');
    } else {
      alert(data.message);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setPage('login');
  };

  if (page === 'dashboard') {
    return (
      <div style={{ padding: 20 }}>
        <h1>Welcome to Dashboard</h1>
        <p><b>Name:</b> {user?.name}</p>
        <p><b>Email:</b> {user?.email}</p>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>{page === 'signup' ? 'Signup' : 'Login'}</h1>
      {page === 'signup' && (
        <input 
          placeholder="Name" 
          onChange={e => setForm({...form, name: e.target.value})} 
          style={{ display: 'block', margin: 10 }}
        />
      )}
      <input 
        placeholder="Email" 
        value={form.email}
        onChange={e => setForm({...form, email: e.target.value})} 
        style={{ display: 'block', margin: 10 }}
      />
      <input 
        placeholder="Password" 
        type="password"
        onChange={e => setForm({...form, password: e.target.value})} 
        style={{ display: 'block', margin: 10 }}
      />
      
      {page === 'signup' ? (
        <button onClick={handleSignup}>Signup</button>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
      
      <p>
        {page === 'signup' ? 'Already have account? ' : "Don't have account? "}
        <button onClick={() => setPage(page === 'signup' ? 'login' : 'signup')}>
          {page === 'signup' ? 'Login' : 'Signup'}
        </button>
      </p>
    </div>
  );
}