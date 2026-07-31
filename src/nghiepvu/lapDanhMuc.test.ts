import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bam32,
  lapDanhMucDeXuat,
  lapDanhSachUngVien,
  mocChuKy,
  mulberry32,
  suaDanhMucChinhThuc,
  taoSeed,
  tinhHanThamDinh,
  THU_TU_CACH_THUC,
  type ThamSoLapDanhMuc,
} from './lapDanhMuc';
import type { CauHinhDauHieu, DonVi, DotRaSoat, LinhVuc, NghiQuyet } from '../kieu';

const NGAY = '2026-07-20';
const KY = '2026-07';
const MUOI = 'muoi-cong-bo-truoc';

const CAU_HINH_DAU_HIEU: CauHinhDauHieu = {
  phienBan: 'thu',
  ghiChu: '',
  canCuHetHieuLuc: {
    diem: 30,
    mucDo: 'cao',
    ghiChu: '',
    danhMuc: [{ mau: 'Luật số 80/2015/QH13', lyDo: 'Đã hết hiệu lực', thayTheBoi: 'Luật số 64/2025/QH15' }],
  },
  tenKhongConDung: {
    diem: 25,
    mucDo: 'cao',
    ghiChu: '',
    danhMuc: [{ mau: 'Ủy ban nhân dân huyện', lyDo: 'Không còn cấp huyện' }],
  },
  thamQuyenTheoLinhVuc: { diem: 20, mucDo: 'trung_binh', ghiChu: '', quyTac: [] },
  thanhPhanHoSo: {
    diem: 15,
    mucDo: 'trung_binh',
    ghiChu: '',
    batBuoc: [{ ma: 'to_trinh', ten: 'Tờ trình' }],
  },
  theThuc: { diem: 10, mucDo: 'thap', ghiChu: '', quyTac: [] },
};

function donVi(so: number, lanRaSoat: string | null): DonVi {
  return {
    ma: `TH-${String(so).padStart(3, '0')}`,
    maDvhc: `9${String(so).padStart(4, '0')}`,
    ten: `Đơn vị thử ${so}`,
    loai: 'xa',
    vung: 'chua_phan_loai',
    lanRaSoatGanNhat: lanRaSoat,
  };
}

function nghiQuyet(maDonVi: string, so: number, phan: Partial<NghiQuyet> = {}): NghiQuyet {
  return {
    id: `${maDonVi}-${so}-2026`,
    maDonVi,
    so: String(so),
    kyHieu: 'NQ-HĐND',
    ngayBanHanh: '2026-03-01',
    kyHop: 'Kỳ họp thứ 3',
    loai: 'ca_biet',
    linhVuc: 'khac',
    trichYeu: 'Trích yếu thử',
    hieuLuc: 'con_hieu_luc',
    canCuPhapLy: ['Căn cứ Luật Tổ chức chính quyền địa phương;'],
    hoSoTrinh: [],
    tepDinhKem: [],
    ngayCapNhat: '2026-03-02',
    ...phan,
  };
}

function boDuLieu(soDonVi = 20, soVanBanMoiDonVi = 2) {
  const dv: DonVi[] = [];
  const nq: NghiQuyet[] = [];
  for (let i = 1; i <= soDonVi; i += 1) {
    dv.push(donVi(i, i % 4 === 0 ? null : `2026-0${(i % 6) + 1}-10`));
    for (let j = 1; j <= soVanBanMoiDonVi; j += 1) {
      nq.push(nghiQuyet(`TH-${String(i).padStart(3, '0')}`, j));
    }
  }
  return { donVi: dv, nghiQuyet: nq };
}

