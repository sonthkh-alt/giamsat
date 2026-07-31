import { describe, expect, it } from 'vitest';
import {
  locCanhBaoHopLe,
  phatHienCanhBao,
  tinhDiemRuiRo,
  tomTatCanhBao,
  xepHangTheoRuiRo,
} from './xepHangRuiRo';
import type { CanhBao, CauHinhDauHieu, NghiQuyet } from '../kieu';

const CAU_HINH: CauHinhDauHieu = {
  phienBan: 'thu',
  ghiChu: '',
  canCuHetHieuLuc: {
    diem: 30,
    mucDo: 'cao',
    ghiChu: '',
    danhMuc: [
      {
        mau: 'Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13',
        lyDo: 'Đã được thay thế',
        thayTheBoi: 'Luật số 64/2025/QH15',
      },
    ],
  },
  tenKhongConDung: {
    diem: 25,
    mucDo: 'cao',
    ghiChu: '',
    danhMuc: [{ mau: 'Ủy ban nhân dân huyện', lyDo: 'Không còn cấp huyện sau 01/7/2025' }],
  },
  thamQuyenTheoLinhVuc: {
    diem: 20,
    mucDo: 'trung_binh',
    ghiChu: '',
    quyTac: [
      { linhVuc: 'phi_le_phi', loai: 'quy_pham', lyDo: 'Phải nằm trong khung mức thu đã ấn định' },
    ],
  },
  thanhPhanHoSo: {
    diem: 15,
    mucDo: 'trung_binh',
    ghiChu: '',
    batBuoc: [
      { ma: 'to_trinh', ten: 'Tờ trình' },
      { ma: 'tong_hop_y_kien', ten: 'Bản tổng hợp ý kiến' },
    ],
  },
  theThuc: {
    diem: 10,
    mucDo: 'thap',
    ghiChu: '',
    quyTac: [
      { ma: 'ky_hieu_quy_pham', mauKyHieu: 'NQ-HĐND', lyDo: 'Số, ký hiệu phải có năm ban hành' },
      { ma: 'so_rong', lyDo: 'Chưa ghi số nghị quyết' },
      { ma: 'trich_yeu_rong', lyDo: 'Chưa ghi trích yếu' },
      { ma: 'thieu_ky_hop', lyDo: 'Chưa ghi kỳ họp' },
    ],
  },
};

function nq(phan: Partial<NghiQuyet> = {}): NghiQuyet {
  return {
    id: 'TH-001-1-2026',
    maDonVi: 'TH-001',
    so: '1/2026',
    kyHieu: 'NQ-HĐND',
    ngayBanHanh: '2026-03-01',
    kyHop: 'Kỳ họp thứ 3',
    loai: 'ca_biet',
    linhVuc: 'khac',
    trichYeu: 'Về việc phê chuẩn quyết toán ngân sách xã năm 2025',
    hieuLuc: 'con_hieu_luc',
    canCuPhapLy: ['Căn cứ Luật Tổ chức chính quyền địa phương;'],
    hoSoTrinh: [],
    tepDinhKem: [],
    ngayCapNhat: '2026-03-02',
    ...phan,
  };
}

