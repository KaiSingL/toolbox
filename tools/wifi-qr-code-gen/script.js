let currentType = 'wifi';
let logoImage = null;

function showError(msg) {
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = msg;
  errorDiv.classList.remove("hidden");
  console.error(msg);
}

function clearError() {
  document.getElementById("error").classList.add("hidden");
}

function clearQR() {
  const qrDiv = document.getElementById("qrcode");
  if (!qrDiv) return;
  qrDiv.classList.add("hidden");
  qrDiv.classList.remove("show");
  const container = qrDiv.querySelector('.qr-container');
  if (container) container.innerHTML = '';
}

function switchType(type) {
  currentType = type;

  document.querySelectorAll('.type-btn').forEach(btn => {
    const isActive = btn.dataset.type === type;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive);
  });

  document.querySelectorAll('.form-section').forEach(section => {
    section.classList.add('hidden');
  });

  const activeForm = document.getElementById(`form-${type}`);
  if (activeForm) activeForm.classList.remove('hidden');

  clearError();
  clearQR();
}

function getWifiData() {
  const ssid = document.getElementById("ssid").value.trim();
  const pwd = document.getElementById("pwd").value || "";
  if (!ssid) return null;
  return `WIFI:S:${escapeSemiColon(ssid)};T:WPA;P:${escapeSemiColon(pwd)};;`;
}

function getUrlData() {
  const url = document.getElementById("url-input").value.trim();
  if (!url) return null;
  try {
    new URL(url);
    return url;
  } catch {
    return null;
  }
}

function getTextData() {
  const text = document.getElementById("text-input").value;
  if (!text.trim()) return null;
  return text;
}

function getEmailData() {
  const to = document.getElementById("email-to").value.trim();
  const subject = document.getElementById("email-subject").value.trim();
  const body = document.getElementById("email-body").value.trim();

  if (!to) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) return null;

  let mailto = `mailto:${encodeURIComponent(to)}`;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length) mailto += '?' + params.join('&');

  return mailto;
}

function escapeSemiColon(str) {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/:/g, '\\:').replace(/"/g, '\\"');
}

function loadLogo(file) {
  if (!file || !file.type.startsWith('image/')) {
    showError('Please select a valid image file.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      logoImage = img;
      document.getElementById('logo-preview-img').src = e.target.result;
      document.getElementById('logo-preview').classList.remove('hidden');
      clearError();
    };
    img.onerror = () => {
      showError('Failed to load image. Try a different file.');
    };
    img.src = e.target.result;
  };
  reader.onerror = () => {
    showError('Failed to read file.');
  };
  reader.readAsDataURL(file);
}

function clearLogo() {
  logoImage = null;
  document.getElementById('logo-input').value = '';
  document.getElementById('logo-preview').classList.add('hidden');
  document.getElementById('logo-preview-img').src = '';
}

function drawLogoOnCanvas(canvas) {
  if (!logoImage) return;

  const ctx = canvas.getContext('2d');
  const qrSize = canvas.width;
  const logoSize = Math.floor(qrSize * 0.22);
  const padding = Math.floor(logoSize * 0.1);
  const totalSize = logoSize + padding * 2;
  const position = (qrSize - totalSize) / 2;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(position, position, totalSize, totalSize);

  const logoX = position + padding;
  const logoY = position + padding;
  ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
}

function generateQR() {
  clearError();
  clearQR();

  const dataMap = {
    wifi: { fn: getWifiData, label: 'ssid' },
    url: { fn: getUrlData, label: 'url' },
    text: { fn: getTextData, label: 'text' },
    email: { fn: getEmailData, label: 'email' }
  };

  const config = dataMap[currentType];
  const qrData = config.fn();

  if (!qrData) {
    const errorMessages = {
      wifi: 'Please enter a network name (SSID).',
      url: 'Please enter a valid URL (including https://).',
      text: 'Please enter some text.',
      email: 'Please enter a valid email address.'
    };
    showError(errorMessages[currentType]);
    return;
  }

  console.log("QR Data:", qrData);

  const qrDiv = document.getElementById("qrcode");
  if (!qrDiv) return;
  const container = qrDiv.querySelector('.qr-container');
  if (!container) return;
  container.innerHTML = '';

  if (typeof QRCode === "undefined") {
    showError("Library not loaded—check connection and refresh.");
    return;
  }

  try {
    new QRCode(container, {
      text: qrData,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
    console.log("QR generated!");

    const canvas = container.querySelector('canvas');
    if (canvas && logoImage) {
      drawLogoOnCanvas(canvas);
    }

    qrDiv.classList.remove("hidden");
    setTimeout(() => qrDiv.classList.add("show"), 0);
  } catch (err) {
    showError("Error: " + err.message);
    console.error(err);
  }
}

function downloadQR() {
  const qrDiv = document.getElementById("qrcode");
  if (!qrDiv) return;
  const container = qrDiv.querySelector('.qr-container');
  if (!container) return;

  const canvas = container.querySelector("canvas");
  const img = container.querySelector("img");

  let url;
  if (canvas) {
    url = canvas.toDataURL("image/png");
  } else if (img) {
    url = img.src;
  } else {
    showError("No QR code to download.");
    return;
  }

  const filenames = {
    wifi: () => `${document.getElementById("ssid").value.trim() || 'wifi'}-qr.png`,
    url: () => {
      try {
        const urlObj = new URL(document.getElementById("url-input").value.trim());
        return `${urlObj.hostname}-qr.png`;
      } catch {
        return 'url-qr.png';
      }
    },
    text: () => 'text-qr.png',
    email: () => `${document.getElementById("email-to").value.trim().split('@')[0] || 'email'}-qr.png`
  };

  const filename = filenames[currentType]();

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => switchType(btn.dataset.type));
  });

  const generateBtn = document.getElementById("generate-btn");
  const downloadBtn = document.getElementById("download-btn");
  if (generateBtn) generateBtn.addEventListener("click", generateQR);
  if (downloadBtn) downloadBtn.addEventListener("click", downloadQR);

  const logoInput = document.getElementById('logo-input');
  const uploadLogoBtn = document.getElementById('upload-logo-btn');
  const removeLogoBtn = document.getElementById('remove-logo-btn');

  if (uploadLogoBtn && logoInput) {
    uploadLogoBtn.addEventListener('click', () => logoInput.click());
    logoInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        loadLogo(e.target.files[0]);
      }
    });
  }

  if (removeLogoBtn) {
    removeLogoBtn.addEventListener('click', clearLogo);
  }

  console.log("Ready. Library loaded:", typeof QRCode !== "undefined");
});
