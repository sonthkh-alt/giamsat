import type { ReactNode } from 'react';

type Loai = 'thanh_cong' | 'luu_y' | 'loi';

const LOP: Record<Loai, string> = {
  thanh_cong: 'border-[#BBD9CC] bg-[#EDF6F1] text-[#134A38]',
  luu_y: 'border-[#E5CFA0] bg-[#FDF6E7] text-[#6B4602]',
  loi: 'border-canhbao bg-[#FDF0F2] text-[#8A0A1F]',
};

/** Thông báo nói rõ chuyện gì đã xảy ra và cần làm gì tiếp. */
export default function ThongBao({
  loai,
  tieuDe,
  children,
}: {
  loai: Loai;
  tieuDe: string;
  children?: ReactNode;
}) {
  return (
    <div role={loai === 'loi' ? 'alert' : 'status'} className={`border px-4 py-3 ${LOP[loai]}`}>
      <p className="font-semibold">{tieuDe}</p>
      {children && <div className="mt-1 text-[0.9375rem]">{children}</div>}
    </div>
  );
}
