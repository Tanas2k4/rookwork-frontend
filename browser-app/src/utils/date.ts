/**
 * @file date.ts
 * @description Các hàm tiện ích để xử lý, định dạng và tính toán liên quan đến ngày tháng (Date/Time).
 * @author Warmdrobe
 */

/**
 * Định dạng ngày giờ hiện tại theo định dạng: DD/MM/YYYY HH:MM.
 * @returns Chuỗi ngày giờ được định dạng
 */
export function formatNow(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/**
 * Kiểm tra xem một sự vụ đã quá hạn (deadline) hay chưa.
 * Một sự vụ được coi là quá hạn nếu trạng thái khác 'done' và ngày deadline nhỏ hơn thời điểm hiện tại.
 * 
 * @param deadline Chuỗi ngày đến hạn
 * @param status Trạng thái hiện tại của sự vụ
 * @returns true nếu quá hạn, ngược lại false
 */
export function isOverdue(deadline: string, status: string): boolean {
  return status !== "done" && new Date(deadline) < new Date();
}

/**
 * Thêm một số ngày nhất định vào đối tượng Date cho trước.
 * @param date Đối tượng Date gốc
 * @param days Số ngày cần cộng thêm
 * @returns Đối tượng Date mới sau khi cộng
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Tính toán số ngày chênh lệch giữa hai thời điểm.
 * @param a Ngày bắt đầu
 * @param b Ngày kết thúc
 * @returns Số ngày chênh lệch (được làm tròn)
 */
export function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
