import { useSyncExternalStore } from 'react';
import type { PhienDangNhap, Quyen, VaiTro } from '../kieu';
import { coKetNoiKho, layPhien, theoDoiPhien } from './xacThuc';
import { coQuyen } from '../nghiepvu/phanQuyen';

let phienDaLuu: PhienDangNhap | null = null;
let banSaoPhien = '';

function docPhien(): PhienDangNhap | null {
  const hienTai = layPhien();
  const chuoi = hienTai === null ? '' : JSON.stringify(hienTai);
  if (chuoi !== banSaoPhien) {
    banSaoPhien = chuoi;
    phienDaLuu = hienTai;
  }
  return phienDaLuu;
}

export type TrangThaiPhien = {
  phien: PhienDangNhap | null;
  daDangNhap: boolean;
  vaiTro: VaiTro | null;
  hoTen: string;
  coKetNoi: boolean;
  duocPhep: (quyen: Quyen) => boolean;
  ghiDuoc: (quyen: Quyen) => boolean;
};

export function usePhien(): TrangThaiPhien {
  const phien = useSyncExternalStore(theoDoiPhien, docPhien, () => null);
  const coKetNoi = useSyncExternalStore(theoDoiPhien, coKetNoiKho, () => false);
  const vaiTro = phien?.vaiTro ?? null;
  return {
    phien,
    daDangNhap: phien !== null,
    vaiTro,
    hoTen: phien?.hoTen ?? '',
    coKetNoi,
    duocPhep: (quyen: Quyen) => coQuyen(vaiTro, quyen),
    ghiDuoc: (quyen: Quyen) => coQuyen(vaiTro, quyen) && coKetNoi,
  };
}
