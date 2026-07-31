import { describe, expect, it } from 'vitest';
import {
  buocTiepTheo,
  conPhaiTheoDoi,
  danhDauQuaHan,
  mucCanhBaoNhiemVu,
  thongKeNhiemVu,
  tinhHanGiaiTrinhDieu40,
  THU_TU_BUOC_XU_LY,
} from './theoDoiNhiemVu';
import type { NgayLe, NhiemVuSauGiamSat } from '../kieu';

const NGAY_LE: NgayLe[] = [{ ngay: '2026-09-02', ten: 'Quốc khánh' }];

function nhiemVu(phan: Partial<NhiemVuSauGiamSat> = {}): NhiemVuSauGiamSat {
  return {
    id: 'NV-2026-001',
    thuocTinh: { nhomGS: 'GS-11', chuThe: 'thuong_truc', cap: 'tinh' },
    nguonGoc: { nhomGS: 'GS-02', soVanBan: '184/TB-HĐND', ngayBanHanh: '2026-06-26' },
    noiDungYeuCau: 'Sửa đổi nội dung trái pháp luật',
    coQuanChuTri: 'Ủy ban nhân dân xã',
    coQuanPhoiHop: [],
    nguoiChiuTrachNhiem: 'Chủ tịch Ủy ban nhân dân xã',
    sanPhamPhaiHoanThanh: 'Nghị quyết sửa đổi',
    hanHoanThanh: '2026-07-24',
    trangThai: 'chua_hoan_thanh',
    minhChung: [],
    buocXuLy: [],
    hanGiaiTrinhDieu40: null,
    ngayXacNhanHoanThanh: null,
    ...phan,
  };
}

describe('Điều 40 tính theo ngày dương lịch, không phải ngày làm việc', () => {
  it('15 ngày dương lịch kể cả cuối tuần', () => {
    // 24/07/2026 + 15 ngày dương lịch = 08/08/2026
    expect(tinhHanGiaiTrinhDieu40('2026-07-24')).toBe('2026-08-08');
  });

  it('trường hợp phức tạp là 30 ngày dương lịch', () => {
    expect(tinhHanGiaiTrinhDieu40('2026-07-24', true)).toBe('2026-08-23');
  });

  it('không bỏ qua ngày nghỉ lễ — vì luật ghi là "ngày"', () => {
    // 01/09 + 15 ngày = 16/09 dù 02/09 là ngày nghỉ lễ
    expect(tinhHanGiaiTrinhDieu40('2026-09-01')).toBe('2026-09-16');
  });
});

describe('trạng thái và cảnh báo', () => {
  it('sáu trạng thái được phân đúng nhóm còn phải theo dõi', () => {
    expect(conPhaiTheoDoi(nhiemVu({ trangThai: 'hoan_thanh' }))).toBe(false);
    for (const tt of [
      'chua_hoan_thanh',
      'hoan_thanh_mot_phan',
      'qua_han',
      'khong_thuc_hien',
      'chua_dap_ung_yeu_cau',
    ] as const) {
      expect(conPhaiTheoDoi(nhiemVu({ trangThai: tt }))).toBe(true);
    }
  });

  it('nhiệm vụ đã hoàn thành không còn cảnh báo hạn', () => {
    expect(
      mucCanhBaoNhiemVu(nhiemVu({ trangThai: 'hoan_thanh' }), '2026-08-30', NGAY_LE),
    ).toBeNull();
  });

  it('quá hạn khi đã qua mốc', () => {
    expect(mucCanhBaoNhiemVu(nhiemVu(), '2026-07-30', NGAY_LE)).toBe('qua_han');
  });

  it('nhắc trước hạn theo ngày làm việc', () => {
    expect(mucCanhBaoNhiemVu(nhiemVu({ hanHoanThanh: '2026-09-30' }), '2026-09-25', NGAY_LE)).toBe(
      'rat_gan',
    );
    expect(mucCanhBaoNhiemVu(nhiemVu({ hanHoanThanh: '2026-09-30' }), '2026-09-22', NGAY_LE)).toBe(
      'gan_han',
    );
    expect(mucCanhBaoNhiemVu(nhiemVu({ hanHoanThanh: '2026-09-30' }), '2026-09-14', NGAY_LE)).toBe(
      'sap_den_han',
    );
  });
});

