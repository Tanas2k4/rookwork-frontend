import { useState, useEffect, useCallback } from "react";
import { notificationApi } from "../api/services/notificationApi";
import { invitationApi } from "../api/services/invitationApi";
import { useWebSocket, type WsNotificationPayload } from "./useWebSocket";
import type { NotificationResponse } from "../api/contracts/notification";

function normalize(all: NotificationResponse[]): NotificationResponse[] {
  return all.map((n) => ({
    ...n,
    isRead: n.isRead ?? (n as unknown as { read?: boolean }).read ?? false,
  }));
}

export function useNotifications(
  onProjectsChanged?: () => void,
  onAcceptSuccess?: (projectId?: string) => void,
) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [respondedMap, setRespondedMap] = useState<Record<string, "accepted" | "declined">>({});

  const loadNotifications = useCallback(() => {
    notificationApi
      .getAll()
      .then((all) => setNotifications(normalize(all)))
      .catch((err: unknown) =>
        console.error("Failed to load notifications", err),
      );
  }, []);

  useEffect(() => {
    let cancelled = false;
    notificationApi
      .getAll()
      .then((all) => {
        if (!cancelled) setNotifications(normalize(all));
      })
      .catch(console.error);
    return () => {
      cancelled = true;
    };
  }, []);

  // WebSocket Integration
  useWebSocket({
    projectId: null,
    issueId: null,
    onNotification: useCallback(
      (payload: WsNotificationPayload) => {
        if (payload.notificationId) {
          loadNotifications();
        }
        if (payload.type === "INVITATION_ACCEPTED") {
          onProjectsChanged?.();
        }
      },
      [loadNotifications, onProjectsChanged],
    ),
  });

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  }, []);

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await notificationApi.delete(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  }, []);

  const handleRespond = useCallback(
    async (
      e: React.MouseEvent,
      invitationId: string,
      accept: boolean,
      projectId?: string,
    ) => {
      e.stopPropagation();
      e.preventDefault();
      if (respondingId) return;
      setRespondingId(invitationId);
      try {
        await invitationApi.respond(invitationId, accept);
        // Hiện text thay thế buttons ngay lập tức
        setRespondedMap((prev) => ({
          ...prev,
          [invitationId]: accept ? "accepted" : "declined",
        }));
        if (accept) {
          onProjectsChanged?.();
          onAcceptSuccess?.(projectId);
        }
        setTimeout(() => loadNotifications(), 800);
      } catch (err) {
        console.error("Failed to respond to invitation", err);
      } finally {
        setRespondingId(null);
      }
    },
    [loadNotifications, respondingId, onProjectsChanged, onAcceptSuccess],
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    respondingId,
    respondedMap,
    loadNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete,
    handleRespond,
  };
}
