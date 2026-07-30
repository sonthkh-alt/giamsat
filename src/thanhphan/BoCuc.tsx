import { NavLink, Outlet } from 'react-router-dom';
import { useKho } from '../dulieu/khoDuLieu';
import { hienThiNgay } from '../nghiepvu/hanXuLy';

const MUC_DIEU_HUONG = [
  { den: '/', nhan: 'Tổng quan', cuoi: true },
  { den: '/nghi-quyet', nhan: 'Nghị quyết' },
  { den: '/rut-tham', nhan: 'Rút thăm' },
  { den: '/tham-dinh', nhan: 'Thẩm định' },
  { den: '/kien-nghi', nhan: 'Kiến nghị' },
  { den: '/hoi-dap', nhan: 'Hỏi đáp' },
  { den: '/quan-tri', nhan: 'Quản trị' },
];

export default function BoCuc() {
  const kho = useKho();
  const duLieuMau = kho.trangThai === 'xong' && kho.duLieu.dangDungDuLieuMau;
  const homNay = kho.trangThai === 'xong' ? kho.duLieu.homNay : null;

  return (
    <div className="flex min-h-screen flex-col bg-nen">
      <a
        href="#noi-dung"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-giay focus:px-4 focus:py-2"
      >
        Bỏ qua điều hướng, sang nội dung chính
      </a>

      <header className="border-b border-vien bg-muc text-giay">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <div>
              <p className="text-[0.8125rem] uppercase tracking-wide text-[#B9C2D8]">
                Hội đồng nhân dân tỉnh Thanh Hóa
              </p>
              <h1 className="text-xl font-semibold sm:text-2xl">Giám sát số Thanh Hóa</h1>
            </div>
            {homNay && (
              <p className="text-[0.9375rem] text-[#D5DBEA]">
                Hôm nay <span className="so">{hienThiNgay(homNay)}</span>
              </p>
            )}
          </div>
        </div>

        <nav aria-label="Điều hướng chính" className="border-t border-[#2C3D68]">
          <div className="mx-auto w-full max-w-[1200px] overflow-x-auto px-2 sm:px-4">
            <ul className="flex min-w-max">
              {MUC_DIEU_HUONG.map((muc) => (
                <li key={muc.den}>
                  <NavLink
                    to={muc.den}
                    end={muc.cuoi}
                    className={({ isActive }) =>
                      [
                        'block whitespace-nowrap border-b-[3px] px-4 py-3 text-[0.9375rem] font-medium',
                        isActive
                          ? 'border-giay text-giay'
                          : 'border-transparent text-[#C6CEE2] hover:text-giay',
                      ].join(' ')
                    }
                  >
                    {muc.nhan}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {duLieuMau && (
        <p
          role="status"
          className="border-b border-[#E5CFA0] bg-[#FDF6E7] px-4 py-2 text-center text-[0.9375rem] text-[#6B4602] sm:px-6"
        >
          Hệ thống đang chạy trên <strong>dữ liệu giả lập</strong> trong <code>data/mau/</code>.
          Số liệu dưới đây không phải số liệu thật của các xã, phường.
        </p>
      )}

      <main id="noi-dung" className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6">
        <Outlet />
      </main>

      <footer className="border-t border-vien bg-giay">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-4 text-[0.9375rem]">
          <p className="text-[#4A536B]">
            Văn phòng Đoàn đại biểu Quốc hội và Hội đồng nhân dân tỉnh Thanh Hóa — cơ quan thường
            trực.
          </p>
        </div>
      </footer>
    </div>
  );
}
