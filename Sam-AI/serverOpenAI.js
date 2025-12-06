

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const app = express();
const port = process.env.PORT || 5000;

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- CONFIGURATION ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL; // Optional
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

if (!OPENAI_API_KEY) {
  console.error("❌ FATAL: OPENAI_API_KEY is missing in environment variables.");
}

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL, 
});

// --- 📂 DATA STORAGE (Identical to server.js for compatibility) ---
const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

const DEFAULT_USERS = [
    { username: 'admin', password: 'password123', name: 'Admin User', storeConnected: true, storeUrl: 'sam-ai-demo.myshopify.com' },
    { username: 'demo', password: 'demo', name: 'Demo User' }
];

async function ensureDataStructure() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(USERS_FILE);
        } catch {
            console.log("⚠️ users.json missing. Creating default users...");
            await fs.writeFile(USERS_FILE, JSON.stringify(DEFAULT_USERS, null, 2));
        }
    } catch (e) {
        console.error("❌ Failed to initialize data directory:", e);
    }
}

async function ensureUserDir(username) {
    const userDir = path.join(DATA_DIR, username);
    const policyDir = path.join(userDir, 'policies');
    
    try {
        await fs.mkdir(userDir, { recursive: true });
        await fs.mkdir(policyDir, { recursive: true });
        try { await fs.access(path.join(userDir, 'history.json')); } 
        catch { await fs.writeFile(path.join(userDir, 'history.json'), '[]'); }
        
        // Copy BASELINE default policies if missing for ANY new user
        try { await fs.access(path.join(policyDir, 'general_standards.txt')); } 
        catch {
            await fs.writeFile(path.join(policyDir, 'general_standards.txt'), "1. Be truthful.\n2. No illegal items.\n3. No weapons or explosives.");
            await fs.writeFile(path.join(policyDir, 'blocked_terms.txt'), "explosives\nillegal drugs\ncounterfeit\nweapon");
        }

    } catch (e) {
        console.error(`❌ Failed to setup user dir for ${username}:`, e);
    }
    return { userDir, policyDir };
}

async function loadUserPolicies(username) {
    const { policyDir } = await ensureUserDir(username);
    let generalPolicies = "";
    let platformPolicies = {};
    let blockedTerms = [];
    let loadedFiles = [];

    try {
        const files = await fs.readdir(policyDir);
        for (const file of files) {
            const filePath = path.join(policyDir, file);
            const content = await fs.readFile(filePath, 'utf-8');

            if (file === 'blocked_terms.txt') {
                blockedTerms = content.split('\n').map(t => t.trim().toLowerCase()).filter(Boolean);
                loadedFiles.push(file);
            } else if (file.endsWith('.json')) {
                try {
                    const parsed = JSON.parse(content);
                    platformPolicies = { ...platformPolicies, ...parsed };
                    loadedFiles.push(file);
                } catch (e) { console.error(`Error parsing JSON policy ${file}:`, e.message); }
            } else if (file.endsWith('.txt') || file.endsWith('.md')) {
                // Dynamically append any text file found in the user's policy folder
                generalPolicies += `\n\n--- DOCUMENT: ${file} ---\n${content}`;
                loadedFiles.push(file);
            }
        }
    } catch (e) { console.error("Error loading user policies", e); }

    return { generalPolicies, platformPolicies, blockedTerms, loadedFiles };
}

ensureDataStructure();

// --- 🤖 OPENAI AGENTS & HELPERS ---

const parseResponse = (text) => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn("JSON Parse Failed, attempting cleanup:", text);
    const match = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
    if (match) {
        try { return JSON.parse(match[1] || match[0]); } catch {}
    }
    throw new Error("Invalid response format from AI");
  }
};

