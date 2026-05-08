import { useContext, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { useTheme } from "../context/themeContext";

const readerLinks = [
  { label: "Home", path: "/", category: "" },
  { label: "Tech", path: "/?category=technology", category: "technology" },
  { label: "Design", path: "/?category=design", category: "design" },
  { label: "Career", path: "/?category=career", category: "career" },
];

const adminLinks = [
  { label: "Dashboard", path: "/admin" },
  { label: "Posts", path: "/admin#posts" },
  { label: "Comments", path: "/admin#comments" },
  { label: "Media", path: "/admin#media" },
];

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeCategory = new URLSearchParams(location.search).get("category") || "";
  const isAdmin = user?.role === "admin";
  const visibleLinks = user ? (isAdmin ? adminLinks : readerLinks) : [];

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileOpen(false);
  };

  const isActive = (link) => {
    if (link.category !== undefined) {
      return (
        location.pathname === "/" &&
        ((link.category === "" && !activeCategory) || activeCategory === link.category)
      );
    }
    return location.pathname === link.path;
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--surface))]/95 backdrop-blur">
      <div className="section-shell">
        <div className="flex h-16 items-center justify-between gap-3">
          <Link to={user ? "/" : "/login"} className="flex items-center gap-2 text-lg font-extrabold no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[rgb(var(--accent))] text-base font-extrabold text-white">
              M
            </span>
            <span className="font-extrabold text-[rgb(var(--text))]">
              Me<span className="text-[rgb(var(--accent))]">Blog</span>
            </span>
          </Link>

          {user && (
            <div className="hidden flex-1 justify-center px-4 lg:flex">
              <div className="flex items-center gap-1 rounded-md bg-[rgb(var(--surface-2))] p-1">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.label}
                    to={link.path}
                    className={`rounded-md px-3 py-2 text-sm font-bold no-underline transition-colors ${
                      isActive(link)
                        ? "bg-[rgb(var(--surface))] text-[rgb(var(--accent))] shadow-sm"
                        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={toggle}
              className="social-icon-btn"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? "L" : "D"}
            </button>

            {user ? (
              <>
                <div className="flex items-center gap-2 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--surface-2))] px-2 py-1.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[rgb(var(--accent))] text-xs font-extrabold text-white">
                    {user.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-[rgb(var(--text))]">{user.name}</p>
                    <p className="text-[11px] app-muted">{user.role}</p>
                  </div>
                </div>

                {isAdmin && (
                  <Link to="/admin" className="app-btn-primary px-4 py-2 text-sm no-underline">
                    Admin
                  </Link>
                )}

                <button onClick={handleLogout} className="app-btn-secondary px-4 py-2 text-sm">
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="app-btn-primary px-4 py-2 text-sm no-underline">
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="social-icon-btn md:hidden"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? "X" : "="}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[rgb(var(--border))] bg-[rgb(var(--surface))] md:hidden">
          <div className="section-shell py-3">
            <div className="flex flex-col gap-2">
              {visibleLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.path}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-bold no-underline ${
                    isActive(link)
                      ? "bg-[rgb(var(--accent))] text-white"
                      : "bg-[rgb(var(--surface-2))] text-[rgb(var(--muted))]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <button onClick={toggle} className="app-btn-secondary text-left">
                {dark ? "Light mode" : "Dark mode"}
              </button>

              {user ? (
                <button onClick={handleLogout} className="app-btn-secondary text-left">
                  Logout
                </button>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)} className="app-btn-primary text-center no-underline">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
