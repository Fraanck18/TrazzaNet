// ===================================
// Configuration
// ===================================
const API_BASE_URL = 'http://localhost:3000/api';
let complianceChartInstance = null;
let currentLoteData = null;

// Mapa de Certificaciones y sus Métricas de Cumplimiento (ejemplo de lógica de auditoría)
// Nota: En una app real, esta lógica sería más compleja y tal vez estaría en el backend.
const CERTIFICATION_METRICS = {
    globalgap: {
        name: 'GlobalGAP',
        metrics: [
            { label: 'Trazabilidad', weight: 30 },
            { label: 'Uso de Pesticidas', weight: 40 },
            { label: 'Registro de Cosecha', weight: 15 },
            { label: 'Manejo de Agua', weight: 15 }
        ]
    },
    brcgs: {
        name: 'BRCGS',
        metrics: [
            { label: 'Seguridad Alimentaria', weight: 40 },
            { label: 'Control de Alérgenos', weight: 25 },
            { label: 'Instalaciones', weight: 20 },
            { label: 'Higiene Personal', weight: 15 }
        ]
    },
    fairtrade: {
        name: 'Fair Trade',
        metrics: [
            { label: 'Precio Justo', weight: 35 },
            { label: 'Condiciones Laborales', weight: 35 },
            { label: 'Sostenibilidad', weight: 30 }
        ]
    },
    organico: {
        name: 'Orgánica',
        metrics: [
            { label: 'Sin Químicos Sintéticos', weight: 50 },
            { label: 'Manejo de Suelos', weight: 30 },
            { label: 'Control de Plagas', weight: 20 }
        ]
    }
};

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Obtener Lote ID y Certificación de la URL
    const params = new URLSearchParams(window.location.search);
    const loteId = params.get('loteId');
    const certType = params.get('cert');

    if (loteId && certType) {
        document.getElementById('loteIdTitle').textContent = loteId;
        document.getElementById('certName').textContent = CERTIFICATION_METRICS[certType].name || 'Desconocida';
        loadLoteDetails(loteId, certType);
    } else {
        showError('❌ Lote ID o Certificación no especificada en la URL.');
    }
});

// ===================================
// Load Lote Details
// ===================================
async function loadLoteDetails(loteId, certType) {
    showLoading(true);

    try {
        // En un sistema real, necesitarías una ruta API específica: GET /api/lotes/:loteId
        // Por ahora, usamos /api/lotes y filtramos en el frontend, asumiendo que el loteId es único.
        const response = await fetch(`${API_BASE_URL}/lotes`);

        if (!response.ok) {
            throw new Error('Error al cargar los datos de lotes');
        }

        const data = await response.json();
        currentLoteData = data.data.find(lote => lote.LOTE_ID === loteId);

        if (currentLoteData) {
            updateLoteInfo(currentLoteData, certType);
            renderComplianceChart(currentLoteData, certType);
            generateDeviationLog(currentLoteData, certType);
        } else {
            showError(`❌ Lote ID "${loteId}" no encontrado.`);
        }

    } catch (error) {
        console.error('Error loading lote details:', error);
        showError('❌ Error de red o del servidor al cargar el lote.');
    } finally {
        showLoading(false);
    }
}

// ===================================
// Update UI
// ===================================

function updateLoteInfo(lote, certType) {
    const certName = CERTIFICATION_METRICS[certType].name;
    const isCompliant = generateComplianceScore(lote, certType).totalComplianceScore > 75; // Ejemplo de umbral

    const resultadoElement = document.getElementById('detailResultadoAuditoria');
    
    document.getElementById('detailFechaCosecha').textContent = lote.FECHA_COSECHA || 'N/A';
    document.getElementById('detailFinca').textContent = lote.FINCA || 'N/A';
    document.getElementById('detailVariedad').textContent = lote.VARIEDAD || 'N/A';
    document.getElementById('detailPeso').textContent = `${lote.PESO_KG || 0} kg`;
    document.getElementById('detailCalidadStatus').textContent = lote.CALIDAD_STATUS || 'N/A';
    document.getElementById('detailTemp').textContent = `${lote.TEMPERATURA_C || 0} °C`;
    document.getElementById('detailCertificacion').textContent = certName;
    
    resultadoElement.textContent = isCompliant ? 'APROBADO' : 'RECHAZADO';
    resultadoElement.className = isCompliant ? 'detail-value pass' : 'detail-value fail';
}

/**
 * Genera un score de cumplimiento y un log de desvíos simulado.
 * @param {object} lote - Objeto con los datos del lote.
 * @param {string} certType - Tipo de certificación.
 * @returns {object} Score de cumplimiento y el log de desvíos.
 */
