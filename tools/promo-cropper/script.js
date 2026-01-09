const dropZone = document.getElementById('drag-overlay');
const uploadBtn = document.getElementById('upload-btn');
const uploadInput = document.getElementById('upload');
const img = document.getElementById('image');
const container = document.getElementById('crop-container');
const overlay = document.getElementById('crop-overlay');
const sizeSelect = document.getElementById('size');
const previewCanvas = document.getElementById('preview');
const previewContainer = document.getElementById('preview-container');
const downloadBtn = document.getElementById('download');
const confirmBtn = document.getElementById('confirm');
const placeholder = document.getElementById('placeholder');
const zoomInfo = document.getElementById('zoom-info');
const zoomPercent = document.getElementById('zoom-percent');
const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const centerOverlayBtn = document.getElementById('center-overlay');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

let isDragging = false;
let startX, startY;
let overlayLeft = 0, overlayTop = 0;
let scale = 1;
let targetW = 440;
let targetH = 280;
let dragCounter = 0;

document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        dragCounter++;
        dropZone.classList.remove('hidden');
        setTimeout(() => dropZone.classList.add('show'), 0);
    }
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        dropZone.classList.remove('show');
        setTimeout(() => dropZone.classList.add('hidden'), 300);
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('show');
    setTimeout(() => dropZone.classList.add('hidden'), 300);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

uploadBtn.addEventListener('click', () => uploadInput.click());
uploadInput.addEventListener('change', e => {
    if (e.target.files[0]) loadImage(e.target.files[0]);
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = ev => {
        img.src = ev.target.result;
        img.onload = initializeCrop;
    };
    reader.readAsDataURL(file);
}

function initializeCrop() {
    [targetW, targetH] = sizeSelect.value.split('x').map(Number);

    overlay.style.width = `${targetW}px`;
    overlay.style.height = `${targetH}px`;
    overlay.classList.remove('hidden');

    const scaleX = targetW / img.naturalWidth;
    const scaleY = targetH / img.naturalHeight;
    scale = Math.max(scaleX, scaleY);

    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    img.style.width = `${displayW}px`;
    img.style.height = `${displayH}px`;

    overlayLeft = (displayW - targetW) / 2;
    overlayTop = (displayH - targetH) / 2;
    updateOverlayPosition();

    updateZoomDisplay();

    placeholder.style.display = 'none';
    zoomInfo.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
}

function updateOverlayPosition() {
    overlay.style.left = `${overlayLeft}px`;
    overlay.style.top = `${overlayTop}px`;
}

function updateZoomDisplay() {
    zoomPercent.textContent = Math.round(scale * 100);
}

function zoomBy(delta) {
    if (!img.src) return;
    const oldScale = scale;
    scale += delta;
    scale = Math.max(0.05, Math.min(scale, 50));

    if (Math.abs(scale - oldScale) > 0.001) {
        const rect = container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const displayW = img.naturalWidth * scale;
        const displayH = img.naturalHeight * scale;
        img.style.width = `${displayW}px`;
        img.style.height = `${displayH}px`;

        const ratio = scale / oldScale;
        overlayLeft = centerX - (centerX - overlayLeft) * ratio;
        overlayTop = centerY - (centerY - overlayTop) * ratio;

        updateOverlayPosition();
        updateZoomDisplay();
    }
}

zoomInBtn.addEventListener('click', () => zoomBy(0.01));
zoomOutBtn.addEventListener('click', () => zoomBy(-0.01));
centerOverlayBtn.addEventListener('click', centerOverlay);

function centerOverlay() {
    if (!img.src) return;
    
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    
    overlayLeft = (displayW - targetW) / 2;
    overlayTop = (displayH - targetH) / 2;
    updateOverlayPosition();
}

container.addEventListener('wheel', (e) => {
    if (!img.src) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.01 : 0.01;
    zoomBy(delta);
});

sizeSelect.addEventListener('change', handleSizeChange);

function handleSizeChange() {
    if (!img.src) return;
    
    [targetW, targetH] = sizeSelect.value.split('x').map(Number);

    overlay.style.width = `${targetW}px`;
    overlay.style.height = `${targetH}px`;

    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;

    overlayLeft = (displayW - targetW) / 2;
    overlayTop = (displayH - targetH) / 2;
    updateOverlayPosition();
}

overlay.addEventListener('mousedown', (e) => {
    if (!img.src) return;
    isDragging = true;
    startX = e.clientX - overlayLeft;
    startY = e.clientY - overlayTop;
    overlay.style.cursor = 'grabbing';
});

overlay.addEventListener('touchstart', (e) => {
    if (!img.src) return;
    isDragging = true;
    const touch = e.touches[0];
    startX = touch.clientX - overlayLeft;
    startY = touch.clientY - overlayTop;
}, { passive: false });

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    overlayLeft = e.clientX - startX;
    overlayTop = e.clientY - startY;
    updateOverlayPosition();
});

document.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    overlayLeft = touch.clientX - startX;
    overlayTop = touch.clientY - startY;
    updateOverlayPosition();
}, { passive: false });

document.addEventListener('mouseup', () => {
    isDragging = false;
    overlay.style.cursor = 'grab';
});

document.addEventListener('touchend', () => {
    isDragging = false;
    overlay.style.cursor = 'grab';
});

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
});

window.addEventListener('resize', () => {
});

confirmBtn.addEventListener('click', () => {
    previewCanvas.width = targetW;
    previewCanvas.height = targetH;

    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, targetW, targetH);

    const sourceX = overlayLeft / scale;
    const sourceY = overlayTop / scale;
    const sourceW = targetW / scale;
    const sourceH = targetH / scale;

    ctx.drawImage(img, sourceX, sourceY, sourceW, sourceH, 0, 0, targetW, targetH);

    previewContainer.classList.remove('hidden');
    downloadBtn.classList.remove('hidden');
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `chrome-promo-${sizeSelect.value}.png`;
    link.href = previewCanvas.toDataURL('image/png');
    link.click();
});
