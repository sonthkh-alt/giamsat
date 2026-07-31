// Tính hạn xử lý theo NGÀY LÀM VIỆC (trừ thứ Bảy, Chủ nhật và ngày nghỉ lễ).
// Mọi mốc thời gian nghiệp vụ tính theo múi giờ Asia/Ho_Chi_Minh (UTC+7).
//
// Quy ước: ngày luôn là chuỗi ISO "YYYY-MM-DD". Bên trong dùng Date ở UTC
// để phép cộng trừ ngày không bị lệch bởi giờ mùa hè hay múi giờ máy trạm.

import type { NgayLe } from '../kieu';

export const MUI_GIO = 'Asia/Ho_Chi_Minh';

/** Hoàn thành thẩm định: 10 ngày làm việc kể từ ngày mở đợt. */
export const HAN_THAM_DINH = 10;

/** Đơn vị giải trình kết quả thẩm định: 5 ngày làm việc. */
export const HAN_GIAI_TRINH = 5;

/**
 * Giải trình theo Điều 40 Luật 121/2025/QH15 khi nhiệm vụ sau giám sát quá hạn.
 * Luật ghi rõ là "15 ngày", "phức tạp không quá 30 ngày" — là NGÀY DƯƠNG LỊCH,
 * không phải ngày làm việc. Đừng nhầm sang congNgayLamViec().
 */
export const HAN_GIAI_TRINH_DIEU_40 = 15;
export const HAN_GIAI_TRINH_DIEU_40_PHUC_TAP = 30;

/** Các mốc nhắc việc trước hạn, tính bằng ngày làm việc. */
export const MOC_NHAC_VIEC = [15, 7, 3] as const;

const MOT_NGAY = 86_400_000;

export class NgayKhongHopLe extends Error {
  constructor(gia_tri: string) {
    super(`Ngày không hợp lệ: "${gia_tri}". Định dạng phải là YYYY-MM-DD.`);
    this.name = 'NgayKhongHopLe';
  }
}

/** Chuyển chuỗi ISO thành Date ở mốc 00:00 UTC. */
export function taoNgay(iso: string): Date {
  const khop = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!khop) throw new NgayKhongHopLe(iso);
  const ngay = new Date(Date.UTC(Number(khop[1]), Number(khop[2]) - 1, Number(khop[3])));
  if (sangISO(ngay) !== iso) throw new NgayKhongHopLe(iso);
  return ngay;
}

/** Chuyển Date thành chuỗi ISO "YYYY-MM-DD". */
export function sangISO(ngay: Date): string {
  return ngay.toISOString().slice(0, 10);
}

