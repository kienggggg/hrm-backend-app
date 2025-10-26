    // hrm-backend/db.js
    const mysql = require('mysql2/promise');
    
    // --- Đọc thông tin kết nối từ BIẾN MÔI TRƯỜNG ---
    // Railway sẽ tự động cung cấp các biến này khi deploy
    // Khi chạy local, nó sẽ dùng giá trị sau dấu || (thông tin public cũ)
    const dbConfig = {
      host: process.env.MYSQLHOST || 'metro.proxy.rlwy.net', // Ưu tiên biến môi trường
      user: process.env.MYSQLUSER || 'root',
      password: process.env.MYSQLPASSWORD || 'ZslqVkLIfdalIBxVCQotRbYYHRgEtNCy', // <-- VẪN CẦN DÁN LẠI MẬT KHẨU PUBLIC CỦA BẠN VÀO ĐÂY
      database: process.env.MYSQLDATABASE || 'railway',
      port: parseInt(process.env.MYSQLPORT || '35732', 10), // Chuyển PORT thành số
    
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    
      // SSL chỉ cần khi kết nối từ bên ngoài (local).
      // Khi chạy trên Railway (nội bộ), thường không cần SSL.
      // Chúng ta sẽ kiểm tra xem biến HOST có phải là internal không.
      ssl: process.env.MYSQLHOST && process.env.MYSQLHOST.includes('internal')
           ? undefined // Không cần SSL nếu kết nối nội bộ
           : { rejectUnauthorized: false } // Bật SSL nếu kết nối từ bên ngoài
    };
    // --- HẾT PHẦN BIẾN MÔI TRƯỜNG ---
    
    
    // Tạo pool kết nối với cấu hình mới
    const pool = mysql.createPool(dbConfig);
    
    // Kiểm tra kết nối ban đầu
    pool.getConnection()
      .then(connection => {
        // Log ra host đang dùng để biết là kết nối nội bộ hay công khai
        console.log(`✅ Kết nối CSDL thành công tới host: ${dbConfig.host}`);
        connection.release();
      })
      .catch(err => {
        console.error(`❌ LỖI KẾT NỐI CSDL tới host ${dbConfig.host}:`, err.code, err.message);
        console.error("Kiểm tra lại các biến môi trường (MYSQLHOST, MYSQLUSER, MYSQLPASSWORD...)");
      });
    
    
    module.exports = pool;
      

