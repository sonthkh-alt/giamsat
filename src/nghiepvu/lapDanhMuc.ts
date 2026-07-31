// Lập danh mục nghị quyết cấp xã đề xuất rà soát hằng tháng (GS-02).
//
// NGUYÊN TẮC KHÔNG ĐƯỢC LÀM SAI:
// Không có bốc thăm tự động. Không có Math.random() quyết định thay con người.
// Thẩm quyền quyết định danh mục thuộc Thường trực HĐND tỉnh. Phần mềm chỉ tập
// hợp, phân tích, xếp hạng và TRÌNH danh mục đề xuất; mỗi mục bắt buộc nêu rõ
// áp dụng cách thức nào và vì sao.
//
// Cách thức `ngau_nhien` chỉ bổ sung phần còn lại của danh mục, không thay thế
// bốn cách trên, và vẫn ghi seed để tra lại được.

import type {
  CachThucLapDanhMuc,
  CanhBao,
  CauHinhDauHieu,
  DonVi,
  DotRaSoat,
  LinhVuc,
  MucDeXuat,
  NgayLe,
  NghiQuyet,
  ThayDoiDanhMuc,
} from '../kieu';
import { congNgayLamViec, ngayTrongKy, soNgayDuongLich, HAN_THAM_DINH } from './hanXuLy';
import { NHAN_LINH_VUC } from './nhan';
import { tomTatCanhBao, xepHangTheoRuiRo } from './xepHangRuiRo';

/**
 * Tỷ lệ mục tiêu của bốn cách thức chủ động trong danh mục.
 * Phần chưa dùng hết được chuyển sang cách thức kế tiếp; còn thừa bao nhiêu thì
 * `ngau_nhien` bổ sung nốt.
 */
export const TY_LE_CACH_THUC: Readonly<Record<Exclude<CachThucLapDanhMuc, 'ngau_nhien'>, number>> =
  {
    chuyen_de: 0.3,
    canh_bao: 0.3,
    de_nghi: 0.2,
    luan_phien: 0.2,
  };

/** Thứ tự áp dụng các cách thức, đúng như mục 3.1 của Quy chế. */
export const THU_TU_CACH_THUC: readonly CachThucLapDanhMuc[] = [
  'chuyen_de',
  'canh_bao',
  'de_nghi',
  'luan_phien',
  'ngau_nhien',
];

export const NHAN_CACH_THUC: Readonly<Record<CachThucLapDanhMuc, string>> = {
  chuyen_de: 'Theo chuyên đề',
  canh_bao: 'Theo dấu hiệu cảnh báo',
  de_nghi: 'Theo đề nghị',
  luan_phien: 'Luân phiên',
  ngau_nhien: 'Ngẫu nhiên bổ sung',
};

export type DeNghiRaSoat = {
  idNghiQuyet: string;
  nguoiDeNghi: string;
  lyDo: string;
};

// ---------------------------------------------------------------------------
// Bộ sinh số có seed — chỉ dùng cho phần bổ sung ngẫu nhiên
// ---------------------------------------------------------------------------

