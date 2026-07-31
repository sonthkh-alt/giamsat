import { useState } from 'react';
import type { KhoTaiKhoan } from '../kieu';
import { dangNhap, LoiDangNhap } from '../dulieu/xacThuc';

export default function ManHinhDangNhap({ khoTaiKhoan }: { khoTaiKhoan: KhoTaiKhoan }) {
  const [tenDangNhap, datTenDangNhap] = useState('');
  const [matKhau, datMatKhau] = useState('');
  const [dangGui, datDangGui] = useState(false);
  const [loi, datLoi] = useState<string | null>(null);

  const chuaCapTaiKhoan = khoTaiKhoan.taiKhoan.length === 0;

  async function gui(su: React.FormEvent) {
    su.preventDefault();
    datDangGui(true);
    datLoi(null);
    try {
      await dangNhap(khoTaiKhoan, tenDangNhap, matKhau);
    } catch (nguyenNhan) {
      datLoi(
        nguyenNhan instanceof LoiDangNhap
          ? nguyenNhan.message
          : 'Không đăng nhập được. Tải lại trang rồi thử lại.',
      );
      datMatKhau('');
    } finally {
      datDangGui(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-nen">
      <header className="border-b border-vien bg-muc text-giay">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 sm:px-6">
          <p className="text-[0.8125rem] uppercase tracking-wide text-[#B9C2D8]">
            Hội đồng nhân dân tỉnh Thanh Hóa
          </p>
          <h1 className="text-xl font-semibold sm:text-2xl">Giám sát số Thanh Hóa</h1>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[440px] flex-1 items-center px-4 py-10">
        <form onSubmit={gui} className="khung w-full space-y-4 p-6">
          <h2 className="text-lg">Đăng nhập</h2>

          {chuaCapTaiKhoan ? (
            <div role="alert" className="border border-canhbao bg-[#FDF0F2] px-3 py-3">
              <p className="font-semibold text-canhbao">Chưa có tài khoản nào</p>
              <p className="mt-1 text-[0.9375rem]">
                Quản trị hệ thống cấp tài khoản bằng lệnh{' '}
                <code>node scripts/tai-khoan.mjs cap</code> rồi commit tệp{' '}
                <code>data/nguoidung.json</code>.
              </p>
            </div>
          ) : null}

          {loi && (
            <div role="alert" className="border border-canhbao bg-[#FDF0F2] px-3 py-2">
              <p className="text-[0.9375rem] text-[#8A0A1F]">{loi}</p>
            </div>
          )}

          <div>
            <label className="nhan-truong" htmlFor="dn-ten">
              Tên đăng nhập
            </label>
            <input
              id="dn-ten"
              className="o-nhap"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={tenDangNhap}
              onChange={(e) => datTenDangNhap(e.target.value)}
              disabled={chuaCapTaiKhoan}
            />
          </div>

          <div>
            <label className="nhan-truong" htmlFor="dn-mat-khau">
              Mật khẩu
            </label>
            <input
              id="dn-mat-khau"
              type="password"
              className="o-nhap"
              autoComplete="current-password"
              value={matKhau}
              onChange={(e) => datMatKhau(e.target.value)}
              disabled={chuaCapTaiKhoan}
            />
          </div>

          <button
            type="submit"
            className="nut-chinh w-full"
            disabled={dangGui || chuaCapTaiKhoan || !tenDangNhap.trim() || !matKhau}
          >
            {dangGui ? 'Đang kiểm tra…' : 'Đăng nhập'}
          </button>

        </form>
      </main>
    </div>
  );
}
