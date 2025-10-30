// hrm-backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- API NHÂN SỰ (Giữ nguyên) ---
// GET /api/employees (Search)
app.get('/api/employees', async (req, res) => {
  try {
    const { search } = req.query;
    let sql = "SELECT * FROM employees";
    const params = [];
    if (search) {
      sql += " WHERE full_name LIKE ? OR employee_code LIKE ? OR email LIKE ?";
      params.push(`%${search}%`);
      params.push(`%${search}%`);
      params.push(`%${search}%`);
    }
    sql += " ORDER BY id DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error("Lỗi [GET /api/employees]:", err);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
  }
});
// POST /api/employees
app.post('/api/employees', async (req, res) => {
    try {
        const { employee_code, full_name, department, position, email, phone } = req.body;
        if (!employee_code || !full_name) {
        return res.status(400).json({ error: 'Mã nhân viên và Họ tên là bắt buộc.' });
        }
        const sql = `INSERT INTO employees
                    (employee_code, full_name, department, position, email, phone)
                    VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [employee_code, full_name, department, position, email, phone]);
        const newEmployeeId = result.insertId;
        const [newEmployeeRows] = await db.query("SELECT * FROM employees WHERE id = ?", [newEmployeeId]);
        res.status(201).json(newEmployeeRows[0]);
    } catch (err) {
        console.error("Lỗi [POST /api/employees]:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã nhân viên này đã tồn tại.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// PUT /api/employees/:id
app.put('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_code, full_name, department, position, email, phone } = req.body;
        if (!employee_code || !full_name) {
            return res.status(400).json({ error: 'Mã nhân viên và Họ tên là bắt buộc.' });
        }
        const sql = `UPDATE employees
                     SET
                       employee_code = ?, full_name = ?, department = ?,
                       position = ?, email = ?, phone = ?
                     WHERE id = ?`;
        const [result] = await db.query(sql, [employee_code, full_name, department, position, email, phone, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên để cập nhật.' });
        }
        const [updatedEmployee] = await db.query("SELECT * FROM employees WHERE id = ?", [id]);
        res.json(updatedEmployee[0]);
    } catch (err) {
        console.error("Lỗi [PUT /api/employees/:id]:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã nhân viên này đã bị trùng.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// DELETE /api/employees/:id
app.delete('/api/employees/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM employees WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy nhân viên để xóa.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Lỗi [DELETE /api/employees/:id]:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ error: 'Không thể xóa nhân viên này. Họ đang có hợp đồng hoặc tài sản liên quan.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// --- API HỢP ĐỒNG (Giữ nguyên) ---
const getContractsSql = `
    SELECT c.id, c.contract_code, c.contract_type, c.start_date, c.end_date, c.status,
           c.employee_id, e.full_name AS employee_name
    FROM contracts c
    JOIN employees e ON c.employee_id = e.id
`;
// GET /api/contracts (Search)
app.get('/api/contracts', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = getContractsSql;
        const params = [];
        if (search) {
            sql += " WHERE c.contract_code LIKE ? OR e.full_name LIKE ? OR c.contract_type LIKE ?";
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }
        sql += " ORDER BY c.id DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Lỗi [GET /api/contracts]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// POST /api/contracts
app.post('/api/contracts', async (req, res) => {
    try {
        const { employee_id, contract_code, contract_type, start_date, end_date, status } = req.body;
        if (!employee_id || !contract_code || !start_date || !end_date) {
            return res.status(400).json({ error: 'Nhân viên, Mã HĐ, Ngày bắt đầu và kết thúc là bắt buộc.' });
        }
        const sql = `INSERT INTO contracts
                     (employee_id, contract_code, contract_type, start_date, end_date, status)
                   VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [employee_id, contract_code, contract_type, start_date, end_date, status]);
        const [newContract] = await db.query(getContractsSql + " WHERE c.id = ?", [result.insertId]);
        res.status(201).json(newContract[0]);
    } catch (err) {
        console.error("Lỗi [POST /api/contracts]:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã hợp đồng này đã tồn tại.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// PUT /api/contracts/:id
app.put('/api/contracts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, contract_code, contract_type, start_date, end_date, status } = req.body;
        if (!employee_id || !contract_code || !start_date || !end_date) {
            return res.status(400).json({ error: 'Nhân viên, Mã HĐ, Ngày bắt đầu và Ngày kết thúc là bắt buộc.' });
        }
        const sql = `UPDATE contracts
                     SET
                       employee_id = ?, contract_code = ?, contract_type = ?,
                       start_date = ?, end_date = ?, status = ?
                     WHERE id = ?`;
        const [result] = await db.query(sql, [employee_id, contract_code, contract_type, start_date, end_date, status, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hợp đồng để cập nhật.' });
        }
        const [updatedContract] = await db.query(getContractsSql + " WHERE c.id = ?", [id]);
        res.json(updatedContract[0]);
    } catch (err) {
        console.error("Lỗi [PUT /api/contracts/:id]:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã hợp đồng này đã bị trùng.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// DELETE /api/contracts/:id
app.delete('/api/contracts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM contracts WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy hợp đồng để xóa.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Lỗi [DELETE /api/contracts/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// --- API ĐÀO TẠO (Giữ nguyên) ---
const getTrainingSql = `
    SELECT t.id, t.course_name, t.trainer_name, t.start_date, t.end_date, t.score,
           t.employee_id, e.full_name AS employee_name, e.employee_code
    FROM training t
    JOIN employees e ON t.employee_id = e.id
`;
// GET /api/training (Search)
app.get('/api/training', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = getTrainingSql;
        const params = [];
        if (search) {
            sql += " WHERE t.course_name LIKE ? OR e.full_name LIKE ? OR t.trainer_name LIKE ?";
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }
        sql += " ORDER BY t.id DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Lỗi [GET /api/training]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// POST /api/training
app.post('/api/training', async (req, res) => {
    try {
        const { employee_id, course_name, trainer_name, start_date, end_date, score } = req.body;
        if (!employee_id || !course_name || !start_date || !end_date) {
            return res.status(400).json({ error: 'Nhân viên, Tên khóa học, Ngày bắt đầu và kết thúc là bắt buộc.' });
        }
        const scoreValue = score ? parseInt(score, 10) : null;
        if (scoreValue !== null && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100)) {
            return res.status(400).json({ error: 'Điểm đánh giá phải là số từ 0 đến 100.' });
        }
        const sql = `INSERT INTO training
                     (employee_id, course_name, trainer_name, start_date, end_date, score)
                   VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(sql, [employee_id, course_name, trainer_name, start_date, end_date, scoreValue]);
        const [newTraining] = await db.query(getTrainingSql + " WHERE t.id = ?", [result.insertId]);
        res.status(201).json(newTraining[0]);
    } catch (err) {
        console.error("Lỗi [POST /api/training]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// PUT /api/training/:id
app.put('/api/training/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, course_name, trainer_name, start_date, end_date, score } = req.body;
        if (!employee_id || !course_name || !start_date || !end_date) {
            return res.status(400).json({ error: 'Nhân viên, Tên khóa học, Ngày bắt đầu và kết thúc là bắt buộc.' });
        }
        const scoreValue = score ? parseInt(score, 10) : null;
        if (scoreValue !== null && (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100)) {
            return res.status(400).json({ error: 'Điểm đánh giá phải là số từ 0 đến 100.' });
        }
        const sql = `UPDATE training
                     SET
                       employee_id = ?, course_name = ?, trainer_name = ?,
                       start_date = ?, end_date = ?, score = ?
                     WHERE id = ?`;
        const [result] = await db.query(sql, [employee_id, course_name, trainer_name, start_date, end_date, scoreValue, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khóa đào tạo để cập nhật.' });
        }
        const [updatedTraining] = await db.query(getTrainingSql + " WHERE t.id = ?", [id]);
        res.json(updatedTraining[0]);
    } catch (err) {
        console.error("Lỗi [PUT /api/training/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// DELETE /api/training/:id
app.delete('/api/training/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM training WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy khóa đào tạo để xóa.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Lỗi [DELETE /api/training/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// --- API CHẤM CÔNG (Giữ nguyên) ---
const getAttendanceSql = `
    SELECT att.id, att.date, att.status, att.notes,
           att.employee_id, e.full_name AS employee_name, e.employee_code
    FROM attendance att
    JOIN employees e ON att.employee_id = e.id
`;
// GET /api/attendance (Search)
app.get('/api/attendance', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = getAttendanceSql;
        const params = [];
        if (search) {
            sql += " WHERE e.full_name LIKE ? OR e.employee_code LIKE ? OR att.status LIKE ?";
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }
        sql += " ORDER BY att.date DESC, e.full_name ASC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Lỗi [GET /api/attendance]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// POST /api/attendance
app.post('/api/attendance', async (req, res) => {
    try {
        const { employee_id, date, status, notes } = req.body;
        if (!employee_id || !date || !status) {
            return res.status(400).json({ error: 'Nhân viên, Ngày và Trạng thái là bắt buộc.' });
        }
        const sql = `INSERT INTO attendance (employee_id, date, status, notes) VALUES (?, ?, ?, ?)`;
        const [result] = await db.query(sql, [employee_id, date, status, notes || null]);
        const [newAttendance] = await db.query(getAttendanceSql + " WHERE att.id = ?", [result.insertId]);
        res.status(201).json(newAttendance[0]);
    } catch (err) {
        console.error("Lỗi [POST /api/attendance]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// PUT /api/attendance/:id
app.put('/api/attendance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, date, status, notes } = req.body;
        if (!employee_id || !date || !status) {
            return res.status(400).json({ error: 'Nhân viên, Ngày và Trạng thái là bắt buộc.' });
        }
        const sql = `UPDATE attendance SET employee_id = ?, date = ?, status = ?, notes = ? WHERE id = ?`;
        const [result] = await db.query(sql, [employee_id, date, status, notes || null, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bản ghi chấm công để cập nhật.' });
        }
        const [updatedAttendance] = await db.query(getAttendanceSql + " WHERE att.id = ?", [id]);
        res.json(updatedAttendance[0]);
    } catch (err) {
        console.error("Lỗi [PUT /api/attendance/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// DELETE /api/attendance/:id
app.delete('/api/attendance/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM attendance WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy bản ghi chấm công để xóa.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Lỗi [DELETE /api/attendance/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// --- API TÀI SẢN (Giữ nguyên) ---
const getAssetsSql = `
    SELECT a.id, a.asset_name, a.asset_code, a.date_assigned, a.status,
           a.employee_id, e.full_name AS employee_name
    FROM assets a
    LEFT JOIN employees e ON a.employee_id = e.id
`;
// GET /api/assets (Search)
app.get('/api/assets', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = getAssetsSql;
        const params = [];
        if (search) {
            sql += " WHERE a.asset_name LIKE ? OR a.asset_code LIKE ? OR e.full_name LIKE ? OR a.status LIKE ?";
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }
        sql += " ORDER BY a.id DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Lỗi [GET /api/assets]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// POST /api/assets
app.post('/api/assets', async (req, res) => {
    try {
        const { asset_name, asset_code, date_assigned, status, employee_id } = req.body;
        if (!asset_name || !status) {
            return res.status(400).json({ error: 'Tên tài sản và Trạng thái là bắt buộc.' });
        }
        if (employee_id && !date_assigned) {
             return res.status(400).json({ error: 'Ngày bàn giao là bắt buộc khi gán tài sản cho nhân viên.' });
        }
        const sql = `INSERT INTO assets (asset_name, asset_code, date_assigned, status, employee_id)
                   VALUES (?, ?, ?, ?, ?)`;
        const employeeIdValue = employee_id ? parseInt(employee_id, 10) : null;
        const dateAssignedValue = employeeIdValue ? date_assigned : null;
        const [result] = await db.query(sql, [asset_name, asset_code || null, dateAssignedValue, status, employeeIdValue]);
        const [newAsset] = await db.query(getAssetsSql + " WHERE a.id = ?", [result.insertId]);
        res.status(201).json(newAsset[0]);
    } catch (err) {
        console.error("Lỗi [POST /api/assets]:", err);
         if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã tài sản này đã tồn tại.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// PUT /api/assets/:id
app.put('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { asset_name, asset_code, date_assigned, status, employee_id } = req.body;
         if (!asset_name || !status) {
            return res.status(400).json({ error: 'Tên tài sản và Trạng thái là bắt buộc.' });
        }
        if (employee_id && !date_assigned) {
             return res.status(400).json({ error: 'Ngày bàn giao là bắt buộc khi gán tài sản cho nhân viên.' });
        }
        const sql = `UPDATE assets SET asset_name = ?, asset_code = ?, date_assigned = ?, status = ?, employee_id = ? WHERE id = ?`;
        const employeeIdValue = employee_id ? parseInt(employee_id, 10) : null;
        const dateAssignedValue = employeeIdValue ? date_assigned : null;
        const [result] = await db.query(sql, [asset_name, asset_code || null, dateAssignedValue, status, employeeIdValue, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy tài sản để cập nhật.' });
        }
        const [updatedAsset] = await db.query(getAssetsSql + " WHERE a.id = ?", [id]);
        res.json(updatedAsset[0]);
    } catch (err) {
        console.error("Lỗi [PUT /api/assets/:id]:", err);
         if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Mã tài sản này đã bị trùng.' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});
// DELETE /api/assets/:id
app.delete('/api/assets/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query("DELETE FROM assets WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy tài sản để xóa.' });
        }
        res.status(204).send();
    } catch (err) {
        console.error("Lỗi [DELETE /api/assets/:id]:", err);
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(400).json({ error: 'Không thể xóa tài sản này (có thể liên quan đến bản ghi khác).' });
        }
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// --- API TUYỂN DỤNG (MỚI) ---

// SQL gốc để lấy ứng viên
const getCandidatesSql = `SELECT * FROM candidates`;

// 21. (READ) API LẤY ỨNG VIÊN (với TÌM KIẾM)
app.get('/api/candidates', async (req, res) => {
    try {
        const { search } = req.query;
        let sql = getCandidatesSql;
        const params = [];
        if (search) {
            // Tìm theo tên, email, vị trí, trạng thái
            sql += " WHERE full_name LIKE ? OR email LIKE ? OR position_applied LIKE ? OR status LIKE ?";
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
            params.push(`%${search}%`);
        }
        sql += " ORDER BY id DESC";
        const [rows] = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Lỗi [GET /api/candidates]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// 22. (CREATE) API THÊM ỨNG VIÊN
app.post('/api/candidates', async (req, res) => {
    try {
        // Lấy các trường từ body (cv_path sẽ xử lý sau nếu có upload)
        const { full_name, email, phone, position_applied, status, interview_date } = req.body;
        if (!full_name || !position_applied) {
            return res.status(400).json({ error: 'Họ tên và Vị trí ứng tuyển là bắt buộc.' });
        }

        const sql = `INSERT INTO candidates
                     (full_name, email, phone, position_applied, status, interview_date)
                   VALUES (?, ?, ?, ?, ?, ?)`;

        const statusValue = status || 'Mới'; // Mặc định là 'Mới' nếu không có
        const interviewDateValue = interview_date || null; // Cho phép null

        const [result] = await db.query(sql, [full_name, email || null, phone || null, position_applied, statusValue, interviewDateValue]);

        // Lấy lại dữ liệu đầy đủ để trả về
        const [newCandidate] = await db.query(getCandidatesSql + " WHERE id = ?", [result.insertId]);
        res.status(201).json(newCandidate[0]);
    } catch (err) {
        console.error("Lỗi [POST /api/candidates]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// 23. (UPDATE) API CẬP NHẬT ỨNG VIÊN
app.put('/api/candidates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, phone, position_applied, status, interview_date } = req.body;
         if (!full_name || !position_applied) {
            return res.status(400).json({ error: 'Họ tên và Vị trí ứng tuyển là bắt buộc.' });
        }

        const sql = `UPDATE candidates
                     SET full_name = ?, email = ?, phone = ?, position_applied = ?, status = ?, interview_date = ?
                     WHERE id = ?`;

        const statusValue = status || 'Mới';
        const interviewDateValue = interview_date || null;

        const [result] = await db.query(sql, [full_name, email || null, phone || null, position_applied, statusValue, interviewDateValue, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy ứng viên để cập nhật.' });
        }
        // Lấy lại dữ liệu đầy đủ để trả về
        const [updatedCandidate] = await db.query(getCandidatesSql + " WHERE id = ?", [id]);
        res.json(updatedCandidate[0]);
    } catch (err) {
        console.error("Lỗi [PUT /api/candidates/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});

// 24. (DELETE) API XÓA ỨNG VIÊN
app.delete('/api/candidates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // Có thể thêm logic xóa file CV liên quan ở đây nếu cần
        const [result] = await db.query("DELETE FROM candidates WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Không tìm thấy ứng viên để xóa.' });
        }
        res.status(204).send(); // Xóa thành công
    } catch (err) {
        console.error("Lỗi [DELETE /api/candidates/:id]:", err);
        res.status(500).json({ error: 'Lỗi máy chủ nội bộ' });
    }
});


// --- Khởi động máy chủ ---
app.listen(port, () => {
  // Log ra cổng thực tế đang sử dụng
  console.log(`Backend API đang chạy và lắng nghe trên cổng: ${port}`); 
});

//djt me chung may lu cho chet
