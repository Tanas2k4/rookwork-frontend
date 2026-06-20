/**
 * @file useProject.ts
 * @description Hook truy xuất dữ liệu dự án hiện tại từ ProjectContext.
 * @author Warmdrobe
 */

import { useContext } from "react";
import { ProjectContext } from "../context/ProjectContext";

/**
 * Hook useProject lấy thông tin định danh dự án và các hàm thao tác dự án dùng chung từ ProjectContext.
 */
export function useProject() {
  return useContext(ProjectContext);
}
