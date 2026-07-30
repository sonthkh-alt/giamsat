// Ghi dữ liệu lên kho GitHub bằng Contents API.
//
// Trang chạy trên GitHub Pages nên không có backend: mọi thao tác ghi đều do
// trình duyệt của người dùng thực hiện, xác thực bằng fine-grained PAT do chính
// họ dán vào. Không thêm SDK, chỉ dùng fetch.

import { layToken } from './phienLamViec';

const GOC_API = 'https://api.github.com';

/** Giới hạn kích thước tệp đính kèm: 10 MB. */
export const KICH_THUOC_TOI_DA = 10 * 1024 * 1024;

export type ThongTinKho = {
  chuKho: string;
  tenKho: string;
  nhanh: string;
};

export class LoiGhiGitHub extends Error {
  constructor(
    message: string,
    public readonly maHTTP?: number,
  ) {
    super(message);
    this.name = 'LoiGhiGitHub';
  }
}

function tokenBatBuoc(): string {
  const token = layToken();
  if (!token) {
    throw new LoiGhiGitHub(
      'Chưa có mã truy cập. Vào trang Quản trị và dán mã truy cập GitHub trước khi ghi dữ liệu.',
    );
  }
  return token;
}

function dienGiaiLoi(ma: number, thongDiepGoc: string): string {
  switch (ma) {
    case 401:
      return 'Mã truy cập không hợp lệ hoặc đã hết hạn. Tạo mã mới rồi dán lại ở trang Quản trị.';
    case 403:
      return 'Mã truy cập không đủ quyền ghi vào kho, hoặc đã chạm giới hạn số lần gọi của GitHub. Kiểm tra quyền "Contents: Read and write".';
    case 404:
      return 'Không tìm thấy kho hoặc đường dẫn. Kiểm tra lại tên chủ kho, tên kho và nhánh trong data/cauhinh.json.';
    case 409:
      return 'Tệp trên kho đã thay đổi kể từ lúc trang tải dữ liệu. Tải lại trang rồi thao tác lại để không ghi đè việc của người khác.';
    case 422:
      return `GitHub từ chối nội dung gửi lên: ${thongDiepGoc}`;
    default:
      return `GitHub trả về lỗi ${ma}: ${thongDiepGoc}`;
  }
}

async function goiAPI<T>(duongDan: string, tuyChon: RequestInit = {}): Promise<T> {
  const phanHoi = await fetch(`${GOC_API}${duongDan}`, {
    ...tuyChon,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      Authorization: `Bearer ${tokenBatBuoc()}`,
      ...(tuyChon.body ? { 'Content-Type': 'application/json' } : {}),
      ...tuyChon.headers,
    },
  });

  if (!phanHoi.ok) {
    let thongDiep = phanHoi.statusText;
    try {
      const than = (await phanHoi.json()) as { message?: string };
      if (than.message) thongDiep = than.message;
    } catch {
      // Phản hồi không phải JSON — giữ nguyên statusText.
      thongDiep = phanHoi.statusText || 'không rõ nguyên nhân';
    }
    throw new LoiGhiGitHub(dienGiaiLoi(phanHoi.status, thongDiep), phanHoi.status);
  }

  if (phanHoi.status === 204) return undefined as T;
  return (await phanHoi.json()) as T;
}

function sangBase64(byte: Uint8Array): string {
  let nhiPhan = '';
  const khoi = 0x8000;
  for (let i = 0; i < byte.length; i += khoi) {
    nhiPhan += String.fromCharCode(...byte.subarray(i, i + khoi));
  }
  return btoa(nhiPhan);
}

function chuoiSangBase64(noiDung: string): string {
  return sangBase64(new TextEncoder().encode(noiDung));
}

type TepGitHub = { sha: string; content?: string; encoding?: string };

