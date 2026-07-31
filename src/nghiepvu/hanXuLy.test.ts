import { describe, expect, it } from 'vitest';
import {
  congNgayDuongLich,
  congNgayLamViec,
  hienThiKyThang,
  hienThiNgay,
  homNay,
  kyThang,
  kyThangTruoc,
  laCuoiTuan,
  laNgayLamViec,
  mucCanhBao,
  ngayTrongKy,
  soNgayDuongLich,
  soNgayLamViecGiua,
  taoNgay,
  HAN_GIAI_TRINH,
  HAN_GIAI_TRINH_DIEU_40,
  HAN_THAM_DINH,
  NgayKhongHopLe,
} from './hanXuLy';
import type { NgayLe } from '../kieu';

const NGAY_LE: NgayLe[] = [
  { ngay: '2026-01-01', ten: 'Tết Dương lịch' },
  { ngay: '2026-04-30', ten: 'Ngày Giải phóng miền Nam' },
  { ngay: '2026-05-01', ten: 'Ngày Quốc tế Lao động' },
  { ngay: '2026-09-02', ten: 'Quốc khánh' },
];

describe('taoNgay', () => {
  it('nhận chuỗi ISO hợp lệ', () => {
    expect(taoNgay('2026-07-30').getUTCFullYear()).toBe(2026);
  });

  it('từ chối định dạng sai', () => {
    expect(() => taoNgay('30/07/2026')).toThrow(NgayKhongHopLe);
  });

  it('từ chối ngày không tồn tại', () => {
    expect(() => taoNgay('2026-02-30')).toThrow(NgayKhongHopLe);
  });
});

describe('hienThiNgay', () => {
  it('đổi ISO sang dd/MM/yyyy', () => {
    expect(hienThiNgay('2026-07-30')).toBe('30/07/2026');
  });

  it('trả về dấu gạch khi không có ngày', () => {
    expect(hienThiNgay(null)).toBe('—');
  });
});

describe('homNay', () => {
  it('tính theo giờ Việt Nam, không theo giờ máy trạm', () => {
    // 30/07/2026 lúc 18:30 UTC đã là 01:30 ngày 31/07 ở Việt Nam
    expect(homNay(new Date('2026-07-30T18:30:00Z'))).toBe('2026-07-31');
    expect(homNay(new Date('2026-07-30T16:00:00Z'))).toBe('2026-07-30');
  });
});

describe('laCuoiTuan / laNgayLamViec', () => {
  it('nhận diện thứ Bảy và Chủ nhật', () => {
    expect(laCuoiTuan('2026-08-01')).toBe(true); // thứ Bảy
    expect(laCuoiTuan('2026-08-02')).toBe(true); // Chủ nhật
    expect(laCuoiTuan('2026-08-03')).toBe(false); // thứ Hai
  });

  it('loại ngày nghỉ lễ khỏi ngày làm việc', () => {
    expect(laNgayLamViec('2026-09-02', NGAY_LE)).toBe(false);
    expect(laNgayLamViec('2026-09-03', NGAY_LE)).toBe(true);
  });
});

describe('congNgayLamViec', () => {
  it('cộng 0 ngày trả về đúng ngày ban đầu', () => {
    expect(congNgayLamViec('2026-07-30', 0, NGAY_LE)).toBe('2026-07-30');
  });

  it('bỏ qua cuối tuần', () => {
    // Thứ Năm 30/07 + 5 ngày làm việc = thứ Năm 06/08
    expect(congNgayLamViec('2026-07-30', 5, NGAY_LE)).toBe('2026-08-06');
  });

  it('bỏ qua ngày nghỉ lễ', () => {
    // Thứ Ba 01/09 + 1 ngày làm việc: 02/09 là Quốc khánh nên nhảy sang 03/09
    expect(congNgayLamViec('2026-09-01', 1, NGAY_LE)).toBe('2026-09-03');
  });

  it('hạn thẩm định 5 ngày làm việc từ thứ Sáu rơi vào thứ Sáu tuần sau', () => {
    expect(congNgayLamViec('2026-07-31', 5, NGAY_LE)).toBe('2026-08-07');
  });

  it('từ chối số ngày âm', () => {
    expect(() => congNgayLamViec('2026-07-30', -1, NGAY_LE)).toThrow();
  });
});

