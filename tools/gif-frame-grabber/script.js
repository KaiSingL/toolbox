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

  function isValidGifFile(file) {
    if (!file) return false;
    if (file.type === 'image/gif') return true;
    if (file.name && file.name.toLowerCase().endsWith('.gif')) return true;
    return false;
  }

  function isGifData(uint8Array) {
    if (uint8Array.length < 6) return false;
    return uint8Array[0] === 0x47 && uint8Array[1] === 0x49 && uint8Array[2] === 0x46 &&
           uint8Array[3] === 0x38 && (uint8Array[4] === 0x39 || uint8Array[4] === 0x37) && uint8Array[5] === 0x61;
  }

  async function extractFramesWithOmggif(uint8Array) {
    const reader = new GifReader(uint8Array);
    const numFrames = reader.numFrames();
    if (numFrames === 0) return null;

    const width = reader.width;
    const height = reader.height;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Running pixel buffer — accumulates frame data across all frames.
    // decodeAndBlitFrameRGBA writes only the frame's region at (x,y) offset,
    // leaving the rest unchanged in this buffer. This is critical for partial frames.
    let runningPixels = new Uint8ClampedArray(width * height * 4);

    function drawRunningPixelsToCanvas() {
      const imgData = new ImageData(runningPixels.slice(), width, height);
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imgData, 0, 0);
    }

    const resultFrames = [];

    for (let i = 0; i < numFrames; i++) {
      const percent = Math.round(((i + 1) / numFrames) * 100);
      progressFill.style.width = percent + '%';
      progressText.textContent = 'Extracting frames: ' + (i + 1) + ' / ' + numFrames;

      const frameInfo = reader.frameInfo(i);

      // Save running buffer BEFORE decode (for disposal method 3: restore to previous)
      let savedPixels = null;
      if (frameInfo.disposal === 3) {
        savedPixels = runningPixels.slice();
      }

      // Decode frame into running buffer at correct (x, y) offset.
      // Partial frames only overwrite their region — previous pixels persist.
      reader.decodeAndBlitFrameRGBA(i, runningPixels);

      // Draw entire canvas and capture as PNG
      drawRunningPixelsToCanvas();
      resultFrames.push({
        dataUrl: canvas.toDataURL('image/png'),
        selected: false
      });

      // Apply disposal method for the NEXT frame
      if (frameInfo.disposal === 2) {
        // Restore to background (transparent) — clear this frame's bounding rect
        for (let fy = frameInfo.y; fy < frameInfo.y + frameInfo.height; fy++) {
          for (let fx = frameInfo.x; fx < frameInfo.x + frameInfo.width; fx++) {
            const idx = (fy * width + fx) * 4;
            runningPixels[idx] = 0;
            runningPixels[idx + 1] = 0;
            runningPixels[idx + 2] = 0;
            runningPixels[idx + 3] = 0;
          }
        }
      } else if (frameInfo.disposal === 3 && savedPixels) {
        // Restore to previous — revert running buffer to pre-decode state
        runningPixels = savedPixels;
      }
      // disposal 0 and 1: keep running buffer as-is

      if (i % 5 === 0) {
        await new Promise(function(resolve) { setTimeout(resolve, 0); });
      }
    }

    return resultFrames;
  }

  async function extractFramesBrowserNative(file) {
    if (typeof ImageDecoder === 'undefined') {
      throw new Error('ImageDecoder API not supported');
    }

    const decoder = new ImageDecoder({ data: file, type: 'image/gif' });
    await decoder.completed;

    const track = decoder.tracks.selectedTrack;
    const numFrames = track.frameCount;
    if (numFrames === 0) return null;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const resultFrames = [];

    for (let i = 0; i < numFrames; i++) {
      const percent = Math.round(((i + 1) / numFrames) * 100);
      progressFill.style.width = percent + '%';
      progressText.textContent = 'Extracting frames: ' + (i + 1) + ' / ' + numFrames;

      const result = await decoder.decode({ frameIndex: i });
      const bitmap = result.image;

      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      ctx.drawImage(bitmap, 0, 0);

      resultFrames.push({
        dataUrl: canvas.toDataURL('image/png'),
        selected: false
      });

      bitmap.close();

      if (i % 5 === 0) {
        await new Promise(function(resolve) { setTimeout(resolve, 0); });
      }
    }

    return resultFrames;
  }

  async function extractFrames(file) {
    if (!isValidGifFile(file)) {
      showError('Please select a valid GIF file');
      return;
    }

    baseName = file.name.replace(/\.[^/.]+$/, '');

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    if (!isGifData(uint8Array)) {
      showError('File does not contain valid GIF data');
      return;
    }

    frames = [];
    framesGrid.innerHTML = '';
    progressSection.classList.remove('hidden');
    framesSection.classList.add('hidden');

    // Try omggif first
    try {
      const result = await extractFramesWithOmggif(uint8Array);
      if (result && result.length > 0) {
        frames = result;
      }
    } catch (e) {
      console.warn('omggif failed, trying browser-native decoder:', e);
    }

    // Fallback to browser-native ImageDecoder
    if (frames.length === 0) {
      progressText.textContent = 'Trying browser-native decoder...';
      try {
        const result2 = await extractFramesBrowserNative(file);
        if (result2 && result2.length > 0) {
          frames = result2;
        }
      } catch (e) {
        console.error('Browser-native decoder also failed:', e);
        showError('Failed to extract frames. The GIF may be corrupted or use an unsupported format.');
        progressSection.classList.add('hidden');
        return;
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
