import { describe, expect, it } from 'vitest';
import { lapDanhSachUngVien, lapDonViChuaDat } from './ungVienRutTham';
import { DIEM_NHOM_RONG } from './chamDiem';
import type { DonVi, DotKiemTra, KetQuaThamDinh, NghiQuyet } from '../kieu';

const donVi: DonVi[] = [
  {
    ma: 'TH-001',
    maDvhc: '99001',
    ten: 'Đơn vị thử 1',
    loai: 'xa',
    vung: 'chua_phan_loai',
    lanKiemTraGanNhat: '2026-06-01',
  },
  {
    ma: 'TH-002',
    maDvhc: '99002',
    ten: 'Đơn vị thử 2',
    loai: 'phuong',
    vung: 'chua_phan_loai',
    lanKiemTraGanNhat: null,
  },
];

function nq(id: string, maDonVi: string, phan: Partial<NghiQuyet> = {}): NghiQuyet {
  return {
    id,
    maDonVi,
    so: id.split('-')[2] ?? '1',
    kyHieu: 'NQ-HĐND',
    ngayBanHanh: '2026-03-01',
    kyHop: 'Kỳ họp thứ 3',
    loai: 'quy_pham',
    linhVuc: 'khac',
    trichYeu: 'Trích yếu thử',
    hieuLuc: 'con_hieu_luc',
    tepDinhKem: [],
    ngayCapNhat: '2026-03-02',
    ...phan,
  };
}

function ketQua(idNghiQuyet: string, ky: string, phan: Partial<KetQuaThamDinh> = {}): KetQuaThamDinh {
  return {
    idNghiQuyet,
    ky,
    diemNhom: { ...DIEM_NHOM_RONG },
    tongDiem: 0,
    xepLoai: 'chua_dat',
    coNoiDungTraiPhapLuat: false,
    nhanXet: '',
    nguoiThamDinh: 'Người thử',
    hanGiaiTrinh: '2026-07-10',
    giaiTrinh: null,
    trangThai: 'da_chot',
    ...phan,
  };
}

describe('lapDanhSachUngVien', () => {
  const nghiQuyet = [
    nq('TH-001-1-2026', 'TH-001'),
    nq('TH-001-2-2026', 'TH-001', { hieuLuc: 'het_hieu_luc' }),
    nq('TH-002-1-2026', 'TH-002', { linhVuc: 'dat_dai' }),
    nq('TH-999-1-2026', 'TH-999'), // đơn vị không có trong danh sách
  ];

  it('chỉ lấy nghị quyết còn hiệu lực và có đơn vị hợp lệ', () => {
    const ds = lapDanhSachUngVien({
      nghiQuyet,
      donVi,
      ketQua: [],
      dotKiemTra: [],
      ky: '2026-W31',
    });
    expect(ds.map((u) => u.id).sort()).toEqual(['TH-001-1-2026', 'TH-002-1-2026']);
  });

  it('loại nghị quyết đã trúng ở đợt khác', () => {
    const dot: DotKiemTra = {
      ky: '2026-W30',
      ngayRutTham: '2026-07-20',
      seed: '2026-W30-muoi',
      thamSoTrongSo: {},
      danhSachTrung: ['TH-001-1-2026'],
      nguoiPhanCong: {},
    };
    const ds = lapDanhSachUngVien({
      nghiQuyet,
      donVi,
      ketQua: [],
      dotKiemTra: [dot],
      ky: '2026-W31',
    });
    expect(ds.map((u) => u.id)).toEqual(['TH-002-1-2026']);
  });

  it('không tự loại trừ bằng đợt của chính kỳ đang xét', () => {
    const dot: DotKiemTra = {
      ky: '2026-W31',
      ngayRutTham: '2026-07-27',
      seed: '2026-W31-muoi',
      thamSoTrongSo: {},
      danhSachTrung: ['TH-001-1-2026'],
      nguoiPhanCong: {},
    };
    const ds = lapDanhSachUngVien({
      nghiQuyet,
      donVi,
      ketQua: [],
      dotKiemTra: [dot],
      ky: '2026-W31',
    });
    expect(ds.map((u) => u.id).sort()).toEqual(['TH-001-1-2026', 'TH-002-1-2026']);
  });

  it('lấy đúng ngày kiểm tra gần nhất của đơn vị', () => {
    const ds = lapDanhSachUngVien({
      nghiQuyet,
      donVi,
      ketQua: [],
      dotKiemTra: [],
      ky: '2026-W31',
    });
    expect(ds.find((u) => u.id === 'TH-001-1-2026')?.lanKiemTraGanNhat).toBe('2026-06-01');
    expect(ds.find((u) => u.id === 'TH-002-1-2026')?.lanKiemTraGanNhat).toBeNull();
  });
});

describe('lapDonViChuaDat', () => {
  const nghiQuyet = [nq('TH-001-1-2026', 'TH-001'), nq('TH-001-3-2026', 'TH-001')];

  it('bỏ qua kết quả chưa chốt', () => {
    const tap = lapDonViChuaDat(
      [ketQua('TH-001-1-2026', '2026-W20', { trangThai: 'chua_chot' })],
      nghiQuyet,
      '2026-W31',
    );
    expect(tap.size).toBe(0);
  });

  it('bỏ qua kết quả của chính kỳ đang rút và các kỳ sau', () => {
    const tap = lapDonViChuaDat(
      [
        ketQua('TH-001-1-2026', '2026-W31'),
        ketQua('TH-001-3-2026', '2026-W40'),
      ],
      nghiQuyet,
      '2026-W31',
    );
    expect(tap.size).toBe(0);
  });

  it('chỉ xét kết quả đã chốt gần nhất của mỗi đơn vị', () => {
    const tap = lapDonViChuaDat(
      [
        ketQua('TH-001-1-2026', '2026-W10'),
        ketQua('TH-001-3-2026', '2026-W20', { xepLoai: 'kha' }),
      ],
      nghiQuyet,
      '2026-W31',
    );
    expect(tap.has('TH-001')).toBe(false);
  });

  it('nhận diện đơn vị chưa đạt ở kỳ gần nhất', () => {
    const tap = lapDonViChuaDat(
      [
        ketQua('TH-001-1-2026', '2026-W10', { xepLoai: 'tot' }),
        ketQua('TH-001-3-2026', '2026-W20', { xepLoai: 'chua_dat' }),
      ],
      nghiQuyet,
      '2026-W31',
    );
    expect(tap.has('TH-001')).toBe(true);
  });
});
