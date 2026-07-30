import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDuLieu } from '../dulieu/khoDuLieu';
import LuoiDonVi from '../thanhphan/LuoiDonVi';
import { Nhan } from '../thanhphan/Nhan';
import { hienThiNgay, mucCanhBao } from '../nghiepvu/hanXuLy';
import { kyRutTham } from '../nghiepvu/rutTham';
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

export default function TongQuan() {
  const du = useDuLieu();
  const kyHienTai = kyRutTham(du.homNay);

  const tomTat = useMemo(() => {
    const dem = demTheoMuc(du.donVi, du.homNay);
    const dot = du.dotKiemTra.find((d) => d.ky === kyHienTai) ?? null;
    const daCoKetQua = new Set(
      du.ketQua.filter((k) => k.ky === kyHienTai).map((k) => k.idNghiQuyet),
    );
    const chuaThamDinh = dot ? dot.danhSachTrung.filter((id) => !daCoKetQua.has(id)) : [];
    const choChot = du.ketQua.filter((k) => k.trangThai === 'chua_chot');
    const kienNghiDangMo = du.kienNghi.filter(
      (k) => k.trangThai === 'chua_thuc_hien' || k.trangThai === 'dang_thuc_hien',
    );
    const kienNghiQuaHan = kienNghiDangMo.filter(
      (k) => mucCanhBao(k.hanThucHien, du.homNay, du.ngayLe) === 'qua_han',
    );
    const daChot = du.ketQua.filter((k) => k.trangThai === 'da_chot');
    const chuaDat = daChot.filter((k) => k.xepLoai === 'chua_dat').length;

    return {
      dem,
      dot,
      chuaThamDinh,
      choChot,
      kienNghiDangMo,
      kienNghiQuaHan,
      daChot,
      chuaDat,
      boQuen: dem.rat_lau + dem.chua_bao_gio,
    };
  }, [du, kyHienTai]);

  const viecCanLam: { noiDung: string; den: string; nhanNut: string; gap: boolean }[] = [];
  if (!tomTat.dot) {
    viecCanLam.push({
      noiDung: `Tuần ${kyHienTai} chưa rút thăm.`,
      den: '/rut-tham',
      nhanNut: 'Sang trang Rút thăm',
      gap: true,
    });
  }
  if (tomTat.chuaThamDinh.length > 0) {
    viecCanLam.push({
      noiDung: `Còn ${tomTat.chuaThamDinh.length} nghị quyết của kỳ ${kyHienTai} chưa có phiếu thẩm định.`,
      den: '/tham-dinh',
      nhanNut: 'Chấm điểm',
      gap: false,
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
  if (tomTat.kienNghiQuaHan.length > 0) {
    viecCanLam.push({
      noiDung: `${tomTat.kienNghiQuaHan.length} kiến nghị sau giám sát đã quá hạn thực hiện.`,
      den: '/kien-nghi',
      nhanNut: 'Xem kiến nghị',
      gap: true,
    });
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="tieu-de-luoi">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="tieu-de-luoi" className="text-xl">
            Lưới theo dõi {du.donVi.length} xã, phường
          </h2>
          <p className="text-[0.9375rem] text-[#4A536B]">
            Màu theo số ngày kể từ lần kiểm tra gần nhất, tính đến{' '}
            <span className="so">{hienThiNgay(du.homNay)}</span>
          </p>
        </div>
        <div className="khung p-4">
          <LuoiDonVi danhSach={du.donVi} ngayThamChieu={du.homNay} />
        </div>
      </section>

      <section aria-labelledby="tieu-de-viec">
        <h2 id="tieu-de-viec" className="mb-3 text-xl">
          Việc cần làm
        </h2>
        {viecCanLam.length === 0 ? (
          <p className="khung px-4 py-3 text-[#4A536B]">
            Không có việc nào đến hạn. Kỳ {kyHienTai} đã rút thăm và các phiếu đều đã xử lý.
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
            nhan="Đơn vị lâu chưa kiểm tra"
            giaTri={tomTat.boQuen}
            phuChu="Trên 180 ngày hoặc chưa từng"
            canhBao={tomTat.boQuen > 0}
          />
          <O
            nhan="Kết quả đã chốt"
            giaTri={tomTat.daChot.length}
            phuChu={`${tomTat.chuaDat} đơn vị chưa đạt`}
          />
          <O
            nhan="Kiến nghị đang theo dõi"
            giaTri={tomTat.kienNghiDangMo.length}
            phuChu={`${tomTat.kienNghiQuaHan.length} quá hạn`}
            canhBao={tomTat.kienNghiQuaHan.length > 0}
          />
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
