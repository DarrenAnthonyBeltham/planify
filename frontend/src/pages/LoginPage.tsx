import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/authContext';
import { User, Lock } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ email, password });
      window.location.hash = '#/';
    } catch {
      setError('Failed to log in. Please check your email and password.');
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-primary">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col items-start justify-center w-1/2 bg-gradient-to-br from-accent to-purple-600 text-white p-12">
        <h1 className="text-6xl font-bold mb-4">Welcome to Planify</h1>
        <p className="text-lg text-white/80 max-w-md">
          All your project management needs in one place. Sign in to continue your journey towards productivity.
        </p>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-2 text-primary">User Login</h2>
          <p className="text-secondary text-sm mb-8">Enter your credentials to access your account.</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-red-500 bg-red-500/10 p-3 rounded-md">{error}</p>}
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="w-full pl-12 pr-4 py-3 border border-secondary/20 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full pl-12 pr-4 py-3 border border-secondary/20 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-secondary">
                <input type="checkbox" className="h-4 w-4 rounded text-accent bg-background border-secondary/30 focus:ring-accent"/>
                Remember me
              </label>
              <a href="#" className="font-medium text-accent hover:underline">Forgot password?</a>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 text-base font-medium rounded-lg text-white bg-gradient-to-r from-accent to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>
          <p className="text-center mt-8 text-sm text-secondary">
            Don't have an account? <a href="#/register" className="font-semibold text-accent hover:underline">Register Now</a>
          </p>
        </div>
      </div>
    </div>
  );
}