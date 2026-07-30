import type { ReactNode } from 'react';
import { useKho } from '../dulieu/khoDuLieu';

/**
 * Chỉ hiển thị nội dung khi dữ liệu đã tải xong.
 * Màn hình lỗi nói rõ chuyện gì xảy ra và cách khắc phục.
 */
export default function ChoDuLieu({ children }: { children: ReactNode }) {
  const kho = useKho();

  if (kho.trangThai === 'dangTai') {
    return (
      <p role="status" className="khung px-4 py-6 text-[#4A536B]">
        Đang tải dữ liệu…
      </p>
    );
  }

  if (kho.trangThai === 'loi') {
    return (
      <div role="alert" className="border border-canhbao bg-[#FDF0F2] px-4 py-4">
        <h2 className="mb-1 text-lg text-canhbao">Không tải được dữ liệu</h2>
        <p className="mb-3">{kho.loi}</p>
        <p className="mb-4 text-[0.9375rem] text-[#4A536B]">
          Thường là do mất kết nối mạng, hoặc một tệp trong thư mục <code>data/</code> sai định
          dạng JSON. Kiểm tra kết nối rồi thử lại.
        </p>
        <button type="button" className="nut-phu" onClick={kho.taiLai}>
          Tải lại dữ liệu
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
