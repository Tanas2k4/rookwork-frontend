import { useState } from "react";
import LoginBackground from "../assets/login-background.jpg";
import { IoIosPersonAdd } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { LuUser } from "react-icons/lu";
import { IoMailOutline } from "react-icons/io5";
import { TbLock } from "react-icons/tb";
import { authApi } from "../api/services/authApi";
import { tokenStorage } from "../api/tokenStorage";

function Register() {
  const [profileName, setProfileName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkEmail = async (val: string) => {
    setEmailError("");
    if (!val) return;
    
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val)) {
      setEmailError("Chỉ chấp nhận email định dạng @gmail.com");
      return;
    }

    try {
      const exists = await authApi.checkEmail(val);
      if (exists) {
        setEmailError("Email này đã được đăng ký");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!profileName || !email || !password || !confirm) {
      setError("Please fill all fields");
      return;
    }
    if (emailError) {
      setError("Vui lòng sửa các lỗi trước khi tiếp tục");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({ profileName, email, password });
      tokenStorage.save(data.accessToken, data.refreshToken);
      setSuccess("Register success!");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="font-heading flex h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${LoginBackground})` }}
    >
      <div className="w-96 bg-white p-6 opacity-90">
        <h1 className="mb-4 text-2xl text-gray-800 font-semibold font-mono text-center tracking-widest">
          REGISTER
        </h1>

        {/* PROFILE NAME */}
        <div className="py-2">
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800 transition-all duration-200">
            <LuUser className="text-gray-400 text-[16px] group-focus-within:text-purple-800 transition-colors" />
            <input
              className="w-full bg-transparent text-[14px] outline-none"
              placeholder="display name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>
        </div>

        {/* EMAIL */}
        <div className="py-2">
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800 transition-all duration-200">
            <IoMailOutline className="text-gray-400 text-[16px] group-focus-within:text-purple-800 transition-colors" />
            <input
              className="w-full bg-transparent text-[14px] outline-none"
              placeholder="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError("");
              }}
              onBlur={(e) => checkEmail(e.target.value)}
            />
          </div>
          {emailError && <p className="text-xs text-red-500 mt-1 pl-1">{emailError}</p>}
        </div>

        {/* PASSWORD */}
        <div className="py-2">
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

        {/* CONFIRM PASSWORD */}
        <div className="py-2">
          <div className="group flex items-center gap-3 rounded-lg bg-gray-100 px-3 py-2.5 border border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800 transition-all duration-200">
            <TbLock className="text-gray-400 text-[16px] group-focus-within:text-purple-800 transition-colors" />
            <input
              type="password"
              className="w-full bg-transparent text-[14px] outline-none"
              placeholder="confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
        </div>

        {/* BACK TO LOGIN */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => navigate("/login")}
            className="text-purple-900 text-xs font-bold tracking-[4px] hover:text-purple-700"
          >
            BACK TO LOGIN
          </button>
        </div>

        {/* ERROR / SUCCESS */}
        <div className="h-5 mt-2 flex items-center justify-center">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!error && success && (
            <p className="text-sm text-green-600">{success}</p>
          )}
        </div>

        {/* REGISTER BUTTON */}
        <div className="pt-6">
          <button
            className="w-full flex items-center justify-center bg-purple-900 py-2.5 text-white text-xs tracking-[4px] rounded-lg hover:bg-purple-800 disabled:opacity-60"
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <span className="tracking-widest">...</span>
            ) : (
              <IoIosPersonAdd size={22} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;
