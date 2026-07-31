// Định nghĩa kiểu dữ liệu dùng chung.
// Định danh nghiệp vụ dùng tiếng Việt không dấu để đối chiếu với Quy chế.

// ---------------------------------------------------------------------------
// Xương sống: 12 nhóm nghiệp vụ giám sát
// ---------------------------------------------------------------------------

/**
 * Mã nhóm nghiệp vụ giám sát. Danh sách đầy đủ và bộ đầu mục của từng nhóm nằm
 * trong `data/khung-nghiep-vu.json` — kiểu ở đây chỉ khóa tập giá trị hợp lệ,
 * mọi thuộc tính khác của nhóm đều đọc từ cấu hình, không hard-code.
 */
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

/** Ba thuộc tính bắt buộc của mọi hồ sơ trong hệ thống. */
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
  /** Cảnh báo về dữ liệu nhạy cảm của nhóm, hiển thị nguyên văn ra giao diện. */
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

// ---------------------------------------------------------------------------
// Đơn vị hành chính
// ---------------------------------------------------------------------------

export type LoaiDonVi = 'xa' | 'phuong';

/**
 * Phân vùng địa lý. `chua_phan_loai` dùng khi chưa có căn cứ chính thức —
 * thà để trống còn hơn gán bừa một vùng cho xã, phường có thật.
 */
export type Vung = 'dong_bang' | 'ven_bien' | 'mien_nui' | 'chua_phan_loai';

export type DonVi = {
  ma: string; // "TH-001" — mã nội bộ, ổn định, dùng dựng id nghị quyết
  /** Mã đơn vị hành chính 5 chữ số theo danh mục của Tổng cục Thống kê. */
  maDvhc: string; // "14812"
  ten: string; // "Phường Hạc Thành"
  loai: LoaiDonVi;
  vung: Vung;
  /** Ngày rà soát gần nhất; null nếu chưa từng được rà soát. */
  lanRaSoatGanNhat: string | null; // ISO date YYYY-MM-DD
};

// ---------------------------------------------------------------------------
// Nghị quyết cấp xã (đối tượng của GS-02)
// ---------------------------------------------------------------------------

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
  ngayBanHanh: string;
  kyHop: string;
  loai: LoaiNghiQuyet;
  linhVuc: LinhVuc;
  trichYeu: string;
  hieuLuc: HieuLuc;
  /** Trích nguyên văn các căn cứ pháp lý viện dẫn trong văn bản. */
  canCuPhapLy: string[];
  /** Mã các thành phần hồ sơ trình đã có, đối chiếu với data/dauhieu-canhbao.json. */
  hoSoTrinh: string[];
  tepDinhKem: string[]; // đường dẫn trong data/files/
  ngayCapNhat: string;
};

// ---------------------------------------------------------------------------
// Cảnh báo và điểm rủi ro
// ---------------------------------------------------------------------------

export type MucDoCanhBao = 'cao' | 'trung_binh' | 'thap';

export type MaDauHieu =
  | 'can_cu_het_hieu_luc'
  | 'ten_khong_con_dung'
  | 'tham_quyen_theo_linh_vuc'
  | 'thanh_phan_ho_so'
  | 'the_thuc';

/**
 * Một dấu hiệu cảnh báo phát hiện được.
 *
 * `lyDo` và `viTri` là BẮT BUỘC: cảnh báo không giải thích được lý do và
 * không chỉ ra được chỗ nào trong văn bản thì không được hiển thị.
 */
export type CanhBao = {
  dauHieu: MaDauHieu;
  mucDo: MucDoCanhBao;
  diem: number;
  lyDo: string;
  viTri: {
    /** Tên trường dữ liệu chứa dấu hiệu, ví dụ "Căn cứ pháp lý". */
    truong: string;
    /** Trích dẫn đúng đoạn gây ra cảnh báo. */
    trichDan: string;
  };
};

// ---------------------------------------------------------------------------
// Đợt rà soát hằng tháng (GS-02)
// ---------------------------------------------------------------------------

export type MucDeXuat = {
  idNghiQuyet: string;
  cachThuc: CachThucLapDanhMuc;
  /** Bắt buộc. Hiển thị cho Thường trực khi quyết định. */
  lyDo: string;
  diemRuiRo: number;
  canhBao: CanhBao[];
  nguoiDeXuat: string;
};

export type HanhDongDanhMuc = 'them' | 'bo';

/** Nhật ký sửa danh mục: ai sửa, sửa lúc nào, vì sao. */
export type ThayDoiDanhMuc = {
  luc: string; // ISO date
  nguoi: string;
  hanhDong: HanhDongDanhMuc;
  idNghiQuyet: string;
  ghiChu: string;
};

export type TrangThaiDotRaSoat = 'de_xuat' | 'da_quyet_dinh' | 'dang_tham_dinh' | 'da_chot';

export type DotRaSoat = {
  ky: string; // "2026-10"
  thuocTinh: ThuocTinhHoSo;
  linhVucTrongTam: string | null;
  danhMucDeXuat: MucDeXuat[];
  danhMucChinhThuc: string[]; // id nghị quyết, sau khi Thường trực quyết định
  vanBanQuyetDinh: string; // số thông báo kết luận phiên họp
  ngayMoDot: string;
  hanThamDinh: string;
  trangThai: TrangThaiDotRaSoat;
  /** Seed của phần bổ sung ngẫu nhiên; null nếu danh mục không dùng cách này. */
  seedNgauNhien: string | null;
  /** Ban được phân công theo lĩnh vực: idNghiQuyet -> tên Ban. */
  phanCongBan: Record<string, string>;
  nhatKyThayDoi: ThayDoiDanhMuc[];
};

// ---------------------------------------------------------------------------
// Thẩm định
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Theo dõi sau giám sát (GS-11, GS-12)
// ---------------------------------------------------------------------------

export type TrangThaiNhiemVu =
  | 'hoan_thanh'
  | 'hoan_thanh_mot_phan'
  | 'chua_hoan_thanh'
  | 'qua_han'
  | 'khong_thuc_hien'
  | 'chua_dap_ung_yeu_cau';

export type BuocXuLy = {
  ma: MaBuocXuLy;
  ngay: string; // ISO date
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
  /**
   * Hạn giải trình theo Điều 40 Luật 121/2025/QH15, tính bằng NGÀY DƯƠNG LỊCH.
   * Đặt khi nhiệm vụ quá hạn và đã khởi tạo quy trình yêu cầu giải trình.
   */
  hanGiaiTrinhDieu40: string | null;
  ngayXacNhanHoanThanh: string | null;
};

// ---------------------------------------------------------------------------
// Cấu hình và nội dung phụ trợ
// ---------------------------------------------------------------------------

export type CauHinh = {
  /** Chuỗi muối công bố trước, dùng dựng seed cho phần bổ sung ngẫu nhiên. */
  maMuoi: string;
  /** Số văn bản mục tiêu của danh mục rà soát mỗi tháng. */
  soVanBanRaSoatMoiThang: number;
  /** Ngày trong tháng hệ thống tổng hợp và chạy phân tích. */
  ngayTongHop: number;
  /** Ngày trong tháng Văn phòng trình danh mục đề xuất. */
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
  ngay: string; // ISO date
  ten: string;
};

// ---------------------------------------------------------------------------
// Cấu hình dấu hiệu cảnh báo
// ---------------------------------------------------------------------------

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