// 1. Validation Agent (OpenAI)
async function validateInputAgent(input, policies) {
    const textToCheck = `${input.productName} ${input.features} ${input.brand}`.toLowerCase();
    
    // Hardcoded Safety
    const UNIVERSAL_BLOCKED = ["bomb", "suicide", "terror", "anthrax", "ricin"];
    const foundUniversal = UNIVERSAL_BLOCKED.find(term => textToCheck.includes(term));
    if (foundUniversal) return { valid: false, reason: `Safety Violation: Input contains universally prohibited term "${foundUniversal}".` };

    // Policy Safety
    const foundBlocked = policies.blockedTerms.find(term => textToCheck.includes(term));
    if (foundBlocked) return { valid: false, reason: `Policy Violation: Input contains prohibited term "${foundBlocked}".` };

    const systemPrompt = `You are a Trust & Safety Officer. 
    Analyze the product input for safety violations (Illegal, Dangerous, Hate, Logic Mismatch).
    
    [USER KNOWLEDGE BASE]
    ${policies.generalPolicies}
    
    Return strict JSON: { "valid": boolean, "reason": "string (only if invalid)" }`;

    const userPrompt = `Product: "${input.productName}"\nCategory: "${input.category}"\nFeatures: "${input.features}"\n\nIs this safe?`;

    try {
        const response = await openai.chat.completions.create({
            model: OPENAI_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        });
        return parseResponse(response.choices[0].message.content);
    } catch (e) {
        console.error("Validation Error:", e);
        return { valid: true }; // Fail open
    }
}

// 2. Vision Category Detection (OpenAI)
async function detectCategoryAgent(imageBase64, categories) {
    // Ensure data URL format for OpenAI
    const imageUrl = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;

    const prompt = `Look at this product image. 
    1. Identify the Brand Name if visible (e.g. "Nike", "Apple"). If not visible, return empty string.
    2. Identify a descriptive Product Name (e.g. "Canon EOS R5 Camera").
    3. Select the single best matching category from this list: [${categories}]. 
    If none fit well, generate a short professional name.
    Return strictly JSON: { "productName": "string", "category": "Category Name", "brand": "Brand Name" }`;

    try {
        const response = await openai.chat.completions.create({
            model: OPENAI_MODEL, // Must support vision (e.g. gpt-4o, gpt-4-turbo)
            messages: [
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            max_tokens: 100
        });
        return parseResponse(response.choices[0].message.content);
    } catch (e) {
        console.error("Vision Error:", e);
        throw new Error("Vision analysis failed");
    }
}

// 3. Content Generation Agent (OpenAI)
async function generateContentAgent(input, policies, marketDemand = null) {
    let systemInstruction = `You are an expert e-commerce copywriter.
    
    CRITICAL INSTRUCTION:
    The user has uploaded specific Policy Documents and Style Guides below.
    You MUST prioritize these documents over general knowledge. 
    1. If the documents contain specific formatting rules, follow them exactly.
    2. If the documents contain a brand voice, adopt it perfectly.
    3. If the documents list mandatory phrases or legal disclaimers, include them.
    
    Target Channel: ${input.channel || 'General E-commerce'}
    Tone: ${input.tone || 'Professional'}
    Language: ${input.language || 'English (US)'}
    
    === START USER UPLOADED DOCUMENTS ===
    ${policies.generalPolicies || "No custom documents uploaded."}
    === END USER UPLOADED DOCUMENTS ===`;

    if (marketDemand) systemInstruction += `\n\n📢 MARKET DEMAND UPDATE: "${marketDemand}".`;

    // --- DATA ENRICHMENT UPDATE ---
    let extraContext = "";
    if (input.customerReviews) {
        extraContext += `\n[CUSTOMER VOC DATA]: The user provided these real reviews: "${input.customerReviews}". Analyze the sentiment. Mention the specific PROS mentioned by users in the description to build social proof. Address CONS subtly if possible.`;
    }
    if (input.targetKeywords) {
        extraContext += `\n[MANDATORY SEO]: You MUST include these exact keywords in the Title or Description: "${input.targetKeywords}".`;
    }

    const textPrompt = `
      Product: "${input.productName}"
      Brand: "${input.brand}"
      Features: "${input.features}"
      ${extraContext}
      
      Generate a complete product listing. Output strictly valid JSON matching:
      {
        "overview": "string",
        "title": "string",
        "bullets": ["string"],
        "longDescription": "html string",
        "seoTitle": "string",
        "seoMetaDescription": "string",
        "seoKeywords": "string",
        "socialCopy": "string"
      }
    `;

    const messages = [{ role: "system", content: systemInstruction }];

    if (input.imageBase64) {
        const imageUrl = input.imageBase64.startsWith('data:') ? input.imageBase64 : `data:image/jpeg;base64,${input.imageBase64}`;
        messages.push({
            role: "user",
            content: [
                { type: "text", text: textPrompt },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        });
    } else {
        messages.push({ role: "user", content: textPrompt });
    }

    const response = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: messages,
        response_format: { type: "json_object" },
        temperature: 0.7
    });

    return parseResponse(response.choices[0].message.content);
}

