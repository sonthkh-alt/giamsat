import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { ReactNode } from 'react';
import { CungCapKho } from './dulieu/khoDuLieu';
import BoCuc from './thanhphan/BoCuc';
import ChoDuLieu from './thanhphan/ChoDuLieu';
import TongQuan from './trang/TongQuan';
import KhungNghiepVu from './trang/KhungNghiepVu';
import NghiQuyet from './trang/NghiQuyet';
import DanhMucRaSoat from './trang/DanhMucRaSoat';
import ThamDinh from './trang/ThamDinh';
import TheoDoiSauGiamSat from './trang/TheoDoiSauGiamSat';
import HoiDap from './trang/HoiDap';
import QuanTri from './trang/QuanTri';

const cho = (noiDung: ReactNode) => <ChoDuLieu>{noiDung}</ChoDuLieu>;

// HashRouter vì GitHub Pages không viết lại được đường dẫn cho ứng dụng một trang.
export default function App() {
  return (
    <CungCapKho>
      <HashRouter>
        <Routes>
          <Route element={<BoCuc />}>
            <Route index element={cho(<TongQuan />)} />
            <Route path="khung-nghiep-vu" element={cho(<KhungNghiepVu />)} />
            <Route path="nghi-quyet" element={cho(<NghiQuyet />)} />
            <Route path="danh-muc-ra-soat" element={cho(<DanhMucRaSoat />)} />
            <Route path="tham-dinh" element={cho(<ThamDinh />)} />
            <Route path="theo-doi-sau-giam-sat" element={cho(<TheoDoiSauGiamSat />)} />
            <Route path="hoi-dap" element={cho(<HoiDap />)} />
            <Route path="quan-tri" element={cho(<QuanTri />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </CungCapKho>
  );
}
