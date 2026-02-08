import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await register(email, password, name || undefined);
      // New users always go to onboarding
      navigate("/onboarding", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-bauhaus-white px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-bauhaus-red border-2 border-black bauhaus-shadow flex items-center justify-center text-white font-black text-2xl mx-auto mb-4">
            L
          </div>
          <h1 className="font-black text-3xl tracking-tight">
            Lingo<span className="text-bauhaus-blue">Loop</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Start your language journey
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-2 border-red-300 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
              Name
              <span className="text-zinc-300 ml-1 normal-case tracking-normal">
                (optional)
              </span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bauhaus-blue focus:border-bauhaus-blue transition-colors"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bauhaus-blue focus:border-bauhaus-blue transition-colors"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border-2 border-black bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-bauhaus-blue focus:border-bauhaus-blue transition-colors"
              placeholder="••••••••"
            />
            <p className="text-xs text-zinc-400 mt-1">At least 6 characters</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 border-2 border-black font-bold text-sm uppercase tracking-wider transition-all ${
              loading
                ? "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                : "bg-bauhaus-red text-white bauhaus-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0px_var(--bauhaus-black)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_var(--bauhaus-black)]"
            }`}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-zinc-500 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-bauhaus-blue hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

