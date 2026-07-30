import { useState } from 'react';
import type { DonVi } from '../kieu';
import { hienThiNgay } from '../nghiepvu/hanXuLy';
import {
  mucTheoDoi,
  soNgayTuLanKiemTra,
  NHAN_MUC_THEO_DOI,
  type MucTheoDoi,
} from '../nghiepvu/theoDoiDonVi';

/**
 * Lưới các xã, phường — mỗi ô một đơn vị, đổ màu theo số ngày kể từ lần kiểm tra
 * gần nhất. Nhìn một cái là thấy đơn vị nào đang bị bỏ quên.
 */

const LOP_O: Record<MucTheoDoi, string> = {
  moi_kiem_tra: 'bg-[#1F6F54] border-[#1F6F54]',
  binh_thuong: 'bg-[#A8CBBC] border-[#8FB9A8]',
  lau: 'bg-[#E8C271] border-[#C79E45]',
  rat_lau: 'bg-[#C8102E] border-[#C8102E]',
  chua_bao_gio: 'bg-giay border-[#7A8194] border-dashed',
};

const THU_TU_CHU_GIAI: MucTheoDoi[] = [
  'moi_kiem_tra',
  'binh_thuong',
  'lau',
  'rat_lau',
  'chua_bao_gio',
];

export default function LuoiDonVi({
  danhSach,
  ngayThamChieu,
}: {
  danhSach: readonly DonVi[];
  ngayThamChieu: string;
}) {
  const [dangChon, datDangChon] = useState<DonVi | null>(null);

  if (danhSach.length === 0) {
    return (
      <p className="khung px-4 py-6 text-[#4A536B]">
        Chưa có danh sách đơn vị. Nhập danh sách xã, phường vào <code>data/donvi.json</code> để
        lưới hiển thị.
      </p>
    );
  }

  return (
    <div>
      <ul
        className="grid gap-[3px]"
        style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(1.5rem, 1fr))' }}
      >
        {danhSach.map((donVi) => {
          const muc = mucTheoDoi(donVi, ngayThamChieu);
          const soNgay = soNgayTuLanKiemTra(donVi, ngayThamChieu);
          const moTa =
            soNgay === null
              ? `${donVi.ten}: chưa từng được kiểm tra`
              : `${donVi.ten}: kiểm tra gần nhất cách đây ${soNgay} ngày`;
          return (
            <li key={donVi.ma}>
              <button
                type="button"
                title={moTa}
                aria-label={moTa}
                aria-pressed={dangChon?.ma === donVi.ma}
                onClick={() => datDangChon(dangChon?.ma === donVi.ma ? null : donVi)}
                className={`aspect-square w-full border ${LOP_O[muc]} ${
                  dangChon?.ma === donVi.ma ? 'ring-2 ring-muc ring-offset-1' : ''
                }`}
              />
            </li>
          );
        })}
      </ul>

      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[0.9375rem] text-[#4A536B]">
        {THU_TU_CHU_GIAI.map((muc) => (
          <li key={muc} className="flex items-center gap-2">
            <span className={`inline-block h-4 w-4 border ${LOP_O[muc]}`} aria-hidden="true" />
            {NHAN_MUC_THEO_DOI[muc]}
          </li>
        ))}
      </ul>

      <div aria-live="polite" className="mt-3">
        {dangChon ? (
          <p className="khung px-3 py-2">
            <strong>{dangChon.ten}</strong>{' '}
            <span className="so text-[#4A536B]">({dangChon.ma})</span> — kiểm tra gần nhất:{' '}
            <span className="so">{hienThiNgay(dangChon.lanKiemTraGanNhat)}</span>
            {dangChon.lanKiemTraGanNhat === null && ' (chưa từng)'}
          </p>
        ) : (
          <p className="text-[0.9375rem] text-[#4A536B]">
            Chọn một ô để xem tên đơn vị và ngày kiểm tra gần nhất.
          </p>
        )}
      </div>
    </div>
  );
}
