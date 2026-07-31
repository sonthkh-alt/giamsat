import { useState } from 'react';
import type { KhoTaiKhoan, TaiKhoan } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { usePhien } from '../dulieu/usePhien';
import { useGhi } from '../dulieu/useGhi';
import { ghiJson, kiemTraQuyenGhi, LoiGhiGitHub, type ThongTinKho } from '../dulieu/ghiGitHub';
import {
  bamMatKhau,
  cheMa,
  layMaKetNoi,
  luuMaKetNoi,
  timTaiKhoan,
  xoaMaKetNoi,
} from '../dulieu/xacThuc';
import { hienThiNgay } from '../nghiepvu/hanXuLy';
import { NHAN_QUYEN, NHAN_VAI_TRO, quyenCuaVaiTro } from '../nghiepvu/phanQuyen';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan } from '../thanhphan/Nhan';

function muoiNgauNhien(): string {
  const dem = new Uint8Array(16);
  crypto.getRandomValues(dem);
  return [...dem].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function QuanTri() {
  const { phien, duocPhep, coKetNoi } = usePhien();
  const laQuanTri = duocPhep('quanTriHeThong');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Quản trị</h2>
        <p className="text-[0.9375rem] text-[#4A536B]">
          {phien?.hoTen} · {phien ? NHAN_VAI_TRO[phien.vaiTro] : ''}
        </p>
      </div>

      <DoiMatKhau />

      <section aria-labelledby="qt-quyen" className="khung p-4">
        <h3 id="qt-quyen" className="mb-3 text-lg">
          Quyền của tài khoản
        </h3>
        {phien && quyenCuaVaiTro(phien.vaiTro).length === 0 ? (
          <p className="text-[#4A536B]">
            Vai trò {NHAN_VAI_TRO[phien.vaiTro]} chỉ được xem, không có quyền ghi dữ liệu.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {phien &&
              quyenCuaVaiTro(phien.vaiTro).map((q) => (
                <li key={q}>
                  <Nhan sac="dat">{NHAN_QUYEN[q]}</Nhan>
                </li>
              ))}
          </ul>
        )}
        {!coKetNoi && phien && quyenCuaVaiTro(phien.vaiTro).length > 0 && (
          <p className="mt-3 text-[0.9375rem] text-[#4A536B]">
            Máy trạm này chưa cấu hình kết nối kho nên các thao tác ghi đang bị khóa. Quản trị hệ
            thống cấu hình một lần cho mỗi máy.
          </p>
        )}
      </section>

      {laQuanTri && <KetNoiKho />}
      {laQuanTri && <DanhSachTaiKhoan />}
      {laQuanTri && <CauHinhHeThong />}
    </div>
  );
}

