// ===================================
// Configuration
// ===================================
const API_BASE_URL = 'http://localhost:3000/api';

// Chart instances
let farmChart, qualityChart, weightChart, tempChart;

// ===================================
// Initialize Dashboard
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        loadDashboardData();
    });

    // Search functionality
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterTable(e.target.value);
    });
});

// ===================================
// Load Dashboard Data
// ===================================
async function loadDashboardData() {
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE_URL}/dashboard-stats`);

        if (!response.ok) {
            throw new Error('Error al cargar los datos');
        }

        const data = await response.json();

        if (data.success) {
            updateStatistics(data.stats);
            updateCharts(data.stats);
            updateTable(data.stats.recentBatches);
            updateLastUpdateTime();
        } else {
            showError('No se pudieron cargar los datos');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Error de conexión. Asegúrate de que el servidor esté ejecutándose.');
    } finally {
        showLoading(false);
    }
}

// ===================================
// Update Statistics Cards
// ===================================
function updateStatistics(stats) {
    // Total Lotes
    document.getElementById('totalLotes').textContent = stats.totalLotes;

    // Average Weight
    document.getElementById('avgWeight').textContent = `${stats.averageWeight} kg`;

    // Quality Percentage
    document.getElementById('qualityPercent').textContent = `${stats.qualityPercentage}%`;

    // Average Temperature
    document.getElementById('avgTemp').textContent = `${stats.avgTemperature}°C`;
}

// ===================================
// Update Charts
// ===================================
function updateCharts(stats) {
    // Destroy existing charts
    if (farmChart) farmChart.destroy();
    if (qualityChart) qualityChart.destroy();
    if (weightChart) weightChart.destroy();
    if (tempChart) tempChart.destroy();

    // Create new charts
    createFarmChart(stats.batchesByFarm);
    createQualityChart(stats.qualityDistribution);
    createWeightChart(stats.weightByDate);
    createTempChart(stats.weightByDate);
}

// ===================================
// Farm Chart (Bar Chart)
// ===================================
function createFarmChart(data) {
    const ctx = document.getElementById('farmChart').getContext('2d');

    const labels = Object.keys(data);
    const values = Object.values(data);

    farmChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Número de Lotes',
                data: values,
                backgroundColor: 'rgba(16, 185, 129, 0.6)',
                borderColor: 'rgba(16, 185, 129, 1)',
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `${context.parsed.y} lotes`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===================================
// Quality Chart (Doughnut Chart)
// ===================================
function createQualityChart(data) {
    const ctx = document.getElementById('qualityChart').getContext('2d');

    const labels = Object.keys(data);
    const values = Object.values(data);

    const colors = [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
    ];

    qualityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderColor: '#1e293b',
                borderWidth: 3,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#cbd5e1',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: (context) => {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// ===================================
// Weight Chart (Line Chart)
// ===================================
function createWeightChart(data) {
    const ctx = document.getElementById('weightChart').getContext('2d');

    // Take last 20 entries for better visualization
    const recentData = data.slice(-20);

    const labels = recentData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });

    const weights = recentData.map(item => item.weight);

    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Peso (kg)',
                data: weights,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(16, 185, 129, 1)',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(16, 185, 129, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `Peso: ${context.parsed.y} kg`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => `${value} kg`
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===================================
// Temperature Chart (Area Chart)
// ===================================
function createTempChart(data) {
    const ctx = document.getElementById('tempChart').getContext('2d');

    // Take last 20 entries
    const recentData = data.slice(-20);

    const labels = recentData.map(item => {
        const date = new Date(item.date);
        return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    });

    // For temperature, we'll use the lote ID as a proxy since we have the data
    // In a real scenario, you'd have temperature data per timestamp
    const temps = recentData.map(() => 18 + Math.random() * 4); // Simulated for demo

    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperatura (°C)',
                data: temps,
                borderColor: 'rgba(245, 158, 11, 1)',
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: 'rgba(245, 158, 11, 1)',
                pointBorderColor: '#1e293b',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: (context) => `Temperatura: ${context.parsed.y.toFixed(1)}°C`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: 15,
                    max: 25,
                    ticks: {
                        color: '#94a3b8',
                        callback: (value) => `${value}°C`
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===================================
// Update Table
// ===================================
function updateTable(batches) {
    const tbody = document.getElementById('batchesTableBody');
    tbody.innerHTML = '';

    batches.forEach(batch => {
        const row = document.createElement('tr');

        const date = new Date(batch.FECHA_COSECHA);
        const formattedDate = date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = batch.CALIDAD_STATUS === 'OK' ? 'ok' : 'warning';

        row.innerHTML = `
            <td><strong>${batch.LOTE_ID}</strong></td>
            <td>${formattedDate}</td>
            <td>${batch.FINCA || '-'}</td>
            <td>${batch.VARIEDAD || '-'}</td>
            <td>${batch.PESO_NETO_KG || '-'}</td>
            <td>${batch.NUM_FRUTOS || '-'}</td>
            <td>${batch.CALIBRE || '-'}</td>
            <td>${batch.TEMPERATURA_C || '-'}</td>
            <td><span class="status-badge ${statusClass}">${batch.CALIDAD_STATUS || '-'}</span></td>
        `;

        tbody.appendChild(row);
    });
}

// ===================================
// Filter Table
// ===================================
function filterTable(searchTerm) {
    const table = document.getElementById('batchesTable');
    const rows = table.getElementsByTagName('tr');

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const text = row.textContent.toLowerCase();

        if (text.includes(searchTerm.toLowerCase())) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
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
