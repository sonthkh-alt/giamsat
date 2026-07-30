// Kiểm thử tích hợp trên chính bộ dữ liệu trong data/.
//
// Mục đích: bảo đảm nút "Chạy lại để kiểm chứng" trên trang Rút thăm luôn báo
// khớp với dữ liệu đi kèm kho, và các tệp JSON không bị lệch lược đồ.

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { CauHinh, DonVi, DotKiemTra, KetQuaThamDinh, NgayLe, NghiQuyet } from '../kieu';
import { chamDiem, DIEM_TOI_DA, kiemTraDiem, MA_NHOM } from './chamDiem';
import { kiemChungRutTham } from './rutTham';
import { lapDanhSachUngVien } from './ungVienRutTham';

const GOC = resolve(__dirname, '../..');
const doc = <T,>(duongDan: string): T =>
  JSON.parse(readFileSync(resolve(GOC, duongDan), 'utf8')) as T;

type DanhMucDvhc = {
  tong_so: number;
  don_vi: { ma_dvhc: string; ten_day_du: string; loai: string }[];
};

const cauHinh = doc<CauHinh>('data/cauhinh.json');
const danhMuc = doc<DanhMucDvhc>('data/donvi_hanhchinh_thanhhoa_166.json');
const ngayLe = doc<NgayLe[]>('data/ngayle.json');
const donVi = doc<DonVi[]>('data/mau/donvi.json');
const nghiQuyet = doc<NghiQuyet[]>('data/mau/nghiquyet/2026.json');
const mucLuc = doc<string[]>('data/mau/dotkiemtra/muc-luc.json');
const ketQua = doc<KetQuaThamDinh[]>('data/mau/ketqua/2026.json');
const dotKiemTra = mucLuc.map((ky) => doc<DotKiemTra>(`data/mau/dotkiemtra/${ky}.json`));

