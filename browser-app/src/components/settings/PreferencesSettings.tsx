import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { UserSummary } from "../../api/contracts/issue";

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "ja", name: "日本語 (Japanese)" },
  { code: "fr", name: "Français (French)" },
];

export default function PreferencesSettings({ user: _user }: { user: UserSummary | null }) {
  const { t, i18n } = useTranslation();

  const systemLanguage = navigator.language.split("-")[0]; // "en-US" → "en"

  const [language, setLanguage] = useState(systemLanguage || "en");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // System preferences are read-only and not saved to the backend
      i18n.changeLanguage(language);
      alert(t('preferences.success'));
    } catch (err) {
      alert(t('preferences.error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{t('preferences.title')}</h2>
      <form onSubmit={handleSave} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        
        <div className="space-y-6">
          <div className="opacity-60">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('preferences.language')}</label>
            <select
              value={language}
              disabled={true}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 font-medium">
              * Language selection is temporarily disabled.
            </p>
          </div>        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-3 py-1.5 bg-purple-900 text-white text-sm font-medium rounded-lg hover:bg-purple-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? t('preferences.saving') : t('preferences.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
