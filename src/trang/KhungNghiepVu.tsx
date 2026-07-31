import { useMemo, useState } from 'react';
import type { CapHanhChinh, ChuTheGiamSat, MucTrienKhai, PhamViCapXa } from '../kieu';
import { useDuLieu } from '../dulieu/khoDuLieu';
import ManHinhTrong from '../thanhphan/ManHinhTrong';
import ThongBao from '../thanhphan/ThongBao';
import { Nhan } from '../thanhphan/Nhan';

const NHAN_TRIEN_KHAI: Record<MucTrienKhai, string> = {
  giai_doan_1: 'Giai đoạn 1',
  giai_doan_2: 'Giai đoạn 2',
  giai_doan_3: 'Giai đoạn 3',
  khong_tren_kho_public: 'Không triển khai trên kho public',
};

const SAC_TRIEN_KHAI: Record<MucTrienKhai, 'trung_tinh' | 'dat' | 'luuy' | 'canhbao'> = {
  giai_doan_1: 'dat',
  giai_doan_2: 'trung_tinh',
  giai_doan_3: 'trung_tinh',
  khong_tren_kho_public: 'canhbao',
};

const NHAN_PHAM_VI_XA: Record<PhamViCapXa, string> = {
  day_du: 'Cấp xã áp dụng đầy đủ',
  theo_quy_dinh: 'Cấp xã áp dụng theo quy định',
  khi_duoc_giao: 'Cấp xã thực hiện khi được giao nhiệm vụ',
};

const NHAN_KIEU_DAU_MUC: Record<string, string> = {
  chuoi: 'Văn bản',
  ngay: 'Ngày',
  so: 'Số',
  tep: 'Tệp đính kèm',
  danh_sach: 'Danh sách',
};

