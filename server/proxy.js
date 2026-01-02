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

        // TTL: 60 seconds for live details
        if (ageInSeconds < 60) {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            if (!json.error) return res.json(json);
        }
    }

    queueRequest(id);
    res.status(202).json({ status: 'queued', message: 'Detail stale or missing' });
});

// 3. Match Statistics (with freshness check)
app.get('/api/sofascore/event/:id/statistics', (req, res) => {
    const id = req.params.id;
    const filePath = path.join(STATS_DIR, `${id}_stats.json`);

    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const ageInSeconds = (Date.now() - stats.mtimeMs) / 1000;

        // TTL: 60 seconds for live statistics
        // Even if it's an error/empty file, we cache it for 60s to avoid spamming the scraper
        if (ageInSeconds < 60) {
            const data = fs.readFileSync(filePath, 'utf8');
            const json = JSON.parse(data);
            return res.json(json);
        }
    }

    queueRequest(id);
    res.status(202).json({ status: 'queued', message: 'Stats stale or missing' });
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

app.listen(PORT, () => {
    console.log(`[PROXY SERVER] Running on http://localhost:${PORT}`);
    startScraper();
    startConsensusScraper();
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
