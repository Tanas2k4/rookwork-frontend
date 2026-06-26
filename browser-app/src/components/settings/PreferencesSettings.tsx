import type { UserSummary } from "../../api/contracts/issue";

export default function PreferencesSettings({
  user,
}: {
  user: UserSummary | null;
}) {
  console.debug("Preferences for user:", user?.id);

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Preferences</h2>
      <form
        className="bg-white p-6 rounded-xl border border-gray-200 "
      >
        <div className="space-y-6">
          <div className="opacity-60">
            <label className="block text-[13px] font-medium text-gray-700 mb-1">
              Language
            </label>
            <span className="flex -full px-3 py-1.5 border bg-gray-200  text-sm border-gray-100 rounded-md focus:outline-none focus:ring-1 disabled:bg-gray-100 disabled:text-gray-500 cursor-not-allowed disabled:cursor-not-allowed">
              English (US)
            </span>
            <p className="mt-1 text-xs text-gray-500 font-medium">
              * Language selection is temporarily disabled.
            </p>
          </div>{" "}
        </div>
      </form>
    </div>
  );
}
