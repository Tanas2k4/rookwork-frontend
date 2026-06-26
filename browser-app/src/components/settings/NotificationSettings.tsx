import { useState } from "react";
import { useTranslation } from "react-i18next";
import { userApi } from "../../api/services/userApi";
import type { UserSummary } from "../../api/contracts/issue";

export default function NotificationSettings({ user }: { user: UserSummary | null }) {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState({
    notifyIssueAssigned: user?.notifyIssueAssigned ?? true,
    notifyMentioned: user?.notifyMentioned ?? true,
    notifyProjectUpdates: user?.notifyProjectUpdates ?? false,
    notifyDailyDigest: user?.notifyDailyDigest ?? false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userApi.updateNotifications(notifications);
      alert(t('notifications.success'));
    } catch {
      alert(t('notifications.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{t('notifications.title')}</h2>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">

        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">{t('notifications.issue')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('notifications.issue_hint')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyIssueAssigned")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notifications.notifyIssueAssigned ? "bg-purple-600" : "bg-gray-200"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.notifyIssueAssigned ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">{t('notifications.mentions')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('notifications.mentions_hint')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyMentioned")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notifications.notifyMentioned ? "bg-purple-600" : "bg-gray-200"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.notifyMentioned ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">{t('notifications.project')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('notifications.project_hint')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyProjectUpdates")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notifications.notifyProjectUpdates ? "bg-purple-600" : "bg-gray-200"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.notifyProjectUpdates ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">{t('notifications.digest')}</h3>
              <p className="text-sm text-gray-500 mt-1">{t('notifications.digest_hint')}</p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyDailyDigest")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${notifications.notifyDailyDigest ? "bg-purple-600" : "bg-gray-200"}`}
            >
              <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${notifications.notifyDailyDigest ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-1.5 bg-purple-900 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('notifications.saving') : t('notifications.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
