import { useCallback, useState } from 'react';

export type TrangThaiGhi = {
  dangGhi: boolean;
  loi: string | null;
  thanhCong: string | null;
};

export function useGhi(): TrangThaiGhi & {
  chay: (viec: () => Promise<string>) => Promise<boolean>;
  xoaThongBao: () => void;
} {
  const [dangGhi, datDangGhi] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);
  const [thanhCong, datThanhCong] = useState<string | null>(null);

  const xoaThongBao = useCallback(() => {
    datLoi(null);
    datThanhCong(null);
  }, []);

  const chay = useCallback(async (viec: () => Promise<string>): Promise<boolean> => {
    datDangGhi(true);
    datLoi(null);
    datThanhCong(null);
    try {
      const thongDiep = await viec();
      datThanhCong(thongDiep);
      return true;
    } catch (nguyenNhan) {
      datLoi(
        nguyenNhan instanceof Error
          ? nguyenNhan.message
          : 'Không rõ nguyên nhân. Thử lại sau ít phút.',
      );
      return false;
    } finally {
      datDangGhi(false);
    }
  }, []);

  return { dangGhi, loi, thanhCong, chay, xoaThongBao };
}