/** Băm chuỗi seed thành số nguyên 32 bit (FNV-1a). */
export function bam32(chuoi: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < chuoi.length; i += 1) {
    h ^= chuoi.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — nhỏ, tái lập được trên mọi trình duyệt. */
export function mulberry32(hat: number): () => number {
  let a = hat >>> 0;
  return function ngauNhien(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** seed = "<kỳ>-<mã muối>". Mã muối công bố trước trong data/cauhinh.json. */
export function taoSeed(ky: string, maMuoi: string): string {
  if (!maMuoi) {
    throw new Error('Thiếu mã muối. Mã muối phải được công bố trước trong data/cauhinh.json.');
  }
  return `${ky}-${maMuoi}`;
}

// ---------------------------------------------------------------------------
// Mốc thời gian của chu kỳ tháng
// ---------------------------------------------------------------------------

export type MocChuKy = {
  ky: string;
  ngayTongHop: string;
  ngayTrinhDanhMuc: string;
};

/** Các mốc cố định trong tháng: ngày tổng hợp và ngày trình danh mục. */
export function mocChuKy(
  ky: string,
  cauHinh: { ngayTongHop: number; ngayTrinhDanhMuc: number },
): MocChuKy {
  return {
    ky,
    ngayTongHop: ngayTrongKy(ky, cauHinh.ngayTongHop),
    ngayTrinhDanhMuc: ngayTrongKy(ky, cauHinh.ngayTrinhDanhMuc),
  };
}

/** Hạn hoàn thành thẩm định: 10 ngày làm việc kể từ ngày mở đợt. */
export function tinhHanThamDinh(ngayMoDot: string, ngayLe: readonly NgayLe[] = []): string {
  return congNgayLamViec(ngayMoDot, HAN_THAM_DINH, ngayLe);
}

// ---------------------------------------------------------------------------
// Lập danh mục đề xuất
// ---------------------------------------------------------------------------

export type ThamSoLapDanhMuc = {
  ky: string;
  nghiQuyet: readonly NghiQuyet[];
  donVi: readonly DonVi[];
  /** Các đợt đã có, để loại văn bản đã rà soát ở đợt khác. */
  dotDaCo: readonly DotRaSoat[];
  cauHinhDauHieu: CauHinhDauHieu;
  linhVucTrongTam: LinhVuc | null;
  deNghi: readonly DeNghiRaSoat[];
  soLuongMucTieu: number;
  maMuoi: string;
  nguoiDeXuat: string;
  ngayThamChieu: string;
};

export type KetQuaLapDanhMuc = {
  ky: string;
  danhMucDeXuat: MucDeXuat[];
  /** null khi danh mục không cần bổ sung ngẫu nhiên. */
  seedNgauNhien: string | null;
  soUngVien: number;
  /** Số mục mỗi cách thức đóng góp, để giải trình cách lập danh mục. */
  thongKeCachThuc: Record<CachThucLapDanhMuc, number>;
};

/**
 * Ứng viên của một kỳ: nghị quyết còn hiệu lực, thuộc đơn vị có trong danh sách,
 * và chưa nằm trong danh mục chính thức của một đợt khác.
 */
export function lapDanhSachUngVien(
  nghiQuyet: readonly NghiQuyet[],
  donVi: readonly DonVi[],
  dotDaCo: readonly DotRaSoat[],
  ky: string,
): NghiQuyet[] {
  const daRaSoat = new Set<string>();
  for (const dot of dotDaCo) {
    if (dot.ky === ky) continue;
    for (const id of dot.danhMucChinhThuc) daRaSoat.add(id);
  }
  const maDonVi = new Set(donVi.map((d) => d.ma));
  return nghiQuyet
    .filter((nq) => nq.hieuLuc === 'con_hieu_luc')
    .filter((nq) => maDonVi.has(nq.maDonVi))
    .filter((nq) => !daRaSoat.has(nq.id));
}

type UngVien = {
  nghiQuyet: NghiQuyet;
  canhBao: CanhBao[];
  diemRuiRo: number;
};

function suatMucTieu(tong: number, tyLe: number): number {
  return Math.max(1, Math.round(tong * tyLe));
}

/**
 * Lập danh mục đề xuất cho một kỳ. Hàm thuần, tất định: cùng đầu vào luôn cho
 * cùng danh mục, kể cả phần bổ sung ngẫu nhiên.
 */
export function lapDanhMucDeXuat(thamSo: ThamSoLapDanhMuc): KetQuaLapDanhMuc {
  const {
    ky,
    nghiQuyet,
    donVi,
    dotDaCo,
    cauHinhDauHieu,
    linhVucTrongTam,
    deNghi,
    soLuongMucTieu,
    maMuoi,
    nguoiDeXuat,
    ngayThamChieu,
  } = thamSo;

  if (!Number.isInteger(soLuongMucTieu) || soLuongMucTieu < 0) {
    throw new Error(`Số lượng mục tiêu phải là số nguyên không âm, nhận được ${soLuongMucTieu}.`);
  }

  const ungVienGoc = lapDanhSachUngVien(nghiQuyet, donVi, dotDaCo, ky);
  const xepHang = xepHangTheoRuiRo(ungVienGoc, cauHinhDauHieu);
  const conLai = new Map<string, UngVien>(
    xepHang.map((x) => [
      x.nghiQuyet.id,
      { nghiQuyet: x.nghiQuyet, canhBao: x.canhBao, diemRuiRo: x.diemRuiRo },
    ]),
  );

  const donViTheoMa = new Map(donVi.map((d) => [d.ma, d]));
  const danhMuc: MucDeXuat[] = [];
  const thongKe: Record<CachThucLapDanhMuc, number> = {
    chuyen_de: 0,
    canh_bao: 0,
    de_nghi: 0,
    luan_phien: 0,
    ngau_nhien: 0,
  };

  const them = (uv: UngVien, cachThuc: CachThucLapDanhMuc, lyDo: string): void => {
    danhMuc.push({
      idNghiQuyet: uv.nghiQuyet.id,
      cachThuc,
      lyDo,
      diemRuiRo: uv.diemRuiRo,
      canhBao: uv.canhBao,
      nguoiDeXuat,
    });
    thongKe[cachThuc] += 1;
    conLai.delete(uv.nghiQuyet.id);
  };

  const conThieu = (): number => soLuongMucTieu - danhMuc.length;

  // 1. Chuyên đề — theo lĩnh vực trọng tâm Thường trực ấn định cho tháng đó.
  if (linhVucTrongTam) {
    const suat = Math.min(suatMucTieu(soLuongMucTieu, TY_LE_CACH_THUC.chuyen_de), conThieu());
    const theoLinhVuc = [...conLai.values()]
      .filter((uv) => uv.nghiQuyet.linhVuc === linhVucTrongTam)
      .slice(0, suat);
    for (const uv of theoLinhVuc) {
      them(
        uv,
        'chuyen_de',
        `Thuộc lĩnh vực trọng tâm "${NHAN_LINH_VUC[linhVucTrongTam]}" Thường trực ấn định cho kỳ ${ky}.`,
      );
    }
  }

  // 2. Cảnh báo — xếp hạng theo điểm rủi ro, chỉ lấy văn bản thật sự có dấu hiệu.
  {
    const suat = Math.min(suatMucTieu(soLuongMucTieu, TY_LE_CACH_THUC.canh_bao), conThieu());
    const coCanhBao = [...conLai.values()]
      .filter((uv) => uv.canhBao.length > 0)
      .sort((a, b) =>
        b.diemRuiRo !== a.diemRuiRo
          ? b.diemRuiRo - a.diemRuiRo
          : a.nghiQuyet.id < b.nghiQuyet.id
            ? -1
            : 1,
      )
      .slice(0, Math.max(0, suat));
    for (const uv of coCanhBao) {
      them(uv, 'canh_bao', `Điểm rủi ro ${uv.diemRuiRo}. ${tomTatCanhBao(uv.canhBao)}`);
    }
  }

  // 3. Đề nghị — của cơ quan, đại biểu, cử tri, báo chí.
  {
    const suat = Math.min(suatMucTieu(soLuongMucTieu, TY_LE_CACH_THUC.de_nghi), conThieu());
    let daLay = 0;
    for (const dn of deNghi) {
      if (daLay >= suat) break;
      const uv = conLai.get(dn.idNghiQuyet);
      if (!uv) continue;
      them(uv, 'de_nghi', `Theo đề nghị của ${dn.nguoiDeNghi}: ${dn.lyDo}`);
      daLay += 1;
    }
  }

  // 4. Luân phiên — ưu tiên đơn vị lâu chưa được rà soát, để không đơn vị nào bị bỏ sót.
  {
    const suat = Math.min(suatMucTieu(soLuongMucTieu, TY_LE_CACH_THUC.luan_phien), conThieu());
    const daChonDonVi = new Set(
      danhMuc
        .map((m) => nghiQuyet.find((nq) => nq.id === m.idNghiQuyet)?.maDonVi)
        .filter((ma): ma is string => ma !== undefined),
    );
    const theoDoLau = [...conLai.values()]
      .filter((uv) => !daChonDonVi.has(uv.nghiQuyet.maDonVi))
      .map((uv) => {
        const dv = donViTheoMa.get(uv.nghiQuyet.maDonVi);
        const lanCuoi = dv?.lanRaSoatGanNhat ?? null;
        return {
          uv,
          ten: dv?.ten ?? uv.nghiQuyet.maDonVi,
          soNgay: lanCuoi === null ? Number.MAX_SAFE_INTEGER : soNgayDuongLich(lanCuoi, ngayThamChieu),
          lanCuoi,
        };
      })
      .sort((a, b) =>
        b.soNgay !== a.soNgay ? b.soNgay - a.soNgay : a.uv.nghiQuyet.id < b.uv.nghiQuyet.id ? -1 : 1,
      )
      .slice(0, Math.max(0, suat));
    for (const muc of theoDoLau) {
      them(
        muc.uv,
        'luan_phien',
        muc.lanCuoi === null
          ? `${muc.ten} chưa từng được rà soát.`
          : `${muc.ten} đã ${muc.soNgay} ngày chưa được rà soát.`,
      );
    }
  }

  // 5. Ngẫu nhiên — CHỈ bổ sung phần còn lại, và ghi seed để tra lại được.
  let seedNgauNhien: string | null = null;
  if (conThieu() > 0 && conLai.size > 0) {
    seedNgauNhien = taoSeed(ky, maMuoi);
    const boSinhSo = mulberry32(bam32(seedNgauNhien));
    // Sắp theo id trước khi bốc để thứ tự đầu vào không ảnh hưởng kết quả.
    const con = [...conLai.values()].sort((a, b) => (a.nghiQuyet.id < b.nghiQuyet.id ? -1 : 1));
    const canLay = Math.min(conThieu(), con.length);
    for (let i = 0; i < canLay; i += 1) {
      const viTri = Math.floor(boSinhSo() * con.length);
      const uv = con.splice(Math.min(viTri, con.length - 1), 1)[0]!;
      them(
        uv,
        'ngau_nhien',
        `Bổ sung ngẫu nhiên cho đủ ${soLuongMucTieu} văn bản của kỳ. Seed công khai "${seedNgauNhien}", tính lại được.`,
      );
    }
  }

  return {
    ky,
    danhMucDeXuat: danhMuc,
    seedNgauNhien,
    soUngVien: ungVienGoc.length,
    thongKeCachThuc: thongKe,
  };
}

// ---------------------------------------------------------------------------
// Thường trực quyết định danh mục chính thức
// ---------------------------------------------------------------------------

/**
 * Thêm hoặc bỏ một văn bản khỏi danh mục chính thức, kèm ghi nhật ký ai sửa và
 * sửa lúc nào. Trả về bản ghi đợt mới, không sửa tại chỗ.
 */
export function suaDanhMucChinhThuc(
  dot: DotRaSoat,
  thayDoi: { hanhDong: 'them' | 'bo'; idNghiQuyet: string; nguoi: string; ghiChu: string; luc: string },
): DotRaSoat {
  const { hanhDong, idNghiQuyet, nguoi, ghiChu, luc } = thayDoi;
  if (!nguoi.trim()) {
    throw new Error('Phải ghi tên người sửa danh mục để lưu vào nhật ký.');
  }

  const dangCo = dot.danhMucChinhThuc.includes(idNghiQuyet);
  if (hanhDong === 'them' && dangCo) return dot;
  if (hanhDong === 'bo' && !dangCo) return dot;

  const danhMucChinhThuc =
    hanhDong === 'them'
      ? [...dot.danhMucChinhThuc, idNghiQuyet].sort()
      : dot.danhMucChinhThuc.filter((id) => id !== idNghiQuyet);

  const buoc: ThayDoiDanhMuc = { luc, nguoi: nguoi.trim(), hanhDong, idNghiQuyet, ghiChu };
  return { ...dot, danhMucChinhThuc, nhatKyThayDoi: [...dot.nhatKyThayDoi, buoc] };
}

/** Nhãn tiếng Việt của trạng thái đợt rà soát. */
export const NHAN_TRANG_THAI_DOT: Readonly<Record<DotRaSoat['trangThai'], string>> = {
  de_xuat: 'Đang đề xuất',
  da_quyet_dinh: 'Đã quyết định danh mục',
  dang_tham_dinh: 'Đang thẩm định',
  da_chot: 'Đã chốt kết quả',
};