function thamSo(ghiDe: Partial<ThamSoLapDanhMuc> = {}): ThamSoLapDanhMuc {
  const bo = boDuLieu();
  return {
    ky: KY,
    nghiQuyet: bo.nghiQuyet,
    donVi: bo.donVi,
    dotDaCo: [],
    cauHinhDauHieu: CAU_HINH_DAU_HIEU,
    linhVucTrongTam: null,
    deNghi: [],
    soLuongMucTieu: 10,
    maMuoi: MUOI,
    nguoiDeXuat: 'Văn phòng',
    ngayThamChieu: NGAY,
    ...ghiDe,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('mốc chu kỳ tháng', () => {
  it('tính đúng ngày tổng hợp và ngày trình', () => {
    expect(mocChuKy('2026-10', { ngayTongHop: 20, ngayTrinhDanhMuc: 25 })).toEqual({
      ky: '2026-10',
      ngayTongHop: '2026-10-20',
      ngayTrinhDanhMuc: '2026-10-25',
    });
  });

  it('hạn thẩm định là 10 ngày làm việc kể từ ngày mở đợt', () => {
    expect(tinhHanThamDinh('2026-07-27', [])).toBe('2026-08-10');
  });
});

describe('taoSeed', () => {
  it('ghép kỳ với mã muối', () => {
    expect(taoSeed('2026-10', MUOI)).toBe(`2026-10-${MUOI}`);
  });

  it('từ chối khi thiếu mã muối', () => {
    expect(() => taoSeed('2026-10', '')).toThrow();
  });
});

describe('bộ sinh số có seed', () => {
  it('cùng hạt cho cùng dãy số', () => {
    const a = Array.from({ length: 10 }, mulberry32(bam32('x')));
    const b = Array.from({ length: 10 }, mulberry32(bam32('x')));
    expect(a).toEqual(b);
  });

  it('sinh số trong nửa khoảng [0, 1)', () => {
    const sinh = mulberry32(bam32('bat-ky'));
    for (let i = 0; i < 500; i += 1) {
      const so = sinh();
      expect(so).toBeGreaterThanOrEqual(0);
      expect(so).toBeLessThan(1);
    }
  });
});

describe('lapDanhSachUngVien', () => {
  const bo = boDuLieu(3, 1);

  it('chỉ lấy văn bản còn hiệu lực', () => {
    const nq = [...bo.nghiQuyet];
    nq[0] = { ...nq[0]!, hieuLuc: 'het_hieu_luc' };
    const ds = lapDanhSachUngVien(nq, bo.donVi, [], KY);
    expect(ds.map((n) => n.id)).not.toContain(nq[0]!.id);
  });

  it('loại văn bản đã nằm trong danh mục chính thức của đợt khác', () => {
    const dot = { ky: '2026-06', danhMucChinhThuc: [bo.nghiQuyet[0]!.id] } as DotRaSoat;
    const ds = lapDanhSachUngVien(bo.nghiQuyet, bo.donVi, [dot], KY);
    expect(ds.map((n) => n.id)).not.toContain(bo.nghiQuyet[0]!.id);
  });

  it('không tự loại trừ bằng đợt của chính kỳ đang xét', () => {
    const dot = { ky: KY, danhMucChinhThuc: [bo.nghiQuyet[0]!.id] } as DotRaSoat;
    const ds = lapDanhSachUngVien(bo.nghiQuyet, bo.donVi, [dot], KY);
    expect(ds.map((n) => n.id)).toContain(bo.nghiQuyet[0]!.id);
  });

  it('loại văn bản của đơn vị không có trong danh sách', () => {
    const la = nghiQuyet('TH-999', 1);
    const ds = lapDanhSachUngVien([...bo.nghiQuyet, la], bo.donVi, [], KY);
    expect(ds.map((n) => n.id)).not.toContain(la.id);
  });
});

describe('lapDanhMucDeXuat', () => {
  it('KHÔNG dùng Math.random — con người quyết định, không phải máy bốc thăm', () => {
    vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('lapDanhMucDeXuat không được phép dùng Math.random');
    });
    expect(() => lapDanhMucDeXuat(thamSo())).not.toThrow();
  });

  it('mọi mục đề xuất đều có lý do — Thường trực phải biết vì sao', () => {
    const kq = lapDanhMucDeXuat(thamSo());
    expect(kq.danhMucDeXuat.length).toBeGreaterThan(0);
    for (const muc of kq.danhMucDeXuat) {
      expect(muc.lyDo.trim().length).toBeGreaterThan(0);
      expect(THU_TU_CACH_THUC).toContain(muc.cachThuc);
      expect(muc.nguoiDeXuat).toBe('Văn phòng');
    }
  });

  it('không đề xuất trùng văn bản', () => {
    const kq = lapDanhMucDeXuat(thamSo());
    const id = kq.danhMucDeXuat.map((m) => m.idNghiQuyet);
    expect(new Set(id).size).toBe(id.length);
  });

  it('không vượt quá số lượng mục tiêu', () => {
    const kq = lapDanhMucDeXuat(thamSo({ soLuongMucTieu: 6 }));
    expect(kq.danhMucDeXuat.length).toBeLessThanOrEqual(6);
  });

  it('chạy lại cho kết quả y hệt', () => {
    const a = lapDanhMucDeXuat(thamSo());
    const b = lapDanhMucDeXuat(thamSo());
    expect(a.danhMucDeXuat.map((m) => m.idNghiQuyet)).toEqual(
      b.danhMucDeXuat.map((m) => m.idNghiQuyet),
    );
    expect(a.seedNgauNhien).toBe(b.seedNgauNhien);
  });

  it('lĩnh vực trọng tâm sinh ra mục theo cách thức chuyên đề', () => {
    const bo = boDuLieu();
    const nq = bo.nghiQuyet.map((n, i) =>
      i < 5 ? { ...n, linhVuc: 'dat_dai' as LinhVuc } : n,
    );
    const kq = lapDanhMucDeXuat(
      thamSo({ nghiQuyet: nq, donVi: bo.donVi, linhVucTrongTam: 'dat_dai' }),
    );
    const chuyenDe = kq.danhMucDeXuat.filter((m) => m.cachThuc === 'chuyen_de');
    expect(chuyenDe.length).toBeGreaterThan(0);
    for (const m of chuyenDe) {
      expect(nq.find((n) => n.id === m.idNghiQuyet)?.linhVuc).toBe('dat_dai');
      expect(m.lyDo).toMatch(/lĩnh vực trọng tâm/i);
    }
  });

  it('văn bản có dấu hiệu được đề xuất theo cách thức cảnh báo, kèm điểm rủi ro', () => {
    const bo = boDuLieu();
    const nq = bo.nghiQuyet.map((n, i) =>
      i === 3
        ? {
            ...n,
            canCuPhapLy: [...n.canCuPhapLy, 'Căn cứ Luật số 80/2015/QH13;'],
            trichYeu: 'Về việc tiếp nhận nhiệm vụ từ Ủy ban nhân dân huyện',
          }
        : n,
    );
    const kq = lapDanhMucDeXuat(thamSo({ nghiQuyet: nq, donVi: bo.donVi }));
    const muc = kq.danhMucDeXuat.find((m) => m.idNghiQuyet === nq[3]!.id);
    expect(muc).toBeDefined();
    expect(muc!.cachThuc).toBe('canh_bao');
    expect(muc!.diemRuiRo).toBe(55);
    expect(muc!.canhBao.length).toBe(2);
  });

  it('đề nghị của cơ quan có thẩm quyền được đưa vào kèm tên người đề nghị', () => {
    const bo = boDuLieu();
    const id = bo.nghiQuyet[7]!.id;
    const kq = lapDanhMucDeXuat(
      thamSo({
        nghiQuyet: bo.nghiQuyet,
        donVi: bo.donVi,
        deNghi: [{ idNghiQuyet: id, nguoiDeNghi: 'Ủy ban Mặt trận Tổ quốc tỉnh', lyDo: 'Cử tri phản ánh' }],
      }),
    );
    const muc = kq.danhMucDeXuat.find((m) => m.idNghiQuyet === id);
    expect(muc?.cachThuc).toBe('de_nghi');
    expect(muc?.lyDo).toMatch(/Ủy ban Mặt trận Tổ quốc tỉnh/);
  });

  it('luân phiên ưu tiên đơn vị chưa từng được rà soát', () => {
    const kq = lapDanhMucDeXuat(thamSo());
    const luanPhien = kq.danhMucDeXuat.filter((m) => m.cachThuc === 'luan_phien');
    expect(luanPhien.length).toBeGreaterThan(0);
    for (const m of luanPhien) {
      expect(m.lyDo).toMatch(/chưa (từng được rà soát|được rà soát)|ngày chưa được rà soát/);
    }
  });

  it('ngẫu nhiên CHỈ bổ sung phần còn lại, không thay thế bốn cách trên', () => {
    const kq = lapDanhMucDeXuat(thamSo());
    const chuDong = (['chuyen_de', 'canh_bao', 'de_nghi', 'luan_phien'] as const).reduce(
      (s, c) => s + kq.thongKeCachThuc[c],
      0,
    );

    expect(kq.thongKeCachThuc.ngau_nhien).toBe(kq.danhMucDeXuat.length - chuDong);
    expect(chuDong).toBeGreaterThan(0);
  });

  it('có dùng ngẫu nhiên thì phải ghi seed để tra lại', () => {
    const kq = lapDanhMucDeXuat(thamSo());
    if (kq.thongKeCachThuc.ngau_nhien > 0) {
      expect(kq.seedNgauNhien).toBe(`${KY}-${MUOI}`);
      for (const m of kq.danhMucDeXuat.filter((x) => x.cachThuc === 'ngau_nhien')) {
        expect(m.lyDo).toContain(kq.seedNgauNhien!);
      }
    } else {
      expect(kq.seedNgauNhien).toBeNull();
    }
  });

  it('bốn cách chủ động lấp đủ danh mục thì không dùng ngẫu nhiên, không sinh seed', () => {
    const bo = boDuLieu();
    const nq = bo.nghiQuyet.map((n) => ({ ...n, linhVuc: 'dat_dai' as LinhVuc }));
    const kq = lapDanhMucDeXuat(
      thamSo({ nghiQuyet: nq, donVi: bo.donVi, soLuongMucTieu: 2, linhVucTrongTam: 'dat_dai' }),
    );
    expect(kq.danhMucDeXuat).toHaveLength(2);
    expect(kq.thongKeCachThuc.ngau_nhien).toBe(0);
    expect(kq.seedNgauNhien).toBeNull();
  });

  it('còn chỗ trống sau bốn cách chủ động thì ngẫu nhiên bù đúng phần thiếu', () => {
    const bo = boDuLieu();
    const nq = bo.nghiQuyet.map((n) => ({ ...n, linhVuc: 'dat_dai' as LinhVuc }));
    const kq = lapDanhMucDeXuat(
      thamSo({ nghiQuyet: nq, donVi: bo.donVi, soLuongMucTieu: 3, linhVucTrongTam: 'dat_dai' }),
    );

    expect(kq.thongKeCachThuc.ngau_nhien).toBe(1);
    expect(kq.seedNgauNhien).toBe(`${KY}-${MUOI}`);
  });

  it('danh sách rỗng cho danh mục rỗng chứ không lỗi', () => {
    const kq = lapDanhMucDeXuat(thamSo({ nghiQuyet: [], donVi: [] }));
    expect(kq.danhMucDeXuat).toEqual([]);
    expect(kq.seedNgauNhien).toBeNull();
  });

  it('từ chối số lượng mục tiêu không hợp lệ', () => {
    expect(() => lapDanhMucDeXuat(thamSo({ soLuongMucTieu: -1 }))).toThrow();
    expect(() => lapDanhMucDeXuat(thamSo({ soLuongMucTieu: 2.5 }))).toThrow();
  });
});

