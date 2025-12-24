const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Database setup
const DB_PATH = 'clients.db';

function initializeDatabase() {
    const db = new sqlite3.Database(DB_PATH);

    // Create tables if they don't exist
    db.serialize(() => {
        db.run(`
            CREATE TABLE IF NOT EXISTS clients (
                id INTEGER PRIMARY KEY,
                name TEXT,
                phone TEXT,
                email TEXT,
                address TEXT
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS expenses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                date TEXT,
                product TEXT,
                price REAL,
                FOREIGN KEY (client_id) REFERENCES clients (id)
            )
        `);

        db.run(`
            CREATE TABLE IF NOT EXISTS snippets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                text TEXT,
                price REAL
            )
        `);
    });

    return db;
}

// Initialize database
const db = initializeDatabase();

// API Routes

// Get all clients with their expenses
app.get('/api/clients', (req, res) => {
    const query = `
        SELECT c.id, c.name, c.phone, c.email, c.address,
               GROUP_CONCAT(JSON_OBJECT('date', e.date, 'product', e.product, 'price', e.price)) as expenses
        FROM clients c
        LEFT JOIN expenses e ON c.id = e.client_id
        GROUP BY c.id
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const clients = rows.map(row => ({
            id: row.id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            address: row.address,
            expenses: row.expenses ? JSON.parse(`[${row.expenses}]`) : []
        }));

        res.json(clients);
    });
});

// Save all clients (replace existing data)
app.post('/api/clients', (req, res) => {
    const clients = req.body;

    // Begin transaction
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Clear existing data
        db.run('DELETE FROM expenses');
        db.run('DELETE FROM clients');

        // Insert new data
        const clientStmt = db.prepare('INSERT INTO clients (id, name, phone, email, address) VALUES (?, ?, ?, ?, ?)');
        const expenseStmt = db.prepare('INSERT INTO expenses (client_id, date, product, price) VALUES (?, ?, ?, ?)');

        clients.forEach(client => {
            clientStmt.run(client.id, client.name, client.phone, client.email, client.address);
            client.expenses.forEach(expense => {
                expenseStmt.run(client.id, expense.date, expense.product, expense.price);
            });
        });

        let finalizedCount = 0;
        const onFinalize = () => {
            finalizedCount++;
            if (finalizedCount === 2) {
                db.run('COMMIT', (err) => {
                    if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: err.message });
                    }
                    res.json({ message: 'Clients saved successfully' });
                });
            }
        };

        clientStmt.finalize(onFinalize);
        expenseStmt.finalize(onFinalize);
    });
});

// Get all snippets
app.get('/api/snippets', (req, res) => {
    db.all('SELECT text, price FROM snippets', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// Save all snippets (replace existing data)
app.post('/api/snippets', (req, res) => {
    const snippets = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Clear existing data
        db.run('DELETE FROM snippets');

        // Insert new data
        const stmt = db.prepare('INSERT INTO snippets (text, price) VALUES (?, ?)');
        snippets.forEach(snippet => {
            stmt.run(snippet.text, snippet.price);
        });
        stmt.finalize();

        db.run('COMMIT', (err) => {
            if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: 'Snippets saved successfully' });
        });
    });
});

// Export database
app.get('/api/export-db', (req, res) => {
    if (!fs.existsSync(DB_PATH)) {
        return res.status(404).json({ error: 'Database not found' });
    }

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment; filename="clients.db"');

    const fileStream = fs.createReadStream(DB_PATH);
    fileStream.pipe(res);
});

// Import database
app.post('/api/import-db', upload.single('database'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const tempPath = req.file.path;
    const targetPath = DB_PATH;

    // Replace the current database with the uploaded one
    fs.rename(tempPath, targetPath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to import database' });
        }

        // Reinitialize database connection
        db.close();
        const newDb = initializeDatabase();

        res.json({ message: 'Database imported successfully' });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
