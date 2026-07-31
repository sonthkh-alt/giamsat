import type { Quyen, VaiTro } from '../kieu';

export const NHAN_VAI_TRO: Readonly<Record<VaiTro, string>> = {
  quan_tri: 'Quản trị hệ thống',
  thuong_truc: 'Thường trực Hội đồng nhân dân',
  ban: 'Ban của Hội đồng nhân dân',
  van_phong: 'Văn phòng',
  dai_bieu: 'Đại biểu Hội đồng nhân dân',
  don_vi: 'Thường trực Hội đồng nhân dân cấp xã',
};

export const NHAN_QUYEN: Readonly<Record<Quyen, string>> = {
  nhapNghiQuyet: 'Nhập và sửa nghị quyết',
  lapDanhMuc: 'Lập danh mục đề xuất',
  quyetDinhDanhMuc: 'Quyết định danh mục chính thức',
  thamDinh: 'Chấm điểm thẩm định',
  ghiGiaiTrinh: 'Ghi giải trình của đơn vị',
  chotKetQua: 'Chốt kết quả thẩm định',
  theoDoiNhiemVu: 'Ghi bước xử lý sau giám sát',
  quanLyHoSo: 'Nhập hồ sơ giám sát',
  quanTriHeThong: 'Quản trị hệ thống',
};

const BANG_QUYEN: Readonly<Record<VaiTro, readonly Quyen[]>> = {
  quan_tri: [
    'nhapNghiQuyet',
    'lapDanhMuc',
    'quyetDinhDanhMuc',
    'thamDinh',
    'ghiGiaiTrinh',
    'chotKetQua',
    'theoDoiNhiemVu',
    'quanLyHoSo',
    'quanTriHeThong',
  ],
  thuong_truc: ['quyetDinhDanhMuc', 'chotKetQua', 'theoDoiNhiemVu', 'quanLyHoSo'],
  ban: ['thamDinh', 'theoDoiNhiemVu', 'quanLyHoSo'],
  van_phong: ['nhapNghiQuyet', 'lapDanhMuc', 'ghiGiaiTrinh', 'theoDoiNhiemVu', 'quanLyHoSo'],
  dai_bieu: [],
  don_vi: ['ghiGiaiTrinh'],
};

export function quyenCuaVaiTro(vaiTro: VaiTro): readonly Quyen[] {
  return BANG_QUYEN[vaiTro];
}

export function coQuyen(vaiTro: VaiTro | null, quyen: Quyen): boolean {
  if (vaiTro === null) return false;
  return BANG_QUYEN[vaiTro].includes(quyen);
}

export function coBatKyQuyenGhi(vaiTro: VaiTro | null): boolean {
  if (vaiTro === null) return false;
  return BANG_QUYEN[vaiTro].length > 0;
}

export function thieuQuyen(quyen: Quyen): string {
  return `Tài khoản của bạn không có quyền "${NHAN_QUYEN[quyen]}". Liên hệ quản trị hệ thống nếu cần cấp thêm quyền.`;
}
