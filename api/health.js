import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const results = {
    env: {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY
    },
    gemini: { status: 'untested', error: null },
    groq: { status: 'untested', error: null }
  };

  // Test Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      await groq.chat.completions.create({
        messages: [{ role: 'user', content: 'test' }],
        model: 'llama-3.3-70b-versatile',
        max_tokens: 5
      });
      results.groq.status = 'ok';
    } catch (err) {
      results.groq.status = 'failed';
      results.groq.error = {
        message: err.message,
        status: err.status,
        code: err.error?.error?.code || err.error?.code || 'unknown'
      };
    }
  } else {
    results.groq.status = 'missing_key';
  }

  // Test Gemini
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      await model.generateContent("test");
      results.gemini.status = 'ok';
    } catch (err) {
      results.gemini.status = 'failed';
      results.gemini.error = {
        message: err.message,
        status: err.status || 'unknown'
      };
    }
  } else {
    results.gemini.status = 'missing_key';
  }

  const overallStatus = (results.gemini.status === 'ok' || results.groq.status === 'ok') ? 200 : 503;
  return res.status(overallStatus).json(results);
}
