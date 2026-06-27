import { useState, useEffect, useCallback } from "react";
import LoginBackground from "../assets/login-background.jpg";
import { IoIosLogIn } from "react-icons/io";
import { IoMailOutline } from "react-icons/io5";
import { TbLock } from "react-icons/tb";
import { MdError } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { authApi } from "../api/services/authApi";
import { tokenStorage } from "../api/tokenStorage";
import { useToast } from "../hooks/useToast";
import { ToastContainer } from "../components/common/ToastContainer";

interface CredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: CredentialResponse) => void;
}

interface GsiButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "signin" | "continue_with" | "signin_to";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
  locale?: string;
}

interface GoogleAccountsId {
  initialize(config: GoogleIdConfiguration): void;
  renderButton(element: HTMLElement | null, config: GsiButtonConfiguration): void;
}

interface GoogleAccounts {
  id: GoogleAccountsId;
}

interface Google {
  accounts: GoogleAccounts;
}

declare global {
  interface Window {
    google?: Google;
  }
}

function Login({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toasts, addToast, removeToast } = useToast();
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
      const msg = err instanceof Error ? err.message : "Login failed";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginResponse = useCallback(async (response: CredentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const data = await authApi.googleLogin({ token: response.credential });
      tokenStorage.save(data.accessToken, data.refreshToken);
      window.electron?.loginSuccess();
      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Google login failed";
      setError(msg);
      addToast(msg, "error");
    } finally {
      setLoading(false);
    }
  }, [onSuccess, addToast]);

  useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        const client_id = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
        window.google.accounts.id.initialize({
          client_id: client_id,
          callback: handleGoogleLoginResponse,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", width: 336, locale: "en" }
        );
      }
    };

    if (window.google) {
      initializeGoogle();
    } else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client?hl=en";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogle;
      document.head.appendChild(script);
    }
  }, [handleGoogleLoginResponse]);

  return (
    <div
      className="font-heading flex h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${LoginBackground})` }}
    >
      <div className="w-96 bg-white p-6 opacity-90 rounded-xl shadow-xl">
        <h1 className="mb-6 text-2xl text-gray-800 font-semibold font-mono text-center tracking-widest">
          LOGIN
        </h1>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <span className="flex-shrink-0"><MdError size={18} /></span>
            <span>{error}</span>
          </div>
        )}

        {/* EMAIL */}
        <div className="py-2">
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800 transition-all duration-200">
            <IoMailOutline className="text-gray-400 text-[16px] group-focus-within:text-purple-800 transition-colors" />
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
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800 transition-all duration-200">
            <TbLock className="text-gray-400 text-[16px] group-focus-within:text-purple-800 transition-colors" />
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


        {/* LOGIN BUTTON */}
        <div className="pt-6">
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

        {/* OR DIVIDER */}
        <div className="my-4 flex items-center justify-between">
          <span className="w-1/4 border-b border-gray-300"></span>
          <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">OR</span>
          <span className="w-1/4 border-b border-gray-300"></span>
        </div>

        {/* GOOGLE SIGN IN BUTTON */}
        <div className="flex justify-center">
          <div id="google-signin-btn" className="w-full flex justify-center"></div>
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default Login;