// Đọc dữ liệu tĩnh trong thư mục data/.
//
// Nếu file thật chưa có (giai đoạn thí điểm chưa nhập liệu), tự động lùi về
// bộ dữ liệu giả lập trong data/mau/ để hệ thống vẫn chạy thử được, và báo rõ
// nguồn dữ liệu ra giao diện.

export type NguonDuLieu = 'that' | 'mau' | 'trong';

export type KetQuaDoc<T> = {
  duLieu: T;
  nguon: NguonDuLieu;
};

const GOC = import.meta.env.BASE_URL;

export class LoiDocDuLieu extends Error {
  constructor(
    public readonly duongDan: string,
    public readonly nguyenNhan: string,
  ) {
    super(`Không đọc được "${duongDan}": ${nguyenNhan}`);
    this.name = 'LoiDocDuLieu';
  }
}

async function taiJson<T>(duongDanDayDu: string): Promise<T | null> {
  let phanHoi: Response;
  try {
    phanHoi = await fetch(duongDanDayDu, { cache: 'no-cache' });
  } catch (loi) {
    throw new LoiDocDuLieu(
      duongDanDayDu,
      loi instanceof Error ? loi.message : 'không kết nối được tới máy chủ',
    );
  }
  if (phanHoi.status === 404) return null;
  if (!phanHoi.ok) {
    throw new LoiDocDuLieu(duongDanDayDu, `máy chủ trả về mã ${phanHoi.status}`);
  }

  // Một số máy chủ tĩnh trả về trang index.html kèm mã 200 cho tệp không tồn tại.
  // Coi đó là tệp chưa có, để còn lùi về data/mau/ thay vì báo lỗi vô cớ.
  const kieuNoiDung = phanHoi.headers.get('content-type') ?? '';
  if (!kieuNoiDung.includes('json')) return null;

  try {
    return (await phanHoi.json()) as T;
  } catch {
    throw new LoiDocDuLieu(duongDanDayDu, 'nội dung không phải JSON hợp lệ');
  }
}

/**
 * Đọc một file trong data/. Trả về `macDinh` kèm nguồn "trong" nếu cả file thật
 * lẫn file mẫu đều chưa có.
 *
 * @param tenTep đường dẫn tương đối trong data/, ví dụ "donvi.json" hoặc "nghiquyet/2026.json"
 */
export async function docDuLieu<T>(tenTep: string, macDinh: T): Promise<KetQuaDoc<T>> {
  const that = await taiJson<T>(`${GOC}data/${tenTep}`);
  if (that !== null) return { duLieu: that, nguon: 'that' };

  const mau = await taiJson<T>(`${GOC}data/mau/${tenTep}`);
  if (mau !== null) return { duLieu: mau, nguon: 'mau' };

  return { duLieu: macDinh, nguon: 'trong' };
}

/** Đường dẫn công khai của một tệp đính kèm trong data/files/. */
export function duongDanTep(duongDanTrongKho: string): string {
  return `${GOC}${duongDanTrongKho.replace(/^\/+/, '')}`;
}
