import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TEP = resolve(GOC, 'data/nguoidung.json');
const SO_VONG_LAP = 210000;
const VAI_TRO = ['quan_tri', 'thuong_truc', 'ban', 'van_phong', 'dai_bieu', 'don_vi'];

function bam(matKhau, muoiHex) {
  return pbkdf2Sync(
    Buffer.from(matKhau.normalize('NFC'), 'utf8'),
    Buffer.from(muoiHex, 'hex'),
    SO_VONG_LAP,
    32,
    'sha256',
  ).toString('hex');
}

function canhBaoMatKhauYeu(matKhau) {
  if (matKhau.length < 10) {
    console.warn(
      'CẢNH BÁO: mật khẩu ngắn hơn 10 ký tự. Kho đang public nên chuỗi băm ai cũng tải được; mật khẩu yếu dò ra rất nhanh.',
    );
  }
}

function doc() {
  if (!existsSync(TEP)) {
    return {
      phienBan: new Date().toISOString().slice(0, 7),
      thamSoBam: { thuatToan: 'PBKDF2-SHA256', soVongLap: SO_VONG_LAP },
      taiKhoan: [],
    };
  }
  return JSON.parse(readFileSync(TEP, 'utf8'));
}

function ghi(kho) {
  writeFileSync(TEP, `${JSON.stringify(kho, null, 2)}\n`, 'utf8');
}

function huongDan() {
  console.log(`Quản lý tài khoản của Giám sát số Thanh Hóa

  node scripts/tai-khoan.mjs cap <tên đăng nhập> <mật khẩu> <vai trò> "<họ tên>" [mã đơn vị]
  node scripts/tai-khoan.mjs doi-mat-khau <tên đăng nhập> <mật khẩu mới>
  node scripts/tai-khoan.mjs dat-lai-tat-ca <mật khẩu mới>
  node scripts/tai-khoan.mjs khoa <tên đăng nhập>
  node scripts/tai-khoan.mjs mo-khoa <tên đăng nhập>
  node scripts/tai-khoan.mjs danh-sach

Vai trò: ${VAI_TRO.join(' | ')}

Tệp data/nguoidung.json nằm trong kho public: chỉ lưu chuỗi băm PBKDF2, không lưu
mật khẩu gốc. Vẫn phải đặt mật khẩu dài, không dùng lại mật khẩu của hệ thống khác.`);
}

const [lenh, ...doiSo] = process.argv.slice(2);
const kho = doc();
const tim = (ten) =>
  kho.taiKhoan.find((t) => t.tenDangNhap.toLowerCase() === String(ten).toLowerCase());

switch (lenh) {
  case 'cap': {
    const [ten, matKhau, vaiTro, hoTen, maDonVi] = doiSo;
    if (!ten || !matKhau || !vaiTro || !hoTen) {
      huongDan();
      process.exit(1);
    }
    if (!VAI_TRO.includes(vaiTro)) {
      console.error(`Vai trò "${vaiTro}" không hợp lệ. Chọn một trong: ${VAI_TRO.join(', ')}`);
      process.exit(1);
    }
    canhBaoMatKhauYeu(matKhau);
    if (tim(ten)) {
      console.error(`Tài khoản "${ten}" đã tồn tại. Dùng lệnh doi-mat-khau nếu muốn đặt lại.`);
      process.exit(1);
    }
    const muoi = randomBytes(16).toString('hex');
    kho.taiKhoan.push({
      tenDangNhap: ten.toLowerCase(),
      hoTen,
      vaiTro,
      maDonVi: maDonVi ?? null,
      muoi,
      bam: bam(matKhau, muoi),
      hoatDong: true,
      ngayCap: new Date().toISOString().slice(0, 10),
    });
    ghi(kho);
    console.log(`Đã cấp tài khoản "${ten}" với vai trò ${vaiTro}.`);
    break;
  }
  case 'doi-mat-khau': {
    const [ten, matKhau] = doiSo;
    const tk = tim(ten);
    if (!tk) {
      console.error(`Không tìm thấy tài khoản "${ten}".`);
      process.exit(1);
    }
    if (!matKhau) {
      console.error('Thiếu mật khẩu mới.');
      process.exit(1);
    }
    canhBaoMatKhauYeu(matKhau);
    tk.muoi = randomBytes(16).toString('hex');
    tk.bam = bam(matKhau, tk.muoi);
    ghi(kho);
    console.log(`Đã đổi mật khẩu tài khoản "${ten}".`);
    break;
  }
  case 'dat-lai-tat-ca': {
    const [matKhau] = doiSo;
    if (!matKhau) {
      console.error('Thiếu mật khẩu mới.');
      process.exit(1);
    }
    if (kho.taiKhoan.length === 0) {
      console.error('Chưa có tài khoản nào để đặt lại.');
      process.exit(1);
    }
    canhBaoMatKhauYeu(matKhau);
    for (const tk of kho.taiKhoan) {
      tk.muoi = randomBytes(16).toString('hex');
      tk.bam = bam(matKhau, tk.muoi);
    }
    ghi(kho);
    console.log(`Đã đặt lại mật khẩu cho ${kho.taiKhoan.length} tài khoản.`);
    break;
  }
  case 'khoa':
  case 'mo-khoa': {
    const [ten] = doiSo;
    const tk = tim(ten);
    if (!tk) {
      console.error(`Không tìm thấy tài khoản "${ten}".`);
      process.exit(1);
    }
    tk.hoatDong = lenh === 'mo-khoa';
    ghi(kho);
    console.log(`Đã ${tk.hoatDong ? 'mở khóa' : 'khóa'} tài khoản "${ten}".`);
    break;
  }
  case 'danh-sach': {
    if (kho.taiKhoan.length === 0) {
      console.log('Chưa có tài khoản nào.');
      break;
    }
    for (const t of kho.taiKhoan) {
      console.log(
        `${t.tenDangNhap.padEnd(16)} ${t.vaiTro.padEnd(13)} ${t.hoatDong ? 'hoạt động' : 'đã khóa '} ${t.hoTen}`,
      );
    }
    break;
  }
  default:
    huongDan();
}
