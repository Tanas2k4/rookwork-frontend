import { useState, useRef } from "react";
import { FiGlobe, FiLock } from "react-icons/fi";
import { userApi } from "../../api/services/userApi";
import type { UserSummary } from "../../api/contracts/issue";
import { avatarUrl } from "../../utils/avatar";
import { useToast } from "../../hooks/useToast";
import { ToastContainer } from "../common/ToastContainer";
import ImageCropModal from "./ImageCropModal";

const PrivacyToggle = ({
  isPublic,
  onClick,
}: {
  isPublic: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center text-xs px-2 py-1 rounded transition-colors ${isPublic ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-600 border border-gray-200"}`}
      title={isPublic ? "Visible to everyone" : "Only visible to you"}
    >
      {isPublic ? <FiGlobe className="mr-1" /> : <FiLock className="mr-1" />}
      {isPublic ? "Public" : "Private"}
    </button>
  );
};

export default function ProfileSettings({
  user,
  onUnsavedChanges,
}: {
  user: UserSummary | null;
  onUnsavedChanges?: (val: boolean) => void;
}) {
  const { toasts, addToast, removeToast } = useToast();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [profileName, setProfileName] = useState(user?.profileName || "");
  const [email, setEmail] = useState(user?.email || "user@example.com");
  const [jobTitle, setJobTitle] = useState(user?.jobTitle || "");
  const [organization, setOrganization] = useState(user?.organization || "");
  const [location, setLocation] = useState(user?.location || "");
  const [emailPublic, setEmailPublic] = useState(user?.emailPublic ?? false);
  const [jobTitlePublic, setJobTitlePublic] = useState(
    user?.jobTitlePublic ?? true,
  );
  const [organizationPublic, setOrganizationPublic] = useState(
    user?.organizationPublic ?? true,
  );
  const [locationPublic, setLocationPublic] = useState(
    user?.locationPublic ?? true,
  );
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(user?.picture || "");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAvatar, setIsDeletingAvatar] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  const handleDeleteAvatar = async () => {
    setIsDeletingAvatar(true);
    try {
      await userApi.deleteAvatar();
      setAvatar("");
      window.dispatchEvent(new CustomEvent("profileUpdated"));
      addToast("Avatar removed successfully!", "success");
    } catch (err) {
      console.error("Delete avatar failed!:", err);
      addToast("Failed to remove avatar. Please try again.", "error");
    } finally {
      setIsDeletingAvatar(false);
    }
  };

  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
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
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        addToast("Avatar file size cannot exceed 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImageSrc(null);
    setIsUploading(true);
    try {
      const file = new File([croppedBlob], "avatar.jpg", {
        type: "image/jpeg",
      });
      const response = await userApi.uploadAvatar(file);
      setAvatar(response.avatarUrl);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
      addToast("Avatar uploaded successfully!", "success");
    } catch (err) {
      console.error("Lỗi tải lên ảnh đại diện:", err);
      addToast("Failed to upload avatar. Please try again.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
  ) => {
    setter(e.target.value);
    onUnsavedChanges?.(true);
  };

  const handleToggle = (
    setter: React.Dispatch<React.SetStateAction<boolean>>,
    val: boolean,
  ) => {
    setter(val);
    onUnsavedChanges?.(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await userApi.updateProfile({
        profileName,
        jobTitle,
        organization,
        location,
        emailPublic,
        jobTitlePublic,
        organizationPublic,
        locationPublic,
      });
      addToast("Profile updated successfully!", "success");
      onUnsavedChanges?.(false);
      window.dispatchEvent(new CustomEvent("profileUpdated"));
    } catch {
      addToast("Failed to update profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Profile Settings
      </h2>
      <form
        onSubmit={handleSave}
        className="space-y-6 bg-white p-6 rounded-xl border border-gray-200"
      >
        {/* Avatar Section */}
        <div className="flex items-center space-x-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={handleAvatarClick}
          >
            <img
              src={avatarUrl(profileName || "User", avatar)}
              alt="Avatar"
              className="h-20 w-20 rounded-full object-cover border border-gray-200 transition-all duration-200 group-hover:brightness-75"
            />
            {/* Camera Overlay on Hover */}
            <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg
                className="w-6 h-6 text-white/90"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            {(isUploading || isDeletingAvatar) && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              {!!avatar && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={isUploading || isDeletingAvatar}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800  rounded-md text-xs font-medium text-white transition"
                >
                  {isDeletingAvatar
                    ? "Removing..."
                    : "Remove avatar"}
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              JPG, GIF or PNG. 1MB max.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[13px] font-bold text-gray-700">
                Email Address
              </label>
              <PrivacyToggle
                isPublic={emailPublic}
                onClick={() => handleToggle(setEmailPublic, !emailPublic)}
              />
            </div>
            <input
              type="email"
              value={email}
              disabled={true}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-1.5 border text-sm border-gray-100 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
              required
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={profileName}
              onChange={(e) => handleChange(e, setProfileName)}
              className="w-full px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100"
              required
            />
          </div>
          
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[13px] font-bold text-gray-700">
                Job Title
              </label>
              <PrivacyToggle
                isPublic={jobTitlePublic}
                onClick={() => handleToggle(setJobTitlePublic, !jobTitlePublic)}
              />
            </div>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => handleChange(e, setJobTitle)}
              className="w-full px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[13px] font-bold text-gray-700">
                Company / Organization
              </label>
              <PrivacyToggle
                isPublic={organizationPublic}
                onClick={() =>
                  handleToggle(setOrganizationPublic, !organizationPublic)
                }
              />
            </div>
            <input
              type="text"
              value={organization}
              onChange={(e) => handleChange(e, setOrganization)}
              className="w-full px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100"
              placeholder="e.g. Acme Corp"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-[13px] font-bold text-gray-700">
                Residence Location
              </label>
              <PrivacyToggle
                isPublic={locationPublic}
                onClick={() => handleToggle(setLocationPublic, !locationPublic)}
              />
            </div>
            <input
              type="text"
              value={location}
              onChange={(e) => handleChange(e, setLocation)}
              className="w-full px-3 py-1.5 border text-sm text-gray-700 border-gray-500 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-600 focus:border-purple-100"
              placeholder="e.g. Ho Chi Minh City, VN"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-4 py-1.5 bg-purple-900 text-white text-[13px] rounded-md hover:bg-purple-800 transition-colors "
          >
            Update
          </button>
        </div>
      </form>

      {/* Custom Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setShowConfirmDelete(false)}
          />
          {/* Modal Container */}
          <div className="relative bg-white rounded-md border border-slate-200 p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col">

            {/* Title */}
            <h3 className="flex items-center justify-start text-base font-bold text-slate-800 mb-2">
              Remove Avatar
            </h3>

            {/* Message */}
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Are you sure you want to remove your avatar? This action cannot be
              undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 w-full">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-gray-500 rounded-md text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDelete(false);
                  handleDeleteAvatar();
                }}
                className="flex-1 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-md transition text-sm font-medium shadow-sm shadow-red-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notifications container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {selectedImageSrc && (
        <ImageCropModal
          imageSrc={selectedImageSrc}
          onClose={() => setSelectedImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
