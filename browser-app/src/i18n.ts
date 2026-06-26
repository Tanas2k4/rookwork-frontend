import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "settings.title": "Settings",
      "settings.profile": "Profile",
      "settings.preferences": "Preferences",
      "settings.notifications": "Notifications",
      "settings.security": "Account & Security",
      
      "preferences.title": "Preferences",
      "preferences.language": "Language",
      "preferences.timezone": "Timezone",
      "preferences.timezone.hint": "Your current timezone affects how dates and times are displayed.",
      "preferences.save": "Save Preferences",
      "preferences.saving": "Saving...",
      "preferences.success": "Preferences updated successfully!",
      "preferences.error": "Failed to update preferences.",

      "profile.title": "Profile Settings",
      "profile.change_avatar": "Change avatar",
      "profile.remove_avatar": "Remove avatar",
      "profile.avatar_hint": "JPG, GIF or PNG. 1MB max.",
      "profile.display_name": "Display Name",
      "profile.email": "Email Address",
      "profile.job_title": "Job Title",
      "profile.organization": "Company / Organization",
      "profile.location": "Residence Location",
      "profile.local_time": "Local Time",
      "profile.public": "Public",
      "profile.private": "Private",
      "profile.public_hint": "Visible to everyone",
      "profile.private_hint": "Only visible to you",
      "profile.save": "Save Changes",
      "profile.saving": "Saving...",
      "profile.success": "Profile updated successfully!",
      "profile.error": "Failed to update profile.",

      "notifications.title": "Notifications",
      "notifications.issue": "Issue Assigned to Me",
      "notifications.issue_hint": "Get notified when someone assigns an issue or task to you.",
      "notifications.mentions": "Mentions (@)",
      "notifications.mentions_hint": "Get notified when someone mentions you in a comment or description.",
      "notifications.project": "Project Updates",
      "notifications.project_hint": "Receive alerts for major changes in projects you are part of.",
      "notifications.digest": "Daily Digest Email",
      "notifications.digest_hint": "Receive a daily summary email of your tasks and upcoming deadlines.",
      "notifications.save": "Save Preferences",
      "notifications.saving": "Saving...",
      "notifications.success": "Notification settings updated!",
      "notifications.error": "Failed to update notification settings.",

      "security.title": "Account & Security",
      "security.change_password": "Change Password",
      "security.current_password": "Current Password",
      "security.new_password": "New Password",
      "security.confirm_password": "Confirm New Password",
      "security.save": "Update Password",
      "security.saving": "Updating...",
      "security.success": "Password updated successfully!",
      "security.error": "Failed to update password.",
      "security.mismatch": "New passwords do not match!",
      "security.danger_zone": "Danger Zone",
      "security.danger_hint": "Once you delete your account, there is no going back. Please be certain.",
      "security.delete_account": "Delete Account",
      "security.delete_confirm": "Are you sure you want to delete your account? This action cannot be undone."
    }
  },
  vi: {
    translation: {
      "settings.title": "Cài đặt",
      "settings.profile": "Hồ sơ cá nhân",
      "settings.preferences": "Tùy chọn",
      "settings.notifications": "Thông báo",
      "settings.security": "Tài khoản & Bảo mật",
      
      "preferences.title": "Tùy chọn hiển thị",
      "preferences.language": "Ngôn ngữ",
      "preferences.timezone": "Múi giờ",
      "preferences.timezone.hint": "Múi giờ hiện tại sẽ ảnh hưởng đến cách hiển thị ngày giờ trong toàn bộ ứng dụng.",
      "preferences.save": "Lưu tùy chọn",
      "preferences.saving": "Đang lưu...",
      "preferences.success": "Cập nhật tùy chọn thành công!",
      "preferences.error": "Cập nhật tùy chọn thất bại.",

      "profile.title": "Cài đặt Hồ sơ",
      "profile.change_avatar": "Đổi ảnh đại diện",
      "profile.remove_avatar": "Xóa ảnh đại diện",
      "profile.avatar_hint": "JPG, GIF hoặc PNG. Tối đa 1MB.",
      "profile.display_name": "Tên hiển thị",
      "profile.email": "Địa chỉ Email",
      "profile.job_title": "Chức danh",
      "profile.organization": "Công ty / Tổ chức",
      "profile.location": "Nơi cư trú",
      "profile.local_time": "Giờ địa phương",
      "profile.public": "Công khai",
      "profile.private": "Riêng tư",
      "profile.public_hint": "Tất cả mọi người đều có thể thấy",
      "profile.private_hint": "Chỉ mình bạn thấy",
      "profile.save": "Lưu thay đổi",
      "profile.saving": "Đang lưu...",
      "profile.success": "Cập nhật hồ sơ thành công!",
      "profile.error": "Cập nhật hồ sơ thất bại.",

      "notifications.title": "Thông báo",
      "notifications.issue": "Công việc được giao",
      "notifications.issue_hint": "Nhận thông báo khi ai đó giao việc cho bạn.",
      "notifications.mentions": "Nhắc đến (@)",
      "notifications.mentions_hint": "Nhận thông báo khi ai đó nhắc đến bạn trong bình luận.",
      "notifications.project": "Cập nhật dự án",
      "notifications.project_hint": "Nhận cảnh báo cho các thay đổi lớn trong dự án của bạn.",
      "notifications.digest": "Email tổng hợp hàng ngày",
      "notifications.digest_hint": "Nhận email tổng hợp các công việc và hạn chót sắp tới.",
      "notifications.save": "Lưu tùy chọn",
      "notifications.saving": "Đang lưu...",
      "notifications.success": "Cập nhật thông báo thành công!",
      "notifications.error": "Cập nhật thông báo thất bại.",

      "security.title": "Tài khoản & Bảo mật",
      "security.change_password": "Đổi mật khẩu",
      "security.current_password": "Mật khẩu hiện tại",
      "security.new_password": "Mật khẩu mới",
      "security.confirm_password": "Xác nhận mật khẩu mới",
      "security.save": "Cập nhật mật khẩu",
      "security.saving": "Đang cập nhật...",
      "security.success": "Cập nhật mật khẩu thành công!",
      "security.error": "Cập nhật mật khẩu thất bại.",
      "security.mismatch": "Mật khẩu mới không khớp!",
      "security.danger_zone": "Khu vực nguy hiểm",
      "security.danger_hint": "Một khi đã xóa tài khoản, bạn không thể khôi phục lại. Hãy cân nhắc kỹ.",
      "security.delete_account": "Xóa tài khoản",
      "security.delete_confirm": "Bạn có chắc chắn muốn xóa tài khoản không? Hành động này không thể hoàn tác."
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
