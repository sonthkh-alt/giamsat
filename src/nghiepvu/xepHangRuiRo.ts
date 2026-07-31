import type { CanhBao, CauHinhDauHieu, NghiQuyet } from '../kieu';
import { boDau } from './nhan';

export const DIEM_RUI_RO_TOI_DA = 100;

function chuaCumTu(vanBan: string, cumTu: string): boolean {
  return boDau(vanBan).includes(boDau(cumTu));
}

function trichDoan(vanBan: string, cumTu: string, doDai = 120): string {
  const viTri = boDau(vanBan).indexOf(boDau(cumTu));
  if (viTri < 0) return vanBan.slice(0, doDai);
  const dau = Math.max(0, viTri - 30);
  const cuoi = Math.min(vanBan.length, viTri + cumTu.length + 50);
  return `${dau > 0 ? '…' : ''}${vanBan.slice(dau, cuoi).trim()}${cuoi < vanBan.length ? '…' : ''}`;
}

export function locCanhBaoHopLe(danhSach: readonly CanhBao[]): CanhBao[] {
  return danhSach.filter(
    (cb) =>
      cb.lyDo.trim().length > 0 &&
      cb.viTri.truong.trim().length > 0 &&
      cb.viTri.trichDan.trim().length > 0,
  );
}

function canCuHetHieuLuc(nghiQuyet: NghiQuyet, cauHinh: CauHinhDauHieu): CanhBao[] {
  const { diem, mucDo, danhMuc } = cauHinh.canCuHetHieuLuc;
  const ketQua: CanhBao[] = [];
  for (const canCu of nghiQuyet.canCuPhapLy) {
    for (const muc of danhMuc) {
      if (!chuaCumTu(canCu, muc.mau)) continue;
      ketQua.push({
        dauHieu: 'can_cu_het_hieu_luc',
        mucDo,
        diem,
        lyDo: `${muc.lyDo}. Đề nghị đối chiếu và thay bằng ${muc.thayTheBoi}.`,
        viTri: { truong: 'Căn cứ pháp lý', trichDan: trichDoan(canCu, muc.mau) },
      });
    }
  }
  return ketQua;
}

function tenKhongConDung(nghiQuyet: NghiQuyet, cauHinh: CauHinhDauHieu): CanhBao[] {
  const { diem, mucDo, danhMuc } = cauHinh.tenKhongConDung;
  const ketQua: CanhBao[] = [];
  const chogTim: { truong: string; vanBan: string }[] = [
    { truong: 'Trích yếu', vanBan: nghiQuyet.trichYeu },
    ...nghiQuyet.canCuPhapLy.map((c) => ({ truong: 'Căn cứ pháp lý', vanBan: c })),
  ];
  for (const cho of chogTim) {
    for (const muc of danhMuc) {
      if (!chuaCumTu(cho.vanBan, muc.mau)) continue;
      ketQua.push({
        dauHieu: 'ten_khong_con_dung',
        mucDo,
        diem,
        lyDo: `Xuất hiện "${muc.mau}". ${muc.lyDo}.`,
        viTri: { truong: cho.truong, trichDan: trichDoan(cho.vanBan, muc.mau) },
      });
    }
  }
  return ketQua;
}

function thamQuyenTheoLinhVuc(nghiQuyet: NghiQuyet, cauHinh: CauHinhDauHieu): CanhBao[] {
  const { diem, mucDo, quyTac } = cauHinh.thamQuyenTheoLinhVuc;
  return quyTac
    .filter((qt) => qt.linhVuc === nghiQuyet.linhVuc && qt.loai === nghiQuyet.loai)
    .map((qt) => ({
      dauHieu: 'tham_quyen_theo_linh_vuc' as const,
      mucDo,
      diem,
      lyDo: qt.lyDo,
      viTri: {
        truong: 'Lĩnh vực và loại văn bản',
        trichDan: `${nghiQuyet.so}/${nghiQuyet.kyHieu} — ${nghiQuyet.trichYeu}`,
      },
    }));
}

function thanhPhanHoSo(nghiQuyet: NghiQuyet, cauHinh: CauHinhDauHieu): CanhBao[] {
  if (nghiQuyet.loai !== 'quy_pham') return [];
  const { diem, mucDo, batBuoc } = cauHinh.thanhPhanHoSo;
  const daCo = new Set(nghiQuyet.hoSoTrinh);
  const thieu = batBuoc.filter((tp) => !daCo.has(tp.ma));
  if (thieu.length === 0) return [];
  return [
    {
      dauHieu: 'thanh_phan_ho_so',
      mucDo,
      diem,
      lyDo: `Hồ sơ trình còn thiếu ${thieu.length} thành phần bắt buộc: ${thieu
        .map((tp) => tp.ten)
        .join('; ')}.`,
      viTri: {
        truong: 'Hồ sơ trình',
        trichDan:
          nghiQuyet.hoSoTrinh.length === 0
            ? 'Chưa khai thành phần hồ sơ nào'
            : `Đã có: ${nghiQuyet.hoSoTrinh.join(', ')}`,
      },
    },
  ];
}

