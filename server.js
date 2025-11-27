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

// Connect to MongoDB
async function connectToDatabase() {
    try {
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas');
        db = client.db('trazzanet');
        lotesCollection = db.collection('Lotes');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

// API Routes

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
