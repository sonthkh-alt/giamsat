import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import type {
  CauHinh,
  CauHinhDauHieu,
  DonVi,
  DotRaSoat,
  KetQuaThamDinh,
  KhungNghiepVu,
  MaNhomGS,
  NgayLe,
  NghiQuyet,
  NhiemVuSauGiamSat,
} from '../kieu';
import { chamDiem, DIEM_TOI_DA, kiemTraDiem, MA_NHOM } from './chamDiem';
import { THU_TU_CACH_THUC } from './lapDanhMuc';
import { conPhaiTheoDoi, THU_TU_BUOC_XU_LY } from './theoDoiNhiemVu';
import { locCanhBaoHopLe, phatHienCanhBao } from './xepHangRuiRo';

const GOC = resolve(__dirname, '../..');
const doc = <T,>(duongDan: string): T =>
  JSON.parse(readFileSync(resolve(GOC, duongDan), 'utf8')) as T;

type DanhMucDvhc = {
  tong_so: number;
  don_vi: { ma_dvhc: string; ten_day_du: string; loai: string }[];
};

const cauHinh = doc<CauHinh>('data/cauhinh.json');
const khung = doc<KhungNghiepVu>('data/khung-nghiep-vu.json');
const dauHieu = doc<CauHinhDauHieu>('data/dauhieu-canhbao.json');
const ngayLe = doc<NgayLe[]>('data/ngayle.json');
const danhMuc = doc<DanhMucDvhc>('data/donvi_hanhchinh_thanhhoa_166.json');
const donVi = doc<DonVi[]>('data/mau/donvi.json');
const nghiQuyet = doc<NghiQuyet[]>('data/mau/nghiquyet/2026.json');
const mucLuc = doc<string[]>('data/mau/dotrasoat/muc-luc.json');
const ketQua = doc<KetQuaThamDinh[]>('data/mau/ketqua/2026.json');
const nhiemVu = doc<NhiemVuSauGiamSat[]>('data/mau/nhiemvu/2026.json');
const dotRaSoat = mucLuc.map((ky) => doc<DotRaSoat>(`data/mau/dotrasoat/${ky}.json`));

const MA_NHOM_GS: MaNhomGS[] = [
  'GS-01',
  'GS-02',
  'GS-03',
  'GS-04',
  'GS-05',
  'GS-06',
  'GS-07',
  'GS-08',
  'GS-09',
  'GS-10',
  'GS-11',
  'GS-12',
];

