import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bam32,
  kiemChungRutTham,
  kyRutTham,
  mulberry32,
  rutTham,
  taoSeed,
  tinhTrongSo,
  tuanISO,
  THAM_SO_TRONG_SO_MAC_DINH,
  type UngVienRutTham,
} from './rutTham';

const NGAY_RUT = '2026-07-27'; // thứ Hai, tuần ISO 31 năm 2026
const MUOI = 'muoi-cong-bo-truoc';

function taoUngVien(soLuong: number): UngVienRutTham[] {
  return Array.from({ length: soLuong }, (_, i) => ({
    id: `TH-${String((i % 40) + 1).padStart(3, '0')}-${i + 1}-2026`,
    maDonVi: `TH-${String((i % 40) + 1).padStart(3, '0')}`,
    linhVuc: i % 3 === 0 ? ('ngan_sach' as const) : ('khac' as const),
    lanKiemTraGanNhat: i % 5 === 0 ? null : '2026-06-01',
    kyTruocChuaDat: i % 11 === 0,
  }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('tuanISO / kyRutTham', () => {
  it('tính đúng tuần ISO đầu năm', () => {
    expect(tuanISO('2026-01-01')).toEqual({ nam: 2026, tuan: 1 });
  });

  it('tính đúng tuần 31 năm 2026', () => {
    expect(kyRutTham('2026-07-27')).toBe('2026-W31');
    expect(kyRutTham('2026-07-30')).toBe('2026-W31');
  });

  it('ngày đầu năm 2027 vẫn thuộc tuần 53 của năm 2026', () => {
    expect(tuanISO('2027-01-01')).toEqual({ nam: 2026, tuan: 53 });
  });

  it('mọi ngày trong cùng một tuần cho cùng mã kỳ', () => {
    const ky = ['2026-07-27', '2026-07-28', '2026-07-29', '2026-07-31', '2026-08-02'].map(
      kyRutTham,
    );
    expect(new Set(ky).size).toBe(1);
  });
});

describe('taoSeed', () => {
  it('ghép kỳ với mã muối', () => {
    expect(taoSeed('2026-W31', MUOI)).toBe(`2026-W31-${MUOI}`);
  });

  it('từ chối khi thiếu mã muối', () => {
    expect(() => taoSeed('2026-W31', '')).toThrow();
  });
});

describe('bộ sinh số có seed', () => {
  it('cùng hạt cho cùng dãy số', () => {
    const a = mulberry32(bam32('2026-W31-muoi'));
    const b = mulberry32(bam32('2026-W31-muoi'));
    const dayA = Array.from({ length: 20 }, () => a());
    const dayB = Array.from({ length: 20 }, () => b());
    expect(dayA).toEqual(dayB);
  });

  it('sinh số trong nửa khoảng [0, 1)', () => {
    const sinh = mulberry32(bam32('bat-ky'));
    for (let i = 0; i < 1000; i += 1) {
      const so = sinh();
      expect(so).toBeGreaterThanOrEqual(0);
      expect(so).toBeLessThan(1);
    }
  });

  it('hạt khác nhau cho dãy số khác nhau', () => {
    expect(mulberry32(bam32('a'))()).not.toBe(mulberry32(bam32('b'))());
  });
});

describe('tinhTrongSo', () => {
  const goc: UngVienRutTham = {
    id: 'TH-001-1-2026',
    maDonVi: 'TH-001',
    linhVuc: 'khac',
    lanKiemTraGanNhat: '2026-07-01',
    kyTruocChuaDat: false,
  };

  it('trường hợp thường có trọng số cơ bản', () => {
    expect(tinhTrongSo(goc, NGAY_RUT).trongSo).toBe(1);
  });

  it('đơn vị chưa kiểm tra trong 6 tháng nhân 3', () => {
    const uv = { ...goc, lanKiemTraGanNhat: '2025-12-01' };
    expect(tinhTrongSo(uv, NGAY_RUT).trongSo).toBe(3);
  });

  it('đơn vị chưa từng kiểm tra cũng nhân 3 và ghi rõ lý do', () => {
    const kq = tinhTrongSo({ ...goc, lanKiemTraGanNhat: null }, NGAY_RUT);
    expect(kq.trongSo).toBe(3);
    expect(kq.lyDo).toContain('Đơn vị chưa từng được kiểm tra');
  });

  it('lĩnh vực ưu tiên nhân 2', () => {
    expect(tinhTrongSo({ ...goc, linhVuc: 'dat_dai' }, NGAY_RUT).trongSo).toBe(2);
    expect(tinhTrongSo({ ...goc, linhVuc: 'che_do_chinh_sach' }, NGAY_RUT).trongSo).toBe(2);
  });

  it('lĩnh vực "khac" không được ưu tiên', () => {
    expect(tinhTrongSo({ ...goc, linhVuc: 'khac' }, NGAY_RUT).trongSo).toBe(1);
  });

  it('kỳ trước chưa đạt nhân 2', () => {
    expect(tinhTrongSo({ ...goc, kyTruocChuaDat: true }, NGAY_RUT).trongSo).toBe(2);
  });

  it('các hệ số nhân dồn với nhau', () => {
    const uv: UngVienRutTham = {
      ...goc,
      linhVuc: 'ngan_sach',
      lanKiemTraGanNhat: null,
      kyTruocChuaDat: true,
    };
    const kq = tinhTrongSo(uv, NGAY_RUT);
    expect(kq.trongSo).toBe(12); // 1 × 3 × 2 × 2
    expect(kq.lyDo).toHaveLength(3);
  });

  it('mốc 6 tháng là 183 ngày, ngày thứ 183 vẫn coi là còn hạn', () => {
    expect(tinhTrongSo({ ...goc, lanKiemTraGanNhat: '2026-01-25' }, NGAY_RUT).trongSo).toBe(1);
    expect(tinhTrongSo({ ...goc, lanKiemTraGanNhat: '2026-01-24' }, NGAY_RUT).trongSo).toBe(3);
  });
});

describe('rutTham', () => {
  const ungVien = taoUngVien(60);

  it('không dùng Math.random', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('rutTham không được phép dùng Math.random');
    });
    expect(() =>
      rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI }),
    ).not.toThrow();
  });

  it('chạy lại cho kết quả y hệt', () => {
    const a = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    const b = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    expect(a.danhSachTrung).toEqual(b.danhSachTrung);
    expect(a.seed).toBe(b.seed);
  });

  it('không phụ thuộc thứ tự truyền vào', () => {
    const daoNguoc = [...ungVien].reverse();
    const a = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    const b = rutTham({
      ungVien: daoNguoc,
      soLuongCanRut: 5,
      ngayRutTham: NGAY_RUT,
      maMuoi: MUOI,
    });
    expect(a.danhSachTrung).toEqual(b.danhSachTrung);
  });

  it('mọi ngày trong cùng tuần cho cùng kết quả', () => {
    const thuHai = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: '2026-07-27', maMuoi: MUOI });
    const thuSau = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: '2026-07-31', maMuoi: MUOI });
    expect(thuHai.ky).toBe(thuSau.ky);
    expect(thuHai.seed).toBe(thuSau.seed);
  });

  it('rút đúng số lượng, không trùng lặp', () => {
    const kq = rutTham({ ungVien, soLuongCanRut: 7, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    expect(kq.danhSachTrung).toHaveLength(7);
    expect(new Set(kq.danhSachTrung).size).toBe(7);
  });

  it('chỉ rút trong danh sách ứng viên', () => {
    const kq = rutTham({ ungVien, soLuongCanRut: 7, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    const hopLe = new Set(ungVien.map((uv) => uv.id));
    for (const id of kq.danhSachTrung) expect(hopLe.has(id)).toBe(true);
  });

  it('không rút quá số ứng viên hiện có', () => {
    const it3 = taoUngVien(3);
    const kq = rutTham({ ungVien: it3, soLuongCanRut: 10, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    expect(kq.danhSachTrung).toHaveLength(3);
  });

  it('ghi đủ nhật ký để kiểm chứng lại', () => {
    const kq = rutTham({ ungVien, soLuongCanRut: 4, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    expect(kq.seed).toBe(`2026-W31-${MUOI}`);
    expect(kq.ungVien).toHaveLength(ungVien.length);
    expect(kq.trongSo).toHaveLength(ungVien.length);
    expect(kq.thamSoTrongSo).toEqual(THAM_SO_TRONG_SO_MAC_DINH);
    expect(kq.nhatKy).toHaveLength(4);
    expect(kq.nhatKy.map((b) => b.idTrung)).toEqual(kq.danhSachTrung);
    for (const buoc of kq.nhatKy) {
      expect(buoc.moc).toBeLessThan(buoc.tongTrongSo);
      expect(buoc.moc).toBeGreaterThanOrEqual(0);
    }
  });

  it('tổng trọng số giảm dần qua từng lượt vì rút không hoàn lại', () => {
    const kq = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    for (let i = 1; i < kq.nhatKy.length; i += 1) {
      expect(kq.nhatKy[i]!.tongTrongSo).toBeLessThan(kq.nhatKy[i - 1]!.tongTrongSo);
    }
  });

  it('mã muối khác cho kết quả khác', () => {
    const a = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: 'muoi-a' });
    const b = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: 'muoi-b' });
    expect(a.danhSachTrung).not.toEqual(b.danhSachTrung);
  });

  it('tuần khác cho kết quả khác', () => {
    const a = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: '2026-07-27', maMuoi: MUOI });
    const b = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: '2026-08-03', maMuoi: MUOI });
    expect(a.danhSachTrung).not.toEqual(b.danhSachTrung);
  });

  it('từ chối danh sách có id trùng', () => {
    const trung = [...taoUngVien(2), ...taoUngVien(2)];
    expect(() =>
      rutTham({ ungVien: trung, soLuongCanRut: 1, ngayRutTham: NGAY_RUT, maMuoi: MUOI }),
    ).toThrow(/trùng/);
  });

  it('từ chối số lượng cần rút không hợp lệ', () => {
    expect(() =>
      rutTham({ ungVien, soLuongCanRut: -1, ngayRutTham: NGAY_RUT, maMuoi: MUOI }),
    ).toThrow();
    expect(() =>
      rutTham({ ungVien, soLuongCanRut: 1.5, ngayRutTham: NGAY_RUT, maMuoi: MUOI }),
    ).toThrow();
  });

  it('danh sách rỗng cho kết quả rỗng chứ không lỗi', () => {
    const kq = rutTham({ ungVien: [], soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI });
    expect(kq.danhSachTrung).toEqual([]);
  });

  it('ứng viên trọng số cao được rút nhiều hơn rõ rệt qua nhiều tuần', () => {
    // Một đơn vị nặng ký (12) trộn với 19 đơn vị nhẹ (1): tần suất trúng phải cao hơn hẳn.
    const nang: UngVienRutTham = {
      id: 'TH-999-1-2026',
      maDonVi: 'TH-999',
      linhVuc: 'ngan_sach',
      lanKiemTraGanNhat: null,
      kyTruocChuaDat: true,
    };
    const nhe: UngVienRutTham[] = Array.from({ length: 19 }, (_, i) => ({
      id: `TH-${String(i + 1).padStart(3, '0')}-1-2026`,
      maDonVi: `TH-${String(i + 1).padStart(3, '0')}`,
      linhVuc: 'khac',
      lanKiemTraGanNhat: '2026-07-20',
      kyTruocChuaDat: false,
    }));
    let soLanTrung = 0;
    for (let tuan = 1; tuan <= 52; tuan += 1) {
      const kq = rutTham({
        ungVien: [nang, ...nhe],
        soLuongCanRut: 1,
        ngayRutTham: NGAY_RUT,
        maMuoi: MUOI,
        ky: `2026-W${String(tuan).padStart(2, '0')}`,
      });
      if (kq.danhSachTrung[0] === nang.id) soLanTrung += 1;
    }
    // Xác suất lý thuyết 12/31 ≈ 39%; chỉ cần cao hơn hẳn mức đều 1/20 = 5%.
    expect(soLanTrung).toBeGreaterThan(52 * 0.15);
  });
});

