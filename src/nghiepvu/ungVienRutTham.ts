// Lập danh sách ứng viên đầu vào cho một đợt rút thăm.
//
// Danh sách này phải tính được lại y hệt từ dữ liệu trong data/, nếu không thì
// nút "Chạy lại để kiểm chứng" mất ý nghĩa. Vì vậy quy tắc lọc phải rõ ràng và
// không phụ thuộc thời điểm chạy.

import type { DonVi, DotKiemTra, KetQuaThamDinh, NghiQuyet } from '../kieu';
import type { UngVienRutTham } from './rutTham';

export type ThamSoLapDanhSach = {
  nghiQuyet: readonly NghiQuyet[];
  donVi: readonly DonVi[];
  ketQua: readonly KetQuaThamDinh[];
  dotKiemTra: readonly DotKiemTra[];
  /** Kỳ đang rút; đợt của chính kỳ này không dùng để loại trừ. */
  ky: string;
};

/**
 * Quy tắc chọn ứng viên:
 *  1. Chỉ nghị quyết còn hiệu lực.
 *  2. Loại nghị quyết đã trúng ở một đợt kiểm tra khác.
 *  3. Loại nghị quyết của đơn vị không có trong danh sách đơn vị.
 */
export function lapDanhSachUngVien(thamSo: ThamSoLapDanhSach): UngVienRutTham[] {
  const { nghiQuyet, donVi, ketQua, dotKiemTra, ky } = thamSo;

  const daTrung = new Set<string>();
  for (const dot of dotKiemTra) {
    if (dot.ky === ky) continue;
    for (const id of dot.danhSachTrung) daTrung.add(id);
  }

  const donViTheoMa = new Map(donVi.map((d) => [d.ma, d]));
  const chuaDatGanNhat = lapDonViChuaDat(ketQua, nghiQuyet, ky);

  return nghiQuyet
    .filter((nq) => nq.hieuLuc === 'con_hieu_luc')
    .filter((nq) => !daTrung.has(nq.id))
    .filter((nq) => donViTheoMa.has(nq.maDonVi))
    .map((nq) => ({
      id: nq.id,
      maDonVi: nq.maDonVi,
      linhVuc: nq.linhVuc,
      lanKiemTraGanNhat: donViTheoMa.get(nq.maDonVi)?.lanKiemTraGanNhat ?? null,
      kyTruocChuaDat: chuaDatGanNhat.has(nq.maDonVi),
    }));
}

/**
 * Đơn vị bị xếp loại "chưa đạt" ở kết quả đã chốt gần nhất của chính đơn vị đó,
 * xét trong các kỳ TRƯỚC `truocKy`.
 *
 * Giới hạn theo kỳ là bắt buộc: nếu tính cả kết quả của chính kỳ đang rút hoặc
 * của kỳ sau, thì mỗi lần chấm điểm xong lại làm thay đổi trọng số của đợt cũ và
 * việc kiểm chứng sẽ không bao giờ khớp.
 *
 * Chỉ tính kết quả đã chốt — kết quả chưa chốt còn có thể thay đổi sau giải trình.
 */
export function lapDonViChuaDat(
  ketQua: readonly KetQuaThamDinh[],
  nghiQuyet: readonly NghiQuyet[],
  truocKy: string,
): Set<string> {
  const donViTheoNghiQuyet = new Map(nghiQuyet.map((nq) => [nq.id, nq.maDonVi]));
  const ganNhat = new Map<string, KetQuaThamDinh>();

  for (const kq of ketQua) {
    if (kq.trangThai !== 'da_chot') continue;
    if (kq.ky >= truocKy) continue;
    const maDonVi = donViTheoNghiQuyet.get(kq.idNghiQuyet);
    if (!maDonVi) continue;
    const dangCo = ganNhat.get(maDonVi);
    if (!dangCo || dangCo.ky < kq.ky) ganNhat.set(maDonVi, kq);
  }

  const chuaDat = new Set<string>();
  for (const [maDonVi, kq] of ganNhat) {
    if (kq.xepLoai === 'chua_dat') chuaDat.add(maDonVi);
  }
  return chuaDat;
}