describe('nguyên tắc hiển thị cảnh báo', () => {
  it('cảnh báo không nêu được lý do thì bị loại, không hiển thị', () => {
    const thieuLyDo: CanhBao = {
      dauHieu: 'the_thuc',
      mucDo: 'thap',
      diem: 10,
      lyDo: '   ',
      viTri: { truong: 'Số, ký hiệu', trichDan: '1/NQ-HĐND' },
    };
    expect(locCanhBaoHopLe([thieuLyDo])).toEqual([]);
  });

  it('cảnh báo không chỉ được vị trí trong văn bản thì bị loại', () => {
    const thieuViTri: CanhBao = {
      dauHieu: 'the_thuc',
      mucDo: 'thap',
      diem: 10,
      lyDo: 'Có lý do rõ ràng',
      viTri: { truong: '', trichDan: '' },
    };
    expect(locCanhBaoHopLe([thieuViTri])).toEqual([]);
  });

  it('mọi cảnh báo sinh ra đều có lý do và trích dẫn vị trí', () => {
    const canhBao = phatHienCanhBao(
      nq({
        loai: 'quy_pham',
        so: '5',
        linhVuc: 'phi_le_phi',
        trichYeu: 'Về việc tiếp nhận nhiệm vụ từ Ủy ban nhân dân huyện',
        canCuPhapLy: ['Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13;'],
      }),
      CAU_HINH,
    );
    expect(canhBao.length).toBeGreaterThan(0);
    for (const cb of canhBao) {
      expect(cb.lyDo.trim()).not.toBe('');
      expect(cb.viTri.truong.trim()).not.toBe('');
      expect(cb.viTri.trichDan.trim()).not.toBe('');
    }
  });
});

describe('năm nhóm dấu hiệu', () => {
  it('văn bản sạch không sinh cảnh báo nào', () => {
    expect(phatHienCanhBao(nq(), CAU_HINH)).toEqual([]);
  });

  it('phát hiện căn cứ pháp lý đã hết hiệu lực và nêu văn bản thay thế', () => {
    const cb = phatHienCanhBao(
      nq({ canCuPhapLy: ['Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13;'] }),
      CAU_HINH,
    );
    expect(cb).toHaveLength(1);
    expect(cb[0]!.dauHieu).toBe('can_cu_het_hieu_luc');
    expect(cb[0]!.lyDo).toMatch(/Luật số 64\/2025\/QH15/);
    expect(cb[0]!.viTri.truong).toBe('Căn cứ pháp lý');
  });

  it('phát hiện tên cơ quan không còn đúng, kể cả trong trích yếu', () => {
    const cb = phatHienCanhBao(
      nq({ trichYeu: 'Về việc bàn giao nhiệm vụ từ Ủy ban nhân dân huyện theo phân cấp' }),
      CAU_HINH,
    );
    expect(cb).toHaveLength(1);
    expect(cb[0]!.dauHieu).toBe('ten_khong_con_dung');
    expect(cb[0]!.viTri.truong).toBe('Trích yếu');
    expect(cb[0]!.viTri.trichDan).toMatch(/Ủy ban nhân dân huyện/);
  });

  it('tìm không phụ thuộc dấu tiếng Việt', () => {
    const cb = phatHienCanhBao(
      nq({ trichYeu: 'Ve viec ban giao tu Uy ban nhan dan huyen' }),
      CAU_HINH,
    );
    expect(cb).toHaveLength(1);
  });

  it('dấu hiệu vượt thẩm quyền chỉ áp cho đúng lĩnh vực và loại văn bản', () => {
    expect(phatHienCanhBao(nq({ linhVuc: 'phi_le_phi', loai: 'ca_biet' }), CAU_HINH)).toEqual([]);
    const cb = phatHienCanhBao(
      nq({ linhVuc: 'phi_le_phi', loai: 'quy_pham', hoSoTrinh: ['to_trinh', 'tong_hop_y_kien'] }),
      CAU_HINH,
    );
    expect(cb.map((c) => c.dauHieu)).toContain('tham_quyen_theo_linh_vuc');
  });

  it('thiếu thành phần hồ sơ chỉ tính cho văn bản quy phạm pháp luật', () => {
    expect(phatHienCanhBao(nq({ loai: 'ca_biet', hoSoTrinh: [] }), CAU_HINH)).toEqual([]);
    const cb = phatHienCanhBao(nq({ loai: 'quy_pham', hoSoTrinh: ['to_trinh'] }), CAU_HINH);
    const thieu = cb.find((c) => c.dauHieu === 'thanh_phan_ho_so');
    expect(thieu).toBeDefined();
    expect(thieu!.lyDo).toMatch(/Bản tổng hợp ý kiến/);
  });

  it('đủ hồ sơ thì không cảnh báo', () => {
    const cb = phatHienCanhBao(
      nq({ loai: 'quy_pham', hoSoTrinh: ['to_trinh', 'tong_hop_y_kien'] }),
      CAU_HINH,
    );
    expect(cb.map((c) => c.dauHieu)).not.toContain('thanh_phan_ho_so');
  });

  it('văn bản quy phạm thiếu năm trong số, ký hiệu bị cảnh báo thể thức', () => {
    const cb = phatHienCanhBao(
      nq({ loai: 'quy_pham', so: '5', hoSoTrinh: ['to_trinh', 'tong_hop_y_kien'] }),
      CAU_HINH,
    );
    const theThuc = cb.find((c) => c.dauHieu === 'the_thuc');
    expect(theThuc).toBeDefined();
    expect(theThuc!.viTri.trichDan).toMatch(/2026/);
  });

  it('cảnh báo khi thiếu số, trích yếu hoặc kỳ họp', () => {
    const cb = phatHienCanhBao(nq({ so: '', trichYeu: '', kyHop: '' }), CAU_HINH);
    expect(cb.filter((c) => c.dauHieu === 'the_thuc')).toHaveLength(3);
  });
});

