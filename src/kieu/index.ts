// Định nghĩa kiểu dữ liệu dùng chung.
// Định danh nghiệp vụ dùng tiếng Việt không dấu để đối chiếu với Quy chế.

export type LoaiDonVi = 'xa' | 'phuong';
export type Vung = 'dong_bang' | 'ven_bien' | 'mien_nui';

export type DonVi = {
  ma: string; // "TH-001"
  ten: string; // "Phường Hạc Thành"
  loai: LoaiDonVi;
  vung: Vung;
  lanKiemTraGanNhat: string | null; // ISO date YYYY-MM-DD
};

export type LoaiNghiQuyet = 'quy_pham' | 'ca_biet';

export type LinhVuc =
  | 'ngan_sach'
  | 'dau_tu_cong'
  | 'dat_dai'
  | 'phi_le_phi'
  | 'to_chuc_bo_may'
  | 'che_do_chinh_sach'
  | 'khac';

export type HieuLuc = 'con_hieu_luc' | 'het_hieu_luc' | 'da_thay_the';

export type NghiQuyet = {
  id: string; // "<maDonVi>-<so>-<nam>"
  maDonVi: string;
  so: string; // "12"
  kyHieu: string; // "NQ-HĐND"
  ngayBanHanh: string; // ISO date
  kyHop: string;
  loai: LoaiNghiQuyet;
  linhVuc: LinhVuc;
  trichYeu: string;
  hieuLuc: HieuLuc;
  tepDinhKem: string[]; // đường dẫn trong data/files/
  ngayCapNhat: string; // ISO date
};

/** Ảnh chụp một ứng viên tại thời điểm rút thăm, đủ để tính lại trọng số. */
export type AnhChupUngVien = {
  id: string;
  maDonVi: string;
  linhVuc: LinhVuc;
  lanKiemTraGanNhat: string | null;
  kyTruocChuaDat: boolean;
};

export type DotKiemTra = {
  ky: string; // "2026-W31"
  ngayRutTham: string; // ISO date
  seed: string; // công khai, để kiểm chứng lại
  thamSoTrongSo: Record<string, number>;
  danhSachTrung: string[]; // id nghị quyết
  nguoiPhanCong: Record<string, string>; // idNghiQuyet -> tên người thẩm định
  /** Danh sách id ứng viên đầu vào, ghi lại để bất kỳ ai cũng tính lại được. */
  ungVien?: string[];
  /**
   * Ảnh chụp toàn bộ dữ liệu đầu vào tại thời điểm rút thăm.
   * Đây mới là căn cứ kiểm chứng chắc chắn: dữ liệu gốc trong data/ còn thay đổi
   * theo thời gian, còn ảnh chụp này nằm cố định trong lịch sử kho.
   */
  anhChupUngVien?: AnhChupUngVien[];
  soLuongCanRut?: number;
};

export type DiemNhom = {
  thamQuyenHinhThuc: number; // tối đa 20
  trinhTuThuTuc: number; // tối đa 20
  noiDungHopPhap: number; // tối đa 30
  theThucTrinhBay: number; // tối đa 10
  khaThiThucTien: number; // tối đa 20
};

export type XepLoai = 'tot' | 'kha' | 'dat' | 'chua_dat';

export type KetQuaThamDinh = {
  idNghiQuyet: string;
  ky: string;
  diemNhom: DiemNhom; // tổng 100
  tongDiem: number;
  xepLoai: XepLoai;
  coNoiDungTraiPhapLuat: boolean; // true ⇒ ép xuống "chua_dat"
  nhanXet: string;
  nguoiThamDinh: string;
  hanGiaiTrinh: string; // ISO date
  giaiTrinh: string | null;
  trangThai: 'chua_chot' | 'da_chot';
};

export type TrangThaiKienNghi =
  | 'chua_thuc_hien'
  | 'dang_thuc_hien'
  | 'da_hoan_thanh'
  | 'khong_con_phu_hop';

export type KienNghi = {
  id: string;
  nguonGiamSat: string;
  noiDung: string;
  coQuanChiuTrachNhiem: string;
  hanThucHien: string; // ISO date
  trangThai: TrangThaiKienNghi;
  minhChung: string[];
  ngayXacNhan: string | null;
};

export type NhomTieuChi = {
  ma: keyof DiemNhom;
  ten: string;
  diemToiDa: number;
  tieuChi: { ma: string; noiDung: string; diemToiDa: number }[];
};

export type CauHinh = {
  /** Chuỗi muối công bố trước, dùng dựng seed rút thăm. */
  maMuoi: string;
  soNghiQuyetRutMoiTuan: number;
  chuKho: string; // "sonthkh-alt"
  tenKho: string; // "giamsat"
  nhanh: string; // "main"
  /** Bật khi hệ thống đang chạy trên bộ dữ liệu giả lập trong data/mau/. */
  duLieuGiaLap: boolean;
  namLamViec: number;
};

export type HoiDap = {
  id: string;
  cauHoi: string;
  traLoi: string;
  chuDe: string;
  canCuPhapLy: string[];
  ngayCapNhat: string;
};

export type VanBanMau = {
  id: string;
  ten: string;
  moTa: string;
  duongDan: string;
  ngayCapNhat: string;
};

export type BanTin = {
  id: string;
  tieuDe: string;
  noiDung: string;
  ngayDang: string;
  mucDo: 'thuong' | 'quan_trong';
};

export type NgayLe = {
  ngay: string; // ISO date
  ten: string;
};
