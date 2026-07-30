// Nhãn tiếng Việt của các giá trị liệt kê, dùng chung cho mọi màn hình.
// Mã trong dữ liệu là tiếng Việt không dấu; ra giao diện phải là tiếng Việt có dấu.

import type { HieuLuc, LinhVuc, LoaiDonVi, LoaiNghiQuyet, Vung } from '../kieu';

export const NHAN_LINH_VUC: Readonly<Record<LinhVuc, string>> = {
  ngan_sach: 'Ngân sách',
  dau_tu_cong: 'Đầu tư công',
  dat_dai: 'Đất đai',
  phi_le_phi: 'Phí, lệ phí',
  to_chuc_bo_may: 'Tổ chức bộ máy',
  che_do_chinh_sach: 'Chế độ, chính sách',
  khac: 'Lĩnh vực khác',
};

export const NHAN_LOAI_NGHI_QUYET: Readonly<Record<LoaiNghiQuyet, string>> = {
  quy_pham: 'Quy phạm pháp luật',
  ca_biet: 'Cá biệt',
};

export const NHAN_HIEU_LUC: Readonly<Record<HieuLuc, string>> = {
  con_hieu_luc: 'Còn hiệu lực',
  het_hieu_luc: 'Hết hiệu lực',
  da_thay_the: 'Đã được thay thế',
};

export const NHAN_LOAI_DON_VI: Readonly<Record<LoaiDonVi, string>> = {
  xa: 'Xã',
  phuong: 'Phường',
};

export const NHAN_VUNG: Readonly<Record<Vung, string>> = {
  dong_bang: 'Đồng bằng',
  ven_bien: 'Ven biển',
  mien_nui: 'Miền núi',
  chua_phan_loai: 'Chưa phân loại',
};

/** Dấu thanh và dấu phụ tổ hợp trong bảng Unicode. */
const DAU_TO_HOP = /[̀-ͯ]/g;

/** Bỏ dấu tiếng Việt để tìm kiếm không phụ thuộc dấu. */
export function boDau(chuoi: string): string {
  return chuoi.normalize('NFD').replace(DAU_TO_HOP, '').replace(/[đĐ]/g, 'd').toLowerCase();
}
