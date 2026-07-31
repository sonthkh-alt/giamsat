// Theo dõi nhiệm vụ sau giám sát (GS-11, GS-12).
//
// NGUYÊN TẮC: hồ sơ không kết thúc khi ban hành kết luận, mà kết thúc khi kiến
// nghị được thực hiện xong.

import type { MaBuocXuLy, NgayLe, NhiemVuSauGiamSat, TrangThaiNhiemVu } from '../kieu';
import {
  congNgayDuongLich,
  mucCanhBao,
  soNgayLamViecConLai,
  HAN_GIAI_TRINH_DIEU_40,
  HAN_GIAI_TRINH_DIEU_40_PHUC_TAP,
  type MucCanhBao,
} from './hanXuLy';

export const NHAN_TRANG_THAI_NHIEM_VU: Readonly<Record<TrangThaiNhiemVu, string>> = {
  hoan_thanh: 'Hoàn thành',
  hoan_thanh_mot_phan: 'Hoàn thành một phần',
  chua_hoan_thanh: 'Chưa hoàn thành',
  qua_han: 'Quá hạn',
  khong_thuc_hien: 'Không thực hiện',
  chua_dap_ung_yeu_cau: 'Chưa đáp ứng yêu cầu',
};

/** Bảy bước xử lý theo mục 3.4 của Quy chế, đúng thứ tự. */
export const THU_TU_BUOC_XU_LY: readonly MaBuocXuLy[] = [
  'don_doc_1',
  'don_doc_tiep',
  'kien_nghi_xu_ly',
  'phien_giai_trinh',
  'chat_van',
  'giam_sat_lai',
  'bao_cao_hdnd',
];

export const NHAN_BUOC_XU_LY: Readonly<Record<MaBuocXuLy, string>> = {
  don_doc_1: 'Đôn đốc lần 1',
  don_doc_tiep: 'Đôn đốc lần tiếp theo',
  kien_nghi_xu_ly: 'Kiến nghị cấp có thẩm quyền xử lý',
  phien_giai_trinh: 'Đưa vào phiên giải trình',
  chat_van: 'Đưa vào nội dung chất vấn',
  giam_sat_lai: 'Tổ chức giám sát lại',
  bao_cao_hdnd: 'Báo cáo Hội đồng nhân dân xem xét',
};

/** Trạng thái coi là còn phải theo dõi. */
export const TRANG_THAI_CON_MO: readonly TrangThaiNhiemVu[] = [
  'chua_hoan_thanh',
  'hoan_thanh_mot_phan',
  'qua_han',
  'khong_thuc_hien',
  'chua_dap_ung_yeu_cau',
];

export function conPhaiTheoDoi(nhiemVu: NhiemVuSauGiamSat): boolean {
  return TRANG_THAI_CON_MO.includes(nhiemVu.trangThai);
}

/**
 * Mức cảnh báo về hạn hoàn thành, tính theo ngày làm việc (nhắc trước 15 / 7 / 3).
 * Nhiệm vụ đã hoàn thành không còn cảnh báo.
 */
export function mucCanhBaoNhiemVu(
  nhiemVu: NhiemVuSauGiamSat,
  ngayThamChieu: string,
  ngayLe: readonly NgayLe[] = [],
): MucCanhBao | null {
  if (!conPhaiTheoDoi(nhiemVu)) return null;
  return mucCanhBao(nhiemVu.hanHoanThanh, ngayThamChieu, ngayLe);
}

export function soNgayConLai(
  nhiemVu: NhiemVuSauGiamSat,
  ngayThamChieu: string,
  ngayLe: readonly NgayLe[] = [],
): number {
  return soNgayLamViecConLai(nhiemVu.hanHoanThanh, ngayThamChieu, ngayLe);
}

/**
 * Bước xử lý tiếp theo nên áp dụng, dựa trên bước đã làm gần nhất.
 * null nghĩa là đã đi hết bảy bước.
 */
