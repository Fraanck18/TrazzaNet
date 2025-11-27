// ===================================
// Configuration
// ===================================
const API_BASE_URL = 'http://localhost:3000/api';

// Sample certifications data
let certifications = [
    {
        id: 1,
        name: 'Auditoría GlobalG.A.P.',
        description: 'Certificación de buenas prácticas agrícolas para productos frescos.',
        rules: 12
    },
    {
        id: 2,
        name: 'Certificación Cliente X',
        description: 'Estándares específicos para el cliente mayorista "Cliente X".',
        rules: 8
    },
    {
        id: 3,
        name: 'ISO 22000: Seguridad Alimentaria',
        description: 'Gestión de la seguridad alimentaria en toda la cadena de suministro.',
        rules: 15
    },
    {
        id: 4,
        name: 'BRCGS Global Standard for Food Safety',
        description: 'Estándar global para la seguridad alimentaria, calidad y operación.',
        rules: 10
    }
];

let editingId = null;

// ===================================
// Initialize
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    initializeTabs();
    renderCertifications();
    initializeModal();
});

// ===================================
// Tab Management
// ===================================
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'certifications') {
        document.getElementById('certificationsTab').classList.add('active');
    } else if (tabName === 'simulator') {
        document.getElementById('simulatorTab').classList.add('active');
    }
}

// ===================================
// Modal Management
// ===================================
function initializeModal() {
    const modal = document.getElementById('certModal');
    const addBtn = document.getElementById('addCertBtn');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const form = document.getElementById('certForm');

    // Open modal for new certification
    addBtn.addEventListener('click', () => {
        openModal();
    });

    // Close modal
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Form submit
    form.addEventListener('submit', handleFormSubmit);
}

function openModal(certification = null) {
    const modal = document.getElementById('certModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('certForm');

    if (certification) {
        // Edit mode
        editingId = certification.id;
        modalTitle.textContent = 'Editar Certificación';
        document.getElementById('certName').value = certification.name;
        document.getElementById('certDescription').value = certification.description;
        document.getElementById('certRules').value = certification.rules;
    } else {
        // Add mode
        editingId = null;
        modalTitle.textContent = 'Nueva Certificación';
        form.reset();
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('certModal');
    modal.classList.remove('active');
    editingId = null;
}

function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('certName').value;
    const description = document.getElementById('certDescription').value;
    const rules = parseInt(document.getElementById('certRules').value);

    if (editingId) {
        // Update existing certification
        const index = certifications.findIndex(c => c.id === editingId);
        if (index !== -1) {
            certifications[index] = {
                ...certifications[index],
                name,
                description,
                rules
            };
        }
    } else {
        // Add new certification
        const newCert = {
            id: Date.now(),
            name,
            description,
            rules
        };
        certifications.push(newCert);
    }

    renderCertifications();
    closeModal();
    showNotification(editingId ? 'Certificación actualizada' : 'Certificación creada');
}

// ===================================
// Render Certifications
// ===================================
function renderCertifications() {
    const grid = document.getElementById('certificationsGrid');

    if (certifications.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3>No hay certificaciones</h3>
                <p>Comienza agregando tu primera certificación</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = certifications.map(cert => `
        <div class="cert-card" data-id="${cert.id}">
            <div class="cert-header">
                <div>
                    <h3 class="cert-title">${cert.name}</h3>
                </div>
            </div>
            <p class="cert-description">${cert.description}</p>
            <span class="cert-rules">${cert.rules} reglas definidas</span>
            <div class="cert-actions">
                <button class="cert-action-btn view" onclick="viewCertification(${cert.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                    Ver
                </button>
                <button class="cert-action-btn edit" onclick="editCertification(${cert.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Editar
                </button>
                <button class="cert-action-btn delete" onclick="deleteCertification(${cert.id})">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

// ===================================
// Certification Actions
// ===================================
function viewCertification(id) {
    const cert = certifications.find(c => c.id === id);
    if (cert) {
        alert(`Certificación: ${cert.name}\n\nDescripción: ${cert.description}\n\nReglas: ${cert.rules}\n\n(Funcionalidad de visualización completa próximamente)`);
    }
}

function editCertification(id) {
    const cert = certifications.find(c => c.id === id);
    if (cert) {
        openModal(cert);
    }
}

function deleteCertification(id) {
    if (confirm('¿Estás seguro de que deseas eliminar esta certificación?')) {
        certifications = certifications.filter(c => c.id !== id);
        renderCertifications();
        showNotification('Certificación eliminada');
    }
}

// ===================================
// Utility Functions
// ===================================
function showNotification(message) {
    // Simple notification - could be enhanced with a toast component
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(16, 185, 129, 0.9);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