describe('suaDanhMucChinhThuc', () => {
  const dot: DotRaSoat = {
    ky: KY,
    thuocTinh: { nhomGS: 'GS-02', chuThe: 'thuong_truc', cap: 'tinh' },
    linhVucTrongTam: null,
    danhMucDeXuat: [],
    danhMucChinhThuc: ['TH-001-1-2026'],
    vanBanQuyetDinh: '',
    ngayMoDot: NGAY,
    hanThamDinh: '2026-08-03',
    trangThai: 'de_xuat',
    seedNgauNhien: null,
    phanCongBan: {},
    nhatKyThayDoi: [],
  };

  it('Thường trực thêm được văn bản, có ghi nhật ký ai sửa và lúc nào', () => {
    const moi = suaDanhMucChinhThuc(dot, {
      hanhDong: 'them',
      idNghiQuyet: 'TH-002-1-2026',
      nguoi: 'Nguyễn Văn A',
      ghiChu: 'Bổ sung theo ý kiến phiên họp',
      luc: NGAY,
    });
    expect(moi.danhMucChinhThuc).toContain('TH-002-1-2026');
    expect(moi.nhatKyThayDoi).toHaveLength(1);
    expect(moi.nhatKyThayDoi[0]).toMatchObject({
      nguoi: 'Nguyễn Văn A',
      hanhDong: 'them',
      idNghiQuyet: 'TH-002-1-2026',
      luc: NGAY,
    });
  });

  it('Thường trực bỏ được văn bản khỏi danh mục', () => {
    const moi = suaDanhMucChinhThuc(dot, {
      hanhDong: 'bo',
      idNghiQuyet: 'TH-001-1-2026',
      nguoi: 'Nguyễn Văn A',
      ghiChu: 'Đã rà soát ở đợt chuyên đề',
      luc: NGAY,
    });
    expect(moi.danhMucChinhThuc).toEqual([]);
    expect(moi.nhatKyThayDoi[0]?.hanhDong).toBe('bo');
  });

  it('không sửa bản ghi gốc', () => {
    suaDanhMucChinhThuc(dot, {
      hanhDong: 'them',
      idNghiQuyet: 'TH-003-1-2026',
      nguoi: 'Nguyễn Văn A',
      ghiChu: '',
      luc: NGAY,
    });
    expect(dot.danhMucChinhThuc).toEqual(['TH-001-1-2026']);
    expect(dot.nhatKyThayDoi).toEqual([]);
  });

  it('thao tác thừa không sinh nhật ký rác', () => {
    expect(
      suaDanhMucChinhThuc(dot, {
        hanhDong: 'them',
        idNghiQuyet: 'TH-001-1-2026',
        nguoi: 'A',
        ghiChu: '',
        luc: NGAY,
      }),
    ).toBe(dot);
    expect(
      suaDanhMucChinhThuc(dot, {
        hanhDong: 'bo',
        idNghiQuyet: 'TH-999-1-2026',
        nguoi: 'A',
        ghiChu: '',
        luc: NGAY,
      }),
    ).toBe(dot);
  });

  it('từ chối sửa khi không ghi tên người sửa', () => {
    expect(() =>
      suaDanhMucChinhThuc(dot, {
        hanhDong: 'them',
        idNghiQuyet: 'TH-002-1-2026',
        nguoi: '   ',
        ghiChu: '',
        luc: NGAY,
      }),
    ).toThrow(/tên người sửa/);
  });
});
