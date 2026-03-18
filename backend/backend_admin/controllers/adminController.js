const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../../config/db");

const REPORT_TABLE_CANDIDATES = [
  "suspicious_reports",
  "item_reports",
  "reports",
  "suspicious_activity_reports",
];

async function tableExists(tableName) {
  const [rows] = await pool.query("SHOW TABLES LIKE ?", [tableName]);
  return rows.length > 0;
}

async function getTableColumns(tableName) {
  const [rows] = await pool.query(`SHOW COLUMNS FROM \`${tableName}\``);
  return new Set(rows.map((row) => row.Field));
}

async function resolveExistingTable(tableNames) {
  for (const tableName of tableNames) {
    if (await tableExists(tableName)) {
      return tableName;
    }
  }

  return null;
}

function mapAdminItem(row) {
  return {
    id: String(row.id),
    title: row.title,
    status: row.status,
    mediaType: row.media_type || "image",
    mediaUrl: row.media_url || null,
    location: row.location_text,
    submittedBy: row.reported_by,
    submittedAt: row.submitted_at,
    description: row.description || "",
    authenticityDetail: row.authenticity_detail || "",
    category: row.category || "Other",
    isUrgent: Boolean(row.is_urgent),
    verificationStatus: row.verification_status,
    approvedAt: row.approved_at || null,
    rejectionReason: row.rejection_reason || null,
  };
}

