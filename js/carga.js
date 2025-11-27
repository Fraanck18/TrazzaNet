document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const browseBtn = document.getElementById('browseBtn');
    const previewSection = document.getElementById('previewSection');
    const previewTable = document.getElementById('previewTable');
    const previewBody = document.getElementById('previewBody');
    const fileInfo = document.getElementById('fileInfo');
    const cancelBtn = document.getElementById('cancelBtn');
    const uploadBtn = document.getElementById('uploadBtn');
    const statusMessage = document.getElementById('statusMessage');

    let currentData = null;

    // Drag and Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight(e) {
        dropZone.classList.add('dragover');
    }

    function unhighlight(e) {
        dropZone.classList.remove('dragover');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }

    // Browse Button
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        const validTypes = ['text/csv', 'application/json', 'application/vnd.ms-excel'];

        // Basic validation
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.json')) {
            showStatus('Formato de archivo no soportado. Use .CSV o .JSON', 'error');
            return;
        }

        readFile(file);
    }

    function readFile(file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            const content = e.target.result;
            try {
                if (file.name.endsWith('.json')) {
                    currentData = JSON.parse(content);
                } else if (file.name.endsWith('.csv')) {
                    currentData = parseCSV(content);
                }

                if (!Array.isArray(currentData)) {
                    // Handle case where JSON might be an object with a data property
                    if (currentData.data && Array.isArray(currentData.data)) {
                        currentData = currentData.data;
                    } else {
                        throw new Error('El archivo debe contener una lista de registros');
                    }
                }

                showPreview(file.name, currentData);
            } catch (error) {
                console.error(error);
                showStatus('Error al procesar el archivo: ' + error.message, 'error');
            }
        };

        reader.readAsText(file);
    }

    function parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));

        return lines.slice(1).map(line => {
            const values = line.split(',').map(value => value.trim().replace(/^"|"$/g, ''));
            const entry = {};
            headers.forEach((header, index) => {
                // Try to convert numbers
                const val = values[index];
                entry[header] = isNaN(val) ? val : (val === '' ? null : Number(val));
            });
            return entry;
        });
    }

    function showPreview(filename, data) {
        if (!data || data.length === 0) {
            showStatus('El archivo está vacío', 'error');
            return;
        }

        // Show section
        previewSection.classList.remove('hidden');
        dropZone.style.display = 'none';

        // File info
        fileInfo.textContent = `Archivo: ${filename} | Registros: ${data.length}`;

        // Table Headers
        const headers = Object.keys(data[0]);
        let headerHTML = '<tr>';
        headers.forEach(header => {
            headerHTML += `<th>${header}</th>`;
        });
        headerHTML += '</tr>';
        previewTable.querySelector('thead').innerHTML = headerHTML;

        // Table Body (First 5 rows)
        const previewData = data.slice(0, 5);
        let bodyHTML = '';
        previewData.forEach(row => {
            bodyHTML += '<tr>';
            headers.forEach(header => {
                bodyHTML += `<td>${row[header] !== null ? row[header] : ''}</td>`;
            });
            bodyHTML += '</tr>';
        });

        if (data.length > 5) {
            bodyHTML += `<tr><td colspan="${headers.length}" style="text-align: center; color: var(--text-muted);">... y ${data.length - 5} registros más</td></tr>`;
        }

        previewBody.innerHTML = bodyHTML;
    }

    // Cancel Button
    cancelBtn.addEventListener('click', () => {
        currentData = null;
        previewSection.classList.add('hidden');
        dropZone.style.display = 'block';
        fileInput.value = '';
        statusMessage.classList.add('hidden');
    });

    // Upload Button
    uploadBtn.addEventListener('click', async () => {
        if (!currentData) return;

        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Subiendo...';

        try {
            const response = await fetch('http://localhost:3000/api/upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(currentData)
            });

            const result = await response.json();

            if (result.success) {
                showStatus(`✅ ${result.message} (${result.count} registros)`, 'success');
                setTimeout(() => {
                    // Reset
                    cancelBtn.click();
                }, 2000);
            } else {
                throw new Error(result.error || 'Error al subir datos');
            }
        } catch (error) {
            showStatus('❌ Error: ' + error.message, 'error');
        } finally {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Subir a Base de Datos';
        }
    });

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${type}`;
        statusMessage.classList.remove('hidden');

        if (type === 'success') {
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 5000);
        }
    }
});
