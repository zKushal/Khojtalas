const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { pool } = require("../../config/db");

function mapDbItem(row) {
  return {
    id: row.id,
    status: row.status,
    mediaType: row.media_type || "image",
    mediaUrl: row.media_url || null,
    title: row.title,
    description: row.description,
    tags: row.tags ? row.tags.split(",") : [],
    reportedBy: row.reported_by,
    location: row.location_text,
    timeAgo: row.time_ago,
    helpfulCount: String(row.helpful_count || 0),
    detailsCount: String(row.details_count || 0),
    shareCount: String(row.share_count || 0),
    verificationStatus: row.verification_status,
    userTrustLevel: row.trust_level || "new",
    authenticityDetail: row.authenticity_detail || undefined,
    category: row.category,
    scope: row.visibility_scope,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

async function signupUser(req, res) {
  try {
    const { fullName, full_name: fullNameSnake, email, password } = req.body;
    const resolvedFullName = fullName || fullNameSnake;

    if (!resolvedFullName || !email || !password) {
      return res.status(400).json({ success: false, message: "fullName, email, and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ? LIMIT 1",
      [normalizedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: "User already exists with this email." });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, 'user')`,
      [resolvedFullName.trim(), normalizedEmail, passwordHash]
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("signupUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to register user." });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "email and password are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const [rows] = await pool.query(
      `SELECT id, full_name, email, password_hash, role, trust_level
       FROM users
       WHERE email = ? AND role = 'user' AND is_active = 1
       LIMIT 1`,
      [normalizedEmail]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid user credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: "Invalid user credentials." });
    }

    const token = signToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        trustLevel: user.trust_level,
      },
    });
  } catch (error) {
    console.error("loginUser error:", error);
    return res.status(500).json({ success: false, message: "Failed to login user." });
  }
}

async function getUserProfile(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, trust_level, role, is_active, created_at
       FROM users
       WHERE id = ? AND role = 'user'
       LIMIT 1`,
      [req.user.id]
    );

    const user = rows[0];
    if (!user) {
      return res.status(404).json({ success: false, message: "User profile not found." });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        trustLevel: user.trust_level,
        role: user.role,
        isActive: Boolean(user.is_active),
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch user profile." });
  }
}

async function getVerifiedItems(req, res) {
  try {
    const category = req.query.category ? String(req.query.category).trim() : null;
    const tag = req.query.tag ? String(req.query.tag).trim() : null;

    let sql = `
      SELECT
        items.id,
        items.status,
        items.category,
        items.title,
        items.description,
        items.location_text,
        items.visibility_scope,
        items.verification_status,
        items.authenticity_detail,
        items.helpful_count,
        items.details_count,
        items.share_count,
        COALESCE(
          (
            SELECT selected_media.media_type
            FROM item_media selected_media
            WHERE selected_media.item_id = items.id
            ORDER BY
              CASE
                WHEN items.status = 'FOUND' AND selected_media.media_type = 'video' THEN 0
                WHEN items.status = 'FOUND' AND selected_media.media_type = 'image' THEN 1
                WHEN items.status <> 'FOUND' AND selected_media.media_type = 'image' THEN 0
                WHEN items.status <> 'FOUND' AND selected_media.media_type = 'video' THEN 1
                ELSE 2
              END,
              selected_media.is_primary DESC,
              selected_media.sort_order ASC,
              selected_media.id ASC
            LIMIT 1
          ),
          'image'
        ) AS media_type,
        (
          SELECT selected_media.media_url
          FROM item_media selected_media
          WHERE selected_media.item_id = items.id
          ORDER BY
            CASE
              WHEN items.status = 'FOUND' AND selected_media.media_type = 'video' THEN 0
              WHEN items.status = 'FOUND' AND selected_media.media_type = 'image' THEN 1
              WHEN items.status <> 'FOUND' AND selected_media.media_type = 'image' THEN 0
              WHEN items.status <> 'FOUND' AND selected_media.media_type = 'video' THEN 1
              ELSE 2
            END,
            selected_media.is_primary DESC,
            selected_media.sort_order ASC,
            selected_media.id ASC
          LIMIT 1
        ) AS media_url,
        users.full_name AS reported_by,
        users.trust_level,
        TIMESTAMPDIFF(HOUR, items.created_at, NOW()) AS hours_since,
        tags.tags
      FROM lost_found_items items
      INNER JOIN users ON users.id = items.reporter_user_id
      LEFT JOIN (
        SELECT item_id, GROUP_CONCAT(DISTINCT tag ORDER BY tag SEPARATOR ',') AS tags
        FROM item_tags
        GROUP BY item_id
      ) tags ON tags.item_id = items.id
      WHERE items.verification_status = 'verified'
    `;

    const values = [];

    if (category) {
      sql += " AND items.category = ?";
      values.push(category);
    }

    if (tag) {
      sql += " AND EXISTS (SELECT 1 FROM item_tags filtered_tags WHERE filtered_tags.item_id = items.id AND filtered_tags.tag = ?)";
      values.push(tag);
    }

    sql += " ORDER BY items.created_at DESC";

    const [rows] = await pool.query(sql, values);

    const items = rows.map((row) => {
      const hours = Number(row.hours_since || 0);
      let timeAgo = `${hours} hours ago`;
      if (hours < 1) {
        timeAgo = "Just now";
      } else if (hours >= 24) {
        timeAgo = `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`;
      }

      return mapDbItem({
        ...row,
        time_ago: timeAgo,
      });
    });

    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("getVerifiedItems error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch items." });
  }
}

async function getMyItems(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        items.id,
        items.status,
        items.category,
        items.title,
        items.description,
        items.location_text,
        items.visibility_scope,
        items.verification_status,
        items.authenticity_detail,
        items.helpful_count,
        items.details_count,
        items.share_count,
        COALESCE(
          (
            SELECT selected_media.media_type
            FROM item_media selected_media
            WHERE selected_media.item_id = items.id
            ORDER BY
              CASE
                WHEN items.status = 'FOUND' AND selected_media.media_type = 'video' THEN 0
                WHEN items.status = 'FOUND' AND selected_media.media_type = 'image' THEN 1
                WHEN items.status <> 'FOUND' AND selected_media.media_type = 'image' THEN 0
                WHEN items.status <> 'FOUND' AND selected_media.media_type = 'video' THEN 1
                ELSE 2
              END,
              selected_media.is_primary DESC,
              selected_media.sort_order ASC,
              selected_media.id ASC
            LIMIT 1
          ),
          'image'
        ) AS media_type,
        (
          SELECT selected_media.media_url
          FROM item_media selected_media
          WHERE selected_media.item_id = items.id
          ORDER BY
            CASE
              WHEN items.status = 'FOUND' AND selected_media.media_type = 'video' THEN 0
              WHEN items.status = 'FOUND' AND selected_media.media_type = 'image' THEN 1
              WHEN items.status <> 'FOUND' AND selected_media.media_type = 'image' THEN 0
              WHEN items.status <> 'FOUND' AND selected_media.media_type = 'video' THEN 1
              ELSE 2
            END,
            selected_media.is_primary DESC,
            selected_media.sort_order ASC,
            selected_media.id ASC
          LIMIT 1
        ) AS media_url,
        users.full_name AS reported_by,
        users.trust_level,
        TIMESTAMPDIFF(HOUR, items.created_at, NOW()) AS hours_since,
        tags.tags
      FROM lost_found_items items
      INNER JOIN users ON users.id = items.reporter_user_id
      LEFT JOIN (
        SELECT item_id, GROUP_CONCAT(DISTINCT tag ORDER BY tag SEPARATOR ',') AS tags
        FROM item_tags
        GROUP BY item_id
      ) tags ON tags.item_id = items.id
      WHERE items.reporter_user_id = ?
      ORDER BY items.created_at DESC`,
      [req.user.id]
    );

    const items = rows.map((row) => {
      const hours = Number(row.hours_since || 0);
      let timeAgo = `${hours} hours ago`;
      if (hours < 1) {
        timeAgo = "Just now";
      } else if (hours >= 24) {
        timeAgo = `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? "s" : ""} ago`;
      }

      return mapDbItem({
        ...row,
        time_ago: timeAgo,
      });
    });

    return res.status(200).json({ success: true, items });
  } catch (error) {
    console.error("getMyItems error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch your items." });
  }
}

async function createLostFoundItem(req, res) {
  const connection = await pool.getConnection();

  try {
    const {
      itemType,
      title,
      category,
      location,
      dateTime,
      description,
      authenticityDetail,
      tags,
      scope,
    } = req.body;

    const normalizedStatus = String(itemType || "").toLowerCase() === "found" ? "FOUND" : "LOST";
    const imageFile = req.files?.image?.[0] || null;
    const videoFile = req.files?.video?.[0] || null;

    if (!title || !category || !location || !dateTime) {
      return res.status(400).json({ success: false, message: "title, category, location, and dateTime are required." });
    }

    if (!authenticityDetail) {
      return res.status(400).json({ success: false, message: "authenticityDetail is required." });
    }

    if (normalizedStatus === "FOUND" && (!imageFile || !videoFile)) {
      return res.status(400).json({ success: false, message: "Found items require both image and video proof." });
    }

    await connection.beginTransaction();

    const [itemResult] = await connection.query(
      `INSERT INTO lost_found_items
       (reporter_user_id, status, category, title, description, location_text, incident_at, visibility_scope, verification_status, authenticity_detail, current_state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'under-review', ?, 'open')`,
      [
        req.user.id,
        normalizedStatus,
        category,
        title,
        description || "",
        location,
        dateTime,
        scope || "nearby",
        authenticityDetail,
      ]
    );

    const itemId = itemResult.insertId;
    const mediaRecords = [];
    const shouldPrioritizeVideo = normalizedStatus === "FOUND";

    if (imageFile) {
      mediaRecords.push([
        itemId,
        "image",
        `/uploads/items/${imageFile.filename}`,
        shouldPrioritizeVideo ? 0 : 1,
        shouldPrioritizeVideo ? 2 : 1,
      ]);
    }

    if (videoFile) {
      mediaRecords.push([
        itemId,
        "video",
        `/uploads/items/${videoFile.filename}`,
        shouldPrioritizeVideo ? 1 : imageFile ? 0 : 1,
        shouldPrioritizeVideo ? 1 : imageFile ? 2 : 1,
      ]);
    }

    if (mediaRecords.length > 0) {
      await connection.query(
        `INSERT INTO item_media (item_id, media_type, media_url, is_primary, sort_order)
         VALUES ?`,
        [mediaRecords]
      );
    }

    const parsedTags = Array.isArray(tags)
      ? tags
      : typeof tags === "string" && tags.trim().length > 0
        ? tags.split(",")
        : [];

    const cleanTags = parsedTags
      .map((tag) => String(tag).trim())
      .filter(Boolean)
      .slice(0, 10);

    if (cleanTags.length > 0) {
      const tagRows = cleanTags.map((tag) => [itemId, tag]);
      await connection.query(
        `INSERT INTO item_tags (item_id, tag) VALUES ?`,
        [tagRows]
      );
    }

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Item submitted successfully and is now under review.",
      itemId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("createLostFoundItem error:", error);
    return res.status(500).json({ success: false, message: "Failed to create item." });
  } finally {
    connection.release();
  }
}

module.exports = {
  signupUser,
  loginUser,
  getUserProfile,
  getVerifiedItems,
  getMyItems,
  createLostFoundItem,
};
