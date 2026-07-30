// Rút thăm nghị quyết để kiểm tra ngẫu nhiên.
//
// Trang web tĩnh không có server đáng tin, nên tính khách quan đến từ TÍNH TÁI LẬP:
// cùng seed + cùng danh sách ứng viên + cùng trọng số ⇒ luôn ra cùng kết quả.
// Vì vậy tuyệt đối không dùng Math.random() ở đây.

import type { LinhVuc } from '../kieu';
import { soNgayDuongLich, taoNgay } from './hanXuLy';

/** 6 tháng quy ước bằng 183 ngày dương lịch, để ai cũng nhẩm lại được. */
export const SO_NGAY_SAU_THANG = 183;

/** Lĩnh vực được ưu tiên kiểm tra (mọi lĩnh vực trừ "khac"). */
export const LINH_VUC_UU_TIEN: ReadonlySet<LinhVuc> = new Set<LinhVuc>([
  'ngan_sach',
  'dau_tu_cong',
  'dat_dai',
  'phi_le_phi',
  'to_chuc_bo_may',
  'che_do_chinh_sach',
]);

/** Hệ số trọng số công bố trước, ghi vào nhật ký từng đợt. */
export const THAM_SO_TRONG_SO_MAC_DINH: Record<string, number> = {
  coBan: 1,
  chuaKiemTraSauThang: 3,
  linhVucUuTien: 2,
  kyTruocChuaDat: 2,
};

export type UngVienRutTham = {
  /** id nghị quyết */
  id: string;
  maDonVi: string;
  linhVuc: LinhVuc;
  /** Lần kiểm tra gần nhất của ĐƠN VỊ, ISO date hoặc null nếu chưa từng. */
  lanKiemTraGanNhat: string | null;
  /** Đơn vị bị xếp loại "chưa đạt" ở kỳ liền trước. */
  kyTruocChuaDat: boolean;
};

export type TrongSoUngVien = {
  id: string;
  trongSo: number;
  lyDo: string[];
};

export type BuocRutTham = {
  luot: number;
  tongTrongSo: number;
  soNgauNhien: number;
  moc: number;
  idTrung: string;
};

export type KetQuaRutTham = {
  ky: string;
  seed: string;
  ngayRutTham: string;
  thamSoTrongSo: Record<string, number>;
  ungVien: string[];
  trongSo: TrongSoUngVien[];
  danhSachTrung: string[];
  nhatKy: BuocRutTham[];
};

// ---------------------------------------------------------------------------
// Bộ sinh số giả ngẫu nhiên có seed
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

