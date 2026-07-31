// Tải toàn bộ dữ liệu tĩnh một lần khi mở trang và chia sẻ cho mọi màn hình.

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  BanTin,
  CauHinh,
  CauHinhDauHieu,
  DonVi,
  DotRaSoat,
  HoiDap,
  KetQuaThamDinh,
  KhungNghiepVu,
  NgayLe,
  NghiQuyet,
  NhiemVuSauGiamSat,
  NhomTieuChi,
  VanBanMau,
} from '../kieu';
import { docDuLieu, type NguonDuLieu } from './docJson';
import { homNay as tinhHomNay } from '../nghiepvu/hanXuLy';

export const CAU_HINH_MAC_DINH: CauHinh = {
  maMuoi: 'giamsat-thanhhoa',
  soVanBanRaSoatMoiThang: 10,
  ngayTongHop: 20,
  ngayTrinhDanhMuc: 25,
  chuKho: 'sonthkh-alt',
  tenKho: 'giamsat',
  nhanh: 'main',
  duLieuGiaLap: true,
  namLamViec: 2026,
};

const KHUNG_RONG: KhungNghiepVu = {
  phienBan: '',
  ghiChu: '',
  chuThe: [],
  cap: [],
  nhom: [],
  buocXuLySauGiamSat: [],
  cachThucLapDanhMuc: [],
};

const DAU_HIEU_RONG: CauHinhDauHieu = {
  phienBan: '',
  ghiChu: '',
  canCuHetHieuLuc: { diem: 0, mucDo: 'cao', ghiChu: '', danhMuc: [] },
  tenKhongConDung: { diem: 0, mucDo: 'cao', ghiChu: '', danhMuc: [] },
  thamQuyenTheoLinhVuc: { diem: 0, mucDo: 'trung_binh', ghiChu: '', quyTac: [] },
  thanhPhanHoSo: { diem: 0, mucDo: 'trung_binh', ghiChu: '', batBuoc: [] },
  theThuc: { diem: 0, mucDo: 'thap', ghiChu: '', quyTac: [] },
};

export type DuLieuHeThong = {
  cauHinh: CauHinh;
  khung: KhungNghiepVu;
  cauHinhDauHieu: CauHinhDauHieu;
  donVi: DonVi[];
  tieuChi: NhomTieuChi[];
  ngayLe: NgayLe[];
  nghiQuyet: NghiQuyet[];
  dotRaSoat: DotRaSoat[];
  ketQua: KetQuaThamDinh[];
  nhiemVu: NhiemVuSauGiamSat[];
  hoiDap: HoiDap[];
  vanBanMau: VanBanMau[];
  banTin: BanTin[];
  /** true khi ít nhất một tập dữ liệu đang lấy từ data/mau/. */
  dangDungDuLieuMau: boolean;
  homNay: string;
};

type TrangThaiKho =
  | { trangThai: 'dangTai' }
  | { trangThai: 'loi'; loi: string }
  | { trangThai: 'xong'; duLieu: DuLieuHeThong };

type GiaTriKho = TrangThaiKho & { taiLai: () => void };

const BoiCanhKho = createContext<GiaTriKho | null>(null);

