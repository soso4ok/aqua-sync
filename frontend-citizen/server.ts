import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs-extra";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.resolve();
const REPORTS_FILE = path.join(__dirname, "data", "reports.json");

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirpSync(path.join(__dirname, "data"));
}
if (!fs.existsSync(REPORTS_FILE)) {
  fs.writeJsonSync(REPORTS_FILE, []);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // API Routes
  
  // 1. Submit Report
  app.post("/api/reports", async (req, res) => {
    try {
      const { photo, coords, tags, comment, timestamp } = req.body;
      
      // AI Analysis Logic
      const base64Data = photo.split(',')[1] || photo;
      
      const prompt = `
        Analyze this environmental report from a citizen sensor.
        Selected Tags: ${tags.join(', ')}
        User Comment: ${comment || 'No comment'}
        
        Task:
        1. Verify if the image likely contains the pollution described in the tags.
        2. Estimate severity: Low, Medium, High.
        3. Provide a 'System Insight' - a 1-sentence technical observation as if from an environmental AI at a satellite agency.
        
        Return JSON format.
      `;

      const aiResponse = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verifiedTags: { type: Type.ARRAY, items: { type: Type.STRING } },
              severity: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
              systemInsight: { type: Type.STRING },
              isSatelliteMatch: { type: Type.BOOLEAN }
            }
          }
        }
      });

      const analysis = JSON.parse(aiResponse.text);

      const newReport = {
        id: Date.now(),
        photo,
        coords,
        tags,
        comment,
        timestamp,
        status: analysis.isSatelliteMatch ? 'alert' : 'verified',
        aiAnalysis: analysis
      };

      const reports = await fs.readJson(REPORTS_FILE);
      reports.unshift(newReport);
      await fs.writeJson(REPORTS_FILE, reports);

      res.json(newReport);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      res.status(500).json({ error: "Failed to process report" });
    }
  });

  // 2. Get All Reports
  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await fs.readJson(REPORTS_FILE);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  // 3. Satellite Alerts Mock
  app.get("/api/satellite-alerts", (req, res) => {
    res.json([
      { id: 'sat-1', type: 'thermal', level: 'High', location: { lat: 50.4501, lng: 30.5234 }, msg: "Thermal anomaly detected in sector UA-KYIV-4" }
    ]);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AquaSync Engine running on http://localhost:${PORT}`);
  });
}

startServer();
