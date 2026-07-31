export type MaNhomGS =
  | 'GS-01'
  | 'GS-02'
  | 'GS-03'
  | 'GS-04'
  | 'GS-05'
  | 'GS-06'
  | 'GS-07'
  | 'GS-08'
  | 'GS-09'
  | 'GS-10'
  | 'GS-11'
  | 'GS-12';

export type ChuTheGiamSat = 'hdnd' | 'thuong_truc' | 'ban' | 'to_dai_bieu' | 'dai_bieu';

export type CapHanhChinh = 'tinh' | 'xa';

export type ThuocTinhHoSo = {
  nhomGS: MaNhomGS;
  chuThe: ChuTheGiamSat;
  cap: CapHanhChinh;
};

export type PhamViCapXa = 'day_du' | 'theo_quy_dinh' | 'khi_duoc_giao';

export type MucTrienKhai =
  | 'giai_doan_1'
  | 'giai_doan_2'
  | 'giai_doan_3'
  | 'khong_tren_kho_public';

export type KieuDauMuc = 'chuoi' | 'ngay' | 'so' | 'tep' | 'danh_sach';

export type DauMucDuLieu = {
  ma: string;
  ten: string;
  kieu: KieuDauMuc;
  batBuoc: boolean;
};

export type NhomNghiepVu = {
  ma: MaNhomGS;
  ten: string;
  canCu: string;
  chuTheApDung: ChuTheGiamSat[];
  capApDung: CapHanhChinh[];
  apDungCapXa: PhamViCapXa;
  trienKhai: MucTrienKhai;
  canhBaoDuLieu?: string;
  dauMuc: DauMucDuLieu[];
};

export type CachThucLapDanhMuc =
  | 'chuyen_de'
  | 'canh_bao'
  | 'de_nghi'
  | 'luan_phien'
  | 'ngau_nhien';

export type MoTaCachThuc = {
  ma: CachThucLapDanhMuc;
  ten: string;
  moTa: string;
  thuTuUuTien: number;
};

export type MaBuocXuLy =
  | 'don_doc_1'
  | 'don_doc_tiep'
  | 'kien_nghi_xu_ly'
  | 'phien_giai_trinh'
  | 'chat_van'
  | 'giam_sat_lai'
  | 'bao_cao_hdnd';

export type MoTaBuocXuLy = {
  ma: MaBuocXuLy;
  ten: string;
  thuTu: number;
};

export type KhungNghiepVu = {
  phienBan: string;
  ghiChu: string;
  chuThe: { ma: ChuTheGiamSat; ten: string }[];
  cap: { ma: CapHanhChinh; ten: string }[];
  nhom: NhomNghiepVu[];
  buocXuLySauGiamSat: MoTaBuocXuLy[];
  cachThucLapDanhMuc: MoTaCachThuc[];
};

export type VaiTro = 'quan_tri' | 'thuong_truc' | 'ban' | 'van_phong' | 'dai_bieu' | 'don_vi';

export type Quyen =
  | 'nhapNghiQuyet'
  | 'lapDanhMuc'
  | 'quyetDinhDanhMuc'
  | 'thamDinh'
  | 'ghiGiaiTrinh'
  | 'chotKetQua'
  | 'theoDoiNhiemVu'
  | 'quanLyHoSo'
  | 'quanTriHeThong';

export type TaiKhoan = {
  tenDangNhap: string;
  hoTen: string;
  vaiTro: VaiTro;
  maDonVi: string | null;
  muoi: string;
  bam: string;
  hoatDong: boolean;
  ngayCap: string;
};

export type KhoTaiKhoan = {
  phienBan: string;
  thamSoBam: { thuatToan: string; soVongLap: number };
  taiKhoan: TaiKhoan[];
};

export type PhienDangNhap = {
  tenDangNhap: string;
  hoTen: string;
  vaiTro: VaiTro;
  maDonVi: string | null;
};

export type LoaiDonVi = 'xa' | 'phuong';

export type Vung = 'dong_bang' | 'ven_bien' | 'mien_nui' | 'chua_phan_loai';

export type DonVi = {
  ma: string;
  maDvhc: string;
  ten: string;
  loai: LoaiDonVi;
  vung: Vung;
  lanRaSoatGanNhat: string | null;
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
  id: string;
  maDonVi: string;
  so: string;
  kyHieu: string;
  ngayBanHanh: string;
  kyHop: string;
  loai: LoaiNghiQuyet;
  linhVuc: LinhVuc;
  trichYeu: string;
  hieuLuc: HieuLuc;
  canCuPhapLy: string[];
  hoSoTrinh: string[];
  tepDinhKem: string[];
  ngayCapNhat: string;
};

export type MucDoCanhBao = 'cao' | 'trung_binh' | 'thap';

export type MaDauHieu =
  | 'can_cu_het_hieu_luc'
  | 'ten_khong_con_dung'
  | 'tham_quyen_theo_linh_vuc'
  | 'thanh_phan_ho_so'
  | 'the_thuc';

export type CanhBao = {
  dauHieu: MaDauHieu;
  mucDo: MucDoCanhBao;
  diem: number;
  lyDo: string;
  viTri: {
    truong: string;
    trichDan: string;
  };
};