// --- API ROUTES (Identical to server.js) ---

const requireUser = (req, res, next) => {
    const username = req.headers['x-user-id'];
    if (!username) return res.status(401).json({ error: "Unauthorized: Missing User ID" });
    req.username = username;
    next();
};

app.get('/health', (req, res) => {
    res.json({ status: 'online', model: OPENAI_MODEL, provider: 'OpenAI', timestamp: Date.now() });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let users = DEFAULT_USERS;
        try {
            const usersData = await fs.readFile(USERS_FILE, 'utf-8');
            users = JSON.parse(usersData);
        } catch { }
        
        const user = users.find(u => u.username === username && u.password === password);
        if (user) {
            await ensureUserDir(username);
            res.json({ 
                success: true, 
                user: { 
                    username: user.username, 
                    name: user.name,
                    storeConnected: user.storeConnected || false,
                    storeUrl: user.storeUrl || null
                } 
            });
        } else {
            res.status(401).json({ error: "Invalid credentials" });
        }
    } catch (e) { res.status(500).json({ error: "Server error" }); }
});

app.get('/api/history', requireUser, async (req, res) => {
    try {
        const historyPath = path.join(DATA_DIR, req.username, 'history.json');
        const data = await fs.readFile(historyPath, 'utf-8');
        res.json(JSON.parse(data));
    } catch { res.json([]); }
});

