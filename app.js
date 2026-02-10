const express = require("express");
const path = require("path");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse-new");
const cleanResumeText = require("./utils/cleanText");
const Groq = require("groq-sdk");
const buildResumePrompt = require("./utils/aiPrompt");

dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const app = express();
const PORT = process.env.PORT || 3000;


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "application/pdf" ||
    file.mimetype === "text/plain"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF or TXT files allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });



// routes
app.get("/", (req, res) => {
  res.render("pages/index");
});

app.post("/analyze", upload.single("resume"), async (req, res) => {
  try {
    if (!req.file) {
      return res.send("No file uploaded");
    }

    const { role, experience } = req.body;
    const filePath = req.file.path;
    let resumeText = "";

    // Extract resume text
    if (req.file.mimetype === "text/plain") {
      resumeText = fs.readFileSync(filePath, "utf-8");
    } else {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      resumeText = pdfData.text;
    }

    //Clean text
    const cleanedText = cleanResumeText(resumeText);

    //Build AI prompt
    const prompt = buildResumePrompt({
      role,
      experience,
      resume: cleanedText,
    });

    //Call Groq
    const aiResponse = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
    });

    // DEFINE aiFeedback FIRST
    const aiFeedback = aiResponse.choices[0].message.content;

    // Extract resume score
    const scoreMatch = aiFeedback.match(/Resume Score:\s*(\d+)\s*\/\s*100/i);
    const resumeScore = scoreMatch ? scoreMatch[1] : "N/A";

    // console.log("======= AI FEEDBACK =======");
    // console.log(aiFeedback);
    // console.log("===========================");

    //Render result page
    res.render("pages/result", {
      feedback: aiFeedback,
      score: resumeScore,
    });

  } catch (err) {
    console.error(err);
    res.send("Error during resume analysis");
  }
});

// server start
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