function DoiMatKhau() {
  const du = useDuLieu();
  const { phien } = usePhien();
  const ghi = useGhi();
  const [cu, datCu] = useState('');
  const [moi, datMoi] = useState('');
  const [lai, datLai] = useState('');
  const [loi, datLoi] = useState<string | null>(null);

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  async function gui(su: React.FormEvent) {
    su.preventDefault();
    datLoi(null);
    if (!phien) return;
    if (moi.length < 10) {
      datLoi('Mật khẩu mới phải dài ít nhất 10 ký tự.');
      return;
    }
    if (moi !== lai) {
      datLoi('Hai lần nhập mật khẩu mới chưa khớp nhau.');
      return;
    }
    const taiKhoan = timTaiKhoan(du.khoTaiKhoan, phien.tenDangNhap);
    if (!taiKhoan) {
      datLoi('Không tìm thấy tài khoản trong danh sách. Tải lại trang rồi thử lại.');
      return;
    }
    const bamCu = await bamMatKhau(cu, taiKhoan.muoi, du.khoTaiKhoan.thamSoBam.soVongLap);
    if (bamCu !== taiKhoan.bam) {
      datLoi('Mật khẩu hiện tại không đúng.');
      return;
    }

    const muoi = muoiNgauNhien();
    const bam = await bamMatKhau(moi, muoi, du.khoTaiKhoan.thamSoBam.soVongLap);
    const khoMoi: KhoTaiKhoan = {
      ...du.khoTaiKhoan,
      taiKhoan: du.khoTaiKhoan.taiKhoan.map((t) =>
        t.tenDangNhap === taiKhoan.tenDangNhap ? { ...t, muoi, bam } : t,
      ),
    };
    const xong = await ghi.chay(async () => {
      await ghiJson(kho, 'data/nguoidung.json', khoMoi, `taiKhoan: đổi mật khẩu ${taiKhoan.tenDangNhap}`);
      return 'Đã đổi mật khẩu. Lần đăng nhập sau dùng mật khẩu mới.';
    });
    if (xong) {
      datCu('');
      datMoi('');
      datLai('');
    }
  }

  return (
    <form onSubmit={gui} className="khung space-y-3 p-4">
      <h3 className="text-lg">Đổi mật khẩu</h3>

      {loi && (
        <ThongBao loai="loi" tieuDe="Chưa đổi được mật khẩu">
          {loi}
        </ThongBao>
      )}
      {ghi.loi && (
        <ThongBao loai="loi" tieuDe="Không ghi được lên kho">
          {ghi.loi}
        </ThongBao>
      )}
      {ghi.thanhCong && (
        <ThongBao loai="thanh_cong" tieuDe="Đã đổi mật khẩu">
          {ghi.thanhCong}
        </ThongBao>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="nhan-truong" htmlFor="mk-cu">
            Mật khẩu hiện tại
          </label>
          <input
            id="mk-cu"
            type="password"
            autoComplete="current-password"
            className="o-nhap"
            value={cu}
            onChange={(e) => datCu(e.target.value)}
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="mk-moi">
            Mật khẩu mới
          </label>
          <input
            id="mk-moi"
            type="password"
            autoComplete="new-password"
            className="o-nhap"
            value={moi}
            onChange={(e) => datMoi(e.target.value)}
          />
        </div>
        <div>
          <label className="nhan-truong" htmlFor="mk-lai">
            Nhập lại mật khẩu mới
          </label>
          <input
            id="mk-lai"
            type="password"
            autoComplete="new-password"
            className="o-nhap"
            value={lai}
            onChange={(e) => datLai(e.target.value)}
          />
        </div>
      </div>

      <button type="submit" className="nut-chinh" disabled={ghi.dangGhi || !cu || !moi}>
        {ghi.dangGhi ? 'Đang lưu…' : 'Đổi mật khẩu'}
      </button>
      <p className="text-[0.875rem] text-[#4A536B]">
        Đổi mật khẩu ghi thẳng lên kho nên máy trạm phải đã cấu hình kết nối kho.
      </p>
    </form>
  );
}

function KetNoiKho() {
  const du = useDuLieu();
  const { coKetNoi } = usePhien();
  const [oNhap, datONhap] = useState('');
  const [dangKiemTra, datDangKiemTra] = useState(false);
  const [ketQua, datKetQua] = useState<{ tot: boolean; moTa: string } | null>(null);

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  async function kiemTra() {
    datDangKiemTra(true);
    datKetQua(null);
    try {
      const quyen = await kiemTraQuyenGhi(kho);
      datKetQua({ tot: quyen.ghiDuoc, moTa: quyen.moTa });
    } catch (loi) {
      datKetQua({
        tot: false,
        moTa:
          loi instanceof LoiGhiGitHub
            ? loi.message
            : 'Không gọi được GitHub. Kiểm tra kết nối mạng rồi thử lại.',
      });
    } finally {
      datDangKiemTra(false);
    }
  }

  return (
    <section aria-labelledby="qt-ket-noi" className="khung space-y-4 p-4">
      <h3 id="qt-ket-noi" className="text-lg">
        Kết nối kho dữ liệu
      </h3>
      <p className="max-w-[80ch] text-[0.9375rem] text-[#4A536B]">
        Trang chạy trên GitHub Pages, không có máy chủ riêng, nên mọi thao tác ghi đều do trình
        duyệt gửi thẳng lên kho. Quản trị cấu hình mã kết nối một lần cho mỗi máy trạm dùng
        chung; người dùng thường không thấy mục này.
      </p>

      {coKetNoi ? (
        <ThongBao loai="thanh_cong" tieuDe="Máy trạm này đã kết nối kho">
          Mã đang dùng: <span className="so">{cheMa(layMaKetNoi() ?? '')}</span>. Mã chỉ nằm trong
          bộ nhớ tạm của tab này và mất khi đóng tab.
        </ThongBao>
      ) : (
        <ThongBao loai="luu_y" tieuDe="Máy trạm này chưa kết nối kho">
          Mọi thao tác ghi dữ liệu đang bị khóa. Dán mã kết nối để mở.
        </ThongBao>
      )}

      <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
        <div>
          <label className="nhan-truong" htmlFor="o-ma-ket-noi">
            Mã kết nối kho
          </label>
          <input
            id="o-ma-ket-noi"
            type="password"
            autoComplete="off"
            spellCheck={false}
            className="o-nhap so"
            value={oNhap}
            onChange={(e) => datONhap(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <button
            type="button"
            className="nut-chinh"
            onClick={() => {
              luuMaKetNoi(oNhap);
              datONhap('');
              datKetQua(null);
            }}
            disabled={!oNhap.trim()}
          >
            Lưu kết nối
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="nut-phu" onClick={kiemTra} disabled={!coKetNoi || dangKiemTra}>
          {dangKiemTra ? 'Đang kiểm tra…' : 'Kiểm tra kết nối'}
        </button>
        <button
          type="button"
          className="nut-canhbao"
          onClick={() => {
            xoaMaKetNoi();
            datKetQua(null);
          }}
          disabled={!coKetNoi}
        >
          Ngắt kết nối
        </button>
      </div>

      {ketQua && (
        <ThongBao
          loai={ketQua.tot ? 'thanh_cong' : 'loi'}
          tieuDe={ketQua.tot ? 'Kết nối dùng được' : 'Kết nối chưa dùng được'}
        >
          {ketQua.moTa}
        </ThongBao>
      )}

      <details className="border border-vien bg-nen px-3 py-2">
        <summary className="cursor-pointer font-medium">Cách tạo mã kết nối</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.9375rem]">
          <li>
            GitHub · Settings · Developer settings · Personal access tokens · Fine-grained tokens ·
            Generate new token.
          </li>
          <li>
            Repository access chọn Only select repositories, chọn kho{' '}
            <span className="so">
              {kho.chuKho}/{kho.tenKho}
            </span>
            .
          </li>
          <li>Permissions · Repository permissions đặt Contents thành Read and write.</li>
          <li>Đặt hạn dùng ngắn, tạo và sao chép mã, rồi dán vào ô ở trên.</li>
        </ol>
      </details>

      <div className="border border-canhbao bg-[#FDF0F2] p-3">
        <p className="font-semibold text-canhbao">Những điều phải nhớ</p>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-[0.9375rem]">
          <li>
            Kho{' '}
            <span className="so">
              {kho.chuKho}/{kho.tenKho}
            </span>{' '}
            đang public. Mọi thứ commit lên đều công khai vĩnh viễn.
          </li>
          <li>
            Không đưa lên thông tin cá nhân của công dân, nội dung đơn thư, hay thông tin thuộc
            phạm vi bí mật nhà nước.
          </li>
          <li>Không commit mã kết nối, mật khẩu, khóa API — kể cả trong tệp ví dụ.</li>
          <li>
            Đăng nhập chỉ phân quyền trong ứng dụng, không phải kiểm soát truy cập thật: tệp JSON
            trong kho public ai cũng đọc được. Nội dung cần riêng tư phải chuyển sang kho private.
          </li>
        </ul>
      </div>
    </section>
  );
}

function DanhSachTaiKhoan() {
  const du = useDuLieu();
  const ghi = useGhi();
  const { phien } = usePhien();

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  async function doiTrangThai(taiKhoan: TaiKhoan) {
    const khoMoi: KhoTaiKhoan = {
      ...du.khoTaiKhoan,
      taiKhoan: du.khoTaiKhoan.taiKhoan.map((t) =>
        t.tenDangNhap === taiKhoan.tenDangNhap ? { ...t, hoatDong: !t.hoatDong } : t,
      ),
    };
    await ghi.chay(async () => {
      await ghiJson(
        kho,
        'data/nguoidung.json',
        khoMoi,
        `taiKhoan: ${taiKhoan.hoatDong ? 'khóa' : 'mở khóa'} ${taiKhoan.tenDangNhap}`,
      );
      return `Đã ${taiKhoan.hoatDong ? 'khóa' : 'mở khóa'} tài khoản ${taiKhoan.tenDangNhap}.`;
    });
  }

  return (
    <section aria-labelledby="qt-tai-khoan" className="khung p-4">
      <h3 id="qt-tai-khoan" className="mb-3 text-lg">
        Tài khoản ({du.khoTaiKhoan.taiKhoan.length})
      </h3>
      <p className="mb-3 text-[0.9375rem] text-[#4A536B]">
        Cấp tài khoản mới và đặt lại mật khẩu bằng lệnh{' '}
        <code>node scripts/tai-khoan.mjs</code>, rồi commit tệp <code>data/nguoidung.json</code>.
        Tại đây chỉ khóa hoặc mở khóa được tài khoản.
      </p>
      <div className="overflow-x-auto">
        <table className="bang">
          <thead>
            <tr>
              <th scope="col">Tên đăng nhập</th>
              <th scope="col">Họ tên</th>
              <th scope="col">Vai trò</th>
              <th scope="col">Đơn vị</th>
              <th scope="col">Ngày cấp</th>
              <th scope="col">Trạng thái</th>
              <th scope="col">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {du.khoTaiKhoan.taiKhoan.map((t) => (
              <tr key={t.tenDangNhap}>
                <td className="so">{t.tenDangNhap}</td>
                <td>{t.hoTen}</td>
                <td>{NHAN_VAI_TRO[t.vaiTro]}</td>
                <td className="so">{t.maDonVi ?? '—'}</td>
                <td className="so">{hienThiNgay(t.ngayCap)}</td>
                <td>
                  <Nhan sac={t.hoatDong ? 'dat' : 'canhbao'}>
                    {t.hoatDong ? 'Hoạt động' : 'Đã khóa'}
                  </Nhan>
                </td>
                <td>
                  {t.tenDangNhap === phien?.tenDangNhap ? (
                    <span className="text-[#4A536B]">Đang đăng nhập</span>
                  ) : (
                    <button
                      type="button"
                      className={t.hoatDong ? 'nut-canhbao' : 'nut-phu'}
                      disabled={ghi.dangGhi}
                      onClick={() => doiTrangThai(t)}
                    >
                      {t.hoatDong ? 'Khóa' : 'Mở khóa'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CauHinhHeThong() {
  const du = useDuLieu();
  return (
    <section aria-labelledby="qt-cau-hinh" className="khung p-4">
      <h3 id="qt-cau-hinh" className="mb-3 text-lg">
        Cấu hình hệ thống
      </h3>
      <p className="mb-3 text-[0.9375rem] text-[#4A536B]">
        Sửa trong <code>data/cauhinh.json</code>, <code>data/khung-nghiep-vu.json</code> và{' '}
        <code>data/dauhieu-canhbao.json</code>.
      </p>
      <table className="bang">
        <tbody>
          <tr>
            <th scope="row" className="text-left">
              Kho
            </th>
            <td className="so">
              {du.cauHinh.chuKho}/{du.cauHinh.tenKho} · nhánh {du.cauHinh.nhanh}
            </td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Năm làm việc
            </th>
            <td className="so">{du.cauHinh.namLamViec}</td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Mã muối bổ sung ngẫu nhiên
            </th>
            <td className="so">{du.cauHinh.maMuoi}</td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Số văn bản rà soát mỗi tháng
            </th>
            <td className="so">{du.cauHinh.soVanBanRaSoatMoiThang}</td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Mốc chu kỳ tháng
            </th>
            <td className="so">
              Ngày {du.cauHinh.ngayTongHop} tổng hợp · ngày {du.cauHinh.ngayTrinhDanhMuc} trình
            </td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Khung nghiệp vụ
            </th>
            <td>
              {du.khung.nhom.length} nhóm, phiên bản{' '}
              <span className="so">{du.khung.phienBan || '—'}</span>
            </td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Bộ dấu hiệu cảnh báo
            </th>
            <td className="so">{du.cauHinhDauHieu.phienBan || '—'}</td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Ngày nghỉ lễ đã khai
            </th>
            <td className="so">{du.ngayLe.length}</td>
          </tr>
          <tr>
            <th scope="row" className="text-left">
              Nguồn dữ liệu
            </th>
            <td>
              {du.dangDungDuLieuMau ? 'Dữ liệu giả lập trong data/mau/' : 'Dữ liệu thật trong data/'}
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
