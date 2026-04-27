const express = require('express');
const { authMiddleware } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

const { GoogleGenAI } = require('@google/genai');
const multer = require('multer');

// ─── Multer config for vision ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for AI vision
});

// ─── AI Service Layer ───
class AIService {
  constructor() {
    this.provider = process.env.GEMINI_API_KEY ? 'gemini' : 'mock';
    if (this.provider === 'gemini') {
      this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }

  async explain(topic) {
    if (this.provider === 'mock') {
      return {
        explanation: `**${topic}**\n\nThis is a simulated AI explanation. Configure GEMINI_API_KEY in backend environment to use real AI.`,
        provider: 'mock'
      };
    }
    
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert tutor. Explain the following educational topic clearly and concisely, suitable for a student. Use formatting (bolding, lists) to make it easy to read. Topic: ${topic}`
    });
    
    return { explanation: response.text, provider: 'gemini' };
  }

  async generateQuiz(content, count = 5) {
    if (this.provider === 'mock') {
      return {
        questions: [
          { question: `Mock Question about: ${content.substring(0, 15)}`, options: ['A', 'B', 'C', 'D'], answer: 0 }
        ],
        provider: 'mock',
        note: 'Configure GEMINI_API_KEY for real quiz generation.'
      };
    }

    const prompt = `Based on the following educational content, generate a multiple-choice quiz with exactly ${count} questions. 
    Format the output strictly as a JSON array where each object has: "question" (string), "options" (array of 4 strings), and "answer" (integer 0-3 representing the index of the correct option). 
    Do not wrap it in markdown codeblocks. Just return the raw JSON array.
    
    Content: ${content}`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    try {
      const parsed = JSON.parse(response.text);
      return { questions: parsed, provider: 'gemini' };
    } catch (e) {
      throw new Error('Failed to parse AI quiz generation');
    }
  }

  async analyzeImage(mimeType, buffer, prompt) {
    if (this.provider === 'mock') {
      return {
        analysis: `Simulated analysis of the uploaded image for prompt: "${prompt}". Configure GEMINI_API_KEY.`,
        provider: 'mock'
      };
    }

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            data: buffer.toString('base64'),
            mimeType: mimeType
          }
        }
      ]
    });

    return { analysis: response.text, provider: 'gemini' };
  }
}

const ai = new AIService();

// ─── EXPLAIN endpoint ───
router.post('/explain', async (req, res) => {
  const { topic } = req.body;
  if (!topic) return res.status(400).json({ error: 'Topic required' });

  try {
    const result = await ai.explain(topic);
    res.json(result);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GENERATE QUIZ endpoint ───
router.post('/quiz', async (req, res) => {
  const { content, count } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });

  try {
    const result = await ai.generateQuiz(content, count || 5);
    res.json(result);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── VISION endpoint ───
router.post('/vision', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Image file required' });
  const prompt = req.body.prompt || 'Analyze this image in an educational context.';

  try {
    const result = await ai.analyzeImage(req.file.mimetype, req.file.buffer, prompt);
    res.json(result);
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