describe('kiemChungRutTham', () => {
  const ungVien = taoUngVien(40);
  const goc = rutTham({ ungVien, soLuongCanRut: 5, ngayRutTham: NGAY_RUT, maMuoi: MUOI });

  it('xác nhận khớp khi dữ liệu không đổi', () => {
    const kq = kiemChungRutTham(goc, ungVien, MUOI);
    expect(kq.khop).toBe(true);
    expect(kq.sanhSai).toEqual([]);
  });

  it('phát hiện khi một ứng viên đã trúng bị rút khỏi danh sách', () => {
    const daBoBot = ungVien.filter((uv) => uv.id !== goc.danhSachTrung[0]);
    const kq = kiemChungRutTham(goc, daBoBot, MUOI);
    expect(kq.khop).toBe(false);
    expect(kq.sanhSai.join(' ')).toMatch(/Danh sách trúng khác nhau/);
  });

  it('phát hiện khi trọng số của cả danh sách bị thay đổi', () => {
    const daSua = ungVien.map((uv) => ({
      ...uv,
      linhVuc: 'dat_dai' as const,
      lanKiemTraGanNhat: null,
      kyTruocChuaDat: true,
    }));
    const kq = kiemChungRutTham(goc, daSua, MUOI);
    expect(kq.khop).toBe(false);
  });

  it('phát hiện khi mã muối bị đổi', () => {
    const kq = kiemChungRutTham(goc, ungVien, 'muoi-khac');
    expect(kq.khop).toBe(false);
    expect(kq.sanhSai.join(' ')).toMatch(/Seed khác nhau/);
  });
});
