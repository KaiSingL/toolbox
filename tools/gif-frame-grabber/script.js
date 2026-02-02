(function() {
  const dropZone = document.getElementById('drop-zone');
  const upload = document.getElementById('upload');
  const progressSection = document.getElementById('progress-section');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const framesSection = document.getElementById('frames-section');
  const framesGrid = document.getElementById('frames-grid');
  const selectAllBtn = document.getElementById('select-all');
  const deselectAllBtn = document.getElementById('deselect-all');
  const selectionCount = document.getElementById('selection-count');
  const downloadBtn = document.getElementById('download-btn');
  const bottomDownloadSection = document.getElementById('bottom-download-section');
  const bottomSelectionCount = document.getElementById('bottom-selection-count');
  const errorOverlay = document.getElementById('error-overlay');
  const errorMessage = document.getElementById('error-message');

  let frames = [];
  let baseName = 'gif';

  function showError(message) {
    errorMessage.textContent = message;
    errorOverlay.classList.remove('hidden');
    setTimeout(() => errorOverlay.classList.add('hidden'), 5000);
  }

  function updateSelectionCount() {
    const selected = frames.filter(f => f.selected).length;
    selectionCount.textContent = selected + ' / ' + frames.length + ' selected';
    bottomSelectionCount.textContent = selected + ' / ' + frames.length + ' selected';

    if (selected >= 1) {
      bottomDownloadSection.classList.remove('hidden');
    } else {
      bottomDownloadSection.classList.add('hidden');
    }
  }

  function renderFrameCard(frame, index) {
    const card = document.createElement('div');
    card.className = 'frame-card' + (frame.selected ? ' selected' : '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'frame-checkbox';
    checkbox.checked = frame.selected;
    checkbox.addEventListener('change', function() {
      frame.selected = checkbox.checked;
      card.classList.toggle('selected', frame.selected);
      updateSelectionCount();
    });

    const img = document.createElement('img');
    img.className = 'frame-image';
    img.src = frame.dataUrl;
    img.alt = 'Frame ' + (index + 1);
    img.loading = 'lazy';

    const number = document.createElement('span');
    number.className = 'frame-number';
    number.textContent = 'Frame ' + (index + 1);

    card.appendChild(checkbox);
    card.appendChild(img);
    card.appendChild(number);

    return card;
  }

  async function extractFrames(file) {
    if (!file || file.type !== 'image/gif') {
      showError('Please select a valid GIF file');
      return;
    }

    baseName = file.name.replace(/\.[^/.]+$/, '');

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    let reader;
    try {
      reader = new GifReader(uint8Array);
    } catch (e) {
      console.error('GIF parsing error:', e);
      showError('Failed to parse GIF file. The file may be corrupted or in an unsupported format.');
      return;
    }

    const numFrames = reader.numFrames();
    if (numFrames === 0) {
      showError('No frames found in GIF');
      return;
    }

    frames = [];
    framesGrid.innerHTML = '';
    progressSection.classList.remove('hidden');
    framesSection.classList.add('hidden');

    const width = reader.width;
    const height = reader.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < numFrames; i++) {
      const percent = Math.round(((i + 1) / numFrames) * 100);
      progressFill.style.width = percent + '%';
      progressText.textContent = 'Extracting frames: ' + (i + 1) + ' / ' + numFrames;

      const frameInfo = reader.frameInfo(i);

      if (frameInfo.width === width && frameInfo.height === height) {
        const frameData = new Uint8ClampedArray(width * height * 4);
        reader.decodeAndBlitFrameRGBA(i, frameData);

        ctx.putImageData(new ImageData(frameData, width, height), 0, 0);

        const dataUrl = canvas.toDataURL('image/png');

        frames.push({
          dataUrl: dataUrl,
          selected: false
        });
      }

      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    progressSection.classList.add('hidden');
    framesSection.classList.remove('hidden');

    frames.forEach(function(frame, index) {
      framesGrid.appendChild(renderFrameCard(frame, index));
    });

    updateSelectionCount();
  }

  function handleFile(file) {
    extractFrames(file);
  }

  function selectAll() {
    frames.forEach(function(frame) {
      frame.selected = true;
    });
    document.querySelectorAll('.frame-checkbox').forEach(function(cb) {
      cb.checked = true;
    });
    document.querySelectorAll('.frame-card').forEach(function(card) {
      card.classList.add('selected');
    });
    updateSelectionCount();
  }

  function deselectAll() {
    frames.forEach(function(frame) {
      frame.selected = false;
    });
    document.querySelectorAll('.frame-checkbox').forEach(function(cb) {
      cb.checked = false;
    });
    document.querySelectorAll('.frame-card').forEach(function(card) {
      card.classList.remove('selected');
    });
    updateSelectionCount();
  }

  async function download() {
    const selectedFrames = frames.filter(function(f) {
      return f.selected;
    });

    if (selectedFrames.length === 0) {
      showError('No frames selected');
      return;
    }

    if (selectedFrames.length === 1) {
      const frame = selectedFrames[0];
      const index = frames.indexOf(frame);
      const link = document.createElement('a');
      link.download = baseName + '-frame-' + String(index + 1).padStart(3, '0') + '.png';
      link.href = frame.dataUrl;
      link.click();
    } else {
      const zip = new JSZip();
      selectedFrames.forEach(function(frame) {
        const originalIndex = frames.indexOf(frame);
        const fileName = baseName + '-frame-' + String(originalIndex + 1).padStart(3, '0') + '.png';
        const base64Data = frame.dataUrl.split(',')[1];
        zip.file(fileName, base64Data, { base64: true });
      });

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, baseName + '-frames.zip');
    }
  }

  dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  upload.addEventListener('change', function(e) {
    const file = e.target.files[0];
    handleFile(file);
  });

  selectAllBtn.addEventListener('click', selectAll);
  deselectAllBtn.addEventListener('click', deselectAll);
  downloadBtn.addEventListener('click', download);
  document.getElementById('bottom-download-btn').addEventListener('click', download);
})();
