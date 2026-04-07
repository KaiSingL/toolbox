const tpsInput = document.getElementById('tps-input');
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');
const output = document.getElementById('output');
const errorEl = document.getElementById('error');

let running = false;
let intervalId = null;
let timeouts = [];

const START_HTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5,3 19,12 5,21" /></svg> Start`;
const STOP_HTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="4" y="4" width="16" height="16" rx="1" /></svg> Stop`;

function generateToken() {
    const len = Math.floor(Math.random() * 3) + 2;
    let token = '';
    for (let i = 0; i < len; i++) {
        token += String.fromCharCode(97 + Math.floor(Math.random() * 26));
    }
    return token;
}

function stop() {
    running = false;
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    timeouts.forEach(t => clearTimeout(t));
    timeouts = [];
    startBtn.innerHTML = START_HTML;
    tpsInput.disabled = false;
}

function start() {
    const tps = parseInt(tpsInput.value, 10);
    if (isNaN(tps) || tps < 1 || tps > 500) {
        showError('Enter a value between 1 and 500.');
        return;
    }
    hideError();

    stop();

    running = true;
    startBtn.innerHTML = STOP_HTML;
    tpsInput.disabled = true;

    const delay = 1000 / tps;

    function emitBatch() {
        if (!running) return;
        const batchTimeouts = [];
        for (let i = 0; i < tps; i++) {
            const tid = setTimeout(() => {
                if (!running) return;
                output.textContent += generateToken() + ' ';
                output.scrollTop = output.scrollHeight;
            }, delay * i);
            batchTimeouts.push(tid);
        }
        timeouts = timeouts.concat(batchTimeouts);
    }

    emitBatch();
    intervalId = setInterval(() => {
        if (!running) {
            clearInterval(intervalId);
            return;
        }
        emitBatch();
    }, 1000);
}

function clear() {
    stop();
    output.textContent = '';
    hideError();
}

function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function hideError() {
    errorEl.classList.add('hidden');
}

startBtn.addEventListener('click', () => {
    if (running) {
        stop();
    } else {
        start();
    }
});

clearBtn.addEventListener('click', clear);
