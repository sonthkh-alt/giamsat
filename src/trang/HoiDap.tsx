import { useMemo, useState } from 'react';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { duongDanTep } from '../dulieu/docJson';
import { hienThiNgay } from '../nghiepvu/hanXuLy';
import { boDau } from '../nghiepvu/nhan';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import { Nhan } from '../thanhphan/Nhan';

export default function HoiDap() {
  const du = useDuLieu();
  const [tuKhoa, datTuKhoa] = useState('');
  const [chuDe, datChuDe] = useState<string | null>(null);

  const cacChuDe = useMemo(
    () => [...new Set(du.hoiDap.map((h) => h.chuDe))].sort((a, b) => a.localeCompare(b, 'vi')),
    [du.hoiDap],
  );

  const ketQua = useMemo(() => {
    const tu = boDau(tuKhoa.trim());
    return du.hoiDap.filter((h) => {
      if (chuDe && h.chuDe !== chuDe) return false;
      if (!tu) return true;
      return boDau(`${h.cauHoi} ${h.traLoi} ${h.chuDe}`).includes(tu);
    });
  }, [du.hoiDap, tuKhoa, chuDe]);

  return (
    <div className="space-y-8">
      <section aria-labelledby="tieu-de-hoi-dap" className="space-y-4">
        <div>
          <h2 id="tieu-de-hoi-dap" className="text-xl">
            Hỏi đáp nghiệp vụ
          </h2>
          <p className="text-[0.9375rem] text-[#4A536B]">
            Ngân hàng tình huống và giải đáp giữa Hội đồng nhân dân tỉnh với Thường trực Hội đồng
            nhân dân cấp xã.
          </p>
        </div>

        {du.hoiDap.length === 0 ? (
          <ManHinhTrong
            tieuDe="Chưa có nội dung hỏi đáp"
            moTa="Các tình huống nghiệp vụ thường gặp sẽ được tổng hợp tại đây, kèm căn cứ pháp lý. Nội dung nằm trong data/hoidap.json."
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <label className="nhan-truong" htmlFor="hd-tu-khoa">
                  Tìm trong hỏi đáp
                </label>
                <input
                  id="hd-tu-khoa"
                  type="search"
                  className="o-nhap"
                  value={tuKhoa}
                  onChange={(e) => datTuKhoa(e.target.value)}
                  placeholder="Ví dụ: trình tự ban hành nghị quyết"
                />
              </div>
              <div>
                <label className="nhan-truong" htmlFor="hd-chu-de">
                  Chủ đề
                </label>
                <select
                  id="hd-chu-de"
                  className="o-nhap"
                  value={chuDe ?? ''}
                  onChange={(e) => datChuDe(e.target.value || null)}
                >
                  <option value="">Tất cả chủ đề</option>
                  {cacChuDe.map((cd) => (
                    <option key={cd} value={cd}>
                      {cd}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {ketQua.length === 0 ? (
              <p className="khung px-4 py-3 text-[#4A536B]">
                Không tìm thấy nội dung phù hợp. Thử từ khóa ngắn hơn.
              </p>
            ) : (
              <ul className="space-y-3">
                {ketQua.map((h) => (
                  <li key={h.id} className="khung p-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-lg">{h.cauHoi}</h3>
                      <Nhan>{h.chuDe}</Nhan>
                    </div>
                    <p className="trichdan mt-2 max-w-[85ch] whitespace-pre-line">{h.traLoi}</p>
                    {h.canCuPhapLy.length > 0 && (
                      <p className="mt-2 text-[0.9375rem] text-[#4A536B]">
                        Căn cứ: {h.canCuPhapLy.join(' · ')}
                      </p>
                    )}
                    <p className="mt-1 text-[0.875rem] text-[#4A536B]">
                      Cập nhật <span className="so">{hienThiNgay(h.ngayCapNhat)}</span>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="tieu-de-van-ban-mau" className="space-y-4">
        <div>
          <h2 id="tieu-de-van-ban-mau" className="text-xl">
            Thư viện văn bản mẫu
          </h2>
          <p className="text-[0.9375rem] text-[#4A536B]">
            Biểu mẫu trình bày theo Nghị định 30/2020/NĐ-CP.
          </p>
        </div>

        {du.vanBanMau.length === 0 ? (
          <ManHinhTrong
            tieuDe="Chưa có văn bản mẫu"
            moTa="Các mẫu nghị quyết, tờ trình, báo cáo thẩm tra sẽ đăng tại đây. Danh mục nằm trong data/vanbanmau.json."
          />
        ) : (
          <ul className="space-y-2">
            {du.vanBanMau.map((vb) => (
              <li key={vb.id} className="khung flex flex-wrap items-baseline justify-between gap-3 px-4 py-3">
                <div>
                  <h3 className="text-lg">{vb.ten}</h3>
                  <p className="text-[0.9375rem] text-[#4A536B]">{vb.moTa}</p>
                </div>
                <a
                  className="nut-phu"
                  href={duongDanTep(vb.duongDan)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Tải mẫu
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