export type MucDeXuat = {
  idNghiQuyet: string;
  cachThuc: CachThucLapDanhMuc;
  lyDo: string;
  diemRuiRo: number;
  canhBao: CanhBao[];
  nguoiDeXuat: string;
};

export type HanhDongDanhMuc = 'them' | 'bo';

export type ThayDoiDanhMuc = {
  luc: string;
  nguoi: string;
  hanhDong: HanhDongDanhMuc;
  idNghiQuyet: string;
  ghiChu: string;
};

export type TrangThaiDotRaSoat = 'de_xuat' | 'da_quyet_dinh' | 'dang_tham_dinh' | 'da_chot';

export type DotRaSoat = {
  ky: string;
  thuocTinh: ThuocTinhHoSo;
  linhVucTrongTam: string | null;
  danhMucDeXuat: MucDeXuat[];
  danhMucChinhThuc: string[];
  vanBanQuyetDinh: string;
  ngayMoDot: string;
  hanThamDinh: string;
  trangThai: TrangThaiDotRaSoat;
  seedNgauNhien: string | null;
  phanCongBan: Record<string, string>;
  nhatKyThayDoi: ThayDoiDanhMuc[];
};

export type DiemNhom = {
  thamQuyenHinhThuc: number;
  trinhTuThuTuc: number;
  noiDungHopPhap: number;
  theThucTrinhBay: number;
  khaThiThucTien: number;
};

export type XepLoai = 'tot' | 'kha' | 'dat' | 'chua_dat';

export type KetQuaThamDinh = {
  idNghiQuyet: string;
  ky: string;
  diemNhom: DiemNhom;
  tongDiem: number;
  xepLoai: XepLoai;
  coNoiDungTraiPhapLuat: boolean;
  nhanXet: string;
  nguoiThamDinh: string;
  banThamDinh: string;
  hanGiaiTrinh: string;
  giaiTrinh: string | null;
  trangThai: 'chua_chot' | 'da_chot';
};

export type NhomTieuChi = {
  ma: keyof DiemNhom;
  ten: string;
  diemToiDa: number;
  tieuChi: { ma: string; noiDung: string; diemToiDa: number }[];
};

export type TrangThaiNhiemVu =
  | 'hoan_thanh'
  | 'hoan_thanh_mot_phan'
  | 'chua_hoan_thanh'
  | 'qua_han'
  | 'khong_thuc_hien'
  | 'chua_dap_ung_yeu_cau';

export type BuocXuLy = {
  ma: MaBuocXuLy;
  ngay: string;
  soVanBan: string;
  ghiChu: string;
};

export type NhiemVuSauGiamSat = {
  id: string;
  thuocTinh: ThuocTinhHoSo;
  nguonGoc: { nhomGS: MaNhomGS; soVanBan: string; ngayBanHanh: string };
  noiDungYeuCau: string;
  coQuanChuTri: string;
  coQuanPhoiHop: string[];
  nguoiChiuTrachNhiem: string;
  sanPhamPhaiHoanThanh: string;
  hanHoanThanh: string;
  trangThai: TrangThaiNhiemVu;
  minhChung: string[];
  buocXuLy: BuocXuLy[];
  hanGiaiTrinhDieu40: string | null;
  ngayXacNhanHoanThanh: string | null;
};

export type TrangThaiHoSo = 'du_thao' | 'dang_thuc_hien' | 'hoan_thanh';

export type HoSoGiamSat = {
  id: string;
  thuocTinh: ThuocTinhHoSo;
  tieuDe: string;
  ky: string;
  ngayLap: string;
  nguoiLap: string;
  trangThai: TrangThaiHoSo;
  dauMuc: Record<string, string>;
  tepDinhKem: string[];
  ngayCapNhat: string;
};

export type CauHinh = {
  maMuoi: string;
  soVanBanRaSoatMoiThang: number;
  ngayTongHop: number;
  ngayTrinhDanhMuc: number;
  chuKho: string;
  tenKho: string;
  nhanh: string;
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
  ngay: string;
  ten: string;
};

export type MucCauHinhDauHieu = {
  diem: number;
  mucDo: MucDoCanhBao;
  ghiChu: string;
};

export type CauHinhDauHieu = {
  phienBan: string;
  ghiChu: string;
  canCuHetHieuLuc: MucCauHinhDauHieu & {
    danhMuc: { mau: string; lyDo: string; thayTheBoi: string }[];
  };
  tenKhongConDung: MucCauHinhDauHieu & {
    danhMuc: { mau: string; lyDo: string }[];
  };
  thamQuyenTheoLinhVuc: MucCauHinhDauHieu & {
    quyTac: { linhVuc: LinhVuc; loai: LoaiNghiQuyet; lyDo: string }[];
  };
  thanhPhanHoSo: MucCauHinhDauHieu & {
    batBuoc: { ma: string; ten: string }[];
  };
  theThuc: MucCauHinhDauHieu & {
    quyTac: { ma: string; mauKyHieu?: string; lyDo: string }[];
  };
};
