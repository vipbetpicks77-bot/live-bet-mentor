import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request Logger Middleware
app.use((req, res, next) => {
    const log = `${new Date().toISOString()} ${req.method} ${req.url}\n`;
    fs.appendFileSync(path.join(__dirname, 'proxy.log'), log);
    next();
});

const SOFASCORE_FILE = path.join(__dirname, 'sofascore_live.json');
const STATS_DIR = path.join(__dirname, 'stats');
const REQUEST_QUEUE = path.join(__dirname, 'stats_request.json');

if (!fs.existsSync(STATS_DIR)) fs.mkdirSync(STATS_DIR, { recursive: true });

app.use('/data', express.static(__dirname));

// 1. Live Events List
app.get('/api/sofascore/live', (req, res) => {
    if (fs.existsSync(SOFASCORE_FILE)) {
        const data = fs.readFileSync(SOFASCORE_FILE, 'utf8');
        return res.json(JSON.parse(data));
    }
    res.status(404).json({ error: 'Data not found yet' });
});

// 2. Match Details (with freshness check)
app.get('/api/sofascore/event/:id', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(STATS_DIR, `${id}_detail.json`);

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ageInSeconds = (Date.now() - stats.mtimeMs) / 1000;

        // Still queue if older than 60s, but return the current data
        if (ageInSeconds >= 60) {
            queueRequest(id);
        }

        const data = fs.readFileSync(filePath, 'utf8');
        try {
            const json = JSON.parse(data);
            if (!json.error) return res.json(json);
        } catch (e) {
            console.error(`Error parsing ${filePath}:`, e);
        }
    }

    queueRequest(id);
    res.status(202).json({ status: 'queued', message: 'Detail missing' });
});

// 3. Match Statistics (with freshness check)
app.get('/api/sofascore/event/:id/statistics', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(STATS_DIR, `${id}_stats.json`);

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ageInSeconds = (Date.now() - stats.mtimeMs) / 1000;

        // Still queue if older than 60s, but return current data
        if (ageInSeconds >= 60) {
            queueRequest(id);
        }

        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            return res.json(json);
        } catch (e) {
            console.error(`Error parsing ${filePath}:`, e);
        }
    }

    queueRequest(id);
    res.status(202).json({ status: 'queued', message: 'Stats missing' });
});

function queueRequest(id) {
    let queue = { ids: [] };
    if (fs.existsSync(REQUEST_QUEUE)) {
        try {
            queue = JSON.parse(fs.readFileSync(REQUEST_QUEUE, 'utf8'));
        } catch (e) { }
    }
    if (!queue.ids.includes(id)) {
        queue.ids.push(id);
        fs.writeFileSync(REQUEST_QUEUE, JSON.stringify(queue));
    }
}

let scraperProcess = null;

function startScraper() {
    console.log('[PROXY] Starting SofaScore CDP Scraper...');
    scraperProcess = spawn('python', ['server/sofascore_scraper.py'], {
        stdio: 'inherit'
    });

    scraperProcess.on('close', (code) => {
        console.log(`[PROXY] Scraper process exited with code ${code}. Restarting...`);
        setTimeout(startScraper, 5000);
    });
}

// --- CONSENSUS API ---
app.get('/api/consensus', (req, res) => {
    const filePath = path.join(__dirname, 'consensus_data.json');
    if (fs.existsSync(filePath)) {
        try {
            console.log('[PROXY] Consensus request received');
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: "Consensus parse error" });
        }
    } else {
        res.json({}); // Return empty if scraper hasn't run yet
    }
});

// --- LIVE ODDS API ---
const ODDS_FILE = path.join(__dirname, 'live_odds.json');

app.get('/api/odds/live', (req, res) => {
    if (fs.existsSync(ODDS_FILE)) {
        try {
            console.log('[PROXY] Odds request received');
            const data = JSON.parse(fs.readFileSync(ODDS_FILE, 'utf8'));
            res.json(data);
        } catch (e) {
            res.status(500).json({ error: "Odds parse error" });
        }
    } else {
        res.json({ matches: [], timestamp: 0, message: 'Odds scraper not running yet' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[PROXY SERVER] Running on http://0.0.0.0:${PORT} (accessible from network)`);
    startScraper();
    startConsensusScraper();
    startOddsScraper(); // Live odds from OddsPortal
});

function startConsensusScraper() {
    console.log('[PROXY] Initializing Consensus Scraper...');
    const spawnScraper = () => {
        const pythonProcess = spawn('python', [path.join(__dirname, 'consensus_scraper.py')]);
        pythonProcess.stdout.on('data', (data) => console.log(`[CONSENSUS_STDOUT] ${data}`));
        pythonProcess.stderr.on('data', (data) => console.error(`[CONSENSUS_STDERR] ${data}`));
    };

    spawnScraper(); // Run once at start
    setInterval(spawnScraper, 4 * 60 * 60 * 1000); // Re-run every 4 hours
}

// Odds Scraper (OddsPortal) - disabled by default, enable when needed
function startOddsScraper() {
    console.log('[PROXY] Initializing Odds Scraper...');
    const pythonProcess = spawn('python', [path.join(__dirname, 'odds_scraper.py')], {
        stdio: 'inherit'
    });

    pythonProcess.on('close', (code) => {
        console.log(`[PROXY] Odds scraper exited with code ${code}. Restarting in 30s...`);
        setTimeout(startOddsScraper, 30000);
    });
}
