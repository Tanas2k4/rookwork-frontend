import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiCheck, FiX } from "react-icons/fi";
import { userApi } from "../../api/services/userApi";

export default function SecuritySettings() {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const passwordChecks = useMemo(() => [
    { label: "At least 8 characters", met: newPassword.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(newPassword) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(newPassword) },
    { label: "One digit (0-9)", met: /\d/.test(newPassword) },
    { label: "One special character (!@#$...)", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(newPassword) },
  ], [newPassword]);

  const passedCount = passwordChecks.filter((c) => c.met).length;
  const allPassed = passedCount === passwordChecks.length;
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;
  const canSubmit = allPassed && passwordsMatch && currentPassword.length > 0;

  const strengthLabel = passedCount <= 1 ? "Very weak" : passedCount === 2 ? "Weak" : passedCount === 3 ? "Fair" : passedCount === 4 ? "Strong" : "Very strong";
  const strengthColor = passedCount <= 1 ? "bg-red-500" : passedCount === 2 ? "bg-orange-500" : passedCount === 3 ? "bg-yellow-500" : passedCount === 4 ? "bg-blue-500" : "bg-green-500";
  const strengthTextColor = passedCount <= 1 ? "text-red-600" : passedCount === 2 ? "text-orange-600" : passedCount === 3 ? "text-yellow-600" : passedCount === 4 ? "text-blue-600" : "text-green-600";

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsDeleting(true);
    try {
      await userApi.deleteAccount(deletePassword);
      alert(t('security.delete_success') || "Account deleted successfully.");
      localStorage.clear();
      window.location.href = "/login";
    } catch (err: any) {
      alert(err.message || t('security.delete_error') || "Incorrect password or an error occurred.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSaving(true);
    try {
      await userApi.updatePassword({ currentPassword, newPassword });
      alert(t('security.success'));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      alert(t('security.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{t('security.title')}</h2>
      
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">{t('security.change_password')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('security.current_password')}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('security.new_password')}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                        ? <FiCheck className="text-green-500 shrink-0" size={14} />
                        : <FiX className="text-red-400 shrink-0" size={14} />
                      }
                      <span className={check.met ? "text-green-700" : "text-gray-500"}>{check.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('security.confirm_password')}</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            disabled={isSaving || !canSubmit}
            className="px-3 py-1.5 bg-purple-900 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('security.saving') : t('security.save')}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
        <h3 className="text-lg font-medium text-red-800 mb-2">{t('security.danger_zone')}</h3>
        <p className="text-sm text-red-600 mb-4">
          {t('security.danger_hint')}
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg shadow-sm text-sm font-medium text-red-600 hover:bg-red-100 transition disabled:opacity-50"
        >
          {t('security.delete_account')}
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Account</h3>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. To verify, type your password below.
            </p>
            <form onSubmit={handleDeleteAccount}>
              <input
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition text-sm font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeleting || !deletePassword}
                  className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition text-sm font-medium shadow-sm shadow-red-200 disabled:opacity-50"
                >
                  {isDeleting ? "Deleting..." : "Confirm Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
