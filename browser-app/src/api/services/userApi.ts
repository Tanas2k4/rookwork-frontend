import { apiClient } from "../apiClient";
import type { UserSummary } from "../contracts/issue";
import type {
  UpdateNotificationsRequest,
  UpdatePasswordRequest,

  UpdateProfileRequest,
} from "../contracts/user";

export const userApi = {
  getMe: () => apiClient.get<UserSummary>("/api/users/me"),
  updateProfile: (data: UpdateProfileRequest) => apiClient.put("/api/users/me/profile", data),

  updateNotifications: (data: UpdateNotificationsRequest) => apiClient.put("/api/users/me/notifications", data),
  updatePassword: (data: UpdatePasswordRequest) => apiClient.put("/api/users/me/password", data),
  deleteAccount: (password: string) => apiClient.delete("/api/users/me", { password }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.postFormData<{ avatarUrl: string }>("/api/users/me/avatar", formData);
  },
};
