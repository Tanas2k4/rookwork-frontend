/**
 * @file avatar.ts
 * @description Tiện ích tạo đường dẫn ảnh đại diện cho thành viên, sử dụng dịch vụ ui-avatars.com làm ảnh mặc định nếu không có ảnh tải lên.
 * @author Warmdrobe
 */

/**
 * Tạo đường dẫn ảnh đại diện (avatar) của thành viên.
 * Nếu không có ảnh đại diện được tải lên (pic là null/undefined),
 * sẽ tự động trả về link avatar mặc định dạng chữ cái đầu (initials) của tên người dùng.
 * 
 * @param name Tên hiển thị của người dùng (để trích xuất chữ cái đầu)
 * @param pic Đường dẫn ảnh đại diện nếu có
 * @returns Chuỗi URL ảnh đại diện
 */
export function avatarUrl(name: string, pic: string | null | undefined): string {
  if (!pic || pic.trim() === "") {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`;
  }
  return pic;
}
