import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDuLieu } from '../dulieu/khoDuLieu';
import LuoiDonVi from '../thanhphan/LuoiDonVi';
import { Nhan } from '../thanhphan/Nhan';
import { hienThiKyThang, hienThiNgay, kyThang } from '../nghiepvu/hanXuLy';
import { mocChuKy, NHAN_TRANG_THAI_DOT } from '../nghiepvu/lapDanhMuc';
import { thongKeNhiemVu } from '../nghiepvu/theoDoiNhiemVu';
import { demTheoMuc } from '../nghiepvu/theoDoiDonVi';

function O({
  nhan,
  giaTri,
  phuChu,
  canhBao,
}: {
  nhan: string;
  giaTri: string | number;
  phuChu?: string;
  canhBao?: boolean;
}) {
  return (
    <div className="khung px-4 py-3">
      <p className="text-[0.9375rem] text-[#4A536B]">{nhan}</p>
      <p className={`so text-2xl font-semibold ${canhBao ? 'text-canhbao' : 'text-muc'}`}>
        {giaTri}
      </p>
      {phuChu && <p className="mt-1 text-[0.875rem] text-[#4A536B]">{phuChu}</p>}
    </div>
  );
}

type Viec = { noiDung: string; den: string; nhanNut: string; gap: boolean };

