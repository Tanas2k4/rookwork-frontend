import { useState, useEffect } from "react";
import LoginBackground from "../assets/login-background.jpg";
import {
  UserPlusIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { authApi } from "../api/services/authApi";
import { tokenStorage } from "../api/tokenStorage";
import { OtpInput } from "../components/common/OtpInput";
import { TERMS_OF_SERVICE } from "../constants/termsOfService";
import { PRIVACY_POLICY } from "../constants/privacyPolicy";

function Register({ onSuccess }: { onSuccess?: () => void }) {
  const [profileName, setProfileName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [modalType, setModalType] = useState<"terms" | "privacy" | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"register" | "otp">("register");
  const [otp, setOtp] = useState("");
  const [isShaking, setIsShaking] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const invitationId = searchParams.get("invitationId");

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const stageParam = searchParams.get("stage");

    if (emailParam) {
      setEmail(emailParam);
    }
    if (stageParam === "otp") {
      setStage("otp");
    } else {
      const state = location.state as {
        email?: string;
        stage?: "register" | "otp";
        message?: string;
      } | null;
      if (state?.email) {
        setEmail(state.email);
      }
      if (state?.stage) {
        setStage(state.stage);
      }
      if (state?.message) {
        setSuccess(state.message);
      }
    }
  }, [location, searchParams]);

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
    if (!agreeTerms) {
      setError("You must agree to the Terms of Service and Privacy Policy");
      return;
    }

    setLoading(true);
    try {
      const data = await authApi.register({
        profileName,
        email,
        password,
        invitationId: invitationId || undefined,
      });
      setSuccess(data.message || "OTP sent! Please check your email.");
      setStage("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val: string) => {
    setOtp(val);
    if (val.length === 6) {
      handleVerifyOtp(val);
    }
  };

  const handleVerifyOtp = async (code?: string) => {
    setError("");
    setSuccess("");
    const otpCode = typeof code === "string" ? code : otp;
    if (otpCode.length < 6) {
      setError("Please enter the 6-digit OTP code");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.verifyOtp(
        email,
        otpCode,
        invitationId || undefined,
      );
      tokenStorage.save(data.accessToken, data.refreshToken);
      setSuccess("Verification successful!");
      window.electron?.loginSuccess();
      if (onSuccess) {
        onSuccess();
      }
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
      <div
        className={`w-96 bg-white p-6 border-2 rounded-md border-gray-200 ${isShaking ? "animate-shake" : ""}`}
      >
        {stage === "register" ? (
          <>
            <h1 className="mb-4 text-2xl text-gray-800 font-semibold font-mono text-center tracking-widest">
              REGISTER
            </h1>

            {(() => {
              const isProfileNameError =
                error === "Please fill all fields" && !profileName;
              const isEmailError =
                !!emailError ||
                (error === "Please fill all fields" && !email) ||
                (error && error.toLowerCase().includes("email"));
              const isPasswordError =
                error === "Passwords do not match" ||
                (error === "Please fill all fields" && !password) ||
                (error && error.toLowerCase().includes("password"));
              const isConfirmError =
                error === "Passwords do not match" ||
                (error === "Please fill all fields" && !confirm);

              return (
                <>
                  {/* PROFILE NAME */}
                  <div className="py-2">
                    <div
                      className={`group flex items-center gap-3 rounded-md px-3 py-2.5 border transition-all duration-200 ${
                        isProfileNameError
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}
                    >
                      <UserIcon
                        className={`text-[16px] w-4.5 h-4.5 transition-colors ${isProfileNameError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`}
                      />
                      <input
                        className="w-full bg-transparent text-[14px] outline-none"
                        placeholder="display name"
                        value={profileName}
                        maxLength={50}
                        onChange={(e) => setProfileName(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="py-2">
                    <div
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isEmailError
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}
                    >
                      <EnvelopeIcon
                        className={`text-[16px] w-4.5 h-4.5 transition-colors ${isEmailError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`}
                      />
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
                    {emailError && (
                      <p className="text-xs text-red-500 mt-1 pl-1">
                        {emailError}
                      </p>
                    )}
                  </div>

                  {/* PASSWORD */}
                  <div className="py-2">
                    <div
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isPasswordError
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}
                    >
                      <LockClosedIcon
                        className={`text-[16px] w-4.5 h-4.5 transition-colors ${isPasswordError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`}
                      />
                      <input
                        type="password"
                        className="w-full bg-transparent text-[14px] outline-none"
                        placeholder="password"
                        value={password}
                        maxLength={128}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="py-2">
                    <div
                      className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all duration-200 ${
                        isConfirmError
                          ? "bg-red-50 border-red-300 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-500"
                          : "bg-gray-100 border-transparent focus-within:border-purple-800 focus-within:ring-1 focus-within:ring-purple-800"
                      }`}
                    >
                      <LockClosedIcon
                        className={`text-[16px] w-4.5 h-4.5 transition-colors ${isConfirmError ? "text-red-500" : "text-gray-400 group-focus-within:text-purple-800"}`}
                      />
                      <input
                        type="password"
                        className="w-full bg-transparent text-[14px] outline-none"
                        placeholder="confirm password"
                        value={confirm}
                        maxLength={128}
                        onChange={(e) => setConfirm(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* TERMS & PRIVACY CHECKBOX */}
                  <div className="py-1.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="agreeTerms"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="accent-purple-900 cursor-pointer w-4 h-4 rounded border-gray-300 text-purple-900 focus:ring-purple-800 shrink-0"
                    />
                    <label
                      htmlFor="agreeTerms"
                      className="text-[12px] text-gray-500 select-none cursor-pointer flex items-center flex-wrap gap-x-1"
                    >
                      <span>I agree to the</span>
                      <button
                        type="button"
                        onClick={() => setModalType("terms")}
                        className="text-purple-900 font-bold underline hover:text-purple-750 focus:outline-none"
                      >
                        Terms of Service
                      </button>
                      <span>and</span>
                      <button
                        type="button"
                        onClick={() => setModalType("privacy")}
                        className="text-purple-900 font-bold underline hover:text-purple-750 focus:outline-none"
                      >
                        Privacy Policy
                      </button>
                    </label>
                  </div>
                </>
              );
            })()}

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
                  <UserPlusIcon className="w-5.5 h-5.5" />
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
              We have sent a 6-digit verification code to email{" "}
              <strong>{email}</strong>. Please check your inbox.
            </p>

            {/* OTP INPUT */}
            <div
              className={`py-2 flex justify-center ${isShaking ? "animate-shake" : ""}`}
            >
              <OtpInput
                value={otp}
                onChange={handleOtpChange}
                disabled={loading}
                error={!!error}
              />
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
                  setOtp("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                BACK
              </button>
            </div>

            {/* ERROR / SUCCESS */}
            <div className="h-10 mt-2 flex items-center justify-center text-center">
              {error && (
                <p className="text-xs text-red-500 leading-normal">{error}</p>
              )}
              {!error && success && (
                <p className="text-xs text-green-600 leading-normal">
                  {success}
                </p>
              )}
            </div>

            {/* VERIFY BUTTON */}
            <div className="pt-4">
              <button
                className="w-full flex items-center justify-center bg-purple-900 py-2.5 text-white text-xs font-bold tracking-[4px] rounded-lg hover:bg-purple-800 disabled:opacity-60"
                onClick={() => handleVerifyOtp()}
                disabled={loading}
              >
                {loading ? "..." : "VERIFY"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* LEGAL MODAL */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-white rounded-md shadow-xl border border-gray-100 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b  border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                {modalType === "terms"
                  ? TERMS_OF_SERVICE.title
                  : PRIVACY_POLICY.title}
              </h2>
              <button
                onClick={() => setModalType(null)}
                className="text-gray-400 hover:text-gray-600 transition text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-gray-600 leading-relaxed font-sans">
              <p className="font-semibold text-gray-700 text-xs italic">
                {modalType === "terms"
                  ? TERMS_OF_SERVICE.lastUpdated
                  : PRIVACY_POLICY.lastUpdated}
              </p>
              <p className="text-gray-700 font-medium">
                {modalType === "terms"
                  ? TERMS_OF_SERVICE.intro
                  : PRIVACY_POLICY.intro}
              </p>

              {(modalType === "terms"
                ? TERMS_OF_SERVICE.sections
                : PRIVACY_POLICY.sections
              ).map((sec, idx) => (
                <div key={idx} className="space-y-2 mt-4">
                  <h3 className="font-bold text-gray-800 text-base border-b border-gray-100 pb-1">
                    {sec.heading}
                  </h3>
                  {sec.content && (
                    <p className="whitespace-pre-line">{sec.content}</p>
                  )}
                  {sec.intro && <p>{sec.intro}</p>}
                  {sec.bullets && (
                    <ul className="list-disc pl-5 space-y-1.5 mt-1">
                      {sec.bullets.map((bullet, bIdx) => (
                        <li key={bIdx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                  {sec.extra && (
                    <p className="whitespace-pre-line text-xs text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      {sec.extra}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setAgreeTerms(true);
                  setModalType(null);
                }}
                className="bg-purple-900 text-gray-200 text-sm px-5 py-1.5 rounded-md hover:bg-purple-800 transition"
              >
                Agree & Close
              </button>
              <button
                onClick={() => setModalType(null)}
                className="bg-white border border-gray-500 text-gray-600 text-sm  px-5 py-1.5 rounded-md hover:bg-gray-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;
