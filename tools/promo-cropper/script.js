const dropZone = document.getElementById('drop-zone');
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
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

let isDragging = false;
let startX, startY;
let imgLeft = 0, imgTop = 0;
let scale = 1;
let targetW = 440;
let targetH = 280;

['dragenter', 'dragover'].forEach(e => {
    dropZone.addEventListener(e, ev => {
        ev.preventDefault();
        ev.stopPropagation();
        dropZone.classList.add('drag-over');
    });
});

['dragleave', 'drop'].forEach(e => {
    dropZone.addEventListener(e, ev => {
        ev.preventDefault();
        ev.stopPropagation();
        dropZone.classList.remove('drag-over');
    });
});

dropZone.addEventListener('drop', e => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImage(file);
});

dropZone.addEventListener('click', () => uploadInput.click());
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
    container.style.width = `${targetW}px`;
    container.style.height = `${targetH}px`;

    const viewportW = window.innerWidth - 32;
    const viewportH = window.innerHeight - 200;
    const scaleFit = Math.min(
        Math.min(viewportW / targetW, 1),
        Math.min(viewportH / targetH, 1)
    );

    if (scaleFit < 1) {
        container.style.transform = `scale(${scaleFit})`;
    } else {
        container.style.transform = 'none';
    }

    const scaleX = targetW / img.naturalWidth;
    const scaleY = targetH / img.naturalHeight;
    scale = Math.max(scaleX, scaleY);

    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;
    img.style.width = `${displayW}px`;
    img.style.height = `${displayH}px`;

    imgLeft = (targetW - displayW) / 2;
    imgTop = (targetH - displayH) / 2;
    updateImagePosition();

    updateZoomDisplay();

    placeholder.style.display = 'none';
    zoomInfo.classList.remove('hidden');
    previewContainer.classList.add('hidden');
    downloadBtn.classList.add('hidden');
}

function updateImagePosition() {
    img.style.left = `${imgLeft}px`;
    img.style.top = `${imgTop}px`;
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
        imgLeft = centerX - (centerX - imgLeft) * ratio;
        imgTop = centerY - (centerY - imgTop) * ratio;

        updateImagePosition();
        updateZoomDisplay();
    }
}

zoomInBtn.addEventListener('click', () => zoomBy(0.01));
zoomOutBtn.addEventListener('click', () => zoomBy(-0.01));

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('show');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('show');
});

window.addEventListener('resize', () => {
    if (img.src) {
        const viewportW = window.innerWidth - 32;
        const viewportH = window.innerHeight - 200;
        const scaleFit = Math.min(
            Math.min(viewportW / targetW, 1),
            Math.min(viewportH / targetH, 1)
        );

        if (scaleFit < 1) {
            container.style.transform = `scale(${scaleFit})`;
        } else {
            container.style.transform = 'none';
        }
    }
});

confirmBtn.addEventListener('click', () => {
    previewCanvas.width = targetW;
    previewCanvas.height = targetH;

    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, targetW, targetH);

    const sourceX = -imgLeft / scale;
    const sourceY = -imgTop / scale;
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
