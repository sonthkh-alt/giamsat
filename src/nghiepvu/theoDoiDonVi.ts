// Phân mức "độ lâu chưa được rà soát" của từng đơn vị.
// Đây là dữ liệu cho lưới 166 ô ở trang tổng quan, phục vụ cách thức `luan_phien`.

import type { DonVi } from '../kieu';
import { soNgayDuongLich } from './hanXuLy';

export type MucTheoDoi = 'moi_ra_soat' | 'binh_thuong' | 'lau' | 'rat_lau' | 'chua_bao_gio';

export const NHAN_MUC_THEO_DOI: Readonly<Record<MucTheoDoi, string>> = {
  moi_ra_soat: 'Rà soát trong 30 ngày',
  binh_thuong: 'Rà soát trong 90 ngày',
  lau: 'Trên 90 ngày',
  rat_lau: 'Trên 180 ngày',
  chua_bao_gio: 'Chưa từng rà soát',
};

/** Ngưỡng ngày dương lịch kể từ lần rà soát gần nhất. */
export const NGUONG_THEO_DOI = { moi: 30, binhThuong: 90, lau: 180 } as const;

export function mucTheoDoi(donVi: DonVi, ngayThamChieu: string): MucTheoDoi {
  if (!donVi.lanRaSoatGanNhat) return 'chua_bao_gio';
  const soNgay = soNgayDuongLich(donVi.lanRaSoatGanNhat, ngayThamChieu);
  if (soNgay <= NGUONG_THEO_DOI.moi) return 'moi_ra_soat';
  if (soNgay <= NGUONG_THEO_DOI.binhThuong) return 'binh_thuong';
  if (soNgay <= NGUONG_THEO_DOI.lau) return 'lau';
  return 'rat_lau';
}

/** Số ngày kể từ lần rà soát gần nhất; null nếu chưa từng. */
export function soNgayTuLanRaSoat(donVi: DonVi, ngayThamChieu: string): number | null {
  if (!donVi.lanRaSoatGanNhat) return null;
  return soNgayDuongLich(donVi.lanRaSoatGanNhat, ngayThamChieu);
}

export function demTheoMuc(
  danhSach: readonly DonVi[],
  ngayThamChieu: string,
): Record<MucTheoDoi, number> {
  const dem: Record<MucTheoDoi, number> = {
    moi_ra_soat: 0,
    binh_thuong: 0,
    lau: 0,
    rat_lau: 0,
    chua_bao_gio: 0,
  };
  for (const donVi of danhSach) dem[mucTheoDoi(donVi, ngayThamChieu)] += 1;
  return dem;
}
