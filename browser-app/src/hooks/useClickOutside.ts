/**
 * @file useClickOutside.ts
 * @description Hook phát hiện tương tác bên ngoài vùng phần tử React Ref (dùng cho Dropdown, Popup, Panel).
 * @author Warmdrobe
 */

import { useEffect } from "react";

/**
 * Hook phát hiện sự kiện click chuột bên ngoài một phần tử DOM được chỉ định qua ref.
 * Thường dùng để đóng các thanh công cụ, menu thả xuống hoặc bảng trượt khi bấm ra ngoài.
 * 
 * @param ref Đối tượng React Ref tham chiếu đến phần tử cần theo dõi
 * @param callback Hàm callback được kích hoạt khi click bên ngoài phần tử ref
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, callback]);
}
