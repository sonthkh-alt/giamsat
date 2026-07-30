import { describe, expect, it } from 'vitest';
import { chamDiem, DIEM_TOI_DA, kiemTraDiem, tongDiem, xepLoai } from './chamDiem';
import type { DiemNhom } from '../kieu';

function diem(phan: Partial<DiemNhom> = {}): DiemNhom {
  return {
    thamQuyenHinhThuc: 0,
    trinhTuThuTuc: 0,
    noiDungHopPhap: 0,
    theThucTrinhBay: 0,
    khaThiThucTien: 0,
    ...phan,
  };
}

describe('thang điểm', () => {
  it('tổng điểm tối đa của năm nhóm đúng bằng 100', () => {
    expect(Object.values(DIEM_TOI_DA).reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('cộng đủ năm nhóm', () => {
    expect(tongDiem(diem({ thamQuyenHinhThuc: 20, noiDungHopPhap: 30 }))).toBe(50);
    expect(tongDiem(diem(DIEM_TOI_DA))).toBe(100);
  });
});

describe('kiemTraDiem', () => {
  it('bảng điểm hợp lệ không báo lỗi', () => {
    expect(kiemTraDiem(diem(DIEM_TOI_DA))).toEqual([]);
  });

  it('báo lỗi khi vượt điểm tối đa của nhóm', () => {
    const loi = kiemTraDiem(diem({ theThucTrinhBay: 11 }));
    expect(loi).toHaveLength(1);
    expect(loi[0]).toMatch(/0–10 điểm/);
  });

  it('báo lỗi khi điểm âm', () => {
    expect(kiemTraDiem(diem({ trinhTuThuTuc: -1 }))).toHaveLength(1);
  });

  it('báo lỗi khi nhóm chưa có điểm', () => {
    expect(kiemTraDiem(diem({ noiDungHopPhap: Number.NaN }))).toHaveLength(1);
  });
});

describe('xepLoai', () => {
  it('Tốt từ 90 điểm trở lên', () => {
    expect(xepLoai(100, false)).toBe('tot');
    expect(xepLoai(90, false)).toBe('tot');
  });

  it('Khá từ 75 đến 89', () => {
    expect(xepLoai(89, false)).toBe('kha');
    expect(xepLoai(75, false)).toBe('kha');
  });

  it('Đạt từ 60 đến 74', () => {
    expect(xepLoai(74, false)).toBe('dat');
    expect(xepLoai(60, false)).toBe('dat');
  });

  it('Chưa đạt dưới 60', () => {
    expect(xepLoai(59, false)).toBe('chua_dat');
    expect(xepLoai(0, false)).toBe('chua_dat');
  });

  it('nội dung trái pháp luật luôn là Chưa đạt, bất kể tổng điểm', () => {
    expect(xepLoai(100, true)).toBe('chua_dat');
    expect(xepLoai(95, true)).toBe('chua_dat');
    expect(xepLoai(60, true)).toBe('chua_dat');
  });
});

describe('chamDiem', () => {
  it('trả về cả tổng điểm và xếp loại', () => {
    const kq = chamDiem(
      diem({
        thamQuyenHinhThuc: 20,
        trinhTuThuTuc: 18,
        noiDungHopPhap: 28,
        theThucTrinhBay: 9,
        khaThiThucTien: 18,
      }),
      false,
    );
    expect(kq.tongDiem).toBe(93);
    expect(kq.xepLoai).toBe('tot');
  });

  it('hạ xuống Chưa đạt khi có nội dung trái pháp luật dù điểm cao', () => {
    const kq = chamDiem(diem(DIEM_TOI_DA), true);
    expect(kq.tongDiem).toBe(100);
    expect(kq.xepLoai).toBe('chua_dat');
  });
});
