-- 1. TẠO CƠ SỞ DỮ LIỆU
CREATE DATABASE IF NOT EXISTS hrm_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Sử dụng CSDL vừa tạo
USE hrm_db;

-- 2. TẠO CÁC BẢNG CỐT LÕI

-- Bảng 2.1: Vai trò
CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(100) NOT NULL UNIQUE COMMENT 'Tên vai trò (Admin, Quản lý, Nhân viên)',
  description TEXT COMMENT 'Mô tả chi tiết quyền hạn'
) COMMENT 'Bảng 2.1: Quản lý Vai trò';

-- Bảng 2.2: Người dùng
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID định danh, tự động tăng',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Tên đăng nhập',
  password VARCHAR(255) NOT NULL COMMENT 'Mật khẩu đã được mã hóa (hash)',
  full_name VARCHAR(100) COMMENT 'Tên đầy đủ của người dùng',
  role_id INT COMMENT 'ID vai trò (liên kết với bảng roles)',
  
  FOREIGN KEY (role_id) REFERENCES roles(id)
) COMMENT 'Bảng 2.2: Lưu trữ tài khoản đăng nhập';

-- Bảng 2.3: Nhân sự
CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID định danh của nhân viên',
  employee_code VARCHAR(20) NOT NULL UNIQUE COMMENT 'Mã nhân viên (ví dụ: NV001)',
  full_name VARCHAR(100) NOT NULL COMMENT 'Họ và tên đầy đủ',
  position VARCHAR(100) COMMENT 'Chức vụ',
  department VARCHAR(100) COMMENT 'Phòng ban',
  email VARCHAR(100) COMMENT 'Email',
  phone VARCHAR(15) COMMENT 'Số điện thoại'
) COMMENT 'Bảng 2.3: Thông tin nhân sự cơ bản';

-- Bảng 2.4: Hợp đồng
CREATE TABLE contracts (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID định danh của hợp đồng',
  contract_code VARCHAR(20) NOT NULL COMMENT 'Mã hợp đồng (ví dụ: HD001)',
  employee_id INT COMMENT 'ID của nhân viên (liên kết bảng employees)',
  contract_type VARCHAR(100) COMMENT 'Loại hợp đồng (Thử việc, Chính thức)',
  start_date DATE COMMENT 'Ngày bắt đầu',
  end_date DATE COMMENT 'Ngày kết thúc',
  status VARCHAR(50) COMMENT 'Trạng thái (Đang hiệu lực, Hết hạn)',
  
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) COMMENT 'Bảng 2.4: Quản lý hợp đồng lao động';

-- Bảng 2.5: Đào tạo (✅ ĐÃ SỬA LỖI THIẾU DẤU PHẨY)
CREATE TABLE training (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID định danh của khóa đào tạo',
  employee_id INT COMMENT 'ID của nhân viên (liên kết bảng employees)',
  course_name VARCHAR(255) COMMENT 'Tên khóa học',
  trainer_name VARCHAR(100) COMMENT 'Tên người đào tạo',
  start_date DATE COMMENT 'Ngày bắt đầu',
  end_date DATE COMMENT 'Ngày kết thúc',
  score INT COMMENT 'Điểm số đánh giá (Thang 100)', -- <== ĐÂY LÀ DẤU PHẨY ĐÃ SỬA
  
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) COMMENT 'Bảng 2.5: Quản lý các khóa đào tạo';

-- Bảng 2.6: Chấm công (Đã sửa từ lần trước)
CREATE TABLE attendance (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID định danh của lần chấm công',
  employee_id INT COMMENT 'ID của nhân viên (liên kết bảng employees)',
  date DATE COMMENT 'Ngày chấm công',
  status VARCHAR(50) COMMENT 'Trạng thái (Đi làm, Nghỉ phép, Vắng)',
  notes TEXT COMMENT 'Ghi chú thêm',
  
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) COMMENT 'Bảng 2.6: Theo dõi chấm công hàng ngày';


-- 3. TẠO CÁC BẢNG MỞ RỘNG

-- Bảng 3.1: Lương
CREATE TABLE salaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL COMMENT 'ID nhân viên (liên kết bảng employees)',
  month INT NOT NULL COMMENT 'Lương của tháng',
  year INT NOT NULL COMMENT 'Lương của năm',
  base_salary DECIMAL(12, 2) DEFAULT 0.00 COMMENT 'Lương cơ bản',
  allowance DECIMAL(12, 2) DEFAULT 0.00 COMMENT 'Phụ cấp',
  bonus DECIMAL(12, 2) DEFAULT 0.00 COMMENT 'Thưởng',
  deductions DECIMAL(12, 2) DEFAULT 0.00 COMMENT 'Khấu trừ (BHXH, thuế...)',
  net_salary DECIMAL(12, 2) DEFAULT 0.00 COMMENT 'Lương thực nhận',
  
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) COMMENT 'Bảng 3.1: Chi tiết lương hàng tháng';

