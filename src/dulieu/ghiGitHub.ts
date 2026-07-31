import { layMaKetNoi } from './xacThuc';

const GOC_API = 'https://api.github.com';

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
  const token = layMaKetNoi();
  if (!token) {
    throw new LoiGhiGitHub(
      'Máy trạm này chưa cấu hình kết nối kho. Liên hệ quản trị hệ thống để mở kết nối trước khi ghi dữ liệu.',
    );
  }
  return token;
}

function dienGiaiLoi(ma: number, thongDiepGoc: string): string {
  switch (ma) {
    case 401:
      return 'Mã kết nối kho không hợp lệ hoặc đã hết hạn. Liên hệ quản trị hệ thống để cấp lại.';
    case 403:
      return 'Mã kết nối kho không đủ quyền ghi, hoặc đã chạm giới hạn số lần gọi của GitHub. Kiểm tra quyền "Contents: Read and write".';
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

export async function ghiJson(
  kho: ThongTinKho,
  duongDan: string,
  duLieu: unknown,
  thongDiep: string,
): Promise<KetQuaGhi> {
  const noiDung = `${JSON.stringify(duLieu, null, 2)}\n`;
  return ghiTep(kho, duongDan, chuoiSangBase64(noiDung), thongDiep);
}

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
      ? `Kết nối hợp lệ, tài khoản "${nguoiDung.login}" ghi được vào ${kho.chuKho}/${kho.tenKho}.`
      : `Tài khoản "${nguoiDung.login}" chỉ đọc được kho ${kho.chuKho}/${kho.tenKho}. Cấp thêm quyền "Contents: Read and write" cho mã kết nối.`,
  };
}
