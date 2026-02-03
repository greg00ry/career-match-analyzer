import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import Database from 'better-sqlite3';
import OpenAI from 'openai';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ============ DATABASE ABSTRACTION ============

let db = null;
let dbType = null; // 'mysql' or 'sqlite'
let mysqlPool = null;

async function tryConnectMySQL() {
  try {
    mysqlPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'career_match',
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 5000,
    });
    
    await mysqlPool.query('SELECT 1');
    console.log('✅ Connected to MySQL');
    return true;
  } catch (error) {
    console.warn('⚠️ MySQL connection failed:', error.message);
    if (mysqlPool) {
      await mysqlPool.end().catch(() => {});
      mysqlPool = null;
    }
    return false;
  }
}

function initSQLite() {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  const dbPath = path.join(dataDir, 'career_match.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      error_message TEXT NOT NULL,
      error_stack TEXT,
      error_type TEXT NOT NULL DEFAULT 'unknown' CHECK(error_type IN ('api', 'parsing', 'validation', 'unknown')),
      context TEXT DEFAULT '{}',
      user_agent TEXT,
      url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS career_analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_description TEXT NOT NULL,
      resume TEXT NOT NULL,
      match_score INTEGER NOT NULL,
      true_intent TEXT,
      gap_analysis TEXT,
      quick_wins TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  db.exec(`CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type)`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON career_analyses(created_at DESC)`);
  
  console.log('✅ SQLite database initialized at:', dbPath);
  return true;
}

async function initDatabase() {
  const mysqlConnected = await tryConnectMySQL();
  
  if (mysqlConnected) {
    dbType = 'mysql';
    
    try {
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS error_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          error_message TEXT NOT NULL,
          error_stack TEXT,
          error_type ENUM('api', 'parsing', 'validation', 'unknown') NOT NULL DEFAULT 'unknown',
          context JSON,
          user_agent VARCHAR(500),
          url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at DESC),
          INDEX idx_error_type (error_type)
        )
      `);
      
      await mysqlPool.query(`
        CREATE TABLE IF NOT EXISTS career_analyses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          job_description TEXT NOT NULL,
          resume TEXT NOT NULL,
          match_score INT NOT NULL,
          true_intent JSON,
          gap_analysis JSON,
          quick_wins JSON,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_created_at (created_at DESC)
        )
      `);
      
      console.log('✅ MySQL tables initialized');
    } catch (error) {
      console.error('❌ MySQL table init failed:', error.message);
    }
  } else {
    console.log('📦 Falling back to SQLite...');
    dbType = 'sqlite';
    initSQLite();
  }
  
  console.log(`🗄️ Using database: ${dbType.toUpperCase()}`);
}