-- Bảng 3.2: Lịch công tác
CREATE TABLE schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL COMMENT 'ID nhân viên (liên kết bảng employees)',
  title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề/Nội dung chính',
  location VARCHAR(255) COMMENT 'Địa điểm công tác',
  start_datetime DATETIME COMMENT 'Thời gian bắt đầu',
  end_datetime DATETIME COMMENT 'Thời gian kết thúc',
  
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) COMMENT 'Bảng 3.2: Quản lý Lịch công tác';

-- Bảng 3.3: Tài sản
CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_name VARCHAR(150) NOT NULL COMMENT 'Tên tài sản (Laptop Dell...)',
  asset_code VARCHAR(50) UNIQUE COMMENT 'Mã tài sản (HRM-LP-001)',
  date_assigned DATE COMMENT 'Ngày bàn giao',
  status VARCHAR(50) COMMENT 'Tình trạng (Trong kho, Đang sử dụng)',
  employee_id INT COMMENT 'ID nhân viên đang giữ (NULL nếu trong kho)',
  
  FOREIGN KEY (employee_id) REFERENCES employees(id)
) COMMENT 'Bảng 3.3: Quản lý Tài sản công ty';

-- Bảng 3.4: Ứng viên
CREATE TABLE candidates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL COMMENT 'Họ tên ứng viên',
  email VARCHAR(100) COMMENT 'Email',
  phone VARCHAR(15) COMMENT 'Số điện thoại',
  position_applied VARCHAR(150) COMMENT 'Vị trí ứng tuyển',
  cv_path VARCHAR(255) COMMENT 'Đường dẫn file CV',
  status VARCHAR(50) DEFAULT 'Mới' COMMENT 'Trạng thái (Mới, Hẹn phỏng vấn, Trúng tuyển)',
  interview_date DATETIME COMMENT 'Ngày hẹn phỏng vấn'
) COMMENT 'Bảng 3.4: Quản lý Ứng viên';

-- Bảng 3.5: Thông báo
CREATE TABLE announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL COMMENT 'Tiêu đề thông báo',
  content TEXT NOT NULL COMMENT 'Nội dung chi tiết',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Ngày giờ đăng (tự động)',
  user_id INT COMMENT 'ID người đăng (liên kết bảng users)',
  
  FOREIGN KEY (user_id) REFERENCES users(id)
) COMMENT 'Bảng 3.5: Thông báo nội bộ';


-- 4. THÊM DỮ LIỆU MẪU

INSERT INTO roles (role_name, description) VALUES
('Admin', 'Quản trị viên tối cao'),
('Manager', 'Cấp quản lý'),
('Employee', 'Nhân viên');

INSERT INTO users (username, password, full_name, role_id)
VALUES ('admin', '$2y$10$K.g/fVSPubv.E.iJIZ./Oum2f00kG9l8xY.e3qg.i6qJk/T0j6U.6', 'Quản trị viên', 1);

INSERT INTO employees (employee_code, full_name, position, department, email, phone)
VALUES 
('NV001', 'Nguyễn Văn A', 'Trưởng phòng', 'Kỹ thuật', 'vana@hrm.com', '0901234567'),
('NV002', 'Trần Thị B', 'Nhân viên', 'Kế toán', 'thib@hrm.com', '0907654321');

INSERT INTO contracts (contract_code, employee_id, contract_type, start_date, end_date, status)
VALUES 
('HD001', 1, 'HĐ chính thức', '2025-01-01', '2026-01-01', 'Đang hiệu lực'),
('HD002', 2, 'HĐ thử việc', '2025-03-01', '2025-05-01', 'Đang hiệu lực');

INSERT INTO attendance (employee_id, date, status, notes)
VALUES 
(1, '2025-10-18', 'Đi làm', 'Vào làm lúc 8:00 AM'),
(2, '2025-10-18', 'Nghỉ phép', 'Xin nghỉ phép 1 ngày');

INSERT INTO assets (asset_name, asset_code, date_assigned, status, employee_id) VALUES
('Laptop Dell Vostro 5490', 'HRM-LP-001', '2025-01-01', 'Đang sử dụng', 1);

INSERT INTO announcements (title, content, user_id) VALUES
('Thông báo nghỉ lễ Giáng Sinh', 'Toàn thể công ty được nghỉ 1 ngày lễ 25/12...', 1);

INSERT INTO candidates (full_name, email, phone, position_applied, status) VALUES
('Lê Văn C', 'levanc@gmail.com', '0987654321', 'Nhân viên Kỹ thuật', 'Mới');