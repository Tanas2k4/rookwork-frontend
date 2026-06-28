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
 * Tính số ngày còn lại từ hiện tại đến deadline.
 * Trả về số ngày (có thể âm nếu đã quá hạn).
 * So sánh dựa trên ngày lịch (calendar days) độc lập với giờ/phút/giây.
 * 
 * @param deadline Chuỗi ngày đến hạn (ISO hoặc YYYY-MM-DD)
 * @returns Số ngày còn lại, hoặc null nếu không có deadline
 */
export function getDaysLeft(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const deadlineStr = deadline.includes("T") ? deadline.split("T")[0] : deadline;
  const parts = deadlineStr.split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const deadlineDate = new Date(year, month, day);

  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const diffTime = deadlineDate.getTime() - todayDate.getTime();
  const days = Math.round(diffTime / 86400000);
  return days === 0 ? 0 : days;
}

/**
 * Kiểm tra xem một sự vụ đã quá hạn (deadline) hay chưa.
 * Một sự vụ được coi là quá hạn nếu trạng thái khác 'done' và ngày deadline nhỏ hơn thời điểm hiện tại.
 * 
 * @param deadline Chuỗi ngày đến hạn
 * @param status Trạng thái hiện tại của sự vụ
 * @returns true nếu quá hạn, ngược lại false
 */
export function isOverdue(deadline: string | null | undefined, status: string | null | undefined): boolean {
  if (!deadline) return false;
  const statusLower = status ? status.toLowerCase() : "";
  if (statusLower === "done") return false;
  const daysLeft = getDaysLeft(deadline);
  return daysLeft !== null && daysLeft < 0;
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

/**
 * Định dạng ngày giờ từ chuỗi ISO sang định dạng DD/MM/YYYY HH:MM:SS.
 * @param iso Chuỗi ngày giờ ISO
 * @returns Chuỗi ngày giờ được định dạng
 */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * Chuyển đối tượng Date thành chuỗi định dạng YYYY-MM-DDTHH:MM phù hợp cho datetime-local input.
 * @param d Đối tượng Date
 * @returns Chuỗi định dạng local datetime
 */
export function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
