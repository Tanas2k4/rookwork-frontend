import { useState } from "react";
import { userApi } from "../../api/services/userApi";
import type { UserSummary } from "../../api/contracts/issue";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../common/ToastContainer";

export default function NotificationSettings({
  user,
}: {
  user: UserSummary | null;
}) {
  const { toasts, addToast, removeToast } = useToast();
  const [notifications, setNotifications] = useState({
    notifyIssueAssigned: user?.notifyIssueAssigned ?? true,
    notifyMentioned: user?.notifyMentioned ?? true,
    notifyProjectUpdates: user?.notifyProjectUpdates ?? false,
    notifyDailyDigest: user?.notifyDailyDigest ?? false,
    notifyComment: user?.notifyComment ?? true,
    notifyEventInvited: user?.notifyEventInvited ?? true,
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
      addToast("Notification settings updated successfully!", "success");
    } catch {
      addToast("Failed to update notification settings.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Notifications
      </h2>
      <form
        onSubmit={handleSave}
        className="bg-white p-6 rounded-xl border border-gray-200"
      >
        <div className="space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Issue Assigned to Me
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Get notified when someone assigns an issue or task to you.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyIssueAssigned")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out  ${notifications.notifyIssueAssigned ? "bg-purple-700" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white  ring-0 transition duration-200 ease-in-out ${notifications.notifyIssueAssigned ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Mentions (@)
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Get notified when someone mentions you in a comment or description.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyMentioned")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${notifications.notifyMentioned ? "bg-purple-700" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${notifications.notifyMentioned ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Project Updates
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive alerts for major changes in projects you are part of.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyProjectUpdates")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out  ${notifications.notifyProjectUpdates ? "bg-purple-700" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${notifications.notifyProjectUpdates ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Daily Digest Email
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive a daily summary email of your tasks and upcoming deadlines.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyDailyDigest")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out  ${notifications.notifyDailyDigest ? "bg-purple-700" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${notifications.notifyDailyDigest ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Comments on my Issues/Tasks
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Receive email alerts when someone posts comments or replies on your issues.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyComment")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out  ${notifications.notifyComment ? "bg-purple-700" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${notifications.notifyComment ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>

          <div className="border-t border-gray-100" />

          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-800">
                Event Invitations
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Get notified by email when someone invites, updates, or cancels an event.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("notifyEventInvited")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out  ${notifications.notifyEventInvited ? "bg-purple-700" : "bg-gray-200"}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white ring-0 transition duration-200 ease-in-out ${notifications.notifyEventInvited ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-1.5 bg-purple-900 text-white text-sm  rounded-md hover:bg-purple-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Update
          </button>
        </div>
      </form>
      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
