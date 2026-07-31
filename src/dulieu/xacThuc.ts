import type { KhoTaiKhoan, PhienDangNhap, TaiKhoan } from '../kieu';

const KHOA_PHIEN = 'giamsat.phien';
const KHOA_KET_NOI = 'giamsat.ketNoiKho';

export class LoiDangNhap extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoiDangNhap';
  }
}

function kho(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

const nguoiNghe = new Set<() => void>();

function baoDaDoi(): void {
  for (const goi of nguoiNghe) goi();
}

export function theoDoiPhien(goi: () => void): () => void {
  nguoiNghe.add(goi);
  return () => {
    nguoiNghe.delete(goi);
  };
}

function sangHex(dem: ArrayBuffer): string {
  return [...new Uint8Array(dem)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function tuHex(hex: string): ArrayBuffer {
  const dem = new Uint8Array(new ArrayBuffer(hex.length / 2));
  for (let i = 0; i < dem.length; i += 1) dem[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return dem.buffer;
}

export async function bamMatKhau(
  matKhau: string,
  muoiHex: string,
  soVongLap: number,
): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new LoiDangNhap(
      'Trình duyệt không hỗ trợ mã hóa cần thiết để đăng nhập. Dùng trình duyệt mới hơn, hoặc mở trang qua địa chỉ https.',
    );
  }
  const goc = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(matKhau.normalize('NFC')),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: tuHex(muoiHex), iterations: soVongLap, hash: 'SHA-256' },
    goc,
    256,
  );
  return sangHex(bits);
}

function soSanhAnToan(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let khac = 0;
  for (let i = 0; i < a.length; i += 1) khac |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return khac === 0;
}

export async function dangNhap(
  khoTaiKhoan: KhoTaiKhoan,
  tenDangNhap: string,
  matKhau: string,
): Promise<PhienDangNhap> {
  const ten = tenDangNhap.trim().toLowerCase();
  if (!ten || !matKhau) {
    throw new LoiDangNhap('Nhập đủ tên đăng nhập và mật khẩu.');
  }
  const taiKhoan = khoTaiKhoan.taiKhoan.find((t) => t.tenDangNhap.toLowerCase() === ten);
  const bamThu = await bamMatKhau(
    matKhau,
    taiKhoan?.muoi ?? '00'.repeat(16),
    khoTaiKhoan.thamSoBam.soVongLap,
  );
  if (!taiKhoan || !soSanhAnToan(bamThu, taiKhoan.bam)) {
    throw new LoiDangNhap('Tên đăng nhập hoặc mật khẩu không đúng.');
  }
  if (!taiKhoan.hoatDong) {
    throw new LoiDangNhap(
      `Tài khoản "${taiKhoan.tenDangNhap}" đã bị khóa. Liên hệ quản trị hệ thống.`,
    );
  }
  const phien: PhienDangNhap = {
    tenDangNhap: taiKhoan.tenDangNhap,
    hoTen: taiKhoan.hoTen,
    vaiTro: taiKhoan.vaiTro,
    maDonVi: taiKhoan.maDonVi,
  };
  kho()?.setItem(KHOA_PHIEN, JSON.stringify(phien));
  baoDaDoi();
  return phien;
}

export function layPhien(): PhienDangNhap | null {
  const thoi = kho()?.getItem(KHOA_PHIEN);
  if (!thoi) return null;
  try {
    return JSON.parse(thoi) as PhienDangNhap;
  } catch {
    return null;
  }
}

export function dangXuat(): void {
  const s = kho();
  s?.removeItem(KHOA_PHIEN);
  s?.removeItem(KHOA_KET_NOI);
  baoDaDoi();
}

export function layMaKetNoi(): string | null {
  return kho()?.getItem(KHOA_KET_NOI) ?? null;
}

export function luuMaKetNoi(ma: string): void {
  const s = kho();
  if (!s) throw new Error('Trình duyệt đang chặn lưu trữ tạm, không giữ được kết nối kho.');
  s.setItem(KHOA_KET_NOI, ma.trim());
  baoDaDoi();
}

export function xoaMaKetNoi(): void {
  kho()?.removeItem(KHOA_KET_NOI);
  baoDaDoi();
}

export function coKetNoiKho(): boolean {
  return (layMaKetNoi()?.length ?? 0) > 0;
}

export function cheMa(ma: string): string {
  if (ma.length <= 12) return '••••';
  return `${ma.slice(0, 8)}…${ma.slice(-4)}`;
}

export function timTaiKhoan(khoTaiKhoan: KhoTaiKhoan, tenDangNhap: string): TaiKhoan | undefined {
  return khoTaiKhoan.taiKhoan.find(
    (t) => t.tenDangNhap.toLowerCase() === tenDangNhap.trim().toLowerCase(),
  );
}