async function tai(): Promise<DuLieuHeThong> {
  const nguon: NguonDuLieu[] = [];
  const ghiNhan = <T,>(kq: { duLieu: T; nguon: NguonDuLieu }): T => {
    nguon.push(kq.nguon);
    return kq.duLieu;
  };

  const cauHinh = ghiNhan(await docDuLieu<CauHinh>('cauhinh.json', CAU_HINH_MAC_DINH));
  const nam = cauHinh.namLamViec;

  const [
    khung,
    cauHinhDauHieu,
    donVi,
    tieuChi,
    ngayLe,
    nghiQuyet,
    ketQua,
    nhiemVu,
    hoiDap,
    vanBanMau,
    banTin,
    mucLuc,
  ] = await Promise.all([
    docDuLieu<KhungNghiepVu>('khung-nghiep-vu.json', KHUNG_RONG),
    docDuLieu<CauHinhDauHieu>('dauhieu-canhbao.json', DAU_HIEU_RONG),
    docDuLieu<DonVi[]>('donvi.json', []),
    docDuLieu<NhomTieuChi[]>('tieuchi.json', []),
    docDuLieu<NgayLe[]>('ngayle.json', []),
    docDuLieu<NghiQuyet[]>(`nghiquyet/${nam}.json`, []),
    docDuLieu<KetQuaThamDinh[]>(`ketqua/${nam}.json`, []),
    docDuLieu<NhiemVuSauGiamSat[]>(`nhiemvu/${nam}.json`, []),
    docDuLieu<HoiDap[]>('hoidap.json', []),
    docDuLieu<VanBanMau[]>('vanbanmau.json', []),
    docDuLieu<BanTin[]>('bangtin.json', []),
    docDuLieu<string[]>('dotrasoat/muc-luc.json', []),
  ]);

  const dotRaSoat = await Promise.all(
    ghiNhan(mucLuc).map((ky) => docDuLieu<DotRaSoat | null>(`dotrasoat/${ky}.json`, null)),
  );

  return {
    cauHinh,
    khung: ghiNhan(khung),
    cauHinhDauHieu: ghiNhan(cauHinhDauHieu),
    donVi: ghiNhan(donVi),
    tieuChi: ghiNhan(tieuChi),
    ngayLe: ghiNhan(ngayLe),
    nghiQuyet: ghiNhan(nghiQuyet),
    dotRaSoat: dotRaSoat
      .map((d) => ghiNhan(d))
      .filter((d): d is DotRaSoat => d !== null)
      .sort((a, b) => (a.ky < b.ky ? 1 : -1)),
    ketQua: ghiNhan(ketQua),
    nhiemVu: ghiNhan(nhiemVu),
    hoiDap: ghiNhan(hoiDap),
    vanBanMau: ghiNhan(vanBanMau),
    banTin: ghiNhan(banTin),
    dangDungDuLieuMau: nguon.includes('mau'),
    homNay: tinhHomNay(),
  };
}

export function CungCapKho({ children }: { children: ReactNode }) {
  const [trangThai, datTrangThai] = useState<TrangThaiKho>({ trangThai: 'dangTai' });
  const [lanTai, datLanTai] = useState(0);

  const taiLai = useCallback(() => {
    datLanTai((n) => n + 1);
  }, []);

  useEffect(() => {
    let conHieuLuc = true;
    datTrangThai({ trangThai: 'dangTai' });
    tai()
      .then((duLieu) => {
        if (conHieuLuc) datTrangThai({ trangThai: 'xong', duLieu });
      })
      .catch((loi: unknown) => {
        if (!conHieuLuc) return;
        datTrangThai({
          trangThai: 'loi',
          loi: loi instanceof Error ? loi.message : 'Không rõ nguyên nhân.',
        });
      });
    return () => {
      conHieuLuc = false;
    };
  }, [lanTai]);

  const giaTri = useMemo<GiaTriKho>(() => ({ ...trangThai, taiLai }), [trangThai, taiLai]);

  return <BoiCanhKho.Provider value={giaTri}>{children}</BoiCanhKho.Provider>;
}

export function useKho(): GiaTriKho {
  const giaTri = useContext(BoiCanhKho);
  if (!giaTri) throw new Error('useKho() phải nằm trong <CungCapKho>.');
  return giaTri;
}

/** Dùng trong các trang chỉ hiển thị sau khi dữ liệu đã tải xong. */
export function useDuLieu(): DuLieuHeThong {
  const kho = useKho();
  if (kho.trangThai !== 'xong') {
    throw new Error('Dữ liệu chưa tải xong. Bọc trang trong <ChoDuLieu>.');
  }
  return kho.duLieu;
}