describe('cấu hình', () => {
  it('có mã muối và trỏ đúng kho', () => {
    expect(cauHinh.maMuoi.length).toBeGreaterThan(0);
    expect(cauHinh.chuKho).toBe('sonthkh-alt');
    expect(cauHinh.tenKho).toBe('giamsat');
    expect(cauHinh.nhanh).toBe('main');
  });

  it('ngày nghỉ lễ đúng định dạng ISO', () => {
    for (const n of ngayLe) expect(n.ngay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('danh mục đơn vị hành chính', () => {
  it('tệp nguồn có đủ 166 đơn vị, 19 phường và 147 xã', () => {
    expect(danhMuc.tong_so).toBe(166);
    expect(danhMuc.don_vi).toHaveLength(166);
    expect(danhMuc.don_vi.filter((d) => d.loai === 'Phường')).toHaveLength(19);
    expect(danhMuc.don_vi.filter((d) => d.loai === 'Xã')).toHaveLength(147);
  });

  it('mã đơn vị hành chính là 5 chữ số và không trùng nhau', () => {
    for (const d of danhMuc.don_vi) expect(d.ma_dvhc).toMatch(/^\d{5}$/);
    expect(new Set(danhMuc.don_vi.map((d) => d.ma_dvhc)).size).toBe(166);
  });
});

describe('dữ liệu giả lập', () => {
  it('có đủ 166 xã, phường', () => {
    expect(donVi).toHaveLength(166);
    expect(donVi.filter((d) => d.loai === 'phuong')).toHaveLength(19);
    expect(donVi.filter((d) => d.loai === 'xa')).toHaveLength(147);
  });

  it('mã đơn vị không trùng nhau', () => {
    expect(new Set(donVi.map((d) => d.ma)).size).toBe(donVi.length);
    expect(new Set(donVi.map((d) => d.maDvhc)).size).toBe(donVi.length);
  });

  it('tên và mã đơn vị lấy đúng từ danh mục chính thức, không tự chế', () => {
    expect(donVi).toHaveLength(danhMuc.don_vi.length);
    donVi.forEach((d, i) => {
      const goc = danhMuc.don_vi[i]!;
      expect(d.ten).toBe(goc.ten_day_du);
      expect(d.maDvhc).toBe(goc.ma_dvhc);
      expect(d.loai).toBe(goc.loai === 'Phường' ? 'phuong' : 'xa');
    });
  });

  it('không tự gán vùng cho xã, phường có thật khi danh mục nguồn bỏ trống', () => {
    for (const d of donVi) expect(d.vung).toBe('chua_phan_loai');
  });

  it('id nghị quyết không trùng và trỏ tới đơn vị có thật', () => {
    const maDonVi = new Set(donVi.map((d) => d.ma));
    expect(new Set(nghiQuyet.map((nq) => nq.id)).size).toBe(nghiQuyet.length);
    for (const nq of nghiQuyet) {
      expect(maDonVi.has(nq.maDonVi)).toBe(true);
      expect(nq.id).toBe(`${nq.maDonVi}-${nq.so}-${nq.ngayBanHanh.slice(0, 4)}`);
    }
  });
});

describe('đợt rút thăm trong dữ liệu kèm kho', () => {
  it('có ít nhất một đợt và mục lục khớp với tệp đợt', () => {
    expect(dotKiemTra.length).toBe(mucLuc.length);
    expect(dotKiemTra.map((d) => d.ky).sort()).toEqual([...mucLuc].sort());
  });

  it.each(mucLuc)('đợt %s tính lại từ ảnh chụp cho đúng kết quả đã lưu', (ky) => {
    const dot = dotKiemTra.find((d) => d.ky === ky);
    expect(dot).toBeDefined();
    expect(dot?.anhChupUngVien, 'đợt phải lưu ảnh chụp ứng viên để kiểm chứng').toBeDefined();
    const kq = kiemChungRutTham(dot!, dot!.anhChupUngVien!, cauHinh.maMuoi);
    expect(kq.sanhSai).toEqual([]);
    expect(kq.khop).toBe(true);
  });

  it.each(mucLuc)('seed của đợt %s đúng công thức đã công bố', (ky) => {
    const dot = dotKiemTra.find((d) => d.ky === ky);
    expect(dot?.seed).toBe(`${ky}-${cauHinh.maMuoi}`);
  });

  it('ảnh chụp ứng viên khớp với cách lập danh sách của ứng dụng', () => {
    const dot = dotKiemTra[0]!;
    const idTheoUngDung = lapDanhSachUngVien({
      nghiQuyet,
      donVi,
      ketQua: [],
      dotKiemTra: [],
      ky: dot.ky,
    })
      .map((u) => u.id)
      .sort();
    const idTrongAnhChup = (dot.anhChupUngVien ?? []).map((u) => u.id).sort();
    expect(idTrongAnhChup).toEqual(idTheoUngDung);
  });

  it('mọi nghị quyết trúng thăm đều tồn tại trong cơ sở dữ liệu', () => {
    const idNghiQuyet = new Set(nghiQuyet.map((nq) => nq.id));
    for (const dot of dotKiemTra) {
      for (const id of dot.danhSachTrung) expect(idNghiQuyet.has(id)).toBe(true);
    }
  });
});

describe('kết quả thẩm định mẫu', () => {
  it('điểm từng nhóm nằm trong khung cho phép', () => {
    for (const kq of ketQua) {
      expect(kiemTraDiem(kq.diemNhom)).toEqual([]);
      for (const ma of MA_NHOM) expect(kq.diemNhom[ma]).toBeLessThanOrEqual(DIEM_TOI_DA[ma]);
    }
  });

  it('tổng điểm và xếp loại tính đúng theo quy tắc', () => {
    for (const kq of ketQua) {
      const tinhLai = chamDiem(kq.diemNhom, kq.coNoiDungTraiPhapLuat);
      expect(tinhLai.tongDiem).toBe(kq.tongDiem);
      expect(tinhLai.xepLoai).toBe(kq.xepLoai);
    }
  });

  it('nghị quyết có nội dung trái pháp luật đều bị xếp chưa đạt', () => {
    for (const kq of ketQua) {
      if (kq.coNoiDungTraiPhapLuat) expect(kq.xepLoai).toBe('chua_dat');
    }
  });

  it('mỗi kết quả gắn với một nghị quyết đã trúng thăm trong cùng kỳ', () => {
    for (const kq of ketQua) {
      const dot = dotKiemTra.find((d) => d.ky === kq.ky);
      expect(dot, `không tìm thấy đợt ${kq.ky}`).toBeDefined();
      expect(dot!.danhSachTrung).toContain(kq.idNghiQuyet);
    }
  });
});
