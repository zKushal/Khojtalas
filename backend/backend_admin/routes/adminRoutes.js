const express = require("express");

const {
	loginAdmin,
	getDashboardStats,
	getUsers,
	getItems,
	approveItem,
	rejectItem,
	getReports,
} = require("../controllers/adminController");
const authAdmin = require("../middleware/authAdmin");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/dashboard", authAdmin, getDashboardStats);
router.get("/users", authAdmin, getUsers);
router.get("/items", authAdmin, getItems);
router.get("/reports", authAdmin, getReports);
router.patch("/items/:id/approve", authAdmin, approveItem);
router.patch("/items/:id/reject", authAdmin, rejectItem);

module.exports = router;
