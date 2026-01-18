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
const downloadBtn = document.getElementById('download');
const ctx = canvas.getContext('2d');

let videoUrl = null;
let dragCounter = 0;

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
        alert('Please drop a valid video file.');
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
}

video.addEventListener('loadedmetadata', () => {
    scrubber.max = video.duration;
    scrubber.value = 0;
    currentTime.textContent = '0.0s';
    video.currentTime = 0;
    video.classList.add('show');
    dropZone.classList.add('has-video');
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
        alert('Video is not ready. Please wait for it to load.');
        return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    results.classList.remove('hidden');
});

downloadBtn.addEventListener('click', () => {
    canvas.toBlob(blob => {
        saveAs(blob, 'frame-' + Date.now() + '.png');
    });
});

// Hide video controls initially
video.controls = false;