describe('soNgayLamViecGiua', () => {
  it('đếm đúng số ngày làm việc, bỏ cuối tuần', () => {
    expect(soNgayLamViecGiua('2026-07-30', '2026-08-06', NGAY_LE)).toBe(5);
  });

  it('cùng ngày trả về 0', () => {
    expect(soNgayLamViecGiua('2026-07-30', '2026-07-30', NGAY_LE)).toBe(0);
  });

  it('trả về số âm khi mốc đến đã ở quá khứ', () => {
    expect(soNgayLamViecGiua('2026-08-06', '2026-07-30', NGAY_LE)).toBe(-5);
  });

  it('nghịch đảo với congNgayLamViec', () => {
    const han = congNgayLamViec('2026-08-28', 7, NGAY_LE);
    expect(soNgayLamViecGiua('2026-08-28', han, NGAY_LE)).toBe(7);
  });
});

describe('mucCanhBao', () => {
  const han = '2026-09-30';

  it('quá hạn khi đã qua mốc', () => {
    expect(mucCanhBao(han, '2026-10-01', NGAY_LE)).toBe('qua_han');
  });

  it('rất gần hạn khi còn tối đa 3 ngày làm việc', () => {
    expect(mucCanhBao(han, congNgayLamViec(han, 0, NGAY_LE), NGAY_LE)).toBe('rat_gan');
    expect(mucCanhBao('2026-09-30', '2026-09-25', NGAY_LE)).toBe('rat_gan');
  });

  it('gần hạn khi còn 4–7 ngày làm việc', () => {
    expect(mucCanhBao('2026-09-30', '2026-09-22', NGAY_LE)).toBe('gan_han');
  });

  it('sắp đến hạn khi còn 8–15 ngày làm việc', () => {
    expect(mucCanhBao('2026-09-30', '2026-09-14', NGAY_LE)).toBe('sap_den_han');
  });

  it('còn hạn khi trên 15 ngày làm việc', () => {
    expect(mucCanhBao('2026-09-30', '2026-08-20', NGAY_LE)).toBe('con_han');
  });
});

describe('soNgayDuongLich', () => {
  it('đếm cả cuối tuần và ngày lễ', () => {
    expect(soNgayDuongLich('2026-01-01', '2026-01-31')).toBe(30);
    expect(soNgayDuongLich('2026-01-31', '2026-01-01')).toBe(-30);
  });
});

describe('congNgayDuongLich', () => {
  it('cộng cả cuối tuần và ngày lễ', () => {
    // 24/07/2026 là thứ Sáu; +3 ngày dương lịch là Chủ nhật 27/07
    expect(congNgayDuongLich('2026-07-24', 3)).toBe('2026-07-27');
  });

  it('cộng 0 ngày trả về đúng ngày ban đầu', () => {
    expect(congNgayDuongLich('2026-07-24', 0)).toBe('2026-07-24');
  });

  it('khác hẳn congNgayLamViec — đây là ngoại lệ của Điều 40', () => {
    expect(congNgayDuongLich('2026-07-24', 5)).not.toBe(
      congNgayLamViec('2026-07-24', 5, NGAY_LE),
    );
  });

  it('từ chối số ngày âm', () => {
    expect(() => congNgayDuongLich('2026-07-24', -1)).toThrow();
  });
});

describe('hạn xử lý theo Quy chế', () => {
  it('thẩm định 10 ngày làm việc, giải trình 5 ngày làm việc', () => {
    expect(HAN_THAM_DINH).toBe(10);
    expect(HAN_GIAI_TRINH).toBe(5);
  });

  it('Điều 40 là 15 ngày, và là ngày dương lịch', () => {
    expect(HAN_GIAI_TRINH_DIEU_40).toBe(15);
  });
});

describe('kỳ theo tháng', () => {
  it('lấy đúng mã kỳ từ một ngày', () => {
    expect(kyThang('2026-10-25')).toBe('2026-10');
  });

  it('từ chối ngày không hợp lệ', () => {
    expect(() => kyThang('2026-13-01')).toThrow(NgayKhongHopLe);
  });

  it('hiển thị kỳ theo cách người dùng đọc', () => {
    expect(hienThiKyThang('2026-10')).toBe('tháng 10/2026');
    expect(hienThiKyThang('2026-01')).toBe('tháng 1/2026');
  });

  it('dựng được ngày cụ thể trong kỳ', () => {
    expect(ngayTrongKy('2026-10', 20)).toBe('2026-10-20');
    expect(ngayTrongKy('2026-10', 5)).toBe('2026-10-05');
  });

  it('lùi được về kỳ trước, kể cả qua năm', () => {
    expect(kyThangTruoc('2026-10')).toBe('2026-09');
    expect(kyThangTruoc('2026-01')).toBe('2025-12');
  });
});