async function dbInsert(table, data) {
  const keys = Object.keys(data);
  const values = Object.values(data).map(v => 
    typeof v === 'object' ? JSON.stringify(v) : v
  );
  
  if (dbType === 'mysql') {
    const placeholders = keys.map(() => '?').join(', ');
    const [result] = await mysqlPool.query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
      values
    );
    return result.insertId;
  } else {
    const placeholders = keys.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`);
    const result = stmt.run(...values);
    return result.lastInsertRowid;
  }
}

// OpenAI client - lazy
let openai = null;
function getOpenAI() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

// ============ ERROR LOGS ENDPOINTS ============

app.post('/api/errors', async (req, res) => {
  try {
    const { error_message, error_stack, error_type, context, user_agent, url } = req.body;
    
    const id = await dbInsert('error_logs', {
      error_message,
      error_stack,
      error_type: error_type || 'unknown',
      context: context || {},
      user_agent,
      url
    });
    
    res.status(201).json({ id, message: 'Error logged' });
  } catch (error) {
    console.error('Failed to log error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

app.get('/api/errors', async (req, res) => {
  try {
    const { type, limit = 50 } = req.query;
    const limitNum = parseInt(limit);
    
    let rows;
    if (dbType === 'mysql') {
      let query = 'SELECT * FROM error_logs';
      const params = [];
      
      if (type && type !== 'all') {
        query += ' WHERE error_type = ?';
        params.push(type);
      }
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limitNum);
      
      [rows] = await mysqlPool.query(query, params);
    } else {
      let query = 'SELECT * FROM error_logs';
      const params = [];
      
      if (type && type !== 'all') {
        query += ' WHERE error_type = ?';
        params.push(type);
      }
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limitNum);
      
      rows = db.prepare(query).all(...params);
    }
    
    const logs = rows.map(row => ({
      ...row,
      context: typeof row.context === 'string' ? JSON.parse(row.context) : row.context
    }));
    
    res.json(logs);
  } catch (error) {
    console.error('Failed to fetch errors:', error);
    res.status(500).json({ error: 'Failed to fetch errors' });
  }
});

app.delete('/api/errors', async (req, res) => {
  try {
    if (dbType === 'mysql') {
      await mysqlPool.query('DELETE FROM error_logs');
    } else {
      db.prepare('DELETE FROM error_logs').run();
    }
    res.json({ message: 'All logs deleted' });
  } catch (error) {
    console.error('Failed to delete errors:', error);
    res.status(500).json({ error: 'Failed to delete errors' });
  }
});

// ============ CAREER ANALYSIS ENDPOINTS ============

const getDemoAnalysis = (jobDescription) => ({
  matchScore: 73,
  trueIntent: {
    whatTheyWrote: (jobDescription || '').substring(0, 150) + '...',
    whatTheyReallyWant: "They need someone who can independently lead technical decisions, mentor junior developers, and bridge the gap between product and engineering.",
    keySignals: [
      "Emphasis on 'ownership' = expect long hours during crunch",
      "'Fast-paced environment' = understaffed team",
      "'Wear many hats' = no clear role boundaries",
      "'Competitive salary' = below market rate negotiable"
    ]
  },
  gapAnalysis: {
    strengths: [
      "Strong technical experience aligns with their stack",
      "Previous experience matches their culture",
      "Contributions demonstrate initiative",
      "Certifications cover their requirements"
    ],
    gaps: [
      "Consider adding more backend project examples",
      "Missing leadership/mentoring experience examples",
      "No metrics or quantified achievements in current role",
      "Some technologies not mentioned but likely needed"
    ]
  },
  quickWins: [
    { title: "Add Quantified Achievements", description: "Replace generic descriptions with specific numbers.", impact: "high" },
    { title: "Highlight Leadership Experience", description: "Include phrases like 'mentored developers'.", impact: "high" },
    { title: "Match Keywords From Job Description", description: "Mirror technologies and terms from the job posting.", impact: "medium" }
  ],
  _demo: true
});

app.post('/api/analyze', async (req, res) => {
  try {
    const { jobDescription, resume } = req.body;

    if (!jobDescription || !resume) {
      return res.status(400).json({ error: 'Job description and resume are required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OpenAI API key missing - running in DEMO MODE');
      
      try {
        await dbInsert('error_logs', {
          error_message: 'Demo mode analysis triggered - OpenAI API key missing',
          error_type: 'api',
          context: { endpoint: '/api/analyze', mode: 'demo' }
        });
      } catch (logError) {
        console.error('Failed to log:', logError);
      }

      return res.json(getDemoAnalysis(jobDescription));
    }

    let analysis;
    try {
      const prompt = `You are an expert career coach and ATS specialist. Analyze the following job description and resume.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resume}

Provide your analysis in the following JSON format (respond ONLY with valid JSON):
{
  "matchScore": <number between 0-100>,
  "trueIntent": {
    "whatTheyWrote": "<brief summary>",
    "whatTheyReallyWant": "<what they actually need>",
    "keySignals": ["<signal 1>", "<signal 2>", "<signal 3>", "<signal 4>"]
  },
  "gapAnalysis": {
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>", "<strength 4>"],
    "gaps": ["<gap 1>", "<gap 2>", "<gap 3>", "<gap 4>"]
  },
  "quickWins": [
    { "title": "<action>", "description": "<explanation>", "impact": "high" },
    { "title": "<action>", "description": "<explanation>", "impact": "high" },
    { "title": "<action>", "description": "<explanation>", "impact": "medium" }
  ]
}`;

      const client = getOpenAI();
      const completion = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const content = completion.choices[0].message.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('Failed to parse AI response');
      }

      analysis = JSON.parse(jsonMatch[0]);

    } catch (openaiError) {
      console.warn('⚠️ OpenAI request failed - DEMO MODE:', openaiError.message);
      
      try {
        await dbInsert('error_logs', {
          error_message: openaiError.message,
          error_stack: openaiError.stack,
          error_type: 'api',
          context: { endpoint: '/api/analyze', mode: 'demo_fallback' }
        });
      } catch (logError) {
        console.error('Failed to log:', logError);
      }

      return res.json(getDemoAnalysis(jobDescription));
    }

    try {
      await dbInsert('career_analyses', {
        job_description: jobDescription.substring(0, 10000),
        resume: resume.substring(0, 10000),
        match_score: analysis.matchScore,
        true_intent: analysis.trueIntent,
        gap_analysis: analysis.gapAnalysis,
        quick_wins: analysis.quickWins
      });
    } catch (dbError) {
      console.warn('Failed to save analysis:', dbError.message);
    }

    res.json(analysis);
  } catch (error) {
    console.error('Analysis failed:', error);
    res.json(getDemoAnalysis(req.body?.jobDescription || ''));
  }
});

app.get('/api/health', async (req, res) => {
  try {
    if (dbType === 'mysql') {
      await mysqlPool.query('SELECT 1');
    } else {
      db.prepare('SELECT 1').get();
    }
    res.json({ status: 'ok', database: dbType, connected: true });
  } catch (error) {
    res.status(500).json({ status: 'error', database: dbType, connected: false });
  }
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await initDatabase();
});