function theThuc(nghiQuyet: NghiQuyet, cauHinh: CauHinhDauHieu): CanhBao[] {
  const { diem, mucDo, quyTac } = cauHinh.theThuc;
  const ketQua: CanhBao[] = [];
  const lay = (ma: string) => quyTac.find((qt) => qt.ma === ma);

  const soRong = lay('so_rong');
  if (soRong && nghiQuyet.so.trim() === '') {
    ketQua.push({
      dauHieu: 'the_thuc',
      mucDo,
      diem,
      lyDo: soRong.lyDo,
      viTri: { truong: 'Số, ký hiệu', trichDan: `/${nghiQuyet.kyHieu}` },
    });
  }

  const trichYeuRong = lay('trich_yeu_rong');
  if (trichYeuRong && nghiQuyet.trichYeu.trim() === '') {
    ketQua.push({
      dauHieu: 'the_thuc',
      mucDo,
      diem,
      lyDo: trichYeuRong.lyDo,
      viTri: { truong: 'Trích yếu', trichDan: `${nghiQuyet.so}/${nghiQuyet.kyHieu}` },
    });
  }

  const thieuKyHop = lay('thieu_ky_hop');
  if (thieuKyHop && nghiQuyet.kyHop.trim() === '') {
    ketQua.push({
      dauHieu: 'the_thuc',
      mucDo,
      diem,
      lyDo: thieuKyHop.lyDo,
      viTri: { truong: 'Kỳ họp', trichDan: `${nghiQuyet.so}/${nghiQuyet.kyHieu}` },
    });
  }

  const kyHieuQuyPham = lay('ky_hieu_quy_pham');
  if (kyHieuQuyPham && nghiQuyet.loai === 'quy_pham') {
    const nam = nghiQuyet.ngayBanHanh.slice(0, 4);

    const coNam = nghiQuyet.so.includes(`/${nam}`) || nghiQuyet.kyHieu.includes(nam);
    if (!coNam) {
      ketQua.push({
        dauHieu: 'the_thuc',
        mucDo,
        diem,
        lyDo: kyHieuQuyPham.lyDo,
        viTri: {
          truong: 'Số, ký hiệu',
          trichDan: `${nghiQuyet.so}/${nghiQuyet.kyHieu} (đúng mẫu: ${nghiQuyet.so}/${nam}/${kyHieuQuyPham.mauKyHieu ?? 'NQ-HĐND'})`,
        },
      });
    }
  }

  return ketQua;
}

export function phatHienCanhBao(nghiQuyet: NghiQuyet, cauHinh: CauHinhDauHieu): CanhBao[] {
  return locCanhBaoHopLe([
    ...canCuHetHieuLuc(nghiQuyet, cauHinh),
    ...tenKhongConDung(nghiQuyet, cauHinh),
    ...thamQuyenTheoLinhVuc(nghiQuyet, cauHinh),
    ...thanhPhanHoSo(nghiQuyet, cauHinh),
    ...theThuc(nghiQuyet, cauHinh),
  ]);
}

export function tinhDiemRuiRo(canhBao: readonly CanhBao[]): number {
  const tong = canhBao.reduce((s, cb) => s + cb.diem, 0);
  return Math.min(tong, DIEM_RUI_RO_TOI_DA);
}

export type XepHang = {
  nghiQuyet: NghiQuyet;
  canhBao: CanhBao[];
  diemRuiRo: number;
};

export function xepHangTheoRuiRo(
  danhSach: readonly NghiQuyet[],
  cauHinh: CauHinhDauHieu,
): XepHang[] {
  return danhSach
    .map((nghiQuyet) => {
      const canhBao = phatHienCanhBao(nghiQuyet, cauHinh);
      return { nghiQuyet, canhBao, diemRuiRo: tinhDiemRuiRo(canhBao) };
    })
    .sort((a, b) =>
      b.diemRuiRo !== a.diemRuiRo
        ? b.diemRuiRo - a.diemRuiRo
        : a.nghiQuyet.id < b.nghiQuyet.id
          ? -1
          : 1,
    );
}

export function tomTatCanhBao(canhBao: readonly CanhBao[]): string {
  if (canhBao.length === 0) return '';
  const dau = canhBao[0]!;
  const con = canhBao.length - 1;
  return con === 0 ? dau.lyDo : `${dau.lyDo} (và ${con} dấu hiệu khác)`;
}
