const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// MongoDB connection
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

let db;
let lotesCollection;
let usuariosCollection;

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        db = client.db('trazzanet');
        lotesCollection = db.collection('Lotes');
        usuariosCollection = db.collection('Usuarios');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// API Routes

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { ruc, usuario, password } = req.body;

        if (!ruc || !usuario || !password) {
            return res.status(400).json({
                success: false,
                error: 'Todos los campos son obligatorios'
            });
        }

        const user = await usuariosCollection.findOne({
            RUC: ruc,
            usuario: usuario,
            contraseña: password
        });

        if (user) {
            res.json({
                success: true,
                message: 'Login exitoso',
                user: {
                    usuario: user.usuario,
                    ruc: user.RUC
                }
            });
        } else {
            res.status(401).json({
                success: false,
                error: 'Credenciales incorrectas'
            });
        }
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({
            success: false,
            error: 'Error en el servidor durante el login'
        });
    }
});

// Get all lotes (batches)
app.get('/api/lotes', async (req, res) => {
    try {
        const lotes = await lotesCollection
            .find({})
            .sort({ FECHA_COSECHA: -1 })
            .toArray();

        res.json({
            success: true,
            count: lotes.length,
            data: lotes
        });
    } catch (error) {
        console.error('Error fetching lotes:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener los lotes'
        });
    }
});