async function updateItemVerificationStatus({ itemId, adminId, nextStatus, rejectionReason = null }) {
  const itemColumns = await getTableColumns("lost_found_items");
  const updates = ["verification_status = ?"];
  const values = [nextStatus];

  if (itemColumns.has("updated_at")) {
    updates.push("updated_at = NOW()");
  }

  if (nextStatus === "verified") {
    if (itemColumns.has("approved_by_user_id")) {
      updates.push("approved_by_user_id = ?");
      values.push(adminId);
    }

    if (itemColumns.has("approved_at")) {
      updates.push("approved_at = NOW()");
    }

    if (itemColumns.has("rejected_at")) {
      updates.push("rejected_at = NULL");
    }

    if (itemColumns.has("rejected_by_user_id")) {
      updates.push("rejected_by_user_id = NULL");
    }

    if (itemColumns.has("rejection_reason")) {
      updates.push("rejection_reason = NULL");
    }
  }

  if (nextStatus === "rejected") {
    if (itemColumns.has("approved_at")) {
      updates.push("approved_at = NULL");
    }

    if (itemColumns.has("approved_by_user_id")) {
      updates.push("approved_by_user_id = NULL");
    }

    if (itemColumns.has("rejected_at")) {
      updates.push("rejected_at = NOW()");
    }

    if (itemColumns.has("rejected_by_user_id")) {
      updates.push("rejected_by_user_id = ?");
      values.push(adminId);
    }

    if (itemColumns.has("rejection_reason")) {
      updates.push("rejection_reason = ?");
      values.push(rejectionReason);
    }
  }

  values.push(itemId);

  await pool.query(
    `UPDATE lost_found_items SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
}

function signToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      `SELECT id, full_name, email, password_hash, role
       FROM users
       WHERE email = ? AND role = 'admin' AND is_active = 1
       LIMIT 1`,
      [normalizedEmail]
    );

    const admin = rows[0];
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid admin credentials." });
    }

    const token = signToken(admin);

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      adminName: admin.full_name,
      admin: {
        id: admin.id,
        fullName: admin.full_name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("loginAdmin error:", error);
    return res.status(500).json({ success: false, message: "Failed to login admin." });
  }
}

async function getDashboardStats(_req, res) {
  try {
    const [[reportsResult], [pendingResult], [verifiedResult], [usersResult], [urgentResult], [lostResult], [foundResult]] = await Promise.all([
      pool.query("SELECT COUNT(*) AS totalReports FROM lost_found_items"),
      pool.query("SELECT COUNT(*) AS pendingApprovals FROM lost_found_items WHERE verification_status = 'under-review'"),
      pool.query("SELECT COUNT(*) AS verifiedItems FROM lost_found_items WHERE verification_status = 'verified'"),
      pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'user'"),
      pool.query(
        `SELECT COUNT(*) AS urgentCases
         FROM lost_found_items
         WHERE verification_status = 'under-review'
           AND TIMESTAMPDIFF(HOUR, created_at, NOW()) >= 24`
      ),
      pool.query("SELECT COUNT(*) AS totalLostItems FROM lost_found_items WHERE status = 'LOST'"),
      pool.query("SELECT COUNT(*) AS totalFoundItems FROM lost_found_items WHERE status = 'FOUND'")
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalReports: reportsResult.totalReports,
        pendingApprovals: pendingResult.pendingApprovals,
        verifiedItems: verifiedResult.verifiedItems,
        totalUsers: usersResult.totalUsers,
        urgentCases: urgentResult.urgentCases,
        totalLostItems: lostResult.totalLostItems,
        totalFoundItems: foundResult.totalFoundItems,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch dashboard stats." });
  }
}

async function getUsers(_req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        users.id,
        users.full_name,
        users.email,
        users.trust_level,
        users.is_active,
        users.created_at,
        COUNT(items.id) AS items_reported
      FROM users
      LEFT JOIN lost_found_items items ON items.reporter_user_id = users.id
      WHERE users.role = 'user'
      GROUP BY users.id
      ORDER BY users.created_at DESC`
    );

    const users = rows.map((row) => ({
      id: String(row.id),
      name: row.full_name,
      email: row.email,
      trustLevel: row.trust_level || "new",
      itemsReported: Number(row.items_reported || 0),
      isSuspended: !Boolean(row.is_active),
      joinedAt: row.created_at,
    }));

    return res.status(200).json({ success: true, users });
  } catch (error) {
    console.error("getUsers error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
}

async function getItems(req, res) {
  try {
    const verificationStatus = req.query.verificationStatus
      ? String(req.query.verificationStatus).trim()
      : null;
    const status = req.query.status ? String(req.query.status).trim() : null;
    const limit = req.query.limit ? Math.max(1, Number(req.query.limit)) : null;
    const itemColumns = await getTableColumns("lost_found_items");
    const hasRejectionReason = itemColumns.has("rejection_reason");

    let sql = `
      SELECT
        items.id,
        items.title,
        items.status,
        items.category,
        items.description,
        items.location_text,
        items.authenticity_detail,
        items.verification_status,
        items.created_at AS submitted_at,
        items.approved_at,
        COALESCE(media.media_type, 'image') AS media_type,
        media.media_url,
        users.full_name AS reported_by,
        CASE
          WHEN items.verification_status = 'under-review' AND TIMESTAMPDIFF(HOUR, items.created_at, NOW()) >= 24 THEN 1
          ELSE 0
        END AS is_urgent,
        ${hasRejectionReason ? "items.rejection_reason" : "NULL AS rejection_reason"}
      FROM lost_found_items items
      INNER JOIN users ON users.id = items.reporter_user_id
      LEFT JOIN item_media media ON media.item_id = items.id AND media.is_primary = 1
      WHERE 1 = 1
    `;
    const values = [];

    if (verificationStatus) {
      sql += " AND items.verification_status = ?";
      values.push(verificationStatus);
    }

    if (status) {
      sql += " AND items.status = ?";
      values.push(status);
    }

    sql += " ORDER BY items.created_at DESC";

    if (limit) {
      sql += " LIMIT ?";
      values.push(limit);
    }

    const [rows] = await pool.query(sql, values);
    const items = rows.map(mapAdminItem);

    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("getItems error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch items." });
  }
}