export default function TongQuan() {
  const du = useDuLieu();
  const kyHienTai = kyThang(du.homNay);
  const moc = mocChuKy(kyHienTai, du.cauHinh);

  const tomTat = useMemo(() => {
    const dem = demTheoMuc(du.donVi, du.homNay);
    const dot = du.dotRaSoat.find((d) => d.ky === kyHienTai) ?? null;
    const daCoKetQua = new Set(
      du.ketQua.filter((k) => k.ky === kyHienTai).map((k) => k.idNghiQuyet),
    );
    const chuaThamDinh = dot
      ? dot.danhMucChinhThuc.filter((id) => !daCoKetQua.has(id))
      : [];
    const choChot = du.ketQua.filter((k) => k.trangThai === 'chua_chot');
    const daChot = du.ketQua.filter((k) => k.trangThai === 'da_chot');
    const nhiemVu = thongKeNhiemVu(du.nhiemVu, du.homNay, du.ngayLe);
    return {
      dem,
      dot,
      chuaThamDinh,
      choChot,
      daChot,
      chuaDat: daChot.filter((k) => k.xepLoai === 'chua_dat').length,
      nhiemVu,
      boQuen: dem.rat_lau + dem.chua_bao_gio,
    };
  }, [du, kyHienTai]);

  const viecCanLam: Viec[] = [];
  const { dot } = tomTat;

  if (!dot) {
    const quaNgayTongHop = du.homNay >= moc.ngayTongHop;
    viecCanLam.push({
      noiDung: quaNgayTongHop
        ? `Đã qua ngày ${du.cauHinh.ngayTongHop} mà kỳ ${hienThiKyThang(kyHienTai)} chưa lập danh mục đề xuất.`
        : `Kỳ ${hienThiKyThang(kyHienTai)} chưa lập danh mục. Mốc tổng hợp là ngày ${hienThiNgay(moc.ngayTongHop)}.`,
      den: '/danh-muc-ra-soat',
      nhanNut: 'Lập danh mục',
      gap: quaNgayTongHop,
    });
  } else if (dot.trangThai === 'de_xuat') {
    viecCanLam.push({
      noiDung: `Danh mục kỳ ${hienThiKyThang(kyHienTai)} đang chờ Thường trực quyết định (${dot.danhMucDeXuat.length} văn bản đề xuất).`,
      den: '/danh-muc-ra-soat',
      nhanNut: 'Sang bàn quyết định',
      gap: du.homNay >= moc.ngayTrinhDanhMuc,
    });
  } else if (dot.trangThai === 'da_quyet_dinh') {
    viecCanLam.push({
      noiDung: `Danh mục kỳ ${hienThiKyThang(kyHienTai)} đã quyết định, chưa mở đợt thẩm định.`,
      den: '/danh-muc-ra-soat',
      nhanNut: 'Mở đợt thẩm định',
      gap: false,
    });
  }

  if (tomTat.chuaThamDinh.length > 0) {
    viecCanLam.push({
      noiDung: `Còn ${tomTat.chuaThamDinh.length} văn bản của kỳ ${hienThiKyThang(kyHienTai)} chưa có phiếu thẩm định. Hạn ${hienThiNgay(dot?.hanThamDinh ?? '')}.`,
      den: '/tham-dinh',
      nhanNut: 'Chấm điểm',
      gap: dot !== null && du.homNay > dot.hanThamDinh,
    });
  }

  if (tomTat.choChot.length > 0) {
    viecCanLam.push({
      noiDung: `${tomTat.choChot.length} kết quả đang chờ giải trình hoặc chờ chốt.`,
      den: '/tham-dinh',
      nhanNut: 'Xem kết quả',
      gap: false,
    });
  }

  if (tomTat.nhiemVu.quaHan > 0) {
    viecCanLam.push({
      noiDung: `${tomTat.nhiemVu.quaHan} nhiệm vụ sau giám sát đã quá hạn, cần khởi tạo yêu cầu giải trình theo Điều 40.`,
      den: '/theo-doi-sau-giam-sat',
      nhanNut: 'Xem nhiệm vụ',
      gap: true,
    });
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="tieu-de-chu-ky">
        <h2 id="tieu-de-chu-ky" className="mb-3 text-xl">
          Chu kỳ {hienThiKyThang(kyHienTai)}
        </h2>
        <ol className="khung grid gap-0 sm:grid-cols-4">
          {[
            {
              nhan: `Ngày ${du.cauHinh.ngayTongHop} — tổng hợp, phân tích`,
              xong: du.homNay >= moc.ngayTongHop,
            },
            {
              nhan: `Ngày ${du.cauHinh.ngayTrinhDanhMuc} — trình danh mục`,
              xong: dot !== null,
            },
            {
              nhan: 'Phiên họp Thường trực — quyết định',
              xong: dot !== null && dot.trangThai !== 'de_xuat',
            },
            {
              nhan: 'Mở đợt, thẩm định 10 ngày làm việc',
              xong: dot !== null && (dot.trangThai === 'dang_tham_dinh' || dot.trangThai === 'da_chot'),
            },
          ].map((b, i) => (
            <li
              key={b.nhan}
              className={`border-vien px-4 py-3 ${i > 0 ? 'border-t sm:border-l sm:border-t-0' : ''}`}
            >
              <p className={`text-[0.9375rem] ${b.xong ? 'text-dat' : 'text-[#4A536B]'}`}>
                {b.xong ? '✓ ' : ''}
                {b.nhan}
              </p>
            </li>
          ))}
        </ol>
        {dot && (
          <p className="mt-2 text-[0.9375rem] text-[#4A536B]">
            Trạng thái đợt: <strong>{NHAN_TRANG_THAI_DOT[dot.trangThai]}</strong>
            {dot.vanBanQuyetDinh && (
              <>
                {' '}
                · quyết định tại <span className="so">{dot.vanBanQuyetDinh}</span>
              </>
            )}
          </p>
        )}
      </section>

      <section aria-labelledby="tieu-de-viec">
        <h2 id="tieu-de-viec" className="mb-3 text-xl">
          Việc cần làm
        </h2>
        {viecCanLam.length === 0 ? (
          <p className="khung px-4 py-3 text-[#4A536B]">
            Không có việc nào đến hạn. Kỳ {hienThiKyThang(kyHienTai)} đã xử lý xong các bước hiện
            tại.
          </p>
        ) : (
          <ul className="space-y-2">
            {viecCanLam.map((viec) => (
              <li
                key={viec.noiDung}
                className="khung flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <span className="flex items-center gap-2">
                  {viec.gap && <Nhan sac="canhbao">Cần xử lý</Nhan>}
                  {viec.noiDung}
                </span>
                <Link to={viec.den} className="nut-phu">
                  {viec.nhanNut}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tieu-de-so-lieu">
        <h2 id="tieu-de-so-lieu" className="mb-3 text-xl">
          Số liệu
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <O
            nhan="Nghị quyết đã nhập"
            giaTri={du.nghiQuyet.length}
            phuChu={`Năm ${du.cauHinh.namLamViec}`}
          />
          <O
            nhan="Đơn vị lâu chưa rà soát"
            giaTri={tomTat.boQuen}
            phuChu="Trên 180 ngày hoặc chưa từng"
            canhBao={tomTat.boQuen > 0}
          />
          <O
            nhan="Kết quả đã chốt"
            giaTri={tomTat.daChot.length}
            phuChu={`${tomTat.chuaDat} văn bản chưa đạt`}
          />
          <O
            nhan="Nhiệm vụ sau giám sát"
            giaTri={tomTat.nhiemVu.conTheoDoi}
            phuChu={`${tomTat.nhiemVu.quaHan} quá hạn`}
            canhBao={tomTat.nhiemVu.quaHan > 0}
          />
        </div>
      </section>

      <section aria-labelledby="tieu-de-luoi">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tieu-de-luoi" className="text-xl">
            Lưới theo dõi {du.donVi.length} xã, phường
          </h2>
          <p className="text-[0.9375rem] text-[#4A536B]">
            Màu theo số ngày kể từ lần rà soát gần nhất — cơ sở cho cách thức luân phiên
          </p>
        </div>
        <div className="khung p-4">
          <LuoiDonVi danhSach={du.donVi} ngayThamChieu={du.homNay} />
        </div>
      </section>

      <section aria-labelledby="tieu-de-ban-tin">
        <h2 id="tieu-de-ban-tin" className="mb-3 text-xl">
          Bảng tin điều hành
        </h2>
        {du.banTin.length === 0 ? (
          <p className="khung px-4 py-3 text-[#4A536B]">
            Chưa có bản tin nào. Bản tin đăng trong <code>data/bangtin.json</code>.
          </p>
        ) : (
          <ul className="space-y-2">
            {[...du.banTin]
              .sort((a, b) => (a.ngayDang < b.ngayDang ? 1 : -1))
              .slice(0, 5)
              .map((tin) => (
                <li key={tin.id} className="khung px-4 py-3">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg">{tin.tieuDe}</h3>
                    {tin.mucDo === 'quan_trong' && <Nhan sac="luuy">Quan trọng</Nhan>}
                    <span className="so text-[0.875rem] text-[#4A536B]">
                      {hienThiNgay(tin.ngayDang)}
                    </span>
                  </div>
                  <p className="mt-1 text-[#31394F]">{tin.noiDung}</p>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
