function showError(msg) {
  const errorDiv = document.getElementById("error");
  errorDiv.textContent = msg;
  errorDiv.classList.remove("hidden");
  console.error(msg);
}

function clearError() {
  document.getElementById("error").classList.add("hidden");
}

function generateQR() {
  clearError();
  const ssid = document.getElementById("ssid").value.trim();
  const pwd = document.getElementById("pwd").value || "";

  if (!ssid) {
    showError("Please enter SSID.");
    return;
  }

  const wifiData = `WIFI:S:${ssid};T:WPA;P:${pwd};;`;
  console.log("QR Data:", wifiData);

  const qrDiv = document.getElementById("qrcode");
  qrDiv.innerHTML = "";
  qrDiv.classList.remove("show");

  document.getElementById("download-btn").classList.add("hidden");

  if (typeof QRCode === "undefined") {
    showError("Library not loaded—check connection and refresh.");
    return;
  }

  try {
    new QRCode(qrDiv, {
      text: wifiData,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
    console.log("QR generated!");
    qrDiv.classList.remove("hidden");
    setTimeout(() => qrDiv.classList.add("show"), 0);
    document.getElementById("download-btn").classList.remove("hidden");
  } catch (err) {
    showError("Error: " + err.message);
    console.error(err);
  }
}

function downloadQR() {
  const qrDiv = document.getElementById("qrcode");
  const canvas = qrDiv.querySelector("canvas");
  const img = qrDiv.querySelector("img");

  let url;
  if (canvas) {
    url = canvas.toDataURL("image/png");
  } else if (img) {
    url = img.src;
  } else {
    showError("No QR code to download.");
    return;
  }

  const ssid = document.getElementById("ssid").value.trim() || "wifi";
  const filename = `${ssid}-qr.png`;

  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
}

window.onload = function () {
  const generateBtn = document.getElementById("generate-btn");
  const downloadBtn = document.getElementById("download-btn");
  generateBtn.addEventListener("click", generateQR);
  downloadBtn.addEventListener("click", downloadQR);
  console.log("Ready. Library loaded:", typeof QRCode !== "undefined");
};
