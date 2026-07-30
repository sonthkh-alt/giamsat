import { useMemo, useState } from 'react';
import type { TrangThaiKienNghi } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { hienThiNgay, mucCanhBao, soNgayLamViecConLai } from '../nghiepvu/hanXuLy';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { NhanHan, NhanKienNghi, NHAN_TRANG_THAI_KIEN_NGHI } from '../thanhphan/Nhan';

const MOI = 'moi';

export default function KienNghi() {
  const du = useDuLieu();
  const [loc, datLoc] = useState<string>(MOI);

  const danhSach = useMemo(() => {
    return du.kienNghi
      .filter((kn) => loc === MOI || kn.trangThai === loc)
      .map((kn) => ({
        kienNghi: kn,
        muc: mucCanhBao(kn.hanThucHien, du.homNay, du.ngayLe),
        conLai: soNgayLamViecConLai(kn.hanThucHien, du.homNay, du.ngayLe),
      }))
      .sort((a, b) => a.conLai - b.conLai);
  }, [du.kienNghi, du.homNay, du.ngayLe, loc]);

  const dangMo = du.kienNghi.filter(
    (kn) => kn.trangThai === 'chua_thuc_hien' || kn.trangThai === 'dang_thuc_hien',
  );
  const hoanThanh = du.kienNghi.filter((kn) => kn.trangThai === 'da_hoan_thanh');
  const dungHan = hoanThanh.filter(
    (kn) => kn.ngayXacNhan !== null && kn.ngayXacNhan <= kn.hanThucHien,
  );
  const tyLeDungHan =
    hoanThanh.length === 0 ? null : Math.round((dungHan.length / hoanThanh.length) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Kiến nghị sau giám sát</h2>
        <p className="max-w-[80ch] text-[0.9375rem] text-[#4A536B]">
          Theo dõi vòng đời kiến nghị: trạng thái, thời hạn, cảnh báo quá hạn. Nhắc việc trước hạn
          15, 7 và 3 ngày làm việc; quá hạn chuyển cảnh báo đỏ.
        </p>
      </div>

      <ThongBao loai="luu_y" tieuDe="Màn hình chỉ để xem trong giai đoạn thí điểm">
        Việc nhập và cập nhật kiến nghị thuộc giai đoạn 3 của lộ trình. Hiện tại dữ liệu đọc từ{' '}
        <code>data/kiennghi/{du.cauHinh.namLamViec}.json</code>.
      </ThongBao>

      {du.kienNghi.length === 0 ? (
        <ManHinhTrong
          tieuDe="Chưa có kiến nghị nào"
          moTa="Khi các cuộc giám sát bắt đầu có kết luận, kiến nghị sẽ được đưa vào đây để theo dõi thời hạn thực hiện."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Đang theo dõi</p>
              <p className="so text-2xl font-semibold">{dangMo.length}</p>
            </div>
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Quá hạn</p>
              <p className="so text-2xl font-semibold text-canhbao">
                {
                  dangMo.filter(
                    (kn) => mucCanhBao(kn.hanThucHien, du.homNay, du.ngayLe) === 'qua_han',
                  ).length
                }
              </p>
            </div>
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Hoàn thành đúng hạn</p>
              <p className="so text-2xl font-semibold">
                {tyLeDungHan === null ? '—' : `${tyLeDungHan}%`}
              </p>
              <p className="mt-1 text-[0.875rem] text-[#4A536B]">
                {dungHan.length}/{hoanThanh.length} kiến nghị đã hoàn thành
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={loc === MOI}
              className={loc === MOI ? 'nut-chinh' : 'nut-phu'}
              onClick={() => datLoc(MOI)}
            >
              Tất cả
            </button>
            {(Object.keys(NHAN_TRANG_THAI_KIEN_NGHI) as TrangThaiKienNghi[]).map((tt) => (
              <button
                key={tt}
                type="button"
                aria-pressed={loc === tt}
                className={loc === tt ? 'nut-chinh' : 'nut-phu'}
                onClick={() => datLoc(tt)}
              >
                {NHAN_TRANG_THAI_KIEN_NGHI[tt]}
              </button>
            ))}
          </div>

          <ul className="space-y-3">
            {danhSach.map(({ kienNghi, muc, conLai }) => (
              <li key={kienNghi.id} className="khung p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                  <p className="trichdan max-w-[80ch]">{kienNghi.noiDung}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <NhanKienNghi trangThai={kienNghi.trangThai} />
                    {(kienNghi.trangThai === 'chua_thuc_hien' ||
                      kienNghi.trangThai === 'dang_thuc_hien') && (
                      <NhanHan muc={muc} soNgay={conLai} />
                    )}
                  </div>
                </div>
                <dl className="mt-2 grid gap-x-8 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
                  <div className="flex gap-2">
                    <dt className="text-[#4A536B]">Nguồn giám sát:</dt>
                    <dd>{kienNghi.nguonGiamSat}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-[#4A536B]">Cơ quan chịu trách nhiệm:</dt>
                    <dd>{kienNghi.coQuanChiuTrachNhiem}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-[#4A536B]">Hạn thực hiện:</dt>
                    <dd className="so">{hienThiNgay(kienNghi.hanThucHien)}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="text-[#4A536B]">Ngày xác nhận hoàn thành:</dt>
                    <dd className="so">{hienThiNgay(kienNghi.ngayXacNhan)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
