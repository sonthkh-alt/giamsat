import type { ReactNode } from 'react';

export default function ManHinhTrong({
  tieuDe,
  moTa,
  hanhDong,
}: {
  tieuDe: string;
  moTa: string;
  hanhDong?: ReactNode;
}) {
  return (
    <div className="khung px-4 py-8 text-center">
      <h3 className="mb-2 text-lg">{tieuDe}</h3>
      <p className="mx-auto mb-4 max-w-[60ch] text-[#4A536B]">{moTa}</p>
      {hanhDong}
    </div>
  );
}
