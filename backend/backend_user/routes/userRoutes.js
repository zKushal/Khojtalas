const express = require("express");

const {
	signupUser,
	loginUser,
	getUserProfile,
	getVerifiedItems,
	getMyItems,
	createLostFoundItem,
} = require("../controllers/userController");
const authUser = require("../middleware/authUser");
const uploadItemMedia = require("../middleware/uploadItemMedia");

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/profile", authUser, getUserProfile);
router.get("/items", getVerifiedItems);
router.get("/my-items", authUser, getMyItems);
router.post("/items", authUser, uploadItemMedia, createLostFoundItem);

module.exports = router;