export default function KhungNghiepVu() {
  const du = useDuLieu();
  const [locChuThe, datLocChuThe] = useState<ChuTheGiamSat | ''>('');
  const [locCap, datLocCap] = useState<CapHanhChinh | ''>('');

  const tenChuThe = useMemo(
    () => new Map(du.khung.chuThe.map((c) => [c.ma, c.ten])),
    [du.khung.chuThe],
  );

  const nhom = useMemo(
    () =>
      du.khung.nhom.filter((n) => {
        if (locChuThe && !n.chuTheApDung.includes(locChuThe)) return false;
        if (locCap && !n.capApDung.includes(locCap)) return false;
        return true;
      }),
    [du.khung.nhom, locChuThe, locCap],
  );

  if (du.khung.nhom.length === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl">Khung nghiệp vụ giám sát</h2>
        <ManHinhTrong
          tieuDe="Chưa nạp được khung nghiệp vụ"
          moTa="Khung 12 nhóm nghiệp vụ nằm trong data/khung-nghiep-vu.json. Kiểm tra tệp này có tồn tại và đúng định dạng JSON."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Khung nghiệp vụ giám sát</h2>
        <p className="max-w-[85ch] text-[0.9375rem] text-[#4A536B]">
          Mười hai nhóm nghiệp vụ là xương sống dữ liệu của hệ thống. Mọi hồ sơ đều thuộc đúng một
          nhóm và được gắn đồng thời ba thuộc tính: nhóm nghiệp vụ, chủ thể giám sát, cấp hành
          chính. Nhờ đó cùng một kho dữ liệu kết xuất được báo cáo theo bất kỳ chiều nào mà không
          phải nhập lại.
        </p>
      </div>

      <ThongBao loai="luu_y" tieuDe="Đây là cấu hình, không phải mã nguồn">
        Toàn bộ khung dưới đây đọc từ <code>data/khung-nghiep-vu.json</code> (phiên bản{' '}
        <span className="so">{du.khung.phienBan}</span>). Khi quy định pháp luật thay đổi, người
        quản trị sửa tệp cấu hình — không sửa mã nguồn.
      </ThongBao>

      <div className="khung flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="nhan-truong" htmlFor="loc-chu-the">
            Chủ thể giám sát
          </label>
          <select
            id="loc-chu-the"
            className="o-nhap"
            value={locChuThe}
            onChange={(e) => datLocChuThe(e.target.value as ChuTheGiamSat | '')}
          >
            <option value="">Tất cả chủ thể</option>
            {du.khung.chuThe.map((c) => (
              <option key={c.ma} value={c.ma}>
                {c.ten}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="nhan-truong" htmlFor="loc-cap">
            Cấp hành chính
          </label>
          <select
            id="loc-cap"
            className="o-nhap"
            value={locCap}
            onChange={(e) => datLocCap(e.target.value as CapHanhChinh | '')}
          >
            <option value="">Cả hai cấp</option>
            {du.khung.cap.map((c) => (
              <option key={c.ma} value={c.ma}>
                {c.ten}
              </option>
            ))}
          </select>
        </div>
        <p className="text-[0.9375rem] text-[#4A536B]">
          Đang hiển thị <span className="so">{nhom.length}</span>/{du.khung.nhom.length} nhóm
        </p>
      </div>

      <ul className="space-y-3">
        {nhom.map((n) => (
          <li key={n.ma} className="khung p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
              <h3 className="text-lg">
                <span className="so text-[#4A536B]">{n.ma}</span> {n.ten}
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Nhan sac={SAC_TRIEN_KHAI[n.trienKhai]}>{NHAN_TRIEN_KHAI[n.trienKhai]}</Nhan>
                <Nhan>{NHAN_PHAM_VI_XA[n.apDungCapXa]}</Nhan>
              </div>
            </div>

            <p className="mt-1 text-[0.9375rem] text-[#4A536B]">Căn cứ: {n.canCu}</p>

            <p className="mt-1 text-[0.9375rem]">
              Chủ thể: {n.chuTheApDung.map((c) => tenChuThe.get(c) ?? c).join(' · ')}
            </p>

            {n.canhBaoDuLieu && (
              <div className="mt-2">
                <ThongBao loai="loi" tieuDe="Ràng buộc dữ liệu">
                  {n.canhBaoDuLieu}
                </ThongBao>
              </div>
            )}

            {n.dauMuc.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[0.9375rem] font-medium">
                  Bộ đầu mục dữ liệu ({n.dauMuc.length} trường)
                </summary>
                <table className="bang mt-2">
                  <thead>
                    <tr>
                      <th scope="col">Đầu mục</th>
                      <th scope="col">Kiểu</th>
                      <th scope="col">Bắt buộc</th>
                    </tr>
                  </thead>
                  <tbody>
                    {n.dauMuc.map((dm) => (
                      <tr key={dm.ma}>
                        <td>{dm.ten}</td>
                        <td>{NHAN_KIEU_DAU_MUC[dm.kieu] ?? dm.kieu}</td>
                        <td>{dm.batBuoc ? 'Có' : 'Không'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </details>
            )}
          </li>
        ))}
      </ul>

      <section aria-labelledby="cach-thuc" className="khung p-4">
        <h3 id="cach-thuc" className="mb-2 text-lg">
          Năm cách thức lập danh mục rà soát
        </h3>
        <ol className="space-y-2">
          {[...du.khung.cachThucLapDanhMuc]
            .sort((a, b) => a.thuTuUuTien - b.thuTuUuTien)
            .map((ct) => (
              <li key={ct.ma}>
                <p className="font-medium">
                  <span className="so text-[#4A536B]">{ct.thuTuUuTien}.</span> {ct.ten}
                </p>
                <p className="text-[0.9375rem] text-[#4A536B]">{ct.moTa}</p>
              </li>
            ))}
        </ol>
      </section>

      <section aria-labelledby="bay-buoc" className="khung p-4">
        <h3 id="bay-buoc" className="mb-2 text-lg">
          Bảy bước xử lý sau giám sát
        </h3>
        <ol className="list-decimal space-y-1 pl-5">
          {[...du.khung.buocXuLySauGiamSat]
            .sort((a, b) => a.thuTu - b.thuTu)
            .map((b) => (
              <li key={b.ma}>{b.ten}</li>
            ))}
        </ol>
      </section>
    </div>
  );
}
