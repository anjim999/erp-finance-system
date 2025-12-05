import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUserCircle, FaSignOutAlt } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const [showLogout, setShowLogout] = useState(false);
  const dropdownRef = useRef(null);
  const timeoutRef = useRef(null);

  const active = (p) =>
    pathname === p || pathname.startsWith(p)
      ? "text-blue-600 font-semibold"
      : "text-gray-600";

  const handleLogout = () => {
    logout();
    setShowLogout(false);
    navigate("/login");
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowLogout(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowLogout(false), 200);
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowLogout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white/70 backdrop-blur-md shadow-sm fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between py-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <span className="font-extrabold text-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-transparent bg-clip-text tracking-wide">
            Devopod ERP
          </span>
        </Link>

        <div className="flex items-center gap-6 sm:gap-8 text-sm sm:text-base">
          {auth && (
            <>
              <Link className={`hover:text-blue-600 transition ${active("/")}`} to="/">
                Dashboard
              </Link>
              <Link
                className={`hover:text-blue-600 transition ${active("/finance")}`}
                to="/finance"
              >
                Finance
              </Link>
              <Link
                className={`hover:text-blue-600 transition ${active("/projects")}`}
                to="/projects"
              >
                Projects
              </Link>
              {auth.user?.role === "admin" && (
                <Link
                  className={`hover:text-blue-600 transition ${active("/admin")}`}
                  to="/admin/users"
                >
                  Admin
                </Link>
              )}
            </>
          )}

          {auth ? (
            <div
              className="relative"
              ref={dropdownRef}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setShowLogout((p) => !p)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <FaUserCircle className="text-3xl text-indigo-500 hover:text-indigo-600 transition" />
              </button>

              {showLogout && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-2xl border border-slate-100 z-50 animate-fade-in-down">
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between px-6 py-3.5 rounded-2xl font-extrabold text-base tracking-wider bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-white shadow-xl hover:from-indigo-700 hover:via-violet-700 hover:to-fuchsia-700 hover:-translate-y-1 active:translate-y-0 active:scale-[0.97] transition-all duration-300"
                    >
                      <span>Logout</span>
                      <FaSignOutAlt className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link className="text-blue-600 font-semibold" to="/login">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