describe('cấu hình', () => {
  it('có mã muối, mốc chu kỳ và trỏ đúng kho', () => {
    expect(cauHinh.maMuoi.length).toBeGreaterThan(0);
    expect(cauHinh.chuKho).toBe('sonthkh-alt');
    expect(cauHinh.tenKho).toBe('giamsat');
    expect(cauHinh.nhanh).toBe('main');
    expect(cauHinh.ngayTongHop).toBe(20);
    expect(cauHinh.ngayTrinhDanhMuc).toBe(25);
    expect(cauHinh.soVanBanRaSoatMoiThang).toBeGreaterThan(0);
  });

  it('ngày nghỉ lễ đúng định dạng ISO', () => {
    for (const n of ngayLe) expect(n.ngay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('khung 12 nhóm nghiệp vụ', () => {
  it('có đúng 12 nhóm, mã không trùng và đúng tập giá trị', () => {
    expect(khung.nhom).toHaveLength(12);
    expect(khung.nhom.map((n) => n.ma).sort()).toEqual([...MA_NHOM_GS].sort());
  });

  it('mỗi nhóm nêu được căn cứ pháp lý', () => {
    for (const n of khung.nhom) expect(n.canCu.trim().length).toBeGreaterThan(0);
  });

  it('chủ thể và cấp của từng nhóm đều nằm trong danh mục đã khai', () => {
    const chuThe = new Set(khung.chuThe.map((c) => c.ma));
    const cap = new Set(khung.cap.map((c) => c.ma));
    for (const n of khung.nhom) {
      expect(n.chuTheApDung.length).toBeGreaterThan(0);
      for (const ct of n.chuTheApDung) expect(chuThe.has(ct)).toBe(true);
      for (const c of n.capApDung) expect(cap.has(c)).toBe(true);
    }
  });

  it('GS-09 tín nhiệm không được triển khai trên kho public', () => {
    const gs09 = khung.nhom.find((n) => n.ma === 'GS-09');
    expect(gs09?.trienKhai).toBe('khong_tren_kho_public');
    expect(gs09?.canhBaoDuLieu).toMatch(/không triển khai trên kho public/i);
    expect(gs09?.dauMuc).toEqual([]);
  });

  it('GS-06 khiếu nại tố cáo có cảnh báo về dữ liệu cá nhân', () => {
    const gs06 = khung.nhom.find((n) => n.ma === 'GS-06');
    expect(gs06?.canhBaoDuLieu).toMatch(/đơn thư|cá nhân/i);
  });

  it('các nhóm của giai đoạn 1 đúng như lộ trình', () => {
    const gd1 = khung.nhom.filter((n) => n.trienKhai === 'giai_doan_1').map((n) => n.ma);
    expect(gd1.sort()).toEqual(['GS-02', 'GS-11', 'GS-12']);
  });

  it('bộ đầu mục của nhóm đang triển khai không được rỗng', () => {
    for (const n of khung.nhom.filter((x) => x.trienKhai === 'giai_doan_1')) {
      expect(n.dauMuc.length).toBeGreaterThan(0);
      for (const dm of n.dauMuc) expect(dm.ten.trim().length).toBeGreaterThan(0);
    }
  });

  it('khai đủ năm cách thức lập danh mục, thứ tự ưu tiên không trùng', () => {
    expect(khung.cachThucLapDanhMuc).toHaveLength(5);
    expect(khung.cachThucLapDanhMuc.map((c) => c.ma).sort()).toEqual([...THU_TU_CACH_THUC].sort());
    const thuTu = khung.cachThucLapDanhMuc.map((c) => c.thuTuUuTien);
    expect(new Set(thuTu).size).toBe(5);
    expect(khung.cachThucLapDanhMuc.find((c) => c.ma === 'ngau_nhien')?.thuTuUuTien).toBe(5);
  });

  it('khai đủ bảy bước xử lý sau giám sát, đúng thứ tự', () => {
    expect(khung.buocXuLySauGiamSat).toHaveLength(7);
    const theoThuTu = [...khung.buocXuLySauGiamSat].sort((a, b) => a.thuTu - b.thuTu);
    expect(theoThuTu.map((b) => b.ma)).toEqual([...THU_TU_BUOC_XU_LY]);
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

describe('dữ liệu giả lập — đơn vị và nghị quyết', () => {
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
    const ma = new Set(donVi.map((d) => d.ma));
    expect(new Set(nghiQuyet.map((nq) => nq.id)).size).toBe(nghiQuyet.length);
    for (const nq of nghiQuyet) expect(ma.has(nq.maDonVi)).toBe(true);
  });

  it('mọi nghị quyết đều khai căn cứ pháp lý và thành phần hồ sơ', () => {
    for (const nq of nghiQuyet) {
      expect(Array.isArray(nq.canCuPhapLy)).toBe(true);
      expect(nq.canCuPhapLy.length).toBeGreaterThan(0);
      expect(Array.isArray(nq.hoSoTrinh)).toBe(true);
    }
  });

  it('bộ dữ liệu có gieo sẵn dấu hiệu để bộ phân tích có việc phát hiện', () => {
    const coCanhBao = nghiQuyet.filter((nq) => phatHienCanhBao(nq, dauHieu).length > 0);
    expect(coCanhBao.length).toBeGreaterThan(5);
  });

  it('mọi cảnh báo sinh ra từ dữ liệu thật đều nêu được lý do và vị trí', () => {
    for (const nq of nghiQuyet) {
      const cb = phatHienCanhBao(nq, dauHieu);
      expect(locCanhBaoHopLe(cb)).toHaveLength(cb.length);
    }
  });
});

describe('đợt rà soát trong dữ liệu kèm kho', () => {
  it('mục lục khớp với các tệp đợt', () => {
    expect(dotRaSoat).toHaveLength(mucLuc.length);
    expect(dotRaSoat.map((d) => d.ky).sort()).toEqual([...mucLuc].sort());
  });

  it.each(mucLuc)('đợt %s gắn đúng ba thuộc tính hồ sơ', (ky) => {
    const dot = dotRaSoat.find((d) => d.ky === ky)!;
    expect(dot.thuocTinh.nhomGS).toBe('GS-02');
    expect(MA_NHOM_GS).toContain(dot.thuocTinh.nhomGS);
    expect(['hdnd', 'thuong_truc', 'ban', 'to_dai_bieu', 'dai_bieu']).toContain(
      dot.thuocTinh.chuThe,
    );
    expect(['tinh', 'xa']).toContain(dot.thuocTinh.cap);
  });

  it.each(mucLuc)('mọi mục đề xuất của đợt %s đều nêu lý do và cách thức hợp lệ', (ky) => {
    const dot = dotRaSoat.find((d) => d.ky === ky)!;
    expect(dot.danhMucDeXuat.length).toBeGreaterThan(0);
    for (const muc of dot.danhMucDeXuat) {
      expect(muc.lyDo.trim().length).toBeGreaterThan(0);
      expect(THU_TU_CACH_THUC).toContain(muc.cachThuc);
      expect(muc.nguoiDeXuat.trim().length).toBeGreaterThan(0);
      expect(muc.diemRuiRo).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(mucLuc)('đợt %s có dùng ngẫu nhiên thì phải ghi seed', (ky) => {
    const dot = dotRaSoat.find((d) => d.ky === ky)!;
    const coNgauNhien = dot.danhMucDeXuat.some((m) => m.cachThuc === 'ngau_nhien');
    if (coNgauNhien) {
      expect(dot.seedNgauNhien).toBe(`${ky}-${cauHinh.maMuoi}`);
    } else {
      expect(dot.seedNgauNhien).toBeNull();
    }
  });

  it.each(mucLuc)('danh mục chính thức của đợt %s nằm trong nghị quyết đã có', (ky) => {
    const dot = dotRaSoat.find((d) => d.ky === ky)!;
    const id = new Set(nghiQuyet.map((nq) => nq.id));
    expect(dot.danhMucChinhThuc.length).toBeGreaterThan(0);
    for (const x of dot.danhMucChinhThuc) expect(id.has(x)).toBe(true);
    expect(new Set(dot.danhMucChinhThuc).size).toBe(dot.danhMucChinhThuc.length);
  });

  it.each(mucLuc)('mọi thay đổi danh mục của đợt %s đều ghi rõ ai sửa và lúc nào', (ky) => {
    const dot = dotRaSoat.find((d) => d.ky === ky)!;
    for (const td of dot.nhatKyThayDoi) {
      expect(td.nguoi.trim().length).toBeGreaterThan(0);
      expect(td.luc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(['them', 'bo']).toContain(td.hanhDong);
    }
  });

  it('bốn cách thức chủ động đều được dùng, ngẫu nhiên không lấn át', () => {
    const dem = new Map<string, number>();
    for (const dot of dotRaSoat) {
      for (const m of dot.danhMucDeXuat) dem.set(m.cachThuc, (dem.get(m.cachThuc) ?? 0) + 1);
    }
    const chuDong = ['chuyen_de', 'canh_bao', 'de_nghi', 'luan_phien'].reduce(
      (s, c) => s + (dem.get(c) ?? 0),
      0,
    );
    expect(chuDong).toBeGreaterThan(dem.get('ngau_nhien') ?? 0);
  });

  it('không văn bản nào bị rà soát ở hai đợt khác nhau', () => {
    const daThay = new Set<string>();
    for (const dot of dotRaSoat) {
      for (const id of dot.danhMucChinhThuc) {
        expect(daThay.has(id)).toBe(false);
        daThay.add(id);
      }
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

  it('văn bản có nội dung trái pháp luật đều bị xếp chưa đạt', () => {
    for (const kq of ketQua) {
      if (kq.coNoiDungTraiPhapLuat) expect(kq.xepLoai).toBe('chua_dat');
    }
  });

  it('mỗi kết quả gắn với văn bản nằm trong danh mục chính thức cùng kỳ', () => {
    for (const kq of ketQua) {
      const dot = dotRaSoat.find((d) => d.ky === kq.ky);
      expect(dot, `không tìm thấy đợt ${kq.ky}`).toBeDefined();
      expect(dot!.danhMucChinhThuc).toContain(kq.idNghiQuyet);
    }
  });

  it('kết quả đã chốt thì đơn vị phải có ngày rà soát gần nhất tương ứng', () => {
    const nqTheoId = new Map(nghiQuyet.map((nq) => [nq.id, nq]));
    const dvTheoMa = new Map(donVi.map((d) => [d.ma, d]));
    for (const kq of ketQua.filter((k) => k.trangThai === 'da_chot')) {
      const dv = dvTheoMa.get(nqTheoId.get(kq.idNghiQuyet)!.maDonVi)!;
      const dot = dotRaSoat.find((d) => d.ky === kq.ky)!;
      expect(dv.lanRaSoatGanNhat).not.toBeNull();
      expect(dv.lanRaSoatGanNhat! >= dot.ngayMoDot).toBe(true);
    }
  });
});

describe('nhiệm vụ sau giám sát mẫu', () => {
  it('id không trùng và gắn đúng ba thuộc tính hồ sơ', () => {
    expect(new Set(nhiemVu.map((n) => n.id)).size).toBe(nhiemVu.length);
    for (const nv of nhiemVu) {
      expect(['GS-11', 'GS-12']).toContain(nv.thuocTinh.nhomGS);
      expect(MA_NHOM_GS).toContain(nv.nguonGoc.nhomGS);
    }
  });

  it('có đủ mặt các trạng thái để chạy thử giao diện', () => {
    const tt = new Set(nhiemVu.map((n) => n.trangThai));
    expect(tt.size).toBeGreaterThanOrEqual(4);
  });

  it('bước xử lý đúng thứ tự Quy chế, không nhảy cóc', () => {
    for (const nv of nhiemVu) {
      const viTri = nv.buocXuLy.map((b) => THU_TU_BUOC_XU_LY.indexOf(b.ma));
      for (const v of viTri) expect(v).toBeGreaterThanOrEqual(0);
      expect(viTri).toEqual([...viTri].sort((a, b) => a - b));

      viTri.forEach((v, i) => expect(v).toBe(i));
      for (const b of nv.buocXuLy) {
        expect(b.ngay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(b.soVanBan.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('nhiệm vụ hoàn thành phải có ngày xác nhận', () => {
    for (const nv of nhiemVu.filter((n) => n.trangThai === 'hoan_thanh')) {
      expect(nv.ngayXacNhanHoanThanh).not.toBeNull();
    }
  });

  it('chỉ nhiệm vụ còn phải theo dõi mới đặt hạn giải trình Điều 40', () => {
    for (const nv of nhiemVu) {
      if (nv.hanGiaiTrinhDieu40 !== null) {
        expect(conPhaiTheoDoi(nv)).toBe(true);
        expect(nv.hanGiaiTrinhDieu40).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }
    }
  });
});
