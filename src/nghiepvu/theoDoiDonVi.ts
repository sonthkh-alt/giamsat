// Phân mức "độ lâu chưa kiểm tra" của từng đơn vị — dữ liệu cho lưới 166 ô.

import type { DonVi } from '../kieu';
import { soNgayDuongLich } from './hanXuLy';

export type MucTheoDoi = 'moi_kiem_tra' | 'binh_thuong' | 'lau' | 'rat_lau' | 'chua_bao_gio';

export const NHAN_MUC_THEO_DOI: Readonly<Record<MucTheoDoi, string>> = {
  moi_kiem_tra: 'Kiểm tra trong 30 ngày',
  binh_thuong: 'Kiểm tra trong 90 ngày',
  lau: 'Trên 90 ngày',
  rat_lau: 'Trên 180 ngày',
  chua_bao_gio: 'Chưa từng kiểm tra',
};

/** Ngưỡng ngày dương lịch kể từ lần kiểm tra gần nhất. */
export const NGUONG_THEO_DOI = { moi: 30, binhThuong: 90, lau: 180 } as const;

export function mucTheoDoi(donVi: DonVi, ngayThamChieu: string): MucTheoDoi {
  if (!donVi.lanKiemTraGanNhat) return 'chua_bao_gio';
  const soNgay = soNgayDuongLich(donVi.lanKiemTraGanNhat, ngayThamChieu);
  if (soNgay <= NGUONG_THEO_DOI.moi) return 'moi_kiem_tra';
  if (soNgay <= NGUONG_THEO_DOI.binhThuong) return 'binh_thuong';
  if (soNgay <= NGUONG_THEO_DOI.lau) return 'lau';
  return 'rat_lau';
}

/** Số ngày kể từ lần kiểm tra gần nhất; null nếu chưa từng kiểm tra. */
export function soNgayTuLanKiemTra(donVi: DonVi, ngayThamChieu: string): number | null {
  if (!donVi.lanKiemTraGanNhat) return null;
  return soNgayDuongLich(donVi.lanKiemTraGanNhat, ngayThamChieu);
}

export function demTheoMuc(
  danhSach: readonly DonVi[],
  ngayThamChieu: string,
): Record<MucTheoDoi, number> {
  const dem: Record<MucTheoDoi, number> = {
    moi_kiem_tra: 0,
    binh_thuong: 0,
    lau: 0,
    rat_lau: 0,
    chua_bao_gio: 0,
  };
  for (const donVi of danhSach) dem[mucTheoDoi(donVi, ngayThamChieu)] += 1;
  return dem;
}
