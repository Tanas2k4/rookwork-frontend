import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { formatInTimeZone } from "date-fns-tz";
import { FiGlobe, FiLock } from "react-icons/fi";
import { userApi } from "../../api/services/userApi";
import type { UserSummary } from "../../api/contracts/issue";
import { avatarUrl } from "../../utils/avatar";

export default function ProfileSettings({ user, onUnsavedChanges }: { user: UserSummary | null; onUnsavedChanges?: (val: boolean) => void }) {
  const { t } = useTranslation();
  const [profileName, setProfileName] = useState(user?.profileName || "");
  const [email, setEmail] = useState(user?.email || "user@example.com");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [location, setLocation] = useState(user?.location || "");
  const [emailPublic, setEmailPublic] = useState(user?.emailPublic ?? false);
  const [jobTitlePublic, setJobTitlePublic] = useState(user?.jobTitlePublic ?? true);
  const [organizationPublic, setOrganizationPublic] = useState(user?.organizationPublic ?? true);
  const [locationPublic, setLocationPublic] = useState(user?.locationPublic ?? true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(user?.picture || "");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setAvatar(user.picture || "");
      setProfileName(user.profileName || "");
      setEmail(user.email || "");
      setJobTitle(user.jobTitle || "");
      setOrganization(user.organization || "");
      setLocation(user.location || "");
      setEmailPublic(user.emailPublic ?? false);
      setJobTitlePublic(user.jobTitlePublic ?? true);
      setOrganizationPublic(user.organizationPublic ?? true);
      setLocationPublic(user.locationPublic ?? true);
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh đại diện không được vượt quá 5MB.");
        return;
      }
      setIsUploading(true);
      try {
        const response = await userApi.uploadAvatar(file);
        setAvatar(response.avatarUrl);
        window.dispatchEvent(new CustomEvent("profileUpdated"));
      } catch (err) {
        console.error("Lỗi tải lên ảnh đại diện:", err);
        alert("Không thể tải lên ảnh đại diện. Vui lòng thử lại.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    setter(e.target.value);
    onUnsavedChanges?.(true);
  };

  const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>, val: boolean) => {
    setter(val);
    onUnsavedChanges?.(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        profileName, jobTitle, organization, location,
        emailPublic, jobTitlePublic, organizationPublic, locationPublic
      });
      alert(t('profile.success'));
      onUnsavedChanges?.(false);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch (err) {
      alert(t('profile.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const PrivacyToggle = ({ isPublic, onClick }: { isPublic: boolean, onClick: () => void }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center text-xs px-2 py-1 rounded transition-colors ${isPublic ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
      title={isPublic ? t('profile.public_hint') : t('profile.private_hint')}
    >
      {isPublic ? <FiGlobe className="mr-1" /> : <FiLock className="mr-1" />}
      {isPublic ? t('profile.public') : t('profile.private')}
    </button>
  );

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">{t('profile.title')}</h2>
      <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">

        {/* Avatar Section */}
        <div className="flex items-center space-x-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <div className="relative group cursor-pointer shrink-0" onClick={handleAvatarClick}>
            <img
              src={avatarUrl(profileName || "User", avatar)}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover border border-gray-200 group-hover:opacity-80 transition-opacity"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={handleAvatarClick}
              disabled={isUploading}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : t('profile.change_avatar')}
            </button>
            <p className="mt-2 text-xs text-gray-500">{t('profile.avatar_hint')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.display_name')}</label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => handleChange(e, setProfileName)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.email')}</label>
              <PrivacyToggle isPublic={emailPublic} onClick={() => handleToggle(setEmailPublic, !emailPublic)} />
            </div>
            <input
              type="email"
              value={email}
              disabled={true}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.job_title')}</label>
              <PrivacyToggle isPublic={jobTitlePublic} onClick={() => handleToggle(setJobTitlePublic, !jobTitlePublic)} />
            </div>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => handleChange(e, setJobTitle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.organization')}</label>
              <PrivacyToggle isPublic={organizationPublic} onClick={() => handleToggle(setOrganizationPublic, !organizationPublic)} />
            </div>
            <input
              type="text"
              value={organization}
              onChange={(e) => handleChange(e, setOrganization)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. Acme Corp"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">{t('profile.location')}</label>
              <PrivacyToggle isPublic={locationPublic} onClick={() => handleToggle(setLocationPublic, !locationPublic)} />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => handleChange(e, setLocation)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g. Ho Chi Minh City, VN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.local_time')}</label>
            <div className="w-full px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg font-mono flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              {user?.timezone
                ? formatInTimeZone(currentTime, user.timezone, 'HH:mm:ss')
                : formatInTimeZone(currentTime, 'UTC', 'HH:mm:ss')}
              <span className="ml-2 text-xs text-gray-400">({user?.timezone || 'UTC'})</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-purple-900 text-white rounded-lg hover:bg-purple-800 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isSaving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>
      </form>
    </div>
  );
}