export function buocTiepTheo(nhiemVu: NhiemVuSauGiamSat): MaBuocXuLy | null {
  const daLam = new Set(nhiemVu.buocXuLy.map((b) => b.ma));
  for (const buoc of THU_TU_BUOC_XU_LY) {
    if (!daLam.has(buoc)) return buoc;
  }
  return null;
}

/**
 * Hạn giải trình theo Điều 40 Luật 121/2025/QH15.
 *
 * Luật ghi "15 ngày", "trường hợp phức tạp không quá 30 ngày" — đây là NGÀY
 * DƯƠNG LỊCH, không phải ngày làm việc. Đó là ngoại lệ duy nhất so với quy tắc
 * chung ở mục 3.5.
 */
export function tinhHanGiaiTrinhDieu40(tuNgay: string, phucTap = false): string {
  return congNgayDuongLich(
    tuNgay,
    phucTap ? HAN_GIAI_TRINH_DIEU_40_PHUC_TAP : HAN_GIAI_TRINH_DIEU_40,
  );
}

/**
 * Nhiệm vụ quá hạn thì chuyển trạng thái `qua_han` và khởi tạo quy trình yêu cầu
 * giải trình theo Điều 40. Hàm thuần: trả về bản ghi mới, không sửa tại chỗ.
 */
export function danhDauQuaHan(
  nhiemVu: NhiemVuSauGiamSat,
  ngayThamChieu: string,
  ngayLe: readonly NgayLe[] = [],
  phucTap = false,
): NhiemVuSauGiamSat {
  if (!conPhaiTheoDoi(nhiemVu)) return nhiemVu;
  if (mucCanhBao(nhiemVu.hanHoanThanh, ngayThamChieu, ngayLe) !== 'qua_han') return nhiemVu;
  if (nhiemVu.trangThai === 'qua_han' && nhiemVu.hanGiaiTrinhDieu40 !== null) return nhiemVu;
  return {
    ...nhiemVu,
    trangThai: 'qua_han',
    hanGiaiTrinhDieu40:
      nhiemVu.hanGiaiTrinhDieu40 ?? tinhHanGiaiTrinhDieu40(ngayThamChieu, phucTap),
  };
}

export type ThongKeNhiemVu = {
  tong: number;
  theoTrangThai: Record<TrangThaiNhiemVu, number>;
  conTheoDoi: number;
  quaHan: number;
  /** Tỷ lệ phần trăm hoàn thành đúng hạn; null khi chưa có nhiệm vụ nào hoàn thành. */
  tyLeDungHan: number | null;
};

export function thongKeNhiemVu(
  danhSach: readonly NhiemVuSauGiamSat[],
  ngayThamChieu: string,
  ngayLe: readonly NgayLe[] = [],
): ThongKeNhiemVu {
  const theoTrangThai: Record<TrangThaiNhiemVu, number> = {
    hoan_thanh: 0,
    hoan_thanh_mot_phan: 0,
    chua_hoan_thanh: 0,
    qua_han: 0,
    khong_thuc_hien: 0,
    chua_dap_ung_yeu_cau: 0,
  };
  for (const nv of danhSach) theoTrangThai[nv.trangThai] += 1;

  const daHoanThanh = danhSach.filter((nv) => nv.trangThai === 'hoan_thanh');
  const dungHan = daHoanThanh.filter(
    (nv) => nv.ngayXacNhanHoanThanh !== null && nv.ngayXacNhanHoanThanh <= nv.hanHoanThanh,
  );

  return {
    tong: danhSach.length,
    theoTrangThai,
    conTheoDoi: danhSach.filter(conPhaiTheoDoi).length,
    quaHan: danhSach.filter(
      (nv) => conPhaiTheoDoi(nv) && mucCanhBaoNhiemVu(nv, ngayThamChieu, ngayLe) === 'qua_han',
    ).length,
    tyLeDungHan:
      daHoanThanh.length === 0
        ? null
        : Math.round((dungHan.length / daHoanThanh.length) * 100),
  };
}
