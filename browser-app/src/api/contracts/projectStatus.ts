export type StatusCategory = "TO_DO" | "IN_PROGRESS" | "DONE";

/** Mirrors ProjectStatusResponse from the backend. */
export interface ProjectStatusResponse {
  id: string;
  statusName: string;
  color: string;
  position: number;
  statusCategory: StatusCategory;
  version: number;
}

export interface CreateStatusRequest {
  statusName: string;
  color?: string;
  statusCategory: StatusCategory;
}

export interface UpdateStatusRequest {
  statusName?: string;
  color?: string;
}

export interface StatusOrder {
  statusId: string;
  position: number;
  version: number;
}

export interface ReorderStatusRequest {
  statusOrders: StatusOrder[];
}

export interface DeleteStatusRequest {
  fallbackStatusId: string;
}
