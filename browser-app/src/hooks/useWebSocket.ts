/**
 * @file useWebSocket.ts
 * @description Hook thiết lập kết nối thời gian thực qua WebSocket (STOMP qua SockJS) để đồng bộ hóa bình luận và nhận thông báo tức thời.
 * @author Warmdrobe
 */

import { useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client, type IMessage } from "@stomp/stompjs";
import { tokenStorage } from "../api/tokenStorage";
import type { ActivityResponse } from "../api/contracts/activity";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export interface WsCommentPayload {
  type: "NEW_COMMENT" | "UPDATED_COMMENT" | "DELETED_COMMENT";
  comment?: unknown;
  commentId?: string;
  issueId?: string;
}

export interface WsActivityPayload {
  type: "NEW_ACTIVITY";
  activity?: ActivityResponse;
}

export interface WsNotificationPayload {
  type: string;
  notificationId: string;
  issueId: string;
  issueName: string;
  projectName: string;
  [key: string]: unknown;
}

interface UseWebSocketOptions {
  projectId: string | null;
  issueId: string | null; // UUID của issue đang mở trong TaskPanel
  onComment?: (payload: WsCommentPayload) => void;
  onNotification?: (payload: WsNotificationPayload) => void;
  onActivity?: (payload: WsActivityPayload) => void;
}

/**
 * Hook useWebSocket khởi tạo kết nối STOMP client, lắng nghe các sự kiện liên quan đến bình luận của một sự vụ (issue) cụ thể,
 * và các thông báo cá nhân gửi từ server thông qua hàng đợi của người dùng.
 * 
 * @param options Các tham số cấu hình bao gồm projectId, issueId và các hàm callback khi nhận sự kiện.
 */
export function useWebSocket({
  projectId,
  issueId,
  onComment,
  onNotification,
  onActivity,
}: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const onCommentRef = useRef(onComment);
  const onNotificationRef = useRef(onNotification);
  const onActivityRef = useRef(onActivity);

  // Keep refs up to date without reconnecting
  useEffect(() => {
    onCommentRef.current = onComment;
  }, [onComment]);

  useEffect(() => {
    onNotificationRef.current = onNotification;
  }, [onNotification]);

  useEffect(() => {
    onActivityRef.current = onActivity;
  }, [onActivity]);

  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/ws`) as WebSocket,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe comments cho issue đang mở
        if (projectId && issueId) {
          client.subscribe(
            `/topic/project/${projectId}/issue/${issueId}/comments`,
            (msg: IMessage) => {
              try {
                const payload = JSON.parse(msg.body) as WsCommentPayload;
                onCommentRef.current?.(payload);
              } catch (e) {
                console.error("WS comment parse error", e);
              }
            },
          );

          // Subscribe activities cho issue đang mở
          client.subscribe(
            `/topic/project/${projectId}/issue/${issueId}/activities`,
            (msg: IMessage) => {
              try {
                const payload = JSON.parse(msg.body) as WsActivityPayload;
                onActivityRef.current?.(payload);
              } catch (e) {
                console.error("WS activity parse error", e);
              }
            },
          );
        }

        // Subscribe personal notifications
        client.subscribe("/user/queue/notifications", (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body) as WsNotificationPayload;
            onNotificationRef.current?.(payload);
          } catch (e) {
            console.error("WS notification parse error", e);
          }
        });
      },
      onStompError: (frame) => {
        console.error("STOMP error", frame);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [projectId, issueId]); // reconnect khi đổi issue
}
