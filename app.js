const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse-new");
const Groq = require("groq-sdk");
const cleanResumeText = require("./utils/cleanText");
const buildResumePrompt = require("./utils/aiPrompt");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Resume = require("./models/Resume");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("MongoDB Error:", err.message));

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}


const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsPath); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
}


app.get("/", (req, res) => {
  res.render("pages/index");
});


app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.json({ message: "User registered successfully" });

  } catch (error) {
    console.error(error);
    res.json({ message: "Error registering user" });
  }
});


app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
    });

  } catch (error) {
    console.error(error);
    res.json({ message: "Error during login" });
  }
});


app.post("/analyze", verifyToken, upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({ message: "No file uploaded" });
    }

    const { role, experience } = req.body;
    const filePath = req.file.path;

    let resumeText = "";

    if (req.file.mimetype === "text/plain") {
      resumeText = fs.readFileSync(filePath, "utf-8");
    } else {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      resumeText = pdfData.text;
    }

    const cleanedText = cleanResumeText(resumeText);

    const prompt = buildResumePrompt({
      role,
      experience,
      resume: cleanedText,
    });

    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    const aiFeedback = aiResponse.choices[0].message.content;

    const scoreMatch = aiFeedback.match(/Resume Score:\s*(\d+)\s*\/\s*100/i);
    const resumeScore = scoreMatch ? scoreMatch[1] : "N/A";

    await Resume.create({
      user: req.user.id,
      role,
      experience,
      score: resumeScore,
      feedback: aiFeedback,
    });

    res.json({
      message: "Analysis successful",
      score: resumeScore,
      feedback: aiFeedback,
    });

  } catch (err) {
    console.error("Error during resume analysis:", err);
    res.status(500).json({ message: "Error during resume analysis" });
  }
});


app.get("/my-analyses", verifyToken, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json({
      total: resumes.length,
      data: resumes,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching analyses" });
  }
});

app.get("/result", (req, res) => {
  res.render("pages/result");
});

app.get("/dashboard", (req, res) => {
  res.render("pages/dashboard");
});

app.get("/register", (req, res) => {
  res.render("pages/register");
});

app.get("/login", (req, res) => {
  res.render("pages/login");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});