const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;

// =========================
// Middleware
// =========================
app.use(cors()); // allow cross-origin requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// =========================
// Path to JSON database file
// =========================
const submissionsFile = path.join(__dirname, "submissions.json");

// Ensure file exists
(async () => {
  try {
    await fs.access(submissionsFile);
    console.log("📄 submissions.json exists.");
  } catch {
    await fs.writeFile(submissionsFile, "[]", "utf8");
    console.log("📄 submissions.json created.");
  }
})();

// =========================
// Default Route
// =========================
app.get("/", (req, res) => {
  res.send("🚀 Fitness-site backend is live and working!");
});

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy" });
});

// =========================
// Form submission route
// =========================
app.post("/submit-form", async (req, res) => {
  console.log("POST /submit-form body:", req.body); // log incoming data
  try {
    const { name, age, gender, locality } = req.body;

    if (!name || !age || !gender || !locality) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const numericAge = parseInt(age, 10);
    if (Number.isNaN(numericAge) || numericAge < 10 || numericAge > 100) {
      return res.status(400).json({ success: false, message: "Age must be between 10 and 100." });
    }

    const newEntry = { name, age: numericAge, gender, locality, timestamp: new Date().toISOString() };

    // Read existing data
    let existingData = [];
    try {
      const data = await fs.readFile(submissionsFile, "utf8");
      existingData = JSON.parse(data || "[]");
    } catch (readErr) {
      console.warn("⚠️ Could not read submissions.json, starting fresh:", readErr.message);
    }

    // Add new entry
    existingData.push(newEntry);

    // Save back to file
    try {
      await fs.writeFile(submissionsFile, JSON.stringify(existingData, null, 2), "utf8");
    } catch (writeErr) {
      console.error("❌ Error writing submissions.json:", writeErr.message);
      return res.status(500).json({ success: false, message: "Could not save submission.", error: writeErr.message });
    }

    console.log("✅ New submission saved:", newEntry);
    res.json({ success: true, message: `Thanks, ${name}! Your form has been submitted.` });
  } catch (err) {
    console.error("❌ Unexpected error in /submit-form:", err.message);
    res.status(500).json({ success: false, message: "Internal server error.", error: err.message });
  }
});

// =========================
// Route to fetch all submissions
// =========================
app.get("/submissions", async (req, res) => {
  try {
    const data = await fs.readFile(submissionsFile, "utf8");
    const submissions = JSON.parse(data || "[]");
    res.json({ success: true, submissions });
  } catch (err) {
    console.error("❌ Error reading submissions.json:", err.message);
    res.status(500).json({ success: false, message: "Internal server error.", error: err.message });
  }
});

// =========================
// Start server
// =========================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
