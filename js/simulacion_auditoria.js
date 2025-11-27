// ===================================
// Configuration
// ===================================
const API_BASE_URL = 'http://localhost:3000/api';

// State
let selectedCertification = null;
let auditData = null;

// ===================================
// Initialize Page
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    initializeCertificationCards();
    initializeStartButton();
    initializeSearch();
});

// ===================================
// Load Dashboard Statistics
// ===================================
async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/dashboard-stats`);

        if (!response.ok) {
            showAlert('Error al cargar los lotes. Verifique su conexión con el servidor');
            return;
        }

        const data = await response.json();

        if (data.success) {
            updateStatistics(data.stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        showAlert('Error al cargar los lotes. Verifique su conexión con el servidor');
    }
}

// ===================================
// Update Statistics
// ===================================
function updateStatistics(stats) {
    // Total lotes
    const totalLotes = stats.totalLotes || 0;
    document.getElementById('lotesAuditar').textContent = totalLotes;

    // Calculate hallazgos and descarte based on selected certification
    const hallazgosPercent = selectedCertification ? getHallazgosPercent(selectedCertification) : 3;
    const descartePercent = selectedCertification ? getDescartePercent(selectedCertification) : 10;

    const conHallazgos = Math.floor(totalLotes * (hallazgosPercent / 100));
    const paraDescarte = Math.floor(totalLotes * (descartePercent / 100));

    document.getElementById('conHallazgos').textContent = conHallazgos;
    document.getElementById('paraDescarte').textContent = paraDescarte;

    // Conformidad (inverse of hallazgos + descarte)
    const conformidad = 100 - hallazgosPercent - descartePercent;
    document.getElementById('conformidad').textContent = `${conformidad}%`;
}

// ===================================
// Initialize Certification Cards
// ===================================
function initializeCertificationCards() {
    const cards = document.querySelectorAll('.certification-card');

    cards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove selected class from all cards
            cards.forEach(c => c.classList.remove('selected'));

            // Add selected class to clicked card
            card.classList.add('selected');

            // Update selected certification
            selectedCertification = card.dataset.cert;

            // Show selected info
            showSelectedCertInfo(card);

            // Update statistics based on selection
            loadDashboardStats();
        });
    });
}

// ===================================
// Show Selected Certification Info
// ===================================
function showSelectedCertInfo(card) {
    const certName = card.querySelector('h3').textContent;
    const hallazgos = getHallazgosPercent(selectedCertification);
    const descarte = getDescartePercent(selectedCertification);

    const infoDiv = document.getElementById('selectedCertInfo');
    const nameSpan = document.getElementById('selectedCertName');

    nameSpan.textContent = `${certName} (Hallazgos ${hallazgos}%, Descarte ${descarte}%)`;
    infoDiv.style.display = 'flex';
}

// ===================================
// Get Certification Percentages
// ===================================
function getHallazgosPercent(cert) {
    const percentages = {
        'globalgap': 5,
        'iso22000': 3,
        'brcgs': 2,
        'organico': 1
    };
    return percentages[cert] || 3;
}

function getDescartePercent(cert) {
    const percentages = {
        'globalgap': 10,
        'iso22000': 20,
        'brcgs': 15,
        'organico': 5
    };
    return percentages[cert] || 10;
}

// ===================================
// Initialize Start Button
// ===================================
function initializeStartButton() {
    const startBtn = document.getElementById('startSimulationBtn');

    startBtn.addEventListener('click', async () => {
        if (!selectedCertification) {
            alert('Por favor, seleccione una certificación antes de iniciar la simulación');
            return;
        }

        // Show loading state
        startBtn.disabled = true;
        startBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style="animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10" />
            </svg>
            Procesando...
        `;

        try {
            // Simulate audit process
            await performAuditSimulation();

            // Reset button
            startBtn.disabled = false;
            startBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Iniciar Simulación
            `;

            // Show success message
            showSuccessAlert('Simulación completada exitosamente');
        } catch (error) {
            console.error('Error in simulation:', error);
            showAlert('Error al realizar la simulación');

            // Reset button
            startBtn.disabled = false;
            startBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Iniciar Simulación
            `;
        }
    });
}

// ===================================
// Perform Audit Simulation
// ===================================
async function performAuditSimulation() {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get all lotes
    const response = await fetch(`${API_BASE_URL}/lotes`);
    const data = await response.json();

    if (!data.success) {
        throw new Error('Failed to fetch lotes');
    }

    const lotes = data.data;
    const hallazgosPercent = getHallazgosPercent(selectedCertification);
    const descartePercent = getDescartePercent(selectedCertification);

    // Simulate audit results
    auditData = {
        certification: selectedCertification,
        totalLotes: lotes.length,
        conformes: lotes.length - Math.floor(lotes.length * ((hallazgosPercent + descartePercent) / 100)),
        hallazgos: Math.floor(lotes.length * (hallazgosPercent / 100)),
        descarte: Math.floor(lotes.length * (descartePercent / 100)),
        timestamp: new Date()
    };

    // Update statistics
    loadDashboardStats();

    return auditData;
}

// ===================================
// Initialize Search
// ===================================
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');

    searchInput.addEventListener('input', (e) => {
        performSearch(e.target.value, filterSelect.value);
    });

    filterSelect.addEventListener('change', (e) => {
        performSearch(searchInput.value, e.target.value);
    });
}

// ===================================
// Perform Search
// ===================================
function performSearch(query, filter) {
    // This would filter the lotes table if it existed
    console.log('Search:', query, 'Filter:', filter);

    // In a full implementation, this would:
    // 1. Fetch lotes from API
    // 2. Filter based on query and filter
    // 3. Display results in a table
}

// ===================================
// Show Alert
// ===================================
function showAlert(message) {
    const alertDiv = document.getElementById('alertMessage');
    const alertText = document.getElementById('alertText');

    alertText.textContent = message;
    alertDiv.style.display = 'flex';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

// ===================================
// Show Success Alert
// ===================================
function showSuccessAlert(message) {
    const alertDiv = document.getElementById('alertMessage');
    const alertText = document.getElementById('alertText');

    // Change to success styling
    alertDiv.style.background = '#10b981';
    alertText.textContent = message;
    alertDiv.style.display = 'flex';

    // Auto-hide after 3 seconds
    setTimeout(() => {
        alertDiv.style.display = 'none';
        // Reset to error styling
        alertDiv.style.background = '#ef4444';
    }, 3000);
}

// ===================================
// Navigation Functions
// ===================================
function navigateTo(page) {
    window.location.href = page;
}

// Add spin animation for loading state
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
