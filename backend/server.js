const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const { testConnection } = require("./config/db");
const userRoutes = require("./backend_user/routes/userRoutes");
const adminRoutes = require("./backend_admin/routes/adminRoutes");

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "KhojTalas backend is running." });
});

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled error:", error);
  res.status(error.status || 500).json({
    success: false,
    message: error.message || "Internal server error",
  });
});

async function startServer() {
  try {
    await testConnection();
    console.log("Connected to MySQL database.");

    app.listen(port, () => {
      console.log(`KhojTalas backend running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
