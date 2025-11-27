// ===================================
// Configuration
// ===================================
const API_BASE_URL = 'http://localhost:3000/api';

// ===================================
// Initialize Audit Module
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    updateLastUpdateTime();

    // Start Simulation Button
    document.getElementById('startSimulationBtn').addEventListener('click', () => {
        startSimulation();
    });

    // Info buttons for certification cards
    const infoButtons = document.querySelectorAll('.info-btn');
    infoButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            showCertificationInfo(e.currentTarget.closest('.cert-card').dataset.cert);
        });
    });

    // Certification card selection
    const certCards = document.querySelectorAll('.cert-card');
    certCards.forEach(card => {
        card.addEventListener('click', () => {
            // Toggle selection
            certCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
        });
    });
});

// ===================================
// Start Simulation
// ===================================
async function startSimulation() {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/lotes`);

        if (!response.ok) {
            throw new Error('Error al cargar los lotes');
        }

        const result = await response.json();

        if (result.success && result.data) {
            displayBatches(result.data);
            updateLastUpdateTime();
        } else {
            showError('No se pudieron cargar los lotes');
        }
    } catch (error) {
        console.error('Error loading batches:', error);
        showError('Error de conexión. Asegúrate de que el servidor esté ejecutándose.');
    } finally {
        showLoading(false);
    }
}

// ===================================
// Display Batches
// ===================================
function displayBatches(batches) {
    const batchListSection = document.getElementById('batchListSection');
    const batchGrid = document.getElementById('batchGrid');
    const batchCount = document.getElementById('batchCount');

    // Clear existing batches
    batchGrid.innerHTML = '';

    // Update batch count
    batchCount.textContent = `${batches.length} lote${batches.length !== 1 ? 's' : ''}`;

    // Create batch cards
    batches.forEach(batch => {
        const batchCard = createBatchCard(batch);
        batchGrid.appendChild(batchCard);
    });

    // Show the batch list section
    batchListSection.classList.remove('hidden');

    // Scroll to batch list
    batchListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================================
// Create Batch Card
// ===================================
function createBatchCard(batch) {
    const card = document.createElement('div');
    card.className = 'batch-card';
    card.dataset.loteId = batch.LOTE_ID;

    const date = new Date(batch.FECHA_COSECHA);
    const formattedDate = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    card.innerHTML = `
        <div class="batch-id">${batch.LOTE_ID}</div>
        <div class="batch-info">
            <div class="batch-info-item">
                <span class="batch-info-label">Fecha:</span>
                <span class="batch-info-value">${formattedDate}</span>
            </div>
            <div class="batch-info-item">
                <span class="batch-info-label">Finca:</span>
                <span class="batch-info-value">${batch.FINCA || 'N/A'}</span>
            </div>
            <div class="batch-info-item">
                <span class="batch-info-label">Variedad:</span>
                <span class="batch-info-value">${batch.VARIEDAD || 'N/A'}</span>
            </div>
            <div class="batch-info-item">
                <span class="batch-info-label">Peso:</span>
                <span class="batch-info-value">${batch.PESO_NETO_KG || 'N/A'} kg</span>
            </div>
            <div class="batch-info-item">
                <span class="batch-info-label">Estado:</span>
                <span class="batch-info-value" style="color: ${batch.CALIDAD_STATUS === 'OK' ? 'var(--primary-green)' : 'var(--accent-orange)'}">${batch.CALIDAD_STATUS || 'N/A'}</span>
            </div>
        </div>
    `;

    // Add click event to view audit details
    card.addEventListener('click', () => {
        viewBatchAudit(batch.LOTE_ID);
    });

    return card;
}

// ===================================
// View Batch Audit
// ===================================
async function viewBatchAudit(loteId) {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/audit/${loteId}`);

        if (!response.ok) {
            throw new Error('Error al cargar la auditoría');
        }

        const result = await response.json();

        if (result.success && result.audit) {
            // For now, log the audit data
            // In a future implementation, this would redirect to auditoria_detalle.html
            console.log('Audit Data:', result.audit);

            // Show success message
            alert(`Auditoría del lote ${loteId} completada.\n\nIntegridad: ${result.audit.integrityScore}%\nHash Blockchain: ${result.audit.blockchainHash.substring(0, 16)}...`);
        } else {
            showError('No se pudo realizar la auditoría');
        }
    } catch (error) {
        console.error('Error performing audit:', error);
        showError('Error al realizar la auditoría. Intenta nuevamente.');
    } finally {
        showLoading(false);
    }
}

// ===================================
// Show Certification Info
// ===================================
function showCertificationInfo(certType) {
    const certInfo = {
        globalgap: {
            name: 'GLOBALG.A.P.',
            description: 'GLOBALG.A.P. es un estándar internacional reconocido para las buenas prácticas agrícolas. Garantiza la seguridad alimentaria, la sostenibilidad ambiental y el bienestar de los trabajadores.',
            details: 'Cubre aspectos como el uso de pesticidas, la gestión del agua, la trazabilidad y las condiciones laborales.'
        },
        iso22000: {
            name: 'ISO 22000',
            description: 'ISO 22000 es un estándar internacional para sistemas de gestión de la inocuidad alimentaria. Combina elementos de HACCP con sistemas de gestión.',
            details: 'Aplicable a toda la cadena alimentaria, desde productores hasta distribuidores.'
        },
        brcgs: {
            name: 'BRCGS',
            description: 'British Retail Consortium Global Standard es un programa de certificación de seguridad alimentaria reconocido mundialmente.',
            details: 'Utilizado por minoristas y fabricantes para garantizar la seguridad, calidad y legalidad de los productos.'
        },
        organico: {
            name: 'Certificación Orgánica',
            description: 'Certifica que los productos se han cultivado sin el uso de pesticidas sintéticos, fertilizantes químicos o organismos modificados genéticamente.',
            details: 'Promueve prácticas agrícolas sostenibles y respetuosas con el medio ambiente.'
        }
    };

    const info = certInfo[certType];
    if (info) {
        alert(`${info.name}\n\n${info.description}\n\n${info.details}`);
    }
}

// ===================================
// Utility Functions
// ===================================
function showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function showError(message) {
    alert(message);
}

function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('lastUpdate').textContent = timeString;
}
