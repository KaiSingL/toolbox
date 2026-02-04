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
const previewImg = document.getElementById('previewImg');
const downloadBtn = document.getElementById('download');
const frameControls = document.getElementById('frame-controls');
const ctx = canvas.getContext('2d');

let videoUrl = null;
let currentBlob = null;
let currentBlobUrl = null;
let dragCounter = 0;

// Check browser download support
const supportsDownload = 'download' in document.createElement('a');

if (!supportsDownload) {
  downloadBtn.disabled = true;
  downloadBtn.innerHTML = 'Download not supported by the browser';
}

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
    if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
    }
    videoUrl = URL.createObjectURL(file);
    video.src = videoUrl;
    video.load();
    results.classList.add('hidden');
    dropZone.classList.remove('has-video');
    video.classList.remove('show');
    frameControls.classList.add('hidden');
    currentBlob = null;
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
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
        }
        currentBlobUrl = URL.createObjectURL(blob);
        previewImg.src = currentBlobUrl;
        currentBlob = blob;
    });
    results.classList.remove('hidden');
});

downloadBtn.addEventListener('click', () => {
    if (!supportsDownload) return;
    
    if (!currentBlob) {
        showError('No frame captured to download');
        return;
    }
    
    try {
        const url = URL.createObjectURL(currentBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'frame-' + Date.now() + '.png';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
        hideError();
    } catch (error) {
        console.error('Download failed:', error);
        showError();
    }
});

// Hide video controls initially
video.controls = false;

// Error overlay functions
function showError(message = 'Download blocked by browser settings') {
  const overlay = document.getElementById('error-overlay');
  overlay.querySelector('span').textContent = message;
  overlay.classList.remove('hidden');
  setTimeout(() => overlay.classList.add('hidden'), 5000);
}

function hideError() {
  document.getElementById('error-overlay').classList.add('hidden');
}