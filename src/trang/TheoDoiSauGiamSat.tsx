import { useMemo, useState } from 'react';
import type { NhiemVuSauGiamSat, TrangThaiNhiemVu } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { useGhi } from '../dulieu/useGhi';
import { usePhien } from '../dulieu/usePhien';
import { ghiJson, type ThongTinKho } from '../dulieu/ghiGitHub';
import { hienThiNgay, HAN_GIAI_TRINH_DIEU_40 } from '../nghiepvu/hanXuLy';
import {
  buocTiepTheo,
  conPhaiTheoDoi,
  danhDauQuaHan,
  mucCanhBaoNhiemVu,
  soNgayConLai,
  thongKeNhiemVu,
  NHAN_BUOC_XU_LY,
  NHAN_TRANG_THAI_NHIEM_VU,
  THU_TU_BUOC_XU_LY,
} from '../nghiepvu/theoDoiNhiemVu';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan, NhanHan } from '../thanhphan/Nhan';

const MOI = 'moi';

const SAC_TRANG_THAI: Record<TrangThaiNhiemVu, 'trung_tinh' | 'dat' | 'luuy' | 'canhbao'> = {
  hoan_thanh: 'dat',
  hoan_thanh_mot_phan: 'luuy',
  chua_hoan_thanh: 'luuy',
  qua_han: 'canhbao',
  khong_thuc_hien: 'canhbao',
  chua_dap_ung_yeu_cau: 'canhbao',
};