app.post('/api/history', requireUser, async (req, res) => {
    try {
        const historyPath = path.join(DATA_DIR, req.username, 'history.json');
        const newItem = req.body;
        let history = [];
        try { history = JSON.parse(await fs.readFile(historyPath, 'utf-8')); } catch {}
        history.unshift(newItem);
        await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
        res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed save" }); }
});

app.delete('/api/history/:id', requireUser, async (req, res) => {
    try {
        const historyPath = path.join(DATA_DIR, req.username, 'history.json');
        let history = JSON.parse(await fs.readFile(historyPath, 'utf-8'));
        history = history.filter(item => item.id !== req.params.id);
        await fs.writeFile(historyPath, JSON.stringify(history, null, 2));
        res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed delete" }); }
});

app.get('/api/policies', requireUser, async (req, res) => {
    try {
        const { policyDir } = await ensureUserDir(req.username);
        const files = await fs.readdir(policyDir);
        const policyList = [];
        for (const file of files) {
            const stats = await fs.stat(path.join(policyDir, file));
            const content = await fs.readFile(path.join(policyDir, file), 'utf-8');
            let type = 'general';
            if (file === 'blocked_terms.txt') type = 'blocked';
            else if (file.endsWith('.json')) type = 'platform';
            else type = 'custom';
            policyList.push({ name: file, size: stats.size, type, contentPreview: content.substring(0, 100).replace(/\n/g, ' ') });
        }
        res.json(policyList);
    } catch { res.status(500).json({ error: "Failed list policies" }); }
});

app.post('/api/policies', requireUser, async (req, res) => {
    try {
        const { filename, content } = req.body;
        console.log(`📥 Uploading policy for ${req.username}: ${filename}`);
        
        const { policyDir } = await ensureUserDir(req.username);
        if (filename.includes('/')) return res.status(400).json({ error: "Invalid filename" });
        
        const filePath = path.join(policyDir, filename);
        await fs.writeFile(filePath, content);
        
        console.log(`✅ Policy saved to: ${filePath}`);
        res.json({ success: true });
    } catch (e) { 
        console.error("Upload failed:", e);
        res.status(500).json({ error: "Failed save policy" }); 
    }
});

app.delete('/api/policies/:name', requireUser, async (req, res) => {
    try {
        const { policyDir } = await ensureUserDir(req.username);
        await fs.unlink(path.join(policyDir, req.params.name));
        console.log(`🗑️ Deleted policy: ${req.params.name}`);
        res.json({ success: true });
    } catch { res.status(500).json({ error: "Failed delete policy" }); }
});

app.post('/api/detect-category', requireUser, async (req, res) => {
    try {
        const { imageBase64, categories } = req.body;
        if (!imageBase64) return res.status(400).json({ error: "Image data missing" });
        
        const result = await detectCategoryAgent(imageBase64, categories);
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/generate', requireUser, async (req, res) => {
    try {
        console.log(`\n--- 🚀 PROCESSING REQUEST FOR: ${req.username} ---`);
        const input = req.body;
        
        // 1. Load Policies
        console.log("📂 Loading policies...");
        const policies = await loadUserPolicies(req.username);
        
        console.log(`✅ Loaded Policies:`);
        policies.loadedFiles.forEach(f => console.log(`   - ${f}`));
        
        // 2. Run Validation
        console.log("🛡️ Running Safety & Logic Validation...");
        const validation = await validateInputAgent(input, policies);
        if (!validation.valid) {
            console.error(`❌ BLOCKED: ${validation.reason}`);
            return res.status(400).json({ error: `VALIDATION_ERROR: ${validation.reason}` });
        }
        console.log("✅ Validation Passed.");

        // 3. Generate Content
        console.log("✨ Generating Content (Policies Injected)...");
        const content = await generateContentAgent(input, policies);
        console.log("✅ Generation Complete.\n");
        res.json(content);
    } catch (error) {
        console.error("❌ ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/regenerate-market', requireUser, async (req, res) => {
    try {
        const { input, marketDemand } = req.body;
        console.log(`\n--- 🔄 REGENERATING FOR MARKET DEMAND: ${marketDemand} ---`);
        
        const policies = await loadUserPolicies(req.username);
        const content = await generateContentAgent(input, policies, marketDemand);
        res.json(content);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- PLATFORM INTEGRATIONS (SHOPIFY SIMULATION) ---
app.post('/api/integrations/publish', requireUser, async (req, res) => {
    const { platform, content, productName } = req.body;
    console.log(`\n--- 🚀 PUBLISHING TO ${platform.toUpperCase()} ---`);
    console.log(`Product: ${productName}`);
    
    // In a real app, we would look up the user's stored OAuth token:
    // const token = await db.tokens.find({ user: req.username, platform: 'shopify' });
    // And call: await axios.post('https://store.myshopify.com/admin/products.json', ...);
    
    // Simulate API Latency
    await new Promise(r => setTimeout(r, 1500));
    
    if (Math.random() > 0.9) {
        // 10% chance of random failure for realism in demos
        return res.status(502).json({ error: "Platform Gateway Timeout" });
    }

    const mockId = Math.floor(Math.random() * 1000000);
    const mockUrl = `https://sam-ai-demo.myshopify.com/products/${productName.toLowerCase().replace(/\s+/g, '-')}`;

    console.log(`✅ Publish Successful: ${mockUrl}`);
    res.json({ 
        success: true, 
        platformId: mockId, 
        publishedUrl: mockUrl 
    });
});

app.listen(port, () => {
  console.log(`🚀 OpenAI Backend running on http://localhost:${port}`);
  console.log(`📡 Model: ${OPENAI_MODEL}`);
  console.log(`📂 Data Storage: ${DATA_DIR}`);
  if (OPENAI_BASE_URL) console.log(`🔗 Custom Base URL: ${OPENAI_BASE_URL}`);
});
