import { apiClient } from "../apiClient";
import type { CreateEventRequest, EventResponse } from "../contracts/event";

export const eventApi = {
  getByProject: (projectId: string) =>
    apiClient.get<EventResponse[]>(`/api/events/project/${projectId}`),

  getMyEvents: () =>
    apiClient.get<EventResponse[]>("/api/events/my-events"),

  create: (data: CreateEventRequest) =>
    apiClient.post<EventResponse>("/api/events", data),

  delete: (id: string) =>
    apiClient.delete<void>(`/api/events/${id}`),
};
