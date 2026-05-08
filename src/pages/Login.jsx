import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import api from "../api/axios";

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({ name: "", email: "", password: "", confirm: "" });

  const handleLogin = async () => {
    setError("");
    const email = loginForm.email.trim().toLowerCase();
    const password = loginForm.password;

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password, rememberMe });
      login(data.user, data.token, rememberMe);
      navigate(data.user.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setError("");
    const name = signupForm.name.trim();
    const email = signupForm.email.trim().toLowerCase();
    const password = signupForm.password;
    const confirm = signupForm.confirm;

    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      login(data.user, data.token);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="app-page px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-6 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-md bg-[rgb(var(--accent))] text-xl font-extrabold text-white">M</span>
            <p className="text-3xl font-extrabold text-[rgb(var(--text))]">MeBlog</p>
          </div>
          <h1 className="max-w-xl text-5xl font-extrabold leading-tight text-[rgb(var(--text))]">
            Your private publishing community.
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 app-muted">
            Sign in to browse the feed, follow topics, comment on posts, and manage your writing workspace.
          </p>
          <div className="mt-6 grid max-w-lg grid-cols-3 gap-3">
            {["Feed", "Groups", "Media"].map((item) => (
              <div key={item} className="app-card p-4">
                <p className="text-2xl font-extrabold text-[rgb(var(--accent))]">{item.slice(0, 1)}</p>
                <p className="mt-2 text-sm font-bold text-[rgb(var(--text))]">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="app-card w-full p-6 sm:p-8">
          <div className="mb-6">
            <p className="app-chip mb-3">MeBlog CMS</p>
            <h1 className="text-3xl font-extrabold tracking-normal text-[rgb(var(--text))]">Welcome back</h1>
            <p className="mt-1 text-sm app-muted">Login or create your account to continue.</p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-md bg-[rgb(var(--surface-2))] p-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab("login");
                setError("");
              }}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === "login" ? "bg-[rgb(var(--surface))] text-[rgb(var(--accent))] shadow-sm" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("signup");
                setError("");
              }}
              className={`rounded-md px-4 py-2 text-sm font-bold transition-colors ${
                activeTab === "signup" ? "bg-[rgb(var(--surface))] text-[rgb(var(--accent))] shadow-sm" : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          {activeTab === "login" ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase app-muted">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="app-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase app-muted">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    placeholder="Password"
                    className="app-field pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-3 py-1 text-xs font-bold app-muted hover:bg-[rgb(var(--surface-2))] hover:text-[rgb(var(--text))]"
                  >
                    {showPass ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm app-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-[rgb(var(--border))] bg-transparent"
                />
                Remember me
              </label>

              <button
                onClick={handleLogin}
                disabled={loading}
                className={`w-full rounded-md px-4 py-3 text-sm font-bold transition-colors ${
                  loading ? "cursor-not-allowed bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]" : "app-btn-primary"
                }`}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase app-muted">Full name</label>
                <input
                  type="text"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="Ali Khan"
                  className="app-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase app-muted">Email</label>
                <input
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="you@example.com"
                  className="app-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase app-muted">Password</label>
                <input
                  type={showPass ? "text" : "password"}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="app-field"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase app-muted">Confirm password</label>
                <input
                  type="password"
                  value={signupForm.confirm}
                  onChange={(e) => setSignupForm({ ...signupForm, confirm: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleSignup()}
                  placeholder="Confirm password"
                  className="app-field"
                />
              </div>

              <button
                onClick={handleSignup}
                disabled={loading}
                className={`w-full rounded-md px-4 py-3 text-sm font-bold transition-colors ${
                  loading ? "cursor-not-allowed bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]" : "app-btn-primary"
                }`}
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
