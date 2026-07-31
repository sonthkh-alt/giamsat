import { describe, expect, it } from 'vitest';
import {
  coBatKyQuyenGhi,
  coQuyen,
  quyenCuaVaiTro,
  thieuQuyen,
  NHAN_QUYEN,
  NHAN_VAI_TRO,
} from './phanQuyen';
import type { Quyen, VaiTro } from '../kieu';

const VAI_TRO: VaiTro[] = ['quan_tri', 'thuong_truc', 'ban', 'van_phong', 'dai_bieu', 'don_vi'];
const QUYEN: Quyen[] = [
  'nhapNghiQuyet',
  'lapDanhMuc',
  'quyetDinhDanhMuc',
  'thamDinh',
  'ghiGiaiTrinh',
  'chotKetQua',
  'theoDoiNhiemVu',
  'quanLyHoSo',
  'quanTriHeThong',
];

describe('bảng vai trò và quyền', () => {
  it('mọi vai trò đều có nhãn tiếng Việt', () => {
    for (const v of VAI_TRO) expect(NHAN_VAI_TRO[v].trim().length).toBeGreaterThan(0);
  });

  it('mọi quyền đều có nhãn tiếng Việt', () => {
    for (const q of QUYEN) expect(NHAN_QUYEN[q].trim().length).toBeGreaterThan(0);
  });

  it('mọi vai trò đều khai được danh sách quyền', () => {
    for (const v of VAI_TRO) expect(Array.isArray(quyenCuaVaiTro(v))).toBe(true);
  });
});

describe('quản trị hệ thống', () => {
  it('có toàn bộ quyền', () => {
    for (const q of QUYEN) expect(coQuyen('quan_tri', q)).toBe(true);
  });

  it('là vai trò duy nhất được quản trị hệ thống', () => {
    for (const v of VAI_TRO) {
      expect(coQuyen(v, 'quanTriHeThong')).toBe(v === 'quan_tri');
    }
  });
});

describe('tách bạch thẩm quyền theo Quy chế', () => {
  it('chỉ Thường trực quyết định danh mục chính thức', () => {
    expect(coQuyen('thuong_truc', 'quyetDinhDanhMuc')).toBe(true);
    expect(coQuyen('van_phong', 'quyetDinhDanhMuc')).toBe(false);
    expect(coQuyen('ban', 'quyetDinhDanhMuc')).toBe(false);
  });

  it('Văn phòng lập danh mục đề xuất nhưng không quyết định', () => {
    expect(coQuyen('van_phong', 'lapDanhMuc')).toBe(true);
    expect(coQuyen('van_phong', 'quyetDinhDanhMuc')).toBe(false);
  });

  it('Ban chấm điểm nhưng không chốt kết quả', () => {
    expect(coQuyen('ban', 'thamDinh')).toBe(true);
    expect(coQuyen('ban', 'chotKetQua')).toBe(false);
  });

  it('chỉ Thường trực chốt kết quả', () => {
    expect(coQuyen('thuong_truc', 'chotKetQua')).toBe(true);
    for (const v of ['ban', 'van_phong', 'dai_bieu', 'don_vi'] as VaiTro[]) {
      expect(coQuyen(v, 'chotKetQua')).toBe(false);
    }
  });

  it('cấp xã chỉ được ghi giải trình', () => {
    expect(quyenCuaVaiTro('don_vi')).toEqual(['ghiGiaiTrinh']);
  });

  it('đại biểu chỉ được xem', () => {
    expect(quyenCuaVaiTro('dai_bieu')).toEqual([]);
    expect(coBatKyQuyenGhi('dai_bieu')).toBe(false);
  });

  it('chỉ Văn phòng và quản trị nhập được nghị quyết', () => {
    for (const v of VAI_TRO) {
      expect(coQuyen(v, 'nhapNghiQuyet')).toBe(v === 'van_phong' || v === 'quan_tri');
    }
  });
});

describe('chưa đăng nhập', () => {
  it('không có quyền nào', () => {
    for (const q of QUYEN) expect(coQuyen(null, q)).toBe(false);
    expect(coBatKyQuyenGhi(null)).toBe(false);
  });
});

describe('thieuQuyen', () => {
  it('nói rõ thiếu quyền gì và làm gì tiếp', () => {
    const thongDiep = thieuQuyen('chotKetQua');
    expect(thongDiep).toContain(NHAN_QUYEN.chotKetQua);
    expect(thongDiep).toMatch(/quản trị/i);
  });
});