/** mulberry32 — nhỏ, nhanh, tái lập được trên mọi trình duyệt. */
export function mulberry32(hat: number): () => number {
  let a = hat >>> 0;
  return function ngauNhien(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bộ sinh số cho một chuỗi seed cụ thể. */
export function taoBoSinhSo(seed: string): () => number {
  return mulberry32(bam32(seed));
}

// ---------------------------------------------------------------------------
// Kỳ và seed
// ---------------------------------------------------------------------------

/** Số tuần ISO 8601 và năm tương ứng của một ngày. */
export function tuanISO(iso: string): { nam: number; tuan: number } {
  const ngay = taoNgay(iso);
  const thu = (ngay.getUTCDay() + 6) % 7; // thứ Hai = 0
  ngay.setUTCDate(ngay.getUTCDate() - thu + 3); // về thứ Năm của tuần
  const nam = ngay.getUTCFullYear();
  const thuNamDauNam = new Date(Date.UTC(nam, 0, 4));
  const lech = (thuNamDauNam.getUTCDay() + 6) % 7;
  thuNamDauNam.setUTCDate(thuNamDauNam.getUTCDate() - lech + 3);
  const tuan = 1 + Math.round((ngay.getTime() - thuNamDauNam.getTime()) / (7 * 86_400_000));
  return { nam, tuan };
}

/** Mã kỳ rút thăm dạng "2026-W31". */
export function kyRutTham(iso: string): string {
  const { nam, tuan } = tuanISO(iso);
  return `${nam}-W${String(tuan).padStart(2, '0')}`;
}

/** seed = "<năm>-W<tuần ISO>-<mã muối>". Mã muối công bố trước trong data/cauhinh.json. */
export function taoSeed(ky: string, maMuoi: string): string {
  if (!maMuoi) throw new Error('Thiếu mã muối. Mã muối phải được công bố trước trong data/cauhinh.json.');
  return `${ky}-${maMuoi}`;
}

// ---------------------------------------------------------------------------
// Trọng số
// ---------------------------------------------------------------------------

/**
 * Trọng số của một ứng viên và lý do kèm theo, để giải trình được với cơ sở.
 * Các hệ số nhân với nhau, khởi điểm là hệ số cơ bản.
 */
export function tinhTrongSo(
  ungVien: UngVienRutTham,
  ngayThamChieu: string,
  thamSo: Record<string, number> = THAM_SO_TRONG_SO_MAC_DINH,
): TrongSoUngVien {
  const heSo = (ten: string, macDinh: number): number => thamSo[ten] ?? macDinh;
  let trongSo = heSo('coBan', 1);
  const lyDo: string[] = [];

  const quaHanKiemTra =
    ungVien.lanKiemTraGanNhat === null ||
    soNgayDuongLich(ungVien.lanKiemTraGanNhat, ngayThamChieu) > SO_NGAY_SAU_THANG;
  if (quaHanKiemTra) {
    trongSo *= heSo('chuaKiemTraSauThang', 3);
    lyDo.push(
      ungVien.lanKiemTraGanNhat === null
        ? 'Đơn vị chưa từng được kiểm tra'
        : 'Đơn vị chưa kiểm tra trong 6 tháng',
    );
  }

  if (LINH_VUC_UU_TIEN.has(ungVien.linhVuc)) {
    trongSo *= heSo('linhVucUuTien', 2);
    lyDo.push('Thuộc lĩnh vực ưu tiên');
  }

  if (ungVien.kyTruocChuaDat) {
    trongSo *= heSo('kyTruocChuaDat', 2);
    lyDo.push('Kỳ trước xếp loại chưa đạt');
  }

  return { id: ungVien.id, trongSo, lyDo };
}

// ---------------------------------------------------------------------------
// Rút thăm
// ---------------------------------------------------------------------------

export type ThamSoRutTham = {
  ungVien: readonly UngVienRutTham[];
  soLuongCanRut: number;
  ngayRutTham: string;
  maMuoi: string;
  /** Ghi đè hệ số trọng số; bỏ trống dùng bộ mặc định. */
  thamSoTrongSo?: Record<string, number>;
  /** Ghi đè kỳ; bỏ trống lấy tuần ISO của ngày rút thăm. */
  ky?: string;
};

/**
 * Rút thăm không hoàn lại, có trọng số, hoàn toàn tất định.
 *
 * Danh sách ứng viên được sắp xếp theo id trước khi rút, nên thứ tự truyền vào
 * không ảnh hưởng kết quả — điều kiện cần để bất kỳ ai cũng tính lại được.
 */
export function rutTham(thamSo: ThamSoRutTham): KetQuaRutTham {
  const {
    ungVien,
    soLuongCanRut,
    ngayRutTham,
    maMuoi,
    thamSoTrongSo = THAM_SO_TRONG_SO_MAC_DINH,
  } = thamSo;

  if (!Number.isInteger(soLuongCanRut) || soLuongCanRut < 0) {
    throw new Error(`Số lượng cần rút phải là số nguyên không âm, nhận được ${soLuongCanRut}.`);
  }

  const trung = new Set<string>();
  for (const uv of ungVien) {
    if (trung.has(uv.id)) throw new Error(`Danh sách ứng viên có id trùng: "${uv.id}".`);
    trung.add(uv.id);
  }

  const ky = thamSo.ky ?? kyRutTham(ngayRutTham);
  const seed = taoSeed(ky, maMuoi);
  const boSinhSo = taoBoSinhSo(seed);

  const daSapXep = [...ungVien].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const trongSo = daSapXep.map((uv) => tinhTrongSo(uv, ngayRutTham, thamSoTrongSo));

  const conLai = trongSo.filter((t) => t.trongSo > 0);
  const canRut = Math.min(soLuongCanRut, conLai.length);
  const danhSachTrung: string[] = [];
  const nhatKy: BuocRutTham[] = [];

  for (let luot = 1; luot <= canRut; luot += 1) {
    const tongTrongSo = conLai.reduce((tong, t) => tong + t.trongSo, 0);
    const soNgauNhien = boSinhSo();
    const moc = soNgauNhien * tongTrongSo;
    let luyKe = 0;
    let viTri = conLai.length - 1;
    for (let i = 0; i < conLai.length; i += 1) {
      luyKe += conLai[i]!.trongSo;
      if (moc < luyKe) {
        viTri = i;
        break;
      }
    }
    const chon = conLai[viTri]!;
    danhSachTrung.push(chon.id);
    nhatKy.push({ luot, tongTrongSo, soNgauNhien, moc, idTrung: chon.id });
    conLai.splice(viTri, 1);
  }

  return {
    ky,
    seed,
    ngayRutTham,
    thamSoTrongSo,
    ungVien: daSapXep.map((uv) => uv.id),
    trongSo,
    danhSachTrung,
    nhatKy,
  };
}

/**
 * Chạy lại đợt rút thăm với đúng dữ liệu đã lưu và đối chiếu kết quả.
 * Đây là chỗ dựa để cơ sở tin vào tính công bằng của việc rút thăm.
 */
export function kiemChungRutTham(
  daLuu: Pick<KetQuaRutTham, 'ky' | 'seed' | 'danhSachTrung' | 'thamSoTrongSo' | 'ngayRutTham'>,
  ungVien: readonly UngVienRutTham[],
  maMuoi: string,
): { khop: boolean; ketQuaTinhLai: KetQuaRutTham; sanhSai: string[] } {
  const ketQuaTinhLai = rutTham({
    ungVien,
    soLuongCanRut: daLuu.danhSachTrung.length,
    ngayRutTham: daLuu.ngayRutTham,
    maMuoi,
    thamSoTrongSo: daLuu.thamSoTrongSo,
    ky: daLuu.ky,
  });

  const sanhSai: string[] = [];
  if (ketQuaTinhLai.seed !== daLuu.seed) {
    sanhSai.push(`Seed khác nhau: đã lưu "${daLuu.seed}", tính lại "${ketQuaTinhLai.seed}".`);
  }
  const a = daLuu.danhSachTrung.join('|');
  const b = ketQuaTinhLai.danhSachTrung.join('|');
  if (a !== b) {
    sanhSai.push(`Danh sách trúng khác nhau: đã lưu [${a}], tính lại [${b}].`);
  }

  return { khop: sanhSai.length === 0, ketQuaTinhLai, sanhSai };
}
