import type { ReactNode } from 'react';
import type { XepLoai } from '../kieu';
import { NHAN_XEP_LOAI } from '../nghiepvu/chamDiem';
import { NHAN_CANH_BAO, type MucCanhBao } from '../nghiepvu/hanXuLy';

type Sac = 'trung_tinh' | 'dat' | 'luuy' | 'canhbao';

const LOP_SAC: Record<Sac, string> = {
  trung_tinh: 'border-vien bg-nen text-[#3B4560]',
  dat: 'border-[#BBD9CC] bg-[#EDF6F1] text-dat',
  luuy: 'border-[#E5CFA0] bg-[#FDF6E7] text-[#8A5802]',
  canhbao: 'border-[#EFC0C8] bg-[#FDF0F2] text-canhbao',
};

export function Nhan({ sac = 'trung_tinh', children }: { sac?: Sac; children: ReactNode }) {
  return (
    <span
      className={`inline-block whitespace-nowrap border px-2 py-[2px] text-[0.875rem] font-medium ${LOP_SAC[sac]}`}
    >
      {children}
    </span>
  );
}

const SAC_XEP_LOAI: Record<XepLoai, Sac> = {
  tot: 'dat',
  kha: 'dat',
  dat: 'trung_tinh',
  chua_dat: 'canhbao',
};

export function NhanXepLoai({ xepLoai }: { xepLoai: XepLoai }) {
  return <Nhan sac={SAC_XEP_LOAI[xepLoai]}>{NHAN_XEP_LOAI[xepLoai]}</Nhan>;
}

const SAC_CANH_BAO: Record<MucCanhBao, Sac> = {
  con_han: 'trung_tinh',
  sap_den_han: 'trung_tinh',
  gan_han: 'luuy',
  rat_gan: 'luuy',
  qua_han: 'canhbao',
};

export function NhanHan({ muc, soNgay }: { muc: MucCanhBao; soNgay?: number }) {
  const phanPhu =
    soNgay === undefined
      ? ''
      : muc === 'qua_han'
        ? ` ${Math.abs(soNgay)} ngày làm việc`
        : ` · còn ${soNgay} ngày làm việc`;
  return (
    <Nhan sac={SAC_CANH_BAO[muc]}>
      {NHAN_CANH_BAO[muc]}
      {phanPhu}
    </Nhan>
  );
}

