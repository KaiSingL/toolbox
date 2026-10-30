    const upload = document.getElementById('upload');
    const preview = document.getElementById('preview');
    const dropZone = document.getElementById('drop-zone');
    const dropText = document.getElementById('drop-text');
    const generate = document.getElementById('generate');
    const results = document.getElementById('results');
    const iconsList = document.getElementById('icons-list');
    const downloadAll = document.getElementById('download-all');

    let uploadedImage = null;
    let baseName = 'icon';
    let generatedBlobs = [];
    let generatedUrls = [];
    let currentUrl = null;
    let customSizes = [];

    const MAX_PREVIEW_SIZE = 80;
    const PIXELATED_THRESHOLD = 32;

    function saveCustomSizes() {
      try {
        localStorage.setItem('icon-resizer-custom-sizes', JSON.stringify(customSizes));
      } catch (e) {
        console.warn('Could not save custom sizes to localStorage:', e);
      }
    }

    function loadCustomSizes() {
      try {
        const saved = localStorage.getItem('icon-resizer-custom-sizes');
        if (saved) {
          customSizes = JSON.parse(saved);
          renderCustomSizes();
        }
      } catch (e) {
        console.warn('Could not load custom sizes from localStorage:', e);
      }
    }

    function renderCustomSizes() {
      const customSizesList = document.getElementById('custom-sizes-list');
      customSizesList.innerHTML = '';

      customSizes.forEach((size, index) => {
        const label = document.createElement('label');
        label.className = 'size-checkbox custom-size-checkbox';
        label.dataset.size = size;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = size;
        checkbox.checked = false; // Custom sizes start unselected

        const sizeText = document.createElement('span');
        sizeText.textContent = `${size}×${size}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'custom-size-remove';
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          customSizes.splice(index, 1);
          saveCustomSizes();
          renderCustomSizes();
        };

        label.appendChild(checkbox);
        label.appendChild(sizeText);
        label.appendChild(removeBtn);

        customSizesList.appendChild(label);
      });
    }

    function revokeGeneratedUrls() {
      generatedUrls.forEach(url => URL.revokeObjectURL(url));
      generatedUrls = [];
    }

    function clearResults() {
      revokeGeneratedUrls();
      iconsList.innerHTML = '';
      generatedBlobs = [];
    }

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) {
        alert('Please select or drop a valid image file.');
        return;
      }

      baseName = file.name.replace(/\.[^/.]+$/, '');

      const url = URL.createObjectURL(file);
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      currentUrl = url;

      preview.src = url;
      preview.classList.add('show');
      dropText.style.display = 'none';

      uploadedImage = new Image();
      uploadedImage.src = url;

      results.classList.add('hidden');
      clearResults();
    }

    upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) handleFile(file);
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--accent)';
      dropZone.style.background = 'var(--accent-glow)';
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '';
      dropZone.style.background = '';
      const file = e.dataTransfer.files[0];
      handleFile(file);
    });

    // Custom size functionality
    const customSizeInput = document.getElementById('custom-size-input');
    const addCustomSizeBtn = document.getElementById('add-custom-size');

    addCustomSizeBtn.addEventListener('click', () => {
      const size = parseInt(customSizeInput.value.trim());
      if (!size || size < 1 || size > 4096) {
        alert('Please enter a valid size between 1 and 4096 pixels.');
        return;
      }

      if (customSizes.includes(size)) {
        alert('This size is already added.');
        return;
      }

      customSizes.push(size);
      customSizes.sort((a, b) => a - b); // Sort numerically
      saveCustomSizes();
      renderCustomSizes();
      customSizeInput.value = ''; // Clear input
    });

    customSizeInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addCustomSizeBtn.click();
      }
    });

    // Load custom sizes on page load
    loadCustomSizes();

    generate.addEventListener('click', () => {
      if (!uploadedImage) {
        alert('Please upload an image first.');
        return;
      }
      if (!uploadedImage.complete) {
        alert('Image is still loading. Please wait a moment.');
        return;
      }

      const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');

      if (checkboxes.length === 0) {
        alert('Please select at least one size.');
        return;
      }

      // Dedupe (a custom size can match a preset) and draw small icons first
      const selectedSizes = Array.from(new Set(
        Array.from(checkboxes).map(cb => parseInt(cb.value))
      )).sort((a, b) => a - b);

      const standardSizes = new Set(
        Array.from(document.querySelectorAll('.size-options input[type="checkbox"]'))
          .map(cb => parseInt(cb.value))
      );

      clearResults();
      results.classList.remove('hidden');

      const originalLabel = generate.innerHTML;
      generate.disabled = true;
      generate.textContent = 'Generating…';

      // Build every card up front so icons always appear in size order, even
      // though canvas.toBlob callbacks can resolve out of order
      const cards = new Map();

      selectedSizes.forEach(size => {
        const displaySize = Math.min(size, MAX_PREVIEW_SIZE);

        const card = document.createElement('div');
        card.className = 'icon-result';

        const stage = document.createElement('div');
        stage.className = 'icon-stage';

        const img = document.createElement('img');
        img.className = 'checkerboard';
        img.width = displaySize;
        img.height = displaySize;
        img.alt = `Generated icon at ${size}×${size}`;
        img.style.setProperty('--checker-size', `${Math.max(4, Math.round(displaySize / 8))}px`);
        if (displaySize <= PIXELATED_THRESHOLD) {
          img.dataset.small = 'true';
        }

        stage.appendChild(img);

        const meta = document.createElement('div');
        meta.className = 'icon-meta';

        const label = document.createElement('p');
        label.textContent = standardSizes.has(size) ? `${size}×${size}` : `Custom: ${size}×${size}`;

        const note = document.createElement('span');
        note.className = 'icon-meta-note';
        note.textContent = displaySize < size ? `shown at ${displaySize}px` : 'actual size';

        meta.appendChild(label);
        meta.appendChild(note);

        const link = document.createElement('a');
        link.textContent = 'Download';
        link.download = `${baseName}-${size}x${size}.png`;
        link.style.visibility = 'hidden';

        card.appendChild(stage);
        card.appendChild(meta);
        card.appendChild(link);
        iconsList.appendChild(card);

        cards.set(size, { img, link });
      });

      let completedCount = 0;

      selectedSizes.forEach(size => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const crop = Math.min(uploadedImage.naturalWidth, uploadedImage.naturalHeight);
        const sx = (uploadedImage.naturalWidth - crop) / 2;
        const sy = (uploadedImage.naturalHeight - crop) / 2;

        ctx.drawImage(uploadedImage, sx, sy, crop, crop, 0, 0, size, size);

        canvas.toBlob(blob => {
          completedCount++;

          if (blob) {
            const objUrl = URL.createObjectURL(blob);
            generatedUrls.push(objUrl);

            const { img, link } = cards.get(size);
            img.src = objUrl;
            link.href = objUrl;
            link.style.visibility = 'visible';

            generatedBlobs.push({ name: link.download, blob });
          }

          if (completedCount === selectedSizes.length) {
            generate.disabled = false;
            generate.innerHTML = originalLabel;
          }
        }, 'image/png');
      });
    });

    downloadAll.addEventListener('click', () => {
      if (generatedBlobs.length === 0) return;

      const zip = new JSZip();
      generatedBlobs.forEach(item => zip.file(item.name, item.blob));

      zip.generateAsync({ type: 'blob' }).then(content => {
        saveAs(content, `${baseName}-icons.zip`);
      });
    });