describe('điểm rủi ro và xếp hạng', () => {
  it('cộng dồn điểm các dấu hiệu', () => {
    const cb = phatHienCanhBao(
      nq({
        trichYeu: 'Về việc bàn giao từ Ủy ban nhân dân huyện',
        canCuPhapLy: ['Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13;'],
      }),
      CAU_HINH,
    );
    expect(tinhDiemRuiRo(cb)).toBe(55);
  });

  it('chặn trên ở 100 điểm', () => {
    const nhieu: CanhBao[] = Array.from({ length: 10 }, () => ({
      dauHieu: 'the_thuc' as const,
      mucDo: 'thap' as const,
      diem: 30,
      lyDo: 'x',
      viTri: { truong: 'y', trichDan: 'z' },
    }));
    expect(tinhDiemRuiRo(nhieu)).toBe(100);
  });

  it('không có cảnh báo thì 0 điểm', () => {
    expect(tinhDiemRuiRo([])).toBe(0);
  });

  it('xếp hạng theo điểm giảm dần, cùng điểm thì theo id để ổn định', () => {
    const danhSach = [
      nq({ id: 'TH-003-1-2026' }),
      nq({
        id: 'TH-001-1-2026',
        canCuPhapLy: ['Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13;'],
      }),
      nq({ id: 'TH-002-1-2026' }),
    ];
    const xh = xepHangTheoRuiRo(danhSach, CAU_HINH);
    expect(xh.map((x) => x.nghiQuyet.id)).toEqual([
      'TH-001-1-2026',
      'TH-002-1-2026',
      'TH-003-1-2026',
    ]);
    expect(xh[0]!.diemRuiRo).toBe(30);
  });

  it('xếp hạng không phụ thuộc thứ tự đầu vào', () => {
    const danhSach = [nq({ id: 'B' }), nq({ id: 'A' }), nq({ id: 'C' })];
    const xuoi = xepHangTheoRuiRo(danhSach, CAU_HINH).map((x) => x.nghiQuyet.id);
    const nguoc = xepHangTheoRuiRo([...danhSach].reverse(), CAU_HINH).map((x) => x.nghiQuyet.id);
    expect(xuoi).toEqual(nguoc);
  });
});

describe('tomTatCanhBao', () => {
  it('rỗng khi không có cảnh báo', () => {
    expect(tomTatCanhBao([])).toBe('');
  });

  it('nêu lý do đầu và đếm phần còn lại', () => {
    const cb = phatHienCanhBao(
      nq({
        trichYeu: 'Về việc bàn giao từ Ủy ban nhân dân huyện',
        canCuPhapLy: ['Căn cứ Luật Ban hành văn bản quy phạm pháp luật số 80/2015/QH13;'],
      }),
      CAU_HINH,
    );
    expect(tomTatCanhBao(cb)).toMatch(/và 1 dấu hiệu khác/);
  });
});