function generateComplianceScore(lote, certType) {
    const metrics = CERTIFICATION_METRICS[certType].metrics;
    let scores = {};
    let totalScore = 0;
    let totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);

    const log = [];

    // Lógica de auditoría simulada
    metrics.forEach(metric => {
        let score = 0;
        let logItem = { status: 'pass', text: `✅ Cumplimiento de ${metric.label} (Score: 100%)` };

        // Simulación de condiciones de falla (muy simple, solo para demo)
        if (metric.label.includes('Pesticidas') && (lote.PESTICIDA_NIVEL || 0.05) > 0.02) {
            score = 30; // 30% de cumplimiento
            logItem = { status: 'fail', text: `❌ Nivel de pesticida detectado: ${(lote.PESTICIDA_NIVEL || 0.05).toFixed(2)} ppm. Límite: 0.02 ppm. (Score: 30%)` };
        } else if (metric.label.includes('Temperatura') && (lote.TEMPERATURA_C || 0) > 20) {
            score = 50; // 50% de cumplimiento
            logItem = { status: 'fail', text: `❌ Temperatura de almacenamiento/transporte fuera de rango: ${lote.TEMPERATURA_C} °C. Máximo permitido: 20°C. (Score: 50%)` };
        } else if (metric.label.includes('Trazabilidad') && lote.FINCA === 'Finca Perdida') {
            score = 0; // 0% de cumplimiento
            logItem = { status: 'fail', text: `❌ Falta de registro del origen (Finca). Trazabilidad incompleta. (Score: 0%)` };
        } else {
             score = Math.floor(Math.random() * 20) + 80; // Aleatorio entre 80% y 100%
             logItem.text = `✅ Cumplimiento de ${metric.label} (Score: ${score}%)`;
        }
        
        scores[metric.label] = score;
        totalScore += (score / 100) * metric.weight;
        log.push(logItem);
    });
    
    // Normalizar la puntuación total al 100%
    const totalComplianceScore = Math.min(100, (totalScore / totalWeight) * 100);

    return { scores, totalComplianceScore, log };
}

// ===================================
// Chart.js - Radar Chart
// ===================================
function renderComplianceChart(lote, certType) {
    const complianceData = generateComplianceScore(lote, certType);
    const metrics = CERTIFICATION_METRICS[certType].metrics.map(m => m.label);
    const scores = metrics.map(label => complianceData.scores[label]);

    if (complianceChartInstance) {
        complianceChartInstance.destroy();
    }

    const ctx = document.getElementById('complianceChart').getContext('2d');

    complianceChartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: metrics,
            datasets: [{
                label: `Cumplimiento ${CERTIFICATION_METRICS[certType].name}`,
                data: scores,
                backgroundColor: 'rgba(16, 185, 129, 0.4)', // --primary-green
                borderColor: 'rgba(16, 185, 129, 1)',
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                    grid: { color: 'rgba(255, 255, 255, 0.15)' },
                    pointLabels: {
                        color: 'var(--text-secondary)',
                        font: { size: 12, weight: '600' }
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: {
                        backdropColor: 'var(--bg-primary)',
                        color: 'var(--text-muted)',
                        stepSize: 25,
                        callback: (value) => `${value}%`
                    }
                }
            },
            plugins: {
                legend: {
                    labels: { color: 'var(--text-primary)' }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.dataset.label}: ${context.raw}% de cumplimiento`
                    }
                },
                // Usamos el plugin datalabels para mostrar los puntos en el radar
                datalabels: {
                    color: 'var(--text-primary)',
                    font: { weight: 'bold' },
                    formatter: (value) => `${value}%`
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// ===================================
// Deviation Log
// ===================================

function generateDeviationLog(lote, certType) {
    const { log } = generateComplianceScore(lote, certType);
    const logContainer = document.getElementById('deviationLog');
    logContainer.innerHTML = ''; // Limpiar log anterior

    log.forEach(item => {
        const logItem = document.createElement('div');
        logItem.className = `log-item ${item.status}`;
        logItem.textContent = item.text;
        logContainer.appendChild(logItem);
    });

    if (log.length === 0) {
        logContainer.innerHTML = '<div class="log-item pass">✅ No se detectaron desvíos. El lote cumple con todos los criterios de la certificación.</div>';
    }
}


// ===================================
// Utility Functions (Copiadas de dashboard.js/auditoria.js)
// ===================================

function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Sustituir alert() por una función que use una UI personalizada
function showError(message) {
    console.error(message);
    const statusMessage = document.getElementById('statusMessage') || document.createElement('div');
    if (!document.getElementById('statusMessage')) {
        statusMessage.id = 'statusMessage';
        statusMessage.classList.add('status-message');
        document.body.appendChild(statusMessage);
    }
    statusMessage.textContent = message;
    statusMessage.className = `status-message error`;
    statusMessage.classList.remove('hidden');
    
    // Auto-ocultar el mensaje
    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 5000);
}
