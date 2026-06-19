import { useState } from "react";
import LoginBackground from "../assets/login-background.jpg";
import { IoIosLogIn } from "react-icons/io";
import { IoMailOutline } from "react-icons/io5";
import { TbLock } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/services/authApi";
import { tokenStorage } from "../api/tokenStorage";

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      tokenStorage.save(data.accessToken, data.refreshToken);
      window.electron?.loginSuccess();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="font-heading flex h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${LoginBackground})` }}
    >
      <div className="w-96 h-100 bg-white p-6 opacity-90">
        <h1 className="mb-6 text-2xl text-gray-800 font-semibold font-mono text-center tracking-widest">
          LOGIN
        </h1>

        {/* EMAIL */}
        <div className="py-2">
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all duration-200">
            <IoMailOutline className="text-gray-400 text-[16px] group-focus-within:text-purple-600 transition-colors" />
            <input
              className="w-full bg-transparent text-[14px] outline-none"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="pt-5">
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-600 focus-within:ring-1 focus-within:ring-purple-600 transition-all duration-200">
            <TbLock className="text-gray-400 text-[16px] group-focus-within:text-purple-600 transition-colors" />
            <input
              type="password"
              className="w-full bg-transparent text-[14px] outline-none"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {/* REGISTER */}
        <div className="mt-4 flex items-center justify-center">
          <button
            onClick={() => navigate("/register")}
            className="text-purple-900 text-xs font-bold tracking-[4px] hover:text-purple-700"
          >
            REGISTER
          </button>
        </div>

        {/* ERROR */}
        <div className="h-5 mt-2 flex items-center justify-center">
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* LOGIN BUTTON */}
        <div className="pt-14">
          <button
            className="w-full flex items-center justify-center bg-purple-900 py-2.5 text-white rounded-lg hover:bg-purple-800 disabled:opacity-60"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <span className="text-xs tracking-widest">...</span>
            ) : (
              <IoIosLogIn size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;