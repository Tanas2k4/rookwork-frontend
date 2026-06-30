import { apiClient } from "../apiClient";
import type { SearchResponse } from "../contracts/search";

export const searchApi = {
  search: (query: string) =>
    apiClient.get<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),
};
