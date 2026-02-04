const dropZone = document.getElementById('drop-zone');
const uploadInput = document.getElementById('upload');
const video = document.getElementById('video');
const scrubber = document.getElementById('scrubber');
const stepBack = document.getElementById('step-back');
const stepForward = document.getElementById('step-forward');
const currentTime = document.getElementById('current-time');
const captureBtn = document.getElementById('capture');
const results = document.getElementById('results');
const canvas = document.getElementById('canvas');
const frameControls = document.getElementById('frame-controls');
const capturedFramesContainer = document.getElementById('captured-frames');
const bulkActions = document.getElementById('bulk-actions');
const selectedCount = document.getElementById('selected-count');
const selectAllCheckbox = document.getElementById('select-all');
const downloadSelectedBtn = document.getElementById('download-selected');
const deleteSelectedBtn = document.getElementById('delete-selected');
const frameOverlay = document.getElementById('frame-overlay');
const overlayImg = document.getElementById('overlay-img');
const overlayClose = document.getElementById('overlay-close');
const overlayPrev = document.getElementById('overlay-prev');
const overlayNext = document.getElementById('overlay-next');
const overlaySelect = document.getElementById('overlay-select');
const overlayDelete = document.getElementById('overlay-delete');
const ctx = canvas.getContext('2d');

let videoUrl = null;
let dragCounter = 0;
let capturedFrames = [];
let overlayFrameId = null;
let overlayFrameIndex = 0;

document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
        dragCounter++;
        dropZone.classList.add('drag-over');
    }
});

document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
        dropZone.classList.remove('drag-over');
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('drag-over');

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('video/')) {
        loadVideo(file);
    } else {
        showError('Please drop a valid video file.');
    }
});

uploadInput.addEventListener('change', e => {
    if (e.target.files[0]) {
        loadVideo(e.target.files[0]);
    }
});

function loadVideo(file) {
    if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
    }
    videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.load();
    results.classList.add('hidden');
    dropZone.classList.remove('has-video');
    video.classList.remove('show');
    frameControls.classList.add('hidden');
    capturedFrames = [];
    capturedFramesContainer.innerHTML = '';
}

video.addEventListener('loadedmetadata', () => {
    scrubber.max = video.duration;
    scrubber.value = 0;
    currentTime.textContent = '0.0s';
    video.currentTime = 0;
    video.classList.add('show');
    dropZone.classList.add('has-video');
    frameControls.classList.remove('hidden');
});

video.addEventListener('timeupdate', () => {
    scrubber.value = video.currentTime;
    currentTime.textContent = video.currentTime.toFixed(1) + 's';
});

scrubber.addEventListener('input', () => {
    video.currentTime = scrubber.value;
});

stepBack.addEventListener('click', () => {
    video.currentTime = Math.max(0, video.currentTime - 0.1);
});

stepForward.addEventListener('click', () => {
    video.currentTime = Math.min(video.duration || 0, video.currentTime + 0.1);
});

captureBtn.addEventListener('click', () => {
    if (video.readyState < 2) {
        showError('Video is not ready. Please wait for it to load.');
        return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
        const id = Date.now();
        const blobUrl = URL.createObjectURL(blob);
        const frame = { id, blob, blobUrl, selected: false };
        capturedFrames.push(frame);
        addFrameToGrid(frame);
        results.classList.remove('hidden');
        updateBulkActions();
    });
});

function addFrameToGrid(frame) {
    const card = document.createElement('div');
    card.className = 'frame-card';
    card.dataset.id = frame.id;
    card.innerHTML = `
        <input type="checkbox" class="frame-checkbox" data-id="${frame.id}">
        <button class="frame-delete" data-id="${frame.id}" title="Delete">×</button>
        <img src="${frame.blobUrl}" alt="Frame ${frame.id}">
    `;
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('frame-checkbox') &&
            !e.target.classList.contains('frame-delete')) {
            showOverlay(frame.id);
        }
    });
    capturedFramesContainer.appendChild(card);
}

capturedFramesContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('frame-checkbox')) {
        const frame = capturedFrames.find(f => f.id === Number(e.target.dataset.id));
        if (frame) {
            frame.selected = e.target.checked;
            e.target.closest('.frame-card').classList.toggle('selected', frame.selected);
            updateBulkActions();
        }
    }
});

capturedFramesContainer.addEventListener('click', (e) => {
    if (e.target.classList.contains('frame-delete')) {
        deleteFrame(Number(e.target.dataset.id));
    }
});

function deleteFrame(id) {
    const index = capturedFrames.findIndex(f => f.id === id);
    if (index > -1) {
        URL.revokeObjectURL(capturedFrames[index].blobUrl);
        capturedFrames.splice(index, 1);
        document.querySelector(`.frame-card[data-id="${id}"]`)?.remove();
        if (overlayFrameId === id) {
            closeOverlay();
        }
        updateBulkActions();
    }
}

