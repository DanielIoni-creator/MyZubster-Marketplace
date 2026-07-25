const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

// =============================================
// CONFIGURAZIONE - URL GATEWAY FISSATO
// =============================================
const GATEWAY_API_URL = 'http://localhost:3001';

// =============================================
// INIZIALIZZAZIONE APP
// =============================================
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// DATABASE SQLITE
// =============================================
let db;

async function initDatabase() {
    const dbPath = path.join(__dirname, 'data', 'marketplace.sqlite');

    // Assicura che la directory data esista
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Crea le tabelle se non esistono
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            wallet_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            price_xmr REAL NOT NULL,
            image_url TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listing_id INTEGER NOT NULL,
            buyer_id INTEGER NOT NULL,
            seller_id INTEGER NOT NULL,
            amount_xmr REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            payment_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (listing_id) REFERENCES listings(id),
            FOREIGN KEY (buyer_id) REFERENCES users(id),
            FOREIGN KEY (seller_id) REFERENCES users(id)
        );
    `);

    console.log('✅ Connessione database stabilita');
    return db;
}

// =============================================
// FUNZIONE PER CHIAMARE IL GATEWAY
// =============================================
async function callGateway(endpoint, method = 'GET', body = null) {
    // Assicura che l'endpoint inizi con /api/
    const apiEndpoint = endpoint.startsWith('/api/') ? endpoint : '/api' + endpoint;
    const url = `${GATEWAY_API_URL}${apiEndpoint}`;

    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Gateway responded with ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Gateway error (${endpoint}):`, error.message);
        return { gateway: 'unreachable', error: error.message };
    }
}

// =============================================
// ROTTE API
// =============================================

// --- Health Check ---
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'MyZubster-Marketplace',
        version: '1.0.0',
        database: db ? 'sqlite' : 'disconnected'
    });
});

// --- Gateway Status ---
app.get('/api/gateway/status', async (req, res) => {
    const result = await callGateway('/health');
    res.json({
        gateway: result.status === 'ok' ? { status: 'ok' } : { status: 'unreachable' },
        status: result.status === 'ok' ? 'connected' : 'disconnected'
    });
});

// --- Users ---
app.get('/api/users', async (req, res) => {
    try {
        const users = await db.all('SELECT id, username, email, wallet_address, created_at FROM users');
        res.json(users);
    } catch (error) {
        console.error('❌ Errore get users:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const { username, email, password_hash, wallet_address } = req.body;

        const result = await db.run(
            'INSERT INTO users (username, email, password_hash, wallet_address) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, wallet_address]
        );

        const user = await db.get('SELECT id, username, email, wallet_address, created_at FROM users WHERE id = ?', result.lastID);
        res.status(201).json(user);
    } catch (error) {
        console.error('❌ Errore create user:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Listings ---
app.get('/api/listings', async (req, res) => {
    try {
        const listings = await db.all(`
            SELECT l.*, u.username as seller_name
            FROM listings l
            JOIN users u ON l.user_id = u.id
            WHERE l.status = 'active'
            ORDER BY l.created_at DESC
        `);
        res.json(listings);
    } catch (error) {
        console.error('❌ Errore get listings:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/listings', async (req, res) => {
    try {
        const { user_id, title, description, price_xmr, image_url } = req.body;

        const result = await db.run(
            'INSERT INTO listings (user_id, title, description, price_xmr, image_url) VALUES (?, ?, ?, ?, ?)',
            [user_id, title, description, price_xmr, image_url]
        );

        const listing = await db.get('SELECT * FROM listings WHERE id = ?', result.lastID);
        res.status(201).json(listing);
    } catch (error) {
        console.error('❌ Errore create listing:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- Orders ---
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await db.all(`
            SELECT o.*,
                   l.title as listing_title,
                   buyer.username as buyer_name,
                   seller.username as seller_name
            FROM orders o
            JOIN listings l ON o.listing_id = l.id
            JOIN users buyer ON o.buyer_id = buyer.id
            JOIN users seller ON o.seller_id = seller.id
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        console.error('❌ Errore get orders:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        const { listing_id, buyer_id, seller_id, amount_xmr, payment_id } = req.body;

        // Verifica che il listing esista
        const listing = await db.get('SELECT * FROM listings WHERE id = ?', listing_id);
        if (!listing) {
            return res.status(404).json({ error: 'Listing non trovato' });
        }

        const result = await db.run(
            'INSERT INTO orders (listing_id, buyer_id, seller_id, amount_xmr, payment_id) VALUES (?, ?, ?, ?, ?)',
            [listing_id, buyer_id, seller_id, amount_xmr, payment_id]
        );

        const order = await db.get('SELECT * FROM orders WHERE id = ?', result.lastID);
        res.status(201).json(order);
    } catch (error) {
        console.error('❌ Errore create order:', error);
        res.status(500).json({ error: error.message });
    }
});

// --- NFT Routes (integrazione con Tari) ---
app.get('/api/nft', async (req, res) => {
    try {
        res.json({
            message: 'NFT API - Integrazione Tari in corso',
            available: false,
            template: 'tari-nft-template'
        });
    } catch (error) {
        console.error('❌ Errore get NFT:', error);
        res.status(500).json({ error: error.message });
    }
});

// =============================================
// AVVIO SERVER
// =============================================
async function startServer() {
    try {
        await initDatabase();

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server avviato sulla porta ${PORT}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`👥 Users: http://localhost:${PORT}/api/users`);
            console.log(`🔗 Gateway URL: ${GATEWAY_API_URL}`);
        });
    } catch (error) {
        console.error('❌ Errore avvio server:', error);
        process.exit(1);
    }
}

// Gestione segnali di terminazione
process.on('SIGINT', () => {
    console.log('\n🛑 Server arrestato');
    process.exit(0);
});

startServer();
