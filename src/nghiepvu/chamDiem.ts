// Chấm điểm thẩm định nghị quyết. Thang 100 điểm, chia năm nhóm.

import type { DiemNhom, XepLoai } from '../kieu';

export const DIEM_TOI_DA: Readonly<Record<keyof DiemNhom, number>> = {
  thamQuyenHinhThuc: 20,
  trinhTuThuTuc: 20,
  noiDungHopPhap: 30,
  theThucTrinhBay: 10,
  khaThiThucTien: 20,
};

export const TEN_NHOM: Readonly<Record<keyof DiemNhom, string>> = {
  thamQuyenHinhThuc: 'Thẩm quyền và hình thức văn bản',
  trinhTuThuTuc: 'Trình tự, thủ tục ban hành',
  noiDungHopPhap: 'Nội dung hợp hiến, hợp pháp, thống nhất',
  theThucTrinhBay: 'Thể thức và kỹ thuật trình bày',
  khaThiThucTien: 'Tính khả thi, phù hợp thực tiễn và tổ chức thực hiện',
};

export const MA_NHOM = Object.keys(DIEM_TOI_DA) as (keyof DiemNhom)[];

export const NHAN_XEP_LOAI: Readonly<Record<XepLoai, string>> = {
  tot: 'Tốt',
  kha: 'Khá',
  dat: 'Đạt',
  chua_dat: 'Chưa đạt',
};

/** Ngưỡng xếp loại: Tốt ≥ 90 · Khá 75–89 · Đạt 60–74 · Chưa đạt < 60. */
export const NGUONG = { tot: 90, kha: 75, dat: 60 } as const;

export function tongDiem(diemNhom: DiemNhom): number {
  return MA_NHOM.reduce((tong, ma) => tong + diemNhom[ma], 0);
}

/**
 * Kiểm tra điểm từng nhóm nằm trong khoảng cho phép.
 * Trả về danh sách lỗi bằng tiếng Việt, rỗng nghĩa là hợp lệ.
 */
export function kiemTraDiem(diemNhom: DiemNhom): string[] {
  const loi: string[] = [];
  for (const ma of MA_NHOM) {
    const diem = diemNhom[ma];
    const toiDa = DIEM_TOI_DA[ma];
    if (!Number.isFinite(diem)) {
      loi.push(`Nhóm "${TEN_NHOM[ma]}" chưa có điểm.`);
    } else if (diem < 0 || diem > toiDa) {
      loi.push(`Nhóm "${TEN_NHOM[ma]}" phải trong khoảng 0–${toiDa} điểm, đang nhập ${diem}.`);
    }
  }
  return loi;
}

/**
 * Xếp loại theo tổng điểm.
 * Nếu nghị quyết có nội dung trái pháp luật thì luôn là "chưa đạt", bất kể tổng điểm.
 */
export function xepLoai(tong: number, coNoiDungTraiPhapLuat: boolean): XepLoai {
  if (coNoiDungTraiPhapLuat) return 'chua_dat';
  if (tong >= NGUONG.tot) return 'tot';
  if (tong >= NGUONG.kha) return 'kha';
  if (tong >= NGUONG.dat) return 'dat';
  return 'chua_dat';
}

/** Tính một lượt tổng điểm và xếp loại từ bảng điểm nhóm. */
export function chamDiem(
  diemNhom: DiemNhom,
  coNoiDungTraiPhapLuat: boolean,
): { tongDiem: number; xepLoai: XepLoai } {
  const tong = tongDiem(diemNhom);
  return { tongDiem: tong, xepLoai: xepLoai(tong, coNoiDungTraiPhapLuat) };
}

export const DIEM_NHOM_RONG: DiemNhom = {
  thamQuyenHinhThuc: 0,
  trinhTuThuTuc: 0,
  noiDungHopPhap: 0,
  theThucTrinhBay: 0,
  khaThiThucTien: 0,
};