function updateBulkActions() {
    const selected = capturedFrames.filter(f => f.selected);
    const countSpan = document.getElementById('selected-count');
    if (capturedFrames.length > 0) {
        bulkActions.classList.remove('hidden');
        countSpan.textContent = selected.length > 0 ? `${selected.length} selected` : `${capturedFrames.length} frame${capturedFrames.length !== 1 ? 's' : ''}`;
    } else {
        bulkActions.classList.add('hidden');
    }
}

selectAllCheckbox.addEventListener('change', (e) => {
    capturedFrames.forEach(f => {
        f.selected = e.target.checked;
        const checkbox = document.querySelector(`.frame-checkbox[data-id="${f.id}"]`);
        if (checkbox) {
            checkbox.checked = e.target.checked;
            checkbox.closest('.frame-card').classList.toggle('selected', e.target.checked);
        }
    });
    updateBulkActions();
});

downloadSelectedBtn.addEventListener('click', async () => {
    const selected = capturedFrames.filter(f => f.selected);
    if (selected.length === 0) return;

    if (selected.length === 1) {
        downloadSingleFrame(selected[0]);
        return;
    }

    try {
        const zip = new JSZip();
        selected.forEach((frame, i) => {
            zip.file(`frame-${i + 1}-${frame.id}.png`, frame.blob);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'frames-' + Date.now() + '.zip');
    } catch (error) {
        console.error('ZIP creation failed:', error);
        showError('Failed to create ZIP file');
    }
});

deleteSelectedBtn.addEventListener('click', () => {
    const selectedIds = capturedFrames.filter(f => f.selected).map(f => f.id);
    selectedIds.forEach(id => deleteFrame(id));
});

function downloadSingleFrame(frame) {
    try {
        const url = URL.createObjectURL(frame.blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'frame-' + frame.id + '.png';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed:', error);
        showError('Download failed');
    }
}

function updateNavButtons() {
  const prevBtn = document.getElementById('overlay-prev');
  const nextBtn = document.getElementById('overlay-next');
  prevBtn.disabled = overlayFrameIndex === 0;
  nextBtn.disabled = overlayFrameIndex === capturedFrames.length - 1;
}

function showOverlayByIndex(index) {
  if (index < 0 || index >= capturedFrames.length) return;
  overlayFrameIndex = index;
  const frame = capturedFrames[index];
  overlayFrameId = frame.id;
  overlayImg.src = frame.blobUrl;
  overlaySelect.textContent = frame.selected ? 'Selected' : 'Select';
  overlaySelect.classList.toggle('selected', frame.selected);
  updateNavButtons();
}

function showOverlay(id) {
    const frame = capturedFrames.find(f => f.id === id);
    if (!frame) return;
    overlayFrameIndex = capturedFrames.indexOf(frame);
    overlayFrameId = frame.id;
    overlayImg.src = frame.blobUrl;
    overlaySelect.classList.toggle('selected', frame.selected);
    frameOverlay.classList.remove('hidden');
    updateNavButtons();
}

function navigateOverlay(direction) {
  const newIndex = overlayFrameIndex + direction;
  if (newIndex >= 0 && newIndex < capturedFrames.length) {
    showOverlayByIndex(newIndex);
  }
}

function closeOverlay() {
    overlayFrameId = null;
    frameOverlay.classList.add('hidden');
}

overlayClose.addEventListener('click', closeOverlay);
frameOverlay.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeOverlay();
});
overlayPrev.addEventListener('click', () => navigateOverlay(-1));
overlayNext.addEventListener('click', () => navigateOverlay(1));

overlaySelect.addEventListener('click', () => {
    const frame = capturedFrames.find(f => f.id === overlayFrameId);
    if (frame) {
        frame.selected = !frame.selected;
        overlaySelect.textContent = frame.selected ? 'Selected' : 'Select';
        overlaySelect.classList.toggle('selected', frame.selected);
        const checkbox = document.querySelector(`.frame-checkbox[data-id="${overlayFrameId}"]`);
        if (checkbox) {
            checkbox.checked = frame.selected;
            checkbox.closest('.frame-card')?.classList.toggle('selected', frame.selected);
        }
        updateBulkActions();
    }
});
overlayDelete.addEventListener('click', () => {
    if (overlayFrameId) {
        deleteFrame(overlayFrameId);
        closeOverlay();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeOverlay();
    if (e.key === 'ArrowLeft') navigateOverlay(-1);
    if (e.key === 'ArrowRight') navigateOverlay(1);
});

video.controls = false;

function showError(message = 'Download blocked by browser settings') {
    const overlay = document.getElementById('error-overlay');
    overlay.querySelector('span').textContent = message;
    overlay.classList.remove('hidden');
    setTimeout(() => overlay.classList.add('hidden'), 5000);
}

function hideError() {
    document.getElementById('error-overlay').classList.add('hidden');
}

window.addEventListener('beforeunload', () => {
    capturedFrames.forEach(f => URL.revokeObjectURL(f.blobUrl));
});
