import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CungCapKho } from './dulieu/khoDuLieu';
import BoCuc from './thanhphan/BoCuc';
import ChoDuLieu from './thanhphan/ChoDuLieu';
import TongQuan from './trang/TongQuan';
import NghiQuyet from './trang/NghiQuyet';
import RutTham from './trang/RutTham';
import ThamDinh from './trang/ThamDinh';
import KienNghi from './trang/KienNghi';
import HoiDap from './trang/HoiDap';
import QuanTri from './trang/QuanTri';

// HashRouter vì GitHub Pages không viết lại được đường dẫn cho ứng dụng một trang.
export default function App() {
  return (
    <CungCapKho>
      <HashRouter>
        <Routes>
          <Route element={<BoCuc />}>
            <Route
              index
              element={
                <ChoDuLieu>
                  <TongQuan />
                </ChoDuLieu>
              }
            />
            <Route
              path="nghi-quyet"
              element={
                <ChoDuLieu>
                  <NghiQuyet />
                </ChoDuLieu>
              }
            />
            <Route
              path="rut-tham"
              element={
                <ChoDuLieu>
                  <RutTham />
                </ChoDuLieu>
              }
            />
            <Route
              path="tham-dinh"
              element={
                <ChoDuLieu>
                  <ThamDinh />
                </ChoDuLieu>
              }
            />
            <Route
              path="kien-nghi"
              element={
                <ChoDuLieu>
                  <KienNghi />
                </ChoDuLieu>
              }
            />
            <Route
              path="hoi-dap"
              element={
                <ChoDuLieu>
                  <HoiDap />
                </ChoDuLieu>
              }
            />
            <Route
              path="quan-tri"
              element={
                <ChoDuLieu>
                  <QuanTri />
                </ChoDuLieu>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </CungCapKho>
  );
}