// Get dashboard statistics
app.get('/api/dashboard-stats', async (req, res) => {
    try {
        // Get all lotes
        const lotes = await lotesCollection.find({}).toArray();

        // Calculate statistics
        const totalLotes = lotes.length;
        const totalWeight = lotes.reduce((sum, lote) => sum + (lote.PESO_NETO_KG || 0), 0);
        const averageWeight = totalLotes > 0 ? totalWeight / totalLotes : 0;

        // Quality statistics
        const okLotes = lotes.filter(lote => lote.CALIDAD_STATUS === 'OK').length;
        const qualityPercentage = totalLotes > 0 ? (okLotes / totalLotes) * 100 : 0;

        // Group by farm (FINCA)
        const batchesByFarm = lotes.reduce((acc, lote) => {
            const farm = lote.FINCA || 'Desconocido';
            acc[farm] = (acc[farm] || 0) + 1;
            return acc;
        }, {});

        // Group by variety (VARIEDAD)
        const batchesByVariety = lotes.reduce((acc, lote) => {
            const variety = lote.VARIEDAD || 'Desconocido';
            acc[variety] = (acc[variety] || 0) + 1;
            return acc;
        }, {});

        // Quality status distribution
        const qualityDistribution = lotes.reduce((acc, lote) => {
            const status = lote.CALIDAD_STATUS || 'Desconocido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // Temperature statistics
        const temperatures = lotes
            .map(lote => lote.TEMPERATURA_C)
            .filter(temp => temp !== null && temp !== undefined);
        const avgTemperature = temperatures.length > 0
            ? temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length
            : 0;

        // Weight distribution over time
        const weightByDate = lotes
            .sort((a, b) => new Date(a.FECHA_COSECHA) - new Date(b.FECHA_COSECHA))
            .map(lote => ({
                date: lote.FECHA_COSECHA,
                weight: lote.PESO_NETO_KG,
                loteId: lote.LOTE_ID
            }));

        // Recent batches (last 10)
        const recentBatches = lotes
            .sort((a, b) => new Date(b.FECHA_COSECHA) - new Date(a.FECHA_COSECHA))
            .slice(0, 10);

        res.json({
            success: true,
            stats: {
                totalLotes,
                totalWeight: totalWeight.toFixed(2),
                averageWeight: averageWeight.toFixed(2),
                qualityPercentage: qualityPercentage.toFixed(1),
                avgTemperature: avgTemperature.toFixed(1),
                batchesByFarm,
                batchesByVariety,
                qualityDistribution,
                weightByDate,
                recentBatches
            }
        });
    } catch (error) {
        console.error('Error calculating dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: 'Error al calcular estadísticas'
        });
    }
});

// Audit endpoint - Get batch for audit
app.get('/api/audit/:loteId', async (req, res) => {
    try {
        const { loteId } = req.params;

        // Find the batch
        const batch = await lotesCollection.findOne({ LOTE_ID: loteId });

        if (!batch) {
            return res.status(404).json({
                success: false,
                error: 'Lote no encontrado'
            });
        }

        // Generate blockchain hash (simulated)
        const crypto = require('crypto');
        const hashData = JSON.stringify({
            loteId: batch.LOTE_ID,
            fecha: batch.FECHA_COSECHA,
            finca: batch.FINCA
        });
        const blockchainHash = crypto.createHash('sha256').update(hashData).digest('hex');

        // Generate mock blockchain trail
        const blockchainTrail = [];
        for (let i = 0; i < 5; i++) {
            const blockData = `${batch.LOTE_ID}-block-${i}`;
            const blockHash = crypto.createHash('sha256').update(blockData).digest('hex');
            blockchainTrail.push({
                blockNumber: i + 1,
                timestamp: new Date(Date.now() - (i * 3600000)),
                hash: blockHash
            });
        }

        // Generate audit log
        const auditLog = [
            {
                timestamp: new Date(batch.FECHA_COSECHA),
                action: 'Registro Inicial',
                field: 'LOTE_ID',
                value: batch.LOTE_ID,
                status: 'Verificado'
            },
            {
                timestamp: new Date(new Date(batch.FECHA_COSECHA).getTime() + 1800000),
                action: 'Actualización',
                field: 'PESO_NETO_KG',
                value: `${batch.PESO_NETO_KG} kg`,
                status: 'Verificado'
            },
            {
                timestamp: new Date(new Date(batch.FECHA_COSECHA).getTime() + 3600000),
                action: 'Validación',
                field: 'CALIDAD_STATUS',
                value: batch.CALIDAD_STATUS || 'N/A',
                status: 'Verificado'
            },
            {
                timestamp: new Date(new Date(batch.FECHA_COSECHA).getTime() + 5400000),
                action: 'Verificación',
                field: 'TEMPERATURA_C',
                value: `${batch.TEMPERATURA_C}°C`,
                status: 'Verificado'
            },
            {
                timestamp: new Date(new Date(batch.FECHA_COSECHA).getTime() + 7200000),
                action: 'Certificación',
                field: 'BLOCKCHAIN_HASH',
                value: 'Generado',
                status: 'Verificado'
            }
        ];

        res.json({
            success: true,
            audit: {
                batch,
                verified: true,
                blockchainHash,
                integrityScore: 100,
                timestamp: new Date(),
                blockchainTrail: blockchainTrail.reverse(),
                auditLog
            }
        });
    } catch (error) {
        console.error('Error performing audit:', error);
        res.status(500).json({
            success: false,
            error: 'Error al realizar la auditoría'
        });
    }
});

// Upload endpoint - Batch insert
app.post('/api/upload', async (req, res) => {
    try {
        const data = req.body;

        if (!Array.isArray(data) || data.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Datos inválidos. Se espera un array de registros.'
            });
        }

        // Optional: Process data (e.g., convert dates)
        const processedData = data.map(item => {
            // Clone item to avoid mutating original
            const newItem = { ...item };

            // Try to convert FECHA_COSECHA to Date object if it exists
            if (newItem.FECHA_COSECHA) {
                const date = new Date(newItem.FECHA_COSECHA);
                if (!isNaN(date.getTime())) {
                    newItem.FECHA_COSECHA = date.toISOString().split('T')[0]; // Store as YYYY-MM-DD string or Date object depending on preference. 
                    // Based on existing code using new Date(lote.FECHA_COSECHA), string is likely fine, but let's keep it consistent.
                }
            }
            return newItem;
        });

        const result = await lotesCollection.insertMany(processedData);

        res.json({
            success: true,
            message: 'Datos subidos correctamente',
            count: result.insertedCount
        });
    } catch (error) {
        console.error('Error uploading data:', error);
        res.status(500).json({
            success: false,
            error: 'Error al guardar los datos en la base de datos'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
async function startServer() {
    await connectToDatabase();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Dashboard available at http://localhost:${PORT}/dashboard.html`);
    });
}

startServer();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    await client.close();
    process.exit(0);
});
