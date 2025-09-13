const express = require("express");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const port = 3000;

// =========================
// Middleware
// =========================
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
// Form submission route
// =========================
app.post("/submit-form", async (req, res) => {
  try {
    const { name, age, gender, locality } = req.body;

    // Basic validation
    if (!name || !age || !gender || !locality) {
      return res.status(400).json({ success: false, message: "All fields are required!" });
    }

    const numericAge = parseInt(age, 10);
    if (numericAge < 10 || numericAge > 100) {
      return res.status(400).json({ success: false, message: "Age must be between 10 and 100." });
    }

    const newEntry = {
      name,
      age: numericAge,
      gender,
      locality,
      timestamp: new Date().toISOString(),
    };

    // Read existing data
    let existingData = [];
    try {
      const data = await fs.readFile(submissionsFile, "utf8");
      existingData = JSON.parse(data);
    } catch (readErr) {
      console.warn("⚠️ Could not read submissions.json, starting fresh:", readErr);
    }

    // Add new entry
    existingData.push(newEntry);

    // Save back to file
    await fs.writeFile(submissionsFile, JSON.stringify(existingData, null, 2), "utf8");

    console.log("✅ New submission saved:", newEntry);

    // Send JSON response
    res.json({ success: true, message: `Thanks, ${name}! Your form has been submitted.` });
  } catch (err) {
    console.error("❌ Error handling form submission:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// =========================
// Bonus: Route to fetch all submissions
// =========================
app.get("/submissions", async (req, res) => {
  try {
    const data = await fs.readFile(submissionsFile, "utf8");
    const submissions = JSON.parse(data);
    res.json({ success: true, submissions });
  } catch (err) {
    console.error("❌ Error reading submissions:", err);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
});

// =========================
// Start server
// =========================
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
