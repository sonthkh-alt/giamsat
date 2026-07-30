// Quản lý mã truy cập (fine-grained PAT) của người dùng.
//
// PAT chỉ tồn tại trong sessionStorage của trình duyệt: đóng tab là mất.
// Tuyệt đối không ghi PAT ra console, không đưa vào URL, không commit lên kho.

const KHOA_TOKEN = 'giamsat.pat';
const KHOA_NGUOI_DUNG = 'giamsat.nguoiDung';

function kho(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null; // trình duyệt chặn lưu trữ
  }
}

const nguoiNghe = new Set<() => void>();

function baoDaDoi(): void {
  for (const goi of nguoiNghe) goi();
}

/** Đăng ký nhận tin khi phiên làm việc thay đổi (dán hoặc xóa mã truy cập). */
export function theoDoiPhien(goi: () => void): () => void {
  nguoiNghe.add(goi);
  return () => {
    nguoiNghe.delete(goi);
  };
}

export function layToken(): string | null {
  return kho()?.getItem(KHOA_TOKEN) ?? null;
}

export function luuToken(token: string): void {
  const s = kho();
  if (!s) throw new Error('Trình duyệt đang chặn lưu trữ tạm, không giữ được mã truy cập.');
  s.setItem(KHOA_TOKEN, token.trim());
  baoDaDoi();
}

export function xoaToken(): void {
  kho()?.removeItem(KHOA_TOKEN);
  baoDaDoi();
}

export function coToken(): boolean {
  return (layToken()?.length ?? 0) > 0;
}

/** Tên người đang thao tác, ghi vào nhật ký thẩm định. Không phải thông tin bí mật. */
export function layNguoiDung(): string {
  return kho()?.getItem(KHOA_NGUOI_DUNG) ?? '';
}

export function luuNguoiDung(ten: string): void {
  kho()?.setItem(KHOA_NGUOI_DUNG, ten.trim());
  baoDaDoi();
}

/**
 * Che bớt mã truy cập để hiển thị, ví dụ "github_pat_11AB…kQ9x".
 * Dùng khi cần cho người dùng biết đã dán đúng mã hay chưa.
 */
export function cheToken(token: string): string {
  if (token.length <= 12) return '••••';
  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}
