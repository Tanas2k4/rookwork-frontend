/**
 * @file useToast.ts
 * @description Hook quản lý trạng thái hiển thị của các thông báo nổi (Toast notifications), tự động xóa thông báo sau 3 giây.
 * @author Warmdrobe
 */

import { useState, useCallback, useRef } from "react";
import type { Toast } from "../types/project";

/**
 * Hook quản lý danh sách và vòng đời của các thông báo Toast.
 * Hỗ trợ các chức năng thêm toast mới (tự động biến mất sau 3 giây) và gỡ bỏ thủ công.
 * 
 * @returns Đối tượng chứa danh sách toasts, hàm addToast, và hàm removeToast
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  /**
   * Thêm một thông báo mới vào danh sách.
   * @param message Nội dung thông báo hiển thị
   * @param type Kiểu thông báo ('success', 'error', 'info')
   */
  const addToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = ++toastIdRef.current;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);

  /**
   * Xóa thủ công một thông báo dựa trên ID của nó.
   * @param id Số định danh của toast cần xóa
   */
  const removeToast = useCallback((id: number) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
}
