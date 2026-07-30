import { useState } from 'react';
import { useDuLieu } from '../dulieu/khoDuLieu';
import { usePhien } from '../dulieu/usePhien';
import {
  cheToken,
  layNguoiDung,
  layToken,
  luuNguoiDung,
  luuToken,
  xoaToken,
} from '../dulieu/phienLamViec';
import { kiemTraQuyenGhi, LoiGhiGitHub, type ThongTinKho } from '../dulieu/ghiGitHub';
import ThongBao from '../thanhphan/ThongBao';

export default function QuanTri() {
  const du = useDuLieu();
  const { coQuyenGhi } = usePhien();
  const [oNhap, datONhap] = useState('');
  const [ten, datTen] = useState(layNguoiDung());
  const [dangKiemTra, datDangKiemTra] = useState(false);
  const [ketQua, datKetQua] = useState<{ tot: boolean; moTa: string } | null>(null);

  const kho: ThongTinKho = {
    chuKho: du.cauHinh.chuKho,
    tenKho: du.cauHinh.tenKho,
    nhanh: du.cauHinh.nhanh,
  };

  function luu() {
    if (!oNhap.trim()) return;
    luuToken(oNhap);
    datONhap('');
    datKetQua(null);
  }

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

  const tokenHienTai = layToken();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl">Quản trị</h2>
        <p className="max-w-[80ch] text-[0.9375rem] text-[#4A536B]">
          Trang chạy trên GitHub Pages nên không có máy chủ riêng. Mọi thao tác ghi dữ liệu đều do
          chính trình duyệt của bạn gửi thẳng lên kho GitHub, xác thực bằng mã truy cập cá nhân bạn
          dán vào đây.
        </p>
      </div>

      <section aria-labelledby="td-ma-truy-cap" className="khung space-y-4 p-4">
        <h3 id="td-ma-truy-cap" className="text-lg">
          Mã truy cập GitHub
        </h3>

        {coQuyenGhi ? (
          <ThongBao loai="thanh_cong" tieuDe="Đã có mã truy cập trong phiên làm việc này">
            <p>
              Mã đang dùng: <span className="so">{cheToken(tokenHienTai ?? '')}</span>. Mã chỉ nằm
              trong bộ nhớ tạm của tab này và mất khi bạn đóng tab.
            </p>
          </ThongBao>
        ) : (
          <ThongBao loai="luu_y" tieuDe="Chưa có mã truy cập">
            Bạn vẫn xem được toàn bộ dữ liệu công khai. Muốn nhập nghị quyết, rút thăm hay chấm
            điểm thì cần dán mã truy cập.
          </ThongBao>
        )}

        <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
          <div>
            <label className="nhan-truong" htmlFor="o-pat">
              Dán mã truy cập (fine-grained personal access token)
            </label>
            <input
              id="o-pat"
              type="password"
              autoComplete="off"
              spellCheck={false}
              className="o-nhap so"
              value={oNhap}
              onChange={(e) => datONhap(e.target.value)}
              placeholder="github_pat_…"
            />
          </div>
          <div className="flex items-end gap-2">
            <button type="button" className="nut-chinh" onClick={luu} disabled={!oNhap.trim()}>
              Lưu vào phiên
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="nut-phu"
            onClick={kiemTra}
            disabled={!coQuyenGhi || dangKiemTra}
          >
            {dangKiemTra ? 'Đang kiểm tra…' : 'Kiểm tra quyền ghi'}
          </button>
          <button
            type="button"
            className="nut-canhbao"
            onClick={() => {
              xoaToken();
              datKetQua(null);
            }}
            disabled={!coQuyenGhi}
          >
            Xóa mã khỏi trình duyệt
          </button>
        </div>

        {ketQua && (
          <ThongBao
            loai={ketQua.tot ? 'thanh_cong' : 'loi'}
            tieuDe={ketQua.tot ? 'Mã truy cập dùng được' : 'Mã truy cập chưa dùng được'}
          >
            {ketQua.moTa}
          </ThongBao>
        )}

        <details className="border border-vien bg-nen px-3 py-2">
          <summary className="cursor-pointer font-medium">Cách tạo mã truy cập</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[0.9375rem]">
            <li>
              Vào GitHub · Settings · Developer settings · Personal access tokens · Fine-grained
              tokens · Generate new token.
            </li>
            <li>
              Mục <em>Repository access</em> chọn <em>Only select repositories</em> và chọn kho{' '}
              <span className="so">
                {kho.chuKho}/{kho.tenKho}
              </span>
              .
            </li>
            <li>
              Mục <em>Permissions · Repository permissions</em> đặt <em>Contents</em> thành{' '}
              <em>Read and write</em>. Không cấp thêm quyền nào khác.
            </li>
            <li>Đặt hạn dùng ngắn, ví dụ 30 ngày, rồi tạo và sao chép mã.</li>
            <li>Quay lại trang này, dán vào ô ở trên và bấm “Lưu vào phiên”.</li>
          </ol>
        </details>
      </section>

      <section aria-labelledby="td-nguoi-dung" className="khung space-y-3 p-4">
        <h3 id="td-nguoi-dung" className="text-lg">
          Tên người thao tác
        </h3>
        <p className="text-[0.9375rem] text-[#4A536B]">
          Tên này được ghi vào phiếu thẩm định để biết ai chấm điểm. Đây không phải thông tin bí
          mật và sẽ xuất hiện công khai trong dữ liệu kết quả.
        </p>
        <div className="grid gap-3 sm:grid-cols-[2fr_auto]">
          <div>
            <label className="nhan-truong" htmlFor="o-ten">
              Họ và tên
            </label>
            <input
              id="o-ten"
              className="o-nhap"
              value={ten}
              onChange={(e) => datTen(e.target.value)}
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div className="flex items-end">
            <button type="button" className="nut-phu" onClick={() => luuNguoiDung(ten)}>
              Lưu tên
            </button>
          </div>
        </div>
      </section>

      <section aria-labelledby="td-canh-bao" className="border border-canhbao bg-[#FDF0F2] p-4">
        <h3 id="td-canh-bao" className="mb-2 text-lg text-canhbao">
          Những điều phải nhớ trước khi ghi dữ liệu
        </h3>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Kho <span className="so">{kho.chuKho}/{kho.tenKho}</span> đang public. Mọi thứ commit
            lên đều công khai vĩnh viễn và vẫn tra được trong lịch sử kể cả sau khi xóa.
          </li>
          <li>
            Không đưa lên thông tin cá nhân của công dân, nội dung đơn thư, hay bất cứ thứ gì thuộc
            phạm vi bí mật nhà nước. Nghị quyết là văn bản phải công khai nên đưa lên được.
          </li>
          <li>
            Không commit mã truy cập, mật khẩu, khóa API — kể cả trong tệp ví dụ. Mã truy cập chỉ
            nằm trong bộ nhớ tạm của trình duyệt.
          </li>
          <li>
            <strong>Trang tĩnh không có phân quyền thật.</strong> Việc ẩn kết quả chưa chốt khỏi
            người chưa dán mã chỉ là quy ước hiển thị, không phải kiểm soát truy cập: ai cũng đọc
            được thẳng tệp JSON trong kho. Nội dung thực sự cần riêng tư phải chuyển sang kho
            private — nhưng GitHub Pages cho kho private đòi hỏi gói trả phí.
          </li>
        </ul>
      </section>

      <section aria-labelledby="td-cau-hinh" className="khung p-4">
        <h3 id="td-cau-hinh" className="mb-3 text-lg">
          Cấu hình hiện tại
        </h3>
        <p className="mb-3 text-[0.9375rem] text-[#4A536B]">
          Sửa trong <code>data/cauhinh.json</code>. Mã muối phải được công bố trước khi rút thăm và
          không được đổi giữa chừng.
        </p>
        <table className="bang">
          <tbody>
            <tr>
              <th scope="row" className="text-left">
                Kho
              </th>
              <td className="so">
                {kho.chuKho}/{kho.tenKho}
              </td>
            </tr>
            <tr>
              <th scope="row" className="text-left">
                Nhánh
              </th>
              <td className="so">{kho.nhanh}</td>
            </tr>
            <tr>
              <th scope="row" className="text-left">
                Năm làm việc
              </th>
              <td className="so">{du.cauHinh.namLamViec}</td>
            </tr>
            <tr>
              <th scope="row" className="text-left">
                Mã muối rút thăm
              </th>
              <td className="so">{du.cauHinh.maMuoi}</td>
            </tr>
            <tr>
              <th scope="row" className="text-left">
                Số nghị quyết rút mỗi tuần
              </th>
              <td className="so">{du.cauHinh.soNghiQuyetRutMoiTuan}</td>
            </tr>
            <tr>
              <th scope="row" className="text-left">
                Nguồn dữ liệu
              </th>
              <td>
                {du.dangDungDuLieuMau
                  ? 'Đang dùng dữ liệu giả lập trong data/mau/'
                  : 'Đang dùng dữ liệu thật trong data/'}
              </td>
            </tr>
            <tr>
              <th scope="row" className="text-left">
                Số ngày nghỉ lễ đã khai
              </th>
              <td className="so">{du.ngayLe.length}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}