export default function TheoDoiSauGiamSat() {
  const du = useDuLieu();
  const { ghiDuoc } = usePhien();
  const ghiBuocDuoc = ghiDuoc('theoDoiNhiemVu');
  const ghi = useGhi();
  const [loc, datLoc] = useState<string>(MOI);
  const [dangMo, datDangMo] = useState<string | null>(null);

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  const thongKe = useMemo(
    () => thongKeNhiemVu(du.nhiemVu, du.homNay, du.ngayLe),
    [du.nhiemVu, du.homNay, du.ngayLe],
  );

  const danhSach = useMemo(
    () =>
      du.nhiemVu
        .filter((nv) => loc === MOI || nv.trangThai === loc)
        .map((nv) => ({
          nhiemVu: nv,
          muc: mucCanhBaoNhiemVu(nv, du.homNay, du.ngayLe),
          conLai: soNgayConLai(nv, du.homNay, du.ngayLe),
        }))
        .sort((a, b) => a.conLai - b.conLai),
    [du.nhiemVu, du.homNay, du.ngayLe, loc],
  );

  async function luuNhiemVu(banGhi: NhiemVuSauGiamSat, thongDiep: string, moTa: string) {
    const con = du.nhiemVu.filter((nv) => nv.id !== banGhi.id);
    const danhSachMoi = [...con, banGhi].sort((a, b) => (a.id < b.id ? -1 : 1));
    await ghi.chay(async () => {
      await ghiJson(kho, `data/nhiemvu/${du.cauHinh.namLamViec}.json`, danhSachMoi, thongDiep);
      return moTa;
    });
  }

  async function ghiBuoc(nv: NhiemVuSauGiamSat, soVanBan: string, ghiChu: string) {
    const buoc = buocTiepTheo(nv);
    if (!buoc) return;
    const banGhi: NhiemVuSauGiamSat = {
      ...nv,
      buocXuLy: [...nv.buocXuLy, { ma: buoc, ngay: du.homNay, soVanBan, ghiChu }],
    };
    await luuNhiemVu(
      banGhi,
      `theoDoi: ghi bước "${NHAN_BUOC_XU_LY[buoc]}" cho nhiệm vụ ${nv.id}`,
      `Đã ghi bước "${NHAN_BUOC_XU_LY[buoc]}" cho nhiệm vụ ${nv.id}.`,
    );
  }

  async function khoiTaoGiaiTrinh(nv: NhiemVuSauGiamSat, phucTap: boolean) {
    const banGhi = danhDauQuaHan(nv, du.homNay, du.ngayLe, phucTap);
    if (banGhi === nv) return;
    await luuNhiemVu(
      banGhi,
      `theoDoi: khởi tạo yêu cầu giải trình theo Điều 40 cho ${nv.id}`,
      `Đã chuyển nhiệm vụ sang "Quá hạn" và đặt hạn giải trình ${hienThiNgay(banGhi.hanGiaiTrinhDieu40)} theo Điều 40 Luật 121/2025/QH15.`,
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Theo dõi thực hiện sau giám sát</h2>
        <p className="max-w-[85ch] text-[0.9375rem] text-[#4A536B]">
          Nhóm nghiệp vụ <span className="so">GS-11</span> và <span className="so">GS-12</span>.
          Hồ sơ không kết thúc khi ban hành kết luận, mà kết thúc khi kiến nghị được thực hiện
          xong. Nhắc trước hạn 15, 7 và 3 ngày làm việc; quá hạn chuyển cảnh báo đỏ và khởi tạo
          quy trình yêu cầu giải trình theo Điều 40 Luật 121/2025/QH15.
        </p>
      </div>

      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không lưu được">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã lưu">
          {ghi.thanhCong}
        </ThongBao>
      )}

      {du.nhiemVu.length === 0 ? (
        <ManHinhTrong
          tieuDe="Chưa có nhiệm vụ sau giám sát nào"
          moTa="Khi một cuộc giám sát có kết luận, tách từng kiến nghị thành nhiệm vụ độc lập và đưa vào đây để theo dõi tới lúc hoàn thành."
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Đang theo dõi</p>
              <p className="so text-2xl font-semibold">{thongKe.conTheoDoi}</p>
            </div>
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Quá hạn</p>
              <p className="so text-2xl font-semibold text-canhbao">{thongKe.quaHan}</p>
            </div>
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Hoàn thành</p>
              <p className="so text-2xl font-semibold">{thongKe.theoTrangThai.hoan_thanh}</p>
            </div>
            <div className="khung px-4 py-3">
              <p className="text-[0.9375rem] text-[#4A536B]">Hoàn thành đúng hạn</p>
              <p className="so text-2xl font-semibold">
                {thongKe.tyLeDungHan === null ? '—' : `${thongKe.tyLeDungHan}%`}
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
              Tất cả ({du.nhiemVu.length})
            </button>
            {(Object.keys(NHAN_TRANG_THAI_NHIEM_VU) as TrangThaiNhiemVu[]).map((tt) => (
              <button
                key={tt}
                type="button"
                aria-pressed={loc === tt}
                className={loc === tt ? 'nut-chinh' : 'nut-phu'}
                onClick={() => datLoc(tt)}
              >
                {NHAN_TRANG_THAI_NHIEM_VU[tt]} ({thongKe.theoTrangThai[tt]})
              </button>
            ))}
          </div>

          <ul className="space-y-3">
            {danhSach.map(({ nhiemVu: nv, muc, conLai }) => {
              const tiep = buocTiepTheo(nv);
              return (
                <li key={nv.id} className="khung p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
                    <div>
                      <p className="trichdan max-w-[80ch]">{nv.noiDungYeuCau}</p>
                      <p className="mt-1 text-[0.9375rem] text-[#4A536B]">
                        <span className="so">{nv.nguonGoc.nhomGS}</span> ·{' '}
                        {nv.nguonGoc.soVanBan} ngày {hienThiNgay(nv.nguonGoc.ngayBanHanh)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Nhan sac={SAC_TRANG_THAI[nv.trangThai]}>
                        {NHAN_TRANG_THAI_NHIEM_VU[nv.trangThai]}
                      </Nhan>
                      {muc && <NhanHan muc={muc} soNgay={conLai} />}
                    </div>
                  </div>

                  <dl className="mt-2 grid gap-x-8 gap-y-1 text-[0.9375rem] sm:grid-cols-2">
                    <div className="flex gap-2">
                      <dt className="text-[#4A536B]">Cơ quan chủ trì:</dt>
                      <dd>{nv.coQuanChuTri}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[#4A536B]">Người chịu trách nhiệm:</dt>
                      <dd>{nv.nguoiChiuTrachNhiem}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[#4A536B]">Sản phẩm phải hoàn thành:</dt>
                      <dd>{nv.sanPhamPhaiHoanThanh}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="text-[#4A536B]">Hạn hoàn thành:</dt>
                      <dd className="so">{hienThiNgay(nv.hanHoanThanh)}</dd>
                    </div>
                    {nv.coQuanPhoiHop.length > 0 && (
                      <div className="flex gap-2">
                        <dt className="text-[#4A536B]">Phối hợp:</dt>
                        <dd>{nv.coQuanPhoiHop.join(', ')}</dd>
                      </div>
                    )}
                    {nv.ngayXacNhanHoanThanh && (
                      <div className="flex gap-2">
                        <dt className="text-[#4A536B]">Xác nhận hoàn thành:</dt>
                        <dd className="so">{hienThiNgay(nv.ngayXacNhanHoanThanh)}</dd>
                      </div>
                    )}
                  </dl>

                  {nv.hanGiaiTrinhDieu40 && (
                    <div className="mt-3">
                      <ThongBao loai="loi" tieuDe="Đã yêu cầu giải trình theo Điều 40">
                        Hạn giải trình <span className="so">{hienThiNgay(nv.hanGiaiTrinhDieu40)}</span>.
                        Điều 40 Luật 121/2025/QH15 ghi rõ {HAN_GIAI_TRINH_DIEU_40} ngày, trường hợp
                        phức tạp không quá 30 ngày — đây là ngày dương lịch, không phải ngày làm việc.
                      </ThongBao>
                    </div>
                  )}

                  <div className="mt-3">
                    <p className="nhan-truong">Bảy bước xử lý</p>
                    <ol className="flex flex-wrap gap-1">
                      {THU_TU_BUOC_XU_LY.map((ma) => {
                        const daLam = nv.buocXuLy.find((b) => b.ma === ma);
                        return (
                          <li key={ma}>
                            <span
                              title={
                                daLam
                                  ? `${NHAN_BUOC_XU_LY[ma]} — ${daLam.soVanBan} ngày ${hienThiNgay(daLam.ngay)}`
                                  : NHAN_BUOC_XU_LY[ma]
                              }
                              className={`inline-block border px-2 py-[2px] text-[0.875rem] ${
                                daLam
                                  ? 'border-muc bg-muc text-giay'
                                  : ma === tiep
                                    ? 'border-luuy bg-[#FDF6E7] text-[#8A5802]'
                                    : 'border-vien bg-nen text-[#7A8194]'
                              }`}
                            >
                              {NHAN_BUOC_XU_LY[ma]}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>

                  {nv.buocXuLy.length > 0 && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[0.9375rem] font-medium">
                        Nhật ký xử lý ({nv.buocXuLy.length} bước đã làm)
                      </summary>
                      <table className="bang mt-2">
                        <thead>
                          <tr>
                            <th scope="col">Bước</th>
                            <th scope="col">Ngày</th>
                            <th scope="col">Văn bản</th>
                            <th scope="col">Ghi chú</th>
                          </tr>
                        </thead>
                        <tbody>
                          {nv.buocXuLy.map((b, i) => (
                            <tr key={`${b.ma}-${i}`}>
                              <td>{NHAN_BUOC_XU_LY[b.ma]}</td>
                              <td className="so">{hienThiNgay(b.ngay)}</td>
                              <td className="so">{b.soVanBan}</td>
                              <td>{b.ghiChu}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </details>
                  )}

                  {ghiBuocDuoc && conPhaiTheoDoi(nv) && (
                    <div className="mt-3 border-t border-vien pt-3">
                      {dangMo === nv.id ? (
                        <BieuMauBuoc
                          nhanBuoc={tiep ? NHAN_BUOC_XU_LY[tiep] : null}
                          dangGhi={ghi.dangGhi}
                          coHanGiaiTrinh={nv.hanGiaiTrinhDieu40 !== null}
                          quaHan={muc === 'qua_han'}
                          onGhiBuoc={async (so, chu) => {
                            await ghiBuoc(nv, so, chu);
                            datDangMo(null);
                          }}
                          onGiaiTrinh={async (phucTap) => {
                            await khoiTaoGiaiTrinh(nv, phucTap);
                            datDangMo(null);
                          }}
                          onHuy={() => datDangMo(null)}
                        />
                      ) : (
                        <button type="button" className="nut-phu" onClick={() => datDangMo(nv.id)}>
                          Ghi bước xử lý
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function BieuMauBuoc({
  nhanBuoc,
  dangGhi,
  quaHan,
  coHanGiaiTrinh,
  onGhiBuoc,
  onGiaiTrinh,
  onHuy,
}: {
  nhanBuoc: string | null;
  dangGhi: boolean;
  quaHan: boolean;
  coHanGiaiTrinh: boolean;
  onGhiBuoc: (soVanBan: string, ghiChu: string) => void;
  onGiaiTrinh: (phucTap: boolean) => void;
  onHuy: () => void;
}) {
  const [soVanBan, datSoVanBan] = useState('');
  const [ghiChu, datGhiChu] = useState('');
  const [phucTap, datPhucTap] = useState(false);

  return (
    <div className="space-y-3">
      {quaHan && !coHanGiaiTrinh && (
        <div className="space-y-2 border border-canhbao bg-[#FDF0F2] p-3">
          <p className="font-medium text-canhbao">Nhiệm vụ đã quá hạn</p>
          <p className="text-[0.9375rem]">
            Khởi tạo quy trình yêu cầu giải trình theo Điều 40 Luật 121/2025/QH15. Thời hạn là 15
            ngày dương lịch; trường hợp phức tạp không quá 30 ngày.
          </p>
          <label className="flex items-center gap-2 text-[0.9375rem]">
            <input
              type="checkbox"
              className="h-5 w-5"
              checked={phucTap}
              onChange={(e) => datPhucTap(e.target.checked)}
            />
            Trường hợp phức tạp — áp dụng thời hạn 30 ngày
          </label>
          <button
            type="button"
            className="nut-canhbao"
            disabled={dangGhi}
            onClick={() => onGiaiTrinh(phucTap)}
          >
            Yêu cầu giải trình theo Điều 40
          </button>
        </div>
      )}

      {nhanBuoc === null ? (
        <p className="text-[0.9375rem] text-[#4A536B]">
          Đã đi hết bảy bước xử lý. Nhiệm vụ này cần báo cáo Hội đồng nhân dân xem xét trách nhiệm.
        </p>
      ) : (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (soVanBan.trim()) onGhiBuoc(soVanBan.trim(), ghiChu.trim());
          }}
        >
          <p className="font-medium">Bước tiếp theo: {nhanBuoc}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="nhan-truong" htmlFor="so-van-ban-buoc">
                Số văn bản
              </label>
              <input
                id="so-van-ban-buoc"
                className="o-nhap so"
                value={soVanBan}
                onChange={(e) => datSoVanBan(e.target.value)}
                placeholder="45/HĐND-VP"
              />
            </div>
            <div>
              <label className="nhan-truong" htmlFor="ghi-chu-buoc">
                Ghi chú
              </label>
              <input
                id="ghi-chu-buoc"
                className="o-nhap"
                value={ghiChu}
                onChange={(e) => datGhiChu(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="nut-chinh" disabled={dangGhi || !soVanBan.trim()}>
              Ghi bước xử lý
            </button>
            <button type="button" className="nut-phu" onClick={onHuy} disabled={dangGhi}>
              Hủy
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
