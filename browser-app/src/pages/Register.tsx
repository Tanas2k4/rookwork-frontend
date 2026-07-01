import { useState, useRef } from "react";
import LoginBackground from "../assets/login-background.jpg";
import { IoIosPersonAdd } from "react-icons/io";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  const [stage, setStage] = useState<"register" | "otp">("register");
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get("invitationId");

  const checkEmail = async (val: string) => {
    setEmailError("");
    if (!val) return;
    
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val)) {
      setEmailError("Only @gmail.com emails are accepted");
      return;
    }

    try {
      const exists = await authApi.checkEmail(val);
      if (exists) {
        setEmailError("This email is already registered");
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
      setError("Please resolve all errors before proceeding");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        profileName,
        email,
        password,
        invitationId: invitationId || undefined
      });
      setSuccess(data.message || "OTP sent! Please check your email.");
      setStage("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const numValue = value.replace(/\D/g, "");
    if (!numValue && value !== "") return;

    const newOtpValues = [...otpValues];
    if (numValue.length > 1) {
      const pastedDigits = numValue.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        if (pastedDigits[i]) {
          newOtpValues[i] = pastedDigits[i];
        }
      }
      setOtpValues(newOtpValues);
      const focusIndex = Math.min(pastedDigits.length, 5);
      inputRefs.current[focusIndex]?.focus();
      return;
    }

    newOtpValues[index] = numValue;
    setOtpValues(newOtpValues);

    if (numValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const newOtpValues = [...otpValues];
        newOtpValues[index - 1] = "";
        setOtpValues(newOtpValues);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtpValues = [...otpValues];
        newOtpValues[index] = "";
        setOtpValues(newOtpValues);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newOtpValues = [...otpValues];
    const digits = pastedData.split("");
    for (let i = 0; i < 6; i++) {
      newOtpValues[i] = digits[i] || "";
    }
    setOtpValues(newOtpValues);

    const focusIndex = Math.min(digits.length - 1, 5);
    if (focusIndex >= 0) {
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    setSuccess("");
    const finalOtp = otpValues.join("");
    if (finalOtp.length < 6) {
      setError("Please enter the 6-digit OTP code");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(email, finalOtp, invitationId || undefined);
      tokenStorage.save(data.accessToken, data.refreshToken);
      setSuccess("Verification successful!");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await authApi.resendOtp(email);
      setSuccess(res.message || "OTP code resent successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="font-heading flex h-screen items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${LoginBackground})` }}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
      <div className={`w-96 bg-white p-6 border-2 rounded-md border-gray-200 ${isShaking ? "animate-shake" : ""}`}>
        {stage === "register" ? (
          <>
            <h1 className="mb-4 text-2xl text-gray-800 font-semibold font-mono text-center tracking-widest">
              REGISTER
            </h1>

            {
              (() => {
                const isProfileNameError = error === "Please fill all fields" && !profileName;
                const isEmailError = !!emailError || (error === "Please fill all fields" && !email) || (error && error.toLowerCase().includes("email"));
                const isPasswordError = error === "Passwords do not match" || (error === "Please fill all fields" && !password) || (error && error.toLowerCase().includes("password"));
                const isConfirmError = error === "Passwords do not match" || (error === "Please fill all fields" && !confirm);

                return (
                  <>
                    {/* PROFILE NAME */}
                    <div className="py-2">
                      <div className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isProfileNameError 
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500" 
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}>
                        <LuUser className={`text-[16px] transition-colors ${isProfileNameError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`} />
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
                      <div className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isEmailError 
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500" 
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}>
                        <IoMailOutline className={`text-[16px] transition-colors ${isEmailError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`} />
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
                      <div className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isPasswordError 
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500" 
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}>
                        <TbLock className={`text-[16px] transition-colors ${isPasswordError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`} />
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
                      <div className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isConfirmError 
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500" 
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}>
                        <TbLock className={`text-[16px] transition-colors ${isConfirmError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`} />
                        <input
                          type="password"
                          className="w-full bg-transparent text-[14px] outline-none"
                          placeholder="confirm password"
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                        />
                      </div>
                    </div>
                  </>
                );
              })()
            }

            {/* BACK TO LOGIN */}
            <div className="mt-3 flex justify-center">
              <button
                onClick={() => navigate("/login")}
                className="text-purple-900 text-xs font-bold tracking-[4px] hover:text-purple-700"
              >
                BACK TO SIGN IN 
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
          </>
        ) : (
          <>
            <h1 className="mb-4 text-2xl text-gray-800 font-semibold font-mono text-center tracking-widest">
              VERIFY OTP
            </h1>
            <p className="text-xs text-gray-500 text-center mb-4 leading-normal">
              We have sent a 6-digit verification code to email <strong>{email}</strong>. Please check your inbox.
            </p>

            {/* OTP INPUTS */}
            <div className={`py-2 flex justify-center gap-2 ${isShaking ? "animate-shake" : ""}`}>
              {otpValues.map((value, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  className={`w-11 h-11 border rounded-lg text-center text-[18px] font-bold outline-none transition-all duration-200 ${
                    error 
                      ? "bg-red-50 border-red-300 text-red-600 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                      : "bg-gray-100 border-transparent text-gray-800 focus:border-purple-800 focus:bg-white focus:ring-1 focus:ring-purple-800"
                  }`}
                  value={value}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={handleOtpPaste}
                />
              ))}
            </div>

            {/* OTP OPTIONS */}
            <div className="mt-4 flex justify-center gap-4 text-xs font-bold">
              <button
                onClick={handleResendOtp}
                className="text-purple-900 hover:text-purple-700 disabled:opacity-50"
                disabled={loading}
              >
                RESEND CODE
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => {
                  setStage("register");
                  setError("");
                  setSuccess("");
                  setOtpValues(Array(6).fill(""));
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                BACK
              </button>
            </div>

            {/* ERROR / SUCCESS */}
            <div className="h-10 mt-2 flex items-center justify-center text-center">
              {error && <p className="text-xs text-red-500 leading-normal">{error}</p>}
              {!error && success && (
                <p className="text-xs text-green-600 leading-normal">{success}</p>
              )}
            </div>

            {/* VERIFY BUTTON */}
            <div className="pt-4">
              <button
                className="w-full flex items-center justify-center bg-purple-900 py-2.5 text-white text-xs font-bold tracking-[4px] rounded-lg hover:bg-purple-800 disabled:opacity-60"
                onClick={handleVerifyOtp}
                disabled={loading}
              >
                {loading ? "..." : "VERIFY"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Register;