/** Ngày hôm nay theo giờ Việt Nam, dạng ISO. */
export function homNay(bayGio: Date = new Date()): string {
  const phan = new Intl.DateTimeFormat('en-CA', {
    timeZone: MUI_GIO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(bayGio);
  const lay = (loai: string): string => phan.find((p) => p.type === loai)?.value ?? '';
  return `${lay('year')}-${lay('month')}-${lay('day')}`;
}

/** Hiển thị ngày theo dd/MM/yyyy. Chuỗi rỗng hoặc null trả về dấu gạch. */
export function hienThiNgay(iso: string | null | undefined): string {
  if (!iso) return '—';
  const khop = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!khop) return iso;
  return `${khop[3]}/${khop[2]}/${khop[1]}`;
}

/** Thứ Bảy hoặc Chủ nhật. */
export function laCuoiTuan(iso: string): boolean {
  const thu = taoNgay(iso).getUTCDay();
  return thu === 0 || thu === 6;
}

function tapNgayLe(ngayLe: readonly NgayLe[]): Set<string> {
  return new Set(ngayLe.map((n) => n.ngay));
}

/** Ngày làm việc: không phải cuối tuần và không nằm trong danh sách nghỉ lễ. */
export function laNgayLamViec(iso: string, ngayLe: readonly NgayLe[] = []): boolean {
  return !laCuoiTuan(iso) && !tapNgayLe(ngayLe).has(iso);
}

function themNgay(iso: string, so: number): string {
  return sangISO(new Date(taoNgay(iso).getTime() + so * MOT_NGAY));
}

/**
 * Cộng thêm `soNgayLamViec` ngày làm việc kể từ `tuNgay`.
 * Bản thân `tuNgay` không được tính. Cộng 0 ngày trả về đúng `tuNgay`.
 */
export function congNgayLamViec(
  tuNgay: string,
  soNgayLamViec: number,
  ngayLe: readonly NgayLe[] = [],
): string {
  if (!Number.isInteger(soNgayLamViec) || soNgayLamViec < 0) {
    throw new Error(`Số ngày làm việc phải là số nguyên không âm, nhận được ${soNgayLamViec}.`);
  }
  const nghi = tapNgayLe(ngayLe);
  let iso = sangISO(taoNgay(tuNgay)); // taoNgay đồng thời xác thực định dạng
  let conLai = soNgayLamViec;
  while (conLai > 0) {
    iso = themNgay(iso, 1);
    if (!laCuoiTuan(iso) && !nghi.has(iso)) conLai -= 1;
  }
  return iso;
}

/**
 * Số ngày làm việc từ `tuNgay` (không tính) đến `denNgay` (có tính).
 * Trả về số âm nếu `denNgay` ở trước `tuNgay`.
 */
export function soNgayLamViecGiua(
  tuNgay: string,
  denNgay: string,
  ngayLe: readonly NgayLe[] = [],
): number {
  const nghi = tapNgayLe(ngayLe);
  const dau = taoNgay(tuNgay);
  const cuoi = taoNgay(denNgay);
  if (dau.getTime() === cuoi.getTime()) return 0;
  const tien = cuoi.getTime() > dau.getTime();
  let iso = sangISO(tien ? dau : cuoi);
  const dich = sangISO(tien ? cuoi : dau);
  let dem = 0;
  while (iso !== dich) {
    iso = themNgay(iso, 1);
    if (!laCuoiTuan(iso) && !nghi.has(iso)) dem += 1;
  }
  return tien ? dem : -dem;
}

export type MucCanhBao = 'con_han' | 'sap_den_han' | 'gan_han' | 'rat_gan' | 'qua_han';

/** Nhãn tiếng Việt của mức cảnh báo, dùng thẳng trên giao diện. */
export const NHAN_CANH_BAO: Record<MucCanhBao, string> = {
  con_han: 'Còn hạn',
  sap_den_han: 'Sắp đến hạn',
  gan_han: 'Gần hạn',
  rat_gan: 'Rất gần hạn',
  qua_han: 'Quá hạn',
};

/**
 * Mức cảnh báo cho một mốc hạn, dựa trên số ngày làm việc còn lại.
 * Mốc nhắc việc: trước hạn 15 / 7 / 3 ngày làm việc; quá hạn là cảnh báo đỏ.
 */
export function mucCanhBao(
  hanISO: string,
  ngayThamChieu: string,
  ngayLe: readonly NgayLe[] = [],
): MucCanhBao {
  const conLai = soNgayLamViecGiua(ngayThamChieu, hanISO, ngayLe);
  if (conLai < 0) return 'qua_han';
  if (conLai <= 3) return 'rat_gan';
  if (conLai <= 7) return 'gan_han';
  if (conLai <= 15) return 'sap_den_han';
  return 'con_han';
}

/** Số ngày làm việc còn lại tới hạn; âm nghĩa là đã quá hạn. */
export function soNgayLamViecConLai(
  hanISO: string,
  ngayThamChieu: string,
  ngayLe: readonly NgayLe[] = [],
): number {
  return soNgayLamViecGiua(ngayThamChieu, hanISO, ngayLe);
}

/** Số ngày dương lịch giữa hai mốc; dùng cho lưới theo dõi đơn vị. */
export function soNgayDuongLich(tuNgay: string, denNgay: string): number {
  return Math.round((taoNgay(denNgay).getTime() - taoNgay(tuNgay).getTime()) / MOT_NGAY);
}

/**
 * Cộng thêm số NGÀY DƯƠNG LỊCH, kể cả cuối tuần và ngày lễ.
 * Chỉ dùng cho thời hạn mà luật ghi rõ là "ngày", điển hình là Điều 40
 * Luật 121/2025/QH15. Mọi thời hạn khác dùng congNgayLamViec().
 */
export function congNgayDuongLich(tuNgay: string, soNgay: number): string {
  if (!Number.isInteger(soNgay) || soNgay < 0) {
    throw new Error(`Số ngày phải là số nguyên không âm, nhận được ${soNgay}.`);
  }
  return sangISO(new Date(taoNgay(tuNgay).getTime() + soNgay * MOT_NGAY));
}

/** Mã kỳ theo tháng, dạng "2026-10". */
export function kyThang(iso: string): string {
  taoNgay(iso); // xác thực định dạng
  return iso.slice(0, 7);
}

/** Hiển thị kỳ tháng theo "tháng M/yyyy". */
export function hienThiKyThang(ky: string): string {
  const khop = /^(\d{4})-(\d{2})$/.exec(ky);
  if (!khop) return ky;
  return `tháng ${Number(khop[2])}/${khop[1]}`;
}

/** Ngày thứ `ngayTrongThang` của kỳ, dạng ISO. */
export function ngayTrongKy(ky: string, ngayTrongThang: number): string {
  const khop = /^(\d{4})-(\d{2})$/.exec(ky);
  if (!khop) throw new NgayKhongHopLe(ky);
  return `${ky}-${String(ngayTrongThang).padStart(2, '0')}`;
}

/** Kỳ tháng liền trước, ví dụ "2026-01" → "2025-12". */
export function kyThangTruoc(ky: string): string {
  const khop = /^(\d{4})-(\d{2})$/.exec(ky);
  if (!khop) throw new NgayKhongHopLe(ky);
  const nam = Number(khop[1]);
  const thang = Number(khop[2]);
  return thang === 1
    ? `${nam - 1}-12`
    : `${nam}-${String(thang - 1).padStart(2, '0')}`;
}
