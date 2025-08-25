import { useState, type FormEvent } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { registerUser } from '../api';

export function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    setIsLoading(true);
    try {
      const result = await registerUser({ name, email, password });
      setSuccess(result.message || 'Registration successful! You can now log in.');
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-primary">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col items-start justify-center w-1/2 bg-gradient-to-br from-accent to-purple-600 text-white p-12">
        <h1 className="text-6xl font-bold mb-4">Join Planify Today</h1>
        <p className="text-lg text-white/80 max-w-md">
          Start organizing your projects and collaborating with your team seamlessly. Create an account to get started.
        </p>
      </div>

      {/* Right Panel (Form) */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-surface">
        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold mb-2 text-primary">Create an Account</h2>
          <p className="text-secondary text-sm mb-8">Fill in your details to register.</p>
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && <p className="text-center text-red-500 bg-red-500/10 p-3 rounded-md">{error}</p>}
            {success && <p className="text-center text-green-500 bg-green-500/10 p-3 rounded-md">{success}</p>}
            
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input name="name" type="text" required className="w-full pl-12 pr-4 py-3 border border-secondary/20 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input name="email" type="email" required className="w-full pl-12 pr-4 py-3 border border-secondary/20 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" size={20} />
              <input name="password" type="password" required className="w-full pl-12 pr-4 py-3 border border-secondary/20 bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-accent transition-all" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            
            <div>
              <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 text-base font-medium rounded-lg text-white bg-gradient-to-r from-accent to-purple-600 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                {isLoading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
          </form>
           <p className="text-center mt-8 text-sm text-secondary">
            Already have an account? <a href="#/login" className="font-semibold text-accent hover:underline">Login Here</a>
          </p>
        </div>
      </div>
    </div>
  );
}