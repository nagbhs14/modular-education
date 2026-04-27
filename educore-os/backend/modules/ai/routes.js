const express = require('express');
const { authMiddleware } = require('../auth/routes');

const router = express.Router();
router.use(authMiddleware);

// ─── AI Service Layer (Provider-Agnostic) ───
// This is a modular abstraction. Replace the inner logic with any AI provider.
class AIService {
  constructor() {
    this.provider = process.env.AI_PROVIDER || 'mock'; // mock | openai | gemini
  }

  async explain(topic) {
    if (this.provider === 'mock') {
      return {
        explanation: `**${topic}**\n\nThis is a simulated AI explanation for the topic "${topic}".\n\nIn a production environment, this would connect to an AI provider like OpenAI, Gemini, or a local LLM to generate detailed educational content.\n\n**Key Points:**\n1. The concept relates to foundational principles in this subject area.\n2. Understanding requires building upon prerequisite knowledge.\n3. Practical applications include real-world problem solving.\n\n*Configure AI_PROVIDER environment variable to connect a real provider.*`,
        provider: 'mock'
      };
    }
    // Add real provider implementations here
    throw new Error(`Unknown AI provider: ${this.provider}`);
  }

  async generateQuiz(content, count = 5) {
    if (this.provider === 'mock') {
      return {
        questions: [
          { question: `What is the main concept discussed in "${content.substring(0, 30)}..."?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], answer: 0 },
          { question: 'Which of the following best describes the topic?', options: ['Description A', 'Description B', 'Description C', 'Description D'], answer: 1 },
          { question: 'What is a key application of this concept?', options: ['App A', 'App B', 'App C', 'App D'], answer: 2 },
        ],
        provider: 'mock',
        note: 'These are mock questions. Connect a real AI provider for actual quiz generation.'
      };
    }
    throw new Error(`Unknown AI provider: ${this.provider}`);
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

module.exports = router;
