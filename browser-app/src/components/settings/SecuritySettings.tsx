import { useState, useMemo, useEffect } from "react";
import { FiCheck, FiX } from "react-icons/fi";
import { userApi } from "../../api/services/userApi";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../common/ToastContainer";
import { FaCheckCircle } from "react-icons/fa";
import { AiFillCloseCircle } from "react-icons/ai";
import type { UserSummary } from "../../api/contracts/issue";

interface SecuritySettingsProps {
  user: UserSummary | null;
}

export default function SecuritySettings({ user }: SecuritySettingsProps) {
  const { toasts, addToast, removeToast } = useToast();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // OTP Cooldown management
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const hasPassword = !!user?.hasPassword;

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => {
      setOtpCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  const passwordChecks = useMemo(() => [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "One digit (0-9)", met: /\d/.test(newPassword) },
    { label: "One special character (!@#$...)", met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword) },
  ], [newPassword]);

  const passedCount = passwordChecks.filter((c) => c.met).length;
  const allPassed = passedCount === passwordChecks.length;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  
  // Submit permission logic
  const canSubmit = allPassed && passwordsMatch && (!hasPassword || otp.length === 6) && !user?.passwordLimitReached;

  const strengthLabel = passedCount <= 1 ? "Very weak" : passedCount === 2 ? "Weak" : passedCount === 3 ? "Fair" : passedCount === 4 ? "Strong" : "Very strong";
  const strengthColor = passedCount <= 1 ? "bg-red-500" : passedCount === 2 ? "bg-orange-500" : passedCount === 3 ? "bg-yellow-500" : passedCount === 4 ? "bg-blue-500" : "bg-green-500";
  const strengthTextColor = passedCount <= 1 ? "text-red-600" : passedCount === 2 ? "text-orange-600" : passedCount === 3 ? "text-yellow-600" : passedCount === 4 ? "text-blue-600" : "text-green-600";

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    try {
      await userApi.requestPasswordOtp();
      addToast("Verification OTP code sent to your email.", "success");
      setOtpCooldown(60);
    } catch (err: any) {
      const errorMessage = err?.message || "Failed to send OTP.";
      addToast(errorMessage, "error");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      addToast("Account deleted successfully.", "success");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err: any) {
      const errorMessage = err?.message || "Incorrect password or an error occurred.";
      addToast(errorMessage, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await userApi.updatePassword({ 
        newPassword, 
        otp: hasPassword ? otp : undefined 
      });
      addToast(
        hasPassword 
          ? "Password updated successfully! Logging out in 2 seconds..." 
          : "Password set successfully! Logging out in 2 seconds...", 
        "success"
      );
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      
      setTimeout(() => {
        localStorage.clear();
        window.location.href = "/login";
      }, 2000);

    } catch (err: any) {
      const errorMessage = err?.message || "Failed to update password.";
      addToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Account & Security</h2>
      
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {hasPassword ? "Change Password" : "Set Password"}
        </h3>
        
        {user?.passwordLimitReached ? (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs font-semibold">
            You have reached the password change limit of 2 times this month. (Changes: 2/2). Please try again next month.
          </div>
        ) : (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-md text-blue-800 text-xs font-semibold">
            Note: You can change your password up to 2 times per month. (You have changed it {user?.passwordChangesThisMonth ?? 0}/2 times this month). Changing password will sign you out of all sessions.
          </div>
        )}

        <div className="space-y-4">
          {hasPassword && (
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-2">OTP Verification Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  disabled={!!user?.passwordLimitReached}
                  className="flex-1 px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100 disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isSendingOtp || otpCooldown > 0 || !!user?.passwordLimitReached}
                  className="px-4 py-1.5 bg-purple-100 text-purple-700 text-sm font-semibold rounded-md hover:bg-purple-200 disabled:opacity-50 disabled:bg-purple-50 disabled:text-purple-400 transition-colors shrink-0"
                >
                  {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : isSendingOtp ? "Sending..." : "Send OTP"}
                </button>
              </div>
            </div>
          )}
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">
              {hasPassword ? "New Password" : "Password"}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={!!user?.passwordLimitReached}
              className="w-full px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100 disabled:bg-gray-100 disabled:border-gray-300"
              required
            />

            {/* Strength bar */}
            {newPassword.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                   <span className="text-xs font-medium text-gray-500">Password strength</span>
                  <span className={`text-xs font-semibold ${strengthTextColor}`}>{strengthLabel}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${strengthColor}`}
                    style={{ width: `${(passedCount / passwordChecks.length) * 100}%` }}
                  />
                </div>

                {/* Requirements checklist */}
                <ul className="mt-3 space-y-1">
                  {passwordChecks.map((check) => (
                    <li key={check.label} className="flex items-center gap-2 text-xs">
                      {check.met
                        ? <FaCheckCircle className="text-green-700 shrink-0" size={14} />
                        : <AiFillCloseCircle   className="text-red-600 shrink-0" size={15} />
                      }
                      <span className={check.met ? "text-green-700" : "text-gray-500"}>{check.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={!!user?.passwordLimitReached}
              className="w-full px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100 disabled:bg-gray-100 disabled:border-gray-300"
              required
            />
            {confirmPassword.length > 0 && !passwordsMatch && (
              <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                <FiX size={12} /> Passwords do not match
              </p>
            )}
            {passwordsMatch && (
              <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                <FiCheck size={12} /> Passwords match
              </p>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving || !canSubmit || !!user?.passwordLimitReached}
            className="px-3 py-1.5 bg-purple-900 text-white text-sm rounded-md hover:bg-purple-800 disabled:opacity-50 transition-colors"
          >
            {hasPassword ? "Update" : "Set Password"}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded-xl ">
        <p className="text-xs text-red-600 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-3 py-1.5 border border-red-200 rounded-sm  text-sm font-medium text-white bg-red-700 hover:bg-red-800 transition disabled:opacity-50"
        >
          Delete Account
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-md w-full max-w-md p-6">
            <h3 className="text-md font-bold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-xs text-gray-500 mb-6">
              This action cannot be undone. To verify, type your password below.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <input
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full text-sm px-4 py-2 border border-gray-300 rounded-md mb-6 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-500"
                required
              />
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-1.5  border border-gray-500 rounded-md text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="flex-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-md transition text-sm disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
