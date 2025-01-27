const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'dextrategia'
});

// Salvar disponibilidade
router.post('/api/consultant/availability', async (req, res) => {
    const { consultantId, date, hours } = req.body;
    try {
        const [existing] = await pool.query(
            'SELECT id FROM consultant_availability WHERE consultant_id = ? AND date = ?',
            [consultantId, date]
        );

        if (existing.length > 0) {
            await pool.query(
                'UPDATE consultant_availability SET hours = ? WHERE consultant_id = ? AND date = ?',
                [JSON.stringify(hours), consultantId, date]
            );
        } else {
            await pool.query(
                'INSERT INTO consultant_availability (consultant_id, date, hours) VALUES (?, ?, ?)',
                [consultantId, date, JSON.stringify(hours)]
            );
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Buscar disponibilidade
router.get('/api/consultant/availability/:consultantId/:date?', async (req, res) => {
    const { consultantId, date } = req.params;
    try {
        let query = 'SELECT date, hours FROM consultant_availability WHERE consultant_id = ?';
        const params = [consultantId];
        
        if (date) {
            query += ' AND date = ?';
            params.push(date);
        }
        
        const [results] = await pool.query(query, params);
        res.json(results.map(row => ({
            date: row.date,
            hours: JSON.parse(row.hours)
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;