describe('bảy bước xử lý', () => {
  it('có đúng bảy bước, đúng thứ tự Quy chế', () => {
    expect(THU_TU_BUOC_XU_LY).toHaveLength(7);
    expect(THU_TU_BUOC_XU_LY[0]).toBe('don_doc_1');
    expect(THU_TU_BUOC_XU_LY[6]).toBe('bao_cao_hdnd');
  });

  it('bước tiếp theo là bước đầu khi chưa làm gì', () => {
    expect(buocTiepTheo(nhiemVu())).toBe('don_doc_1');
  });

  it('bỏ qua các bước đã làm', () => {
    const nv = nhiemVu({
      buocXuLy: [
        { ma: 'don_doc_1', ngay: '2026-07-27', soVanBan: '1', ghiChu: '' },
        { ma: 'don_doc_tiep', ngay: '2026-08-01', soVanBan: '2', ghiChu: '' },
      ],
    });
    expect(buocTiepTheo(nv)).toBe('kien_nghi_xu_ly');
  });

  it('hết bảy bước thì trả về null', () => {
    const nv = nhiemVu({
      buocXuLy: THU_TU_BUOC_XU_LY.map((ma) => ({
        ma,
        ngay: '2026-08-01',
        soVanBan: 'x',
        ghiChu: '',
      })),
    });
    expect(buocTiepTheo(nv)).toBeNull();
  });
});

describe('danhDauQuaHan', () => {
  it('chuyển trạng thái và đặt hạn giải trình theo Điều 40', () => {
    const moi = danhDauQuaHan(nhiemVu(), '2026-07-30', NGAY_LE);
    expect(moi.trangThai).toBe('qua_han');
    expect(moi.hanGiaiTrinhDieu40).toBe('2026-08-14');
  });

  it('không đụng tới nhiệm vụ chưa quá hạn', () => {
    const nv = nhiemVu({ hanHoanThanh: '2026-12-31' });
    expect(danhDauQuaHan(nv, '2026-07-30', NGAY_LE)).toBe(nv);
  });

  it('không đụng tới nhiệm vụ đã hoàn thành', () => {
    const nv = nhiemVu({ trangThai: 'hoan_thanh' });
    expect(danhDauQuaHan(nv, '2026-07-30', NGAY_LE)).toBe(nv);
  });

  it('không đặt lại hạn nếu đã khởi tạo giải trình', () => {
    const nv = nhiemVu({ trangThai: 'qua_han', hanGiaiTrinhDieu40: '2026-08-01' });
    expect(danhDauQuaHan(nv, '2026-07-30', NGAY_LE)).toBe(nv);
  });

  it('không sửa bản ghi gốc', () => {
    const nv = nhiemVu();
    danhDauQuaHan(nv, '2026-07-30', NGAY_LE);
    expect(nv.trangThai).toBe('chua_hoan_thanh');
    expect(nv.hanGiaiTrinhDieu40).toBeNull();
  });
});

describe('thongKeNhiemVu', () => {
  const danhSach = [
    nhiemVu({ id: 'a', trangThai: 'hoan_thanh', ngayXacNhanHoanThanh: '2026-07-20' }),
    nhiemVu({ id: 'b', trangThai: 'hoan_thanh', ngayXacNhanHoanThanh: '2026-07-28' }),
    nhiemVu({ id: 'c', trangThai: 'chua_hoan_thanh' }),
    nhiemVu({ id: 'd', trangThai: 'khong_thuc_hien' }),
  ];

  it('đếm đúng theo từng trạng thái', () => {
    const tk = thongKeNhiemVu(danhSach, '2026-07-30', NGAY_LE);
    expect(tk.tong).toBe(4);
    expect(tk.theoTrangThai.hoan_thanh).toBe(2);
    expect(tk.conTheoDoi).toBe(2);
  });

  it('đếm quá hạn trong số còn phải theo dõi', () => {
    const tk = thongKeNhiemVu(danhSach, '2026-07-30', NGAY_LE);
    expect(tk.quaHan).toBe(2);
  });

  it('tỷ lệ đúng hạn tính trên số đã hoàn thành', () => {
    // 'a' xác nhận 20/07 ≤ hạn 24/07 là đúng hạn; 'b' xác nhận 28/07 là trễ.
    expect(thongKeNhiemVu(danhSach, '2026-07-30', NGAY_LE).tyLeDungHan).toBe(50);
  });

  it('chưa có nhiệm vụ hoàn thành thì tỷ lệ là null, không phải 0', () => {
    const tk = thongKeNhiemVu([nhiemVu({ trangThai: 'chua_hoan_thanh' })], '2026-07-30', NGAY_LE);
    expect(tk.tyLeDungHan).toBeNull();
  });
});