async function approveItem(req, res) {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ success: false, message: "Valid item id is required." });
    }

    const [existingItems] = await pool.query(
      "SELECT id, verification_status FROM lost_found_items WHERE id = ? LIMIT 1",
      [itemId]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    await updateItemVerificationStatus({
      itemId,
      adminId: req.admin.id,
      nextStatus: "verified",
    });

    return res.status(200).json({
      success: true,
      message: "Item approved successfully.",
      itemId,
    });
  } catch (error) {
    console.error("approveItem error:", error);
    return res.status(500).json({ success: false, message: "Failed to approve item." });
  }
}

async function rejectItem(req, res) {
  try {
    const itemId = Number(req.params.id);
    const reason = String(req.body.reason || "").trim();

    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ success: false, message: "Valid item id is required." });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: "Rejection reason is required." });
    }

    const [existingItems] = await pool.query(
      "SELECT id FROM lost_found_items WHERE id = ? LIMIT 1",
      [itemId]
    );

    if (existingItems.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found." });
    }

    await updateItemVerificationStatus({
      itemId,
      adminId: req.admin.id,
      nextStatus: "rejected",
      rejectionReason: reason,
    });

    return res.status(200).json({
      success: true,
      message: "Item rejected successfully.",
      itemId,
    });
  } catch (error) {
    console.error("rejectItem error:", error);
    return res.status(500).json({ success: false, message: "Failed to reject item." });
  }
}

async function getReports(_req, res) {
  try {
    const reportTable = await resolveExistingTable(REPORT_TABLE_CANDIDATES);

    if (!reportTable) {
      return res.status(200).json({ success: true, reports: [] });
    }

    const reportColumns = await getTableColumns(reportTable);
    const reportReasonColumn = ["reason", "description", "details", "message", "notes"].find((column) =>
      reportColumns.has(column)
    );
    const reportStatusColumn = ["status", "review_status"].find((column) => reportColumns.has(column));
    const reportCreatedAtColumn = ["created_at", "reported_at", "submitted_at"].find((column) =>
      reportColumns.has(column)
    );
    const reportItemColumn = ["item_id", "lost_found_item_id"].find((column) => reportColumns.has(column));
    const reportUserColumn = ["reported_by_user_id", "reporter_user_id", "user_id"].find((column) =>
      reportColumns.has(column)
    );

    let sql = `
      SELECT
        r.id,
        ${reportReasonColumn ? `r.${reportReasonColumn}` : "NULL"} AS reason,
        ${reportStatusColumn ? `r.${reportStatusColumn}` : "'open'"} AS status,
        ${reportCreatedAtColumn ? `r.${reportCreatedAtColumn}` : "NULL"} AS created_at,
        ${reportItemColumn ? `r.${reportItemColumn}` : "NULL"} AS item_id,
        ${reportUserColumn ? `r.${reportUserColumn}` : "NULL"} AS reporter_user_id,
        items.title AS item_title,
        users.full_name AS reporter_name
      FROM \`${reportTable}\` r
      LEFT JOIN lost_found_items items ON ${reportItemColumn ? `items.id = r.${reportItemColumn}` : "1 = 0"}
      LEFT JOIN users ON ${reportUserColumn ? `users.id = r.${reportUserColumn}` : "1 = 0"}
      ORDER BY ${reportCreatedAtColumn ? `r.${reportCreatedAtColumn}` : "r.id"} DESC
      LIMIT 20
    `;

    const [rows] = await pool.query(sql);
    const reports = rows.map((row) => ({
      id: String(row.id),
      reason: row.reason || "No reason provided",
      status: row.status || "open",
      createdAt: row.created_at || null,
      itemId: row.item_id ? String(row.item_id) : null,
      itemTitle: row.item_title || null,
      reporterName: row.reporter_name || null,
    }));

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    console.error("getReports error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch reports." });
  }
}

module.exports = {
  loginAdmin,
  getDashboardStats,
  getUsers,
  getItems,
  approveItem,
  rejectItem,
  getReports,
};
