/**
 * @file useAutoRefreshToken.ts
 * @description Hook tự động gửi yêu cầu làm mới mã thông báo truy cập (Access Token) trước khi hết hạn 5 phút.
 * @author Warmdrobe
 */

import { useEffect, useRef } from "react";
import { tokenStorage } from "../api/tokenStorage";

/**
 * Hook tự động refresh token trước khi hết hạn
 * - Decode JWT lấy expiration time
 * - Refresh trước khi hết hạn 5 phút (buffer)
 */
export const useAutoRefreshToken = () => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const scheduleRefresh = () => {
      // Clear timeout cũ nếu có
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const accessToken = tokenStorage.getAccess();
      if (!accessToken) return;

      try {
        // Decode JWT lấy expiration time
        const payload = accessToken.split(".")[1];
        const decoded = JSON.parse(atob(payload));
        const expirationTime = decoded.exp * 1000; // Convert seconds to milliseconds

        const now = Date.now();
        const timeUntilExpire = expirationTime - now;
        const bufferTime = 5 * 60 * 1000; // Refresh 5 phút trước khi hết hạn

        // Nếu token sắp hết hạn (< 5 phút), refresh ngay
        if (timeUntilExpire < bufferTime) {
          performRefresh();
          return;
        }

        // Nếu không, đặt timeout refresh trước bufferTime
        const scheduleTime = timeUntilExpire - bufferTime;
        timeoutRef.current = setTimeout(performRefresh, scheduleTime);
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    };

    const performRefresh = async () => {
      try {
        const refreshToken = tokenStorage.getRefresh();
        if (!refreshToken) {
          tokenStorage.clear();
          window.location.href = "/login";
          return;
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL ?? "http://localhost:8080"}/api/auth/refresh`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          tokenStorage.save(data.accessToken, refreshToken);
          // Schedule tiếp theo
          scheduleRefresh();
        } else {
          tokenStorage.clear();
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Token refresh error:", error);
        tokenStorage.clear();
        window.location.href = "/login";
      }
    };

    // Lần đầu check schedule
    scheduleRefresh();

    // Cleanup
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
};