/** Lấy sha hiện tại của một tệp; null nếu tệp chưa tồn tại. */
export async function laySha(kho: ThongTinKho, duongDan: string): Promise<string | null> {
  try {
    const tep = await goiAPI<TepGitHub>(
      `/repos/${kho.chuKho}/${kho.tenKho}/contents/${encodeURI(duongDan)}?ref=${encodeURIComponent(kho.nhanh)}`,
    );
    return tep.sha;
  } catch (loi) {
    if (loi instanceof LoiGhiGitHub && loi.maHTTP === 404) return null;
    throw loi;
  }
}

export type KetQuaGhi = {
  duongDan: string;
  sha: string;
  duongDanCommit: string;
};

type PhanHoiGhi = {
  content: { sha: string; path: string } | null;
  commit: { html_url?: string };
};

/** Commit một tệp (tạo mới hoặc cập nhật) thẳng vào nhánh làm việc. */
export async function ghiTep(
  kho: ThongTinKho,
  duongDan: string,
  noiDungBase64: string,
  thongDiep: string,
): Promise<KetQuaGhi> {
  const shaCu = await laySha(kho, duongDan);
  const phanHoi = await goiAPI<PhanHoiGhi>(
    `/repos/${kho.chuKho}/${kho.tenKho}/contents/${encodeURI(duongDan)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        message: thongDiep,
        content: noiDungBase64,
        branch: kho.nhanh,
        ...(shaCu ? { sha: shaCu } : {}),
      }),
    },
  );
  return {
    duongDan,
    sha: phanHoi.content?.sha ?? '',
    duongDanCommit: phanHoi.commit.html_url ?? '',
  };
}

/** Ghi một tệp JSON, tự thụt lề 2 khoảng trắng và xuống dòng cuối tệp. */
export async function ghiJson(
  kho: ThongTinKho,
  duongDan: string,
  duLieu: unknown,
  thongDiep: string,
): Promise<KetQuaGhi> {
  const noiDung = `${JSON.stringify(duLieu, null, 2)}\n`;
  return ghiTep(kho, duongDan, chuoiSangBase64(noiDung), thongDiep);
}

/** Tải một tệp đính kèm (PDF nghị quyết) lên data/files/<năm>/. */
export async function taiTepLen(
  kho: ThongTinKho,
  duongDan: string,
  tep: File,
  thongDiep: string,
): Promise<KetQuaGhi> {
  if (tep.size > KICH_THUOC_TOI_DA) {
    throw new LoiGhiGitHub(
      `Tệp "${tep.name}" nặng ${(tep.size / 1024 / 1024).toFixed(1)} MB, vượt giới hạn 10 MB. Hãy nén lại hoặc tách thành nhiều tệp.`,
    );
  }
  const dem = new Uint8Array(await tep.arrayBuffer());
  return ghiTep(kho, duongDan, sangBase64(dem), thongDiep);
}

export type QuyenGhi = {
  hopLe: boolean;
  tenDangNhap: string;
  ghiDuoc: boolean;
  moTa: string;
};

/** Kiểm tra mã truy cập có ghi được vào kho hay không, trước khi người dùng nhập liệu. */
export async function kiemTraQuyenGhi(kho: ThongTinKho): Promise<QuyenGhi> {
  const nguoiDung = await goiAPI<{ login: string }>('/user');
  const thongTinKho = await goiAPI<{ permissions?: { push?: boolean } }>(
    `/repos/${kho.chuKho}/${kho.tenKho}`,
  );
  const ghiDuoc = thongTinKho.permissions?.push === true;
  return {
    hopLe: true,
    tenDangNhap: nguoiDung.login,
    ghiDuoc,
    moTa: ghiDuoc
      ? `Mã truy cập hợp lệ, tài khoản "${nguoiDung.login}" ghi được vào ${kho.chuKho}/${kho.tenKho}.`
      : `Tài khoản "${nguoiDung.login}" chỉ đọc được kho ${kho.chuKho}/${kho.tenKho}. Cấp thêm quyền "Contents: Read and write" cho mã truy cập.`,
  };
}
