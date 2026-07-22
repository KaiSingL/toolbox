// State
const grid = document.getElementById('symbol-grid');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const emojiToggle = document.getElementById('emoji-toggle');
const categoryPill = document.getElementById('category-pill');
const categoryPillLabel = document.getElementById('category-pill-label');
const categoryOverlay = document.getElementById('category-overlay');
const noResults = document.getElementById('no-results');
const toast = document.getElementById('toast');
const categories = window.CATEGORIES || [];

let toastTimer = null;
let sectionObserver = null;
let isSearchActive = false;
// 'hide' → filter emoji out, 'only' → show only emoji, 'all' → show everything
let emojiFilter = 'hide';
let overlayOpen = false;
let currentCategoryIndex = -1;

const EMOJI_RE = /\p{Extended_Pictographic}/u;

const TEXT_SYMBOL_CODEPOINTS = new Set([
    0x2194, 0x2195, 0x2196, 0x2197, 0x2198, 0x2199,
    0x21A9, 0x21AA,
    0x25AA, 0x25AB, 0x25B6, 0x25C0, 0x25FB, 0x25FC,
    0x2600, 0x2602, 0x2603, 0x2604, 0x260E,
    0x2611, 0x2618,
    0x2620, 0x2622, 0x2623, 0x262A,
    0x2639, 0x263A,
    0x265F,
    0x2660, 0x2663, 0x2665, 0x2666,
    0x2692, 0x2695, 0x269B,
    0x26A0,
    0x2702, 0x2708, 0x2709, 0x270F, 0x2712,
    0x2714, 0x2716,
    0x2733, 0x2734,
    0x2744, 0x2747,
    0x27A1,
    0x2122,
    0x00A9, 0x00AE,
]);

function isEmojiChar(c) {
    return EMOJI_RE.test(c) && !TEXT_SYMBOL_CODEPOINTS.has(c.codePointAt(0));
}

// Format derivation
function getCodepoint(char) {
    const cp = char.codePointAt(0);
    return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}

function getHtmlEntity(char) {
    const cp = char.codePointAt(0);
    return '&#x' + cp.toString(16).toUpperCase() + ';';
}

function getCssEscape(char) {
    const cp = char.codePointAt(0);
    const hex = cp.toString(16).toUpperCase();
    return '\\' + hex;
}

function getJsEscape(char) {
    const cp = char.codePointAt(0);
    if (cp > 0xFFFF) {
        return '\\u{' + cp.toString(16).toUpperCase() + '}';
    }
    return '\\u' + cp.toString(16).toUpperCase().padStart(4, '0');
}

function getFormats(char) {
    return {
        char: char,
        code: getCodepoint(char),
        html: getHtmlEntity(char),
        css: getCssEscape(char),
        js: getJsEscape(char)
    };
}

// Copy to clipboard with fallback
async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (e) {
        // Fallback for non-secure contexts
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            const result = document.execCommand('copy');
            document.body.removeChild(textarea);
            return result;
        } catch (e2) {
            return false;
        }
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.hidden = false;
    // Force reflow before adding visible class for transition
    void toast.offsetWidth;
    toast.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => { toast.hidden = true; }, 300);
    }, 2000);
}

function flashChip(chip) {
    const originalText = chip.textContent;
    chip.classList.add('copied');
    chip.textContent = '\u2713';
    setTimeout(() => {
        chip.classList.remove('copied');
        chip.textContent = originalText;
    }, 1200);
}

// Rendering
function slugify(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function renderCategory(cat, categoryIndex) {
    const section = document.createElement('section');
    section.className = 'category-section';
    section.dataset.categoryIndex = categoryIndex;

    const slug = slugify(cat.name);
    section.id = 'cat-' + slug;

    const title = document.createElement('h2');
    title.className = 'category-title';
    title.textContent = cat.name;
    section.appendChild(title);

    cat.symbols.forEach((sym, symIndex) => {
        const card = createCard(sym, categoryIndex, symIndex);
        section.appendChild(card);
    });

    return section;
}

function createCard(sym, categoryIndex, symIndex) {
    const formats = getFormats(sym.c);
    const card = document.createElement('div');
    card.className = 'symbol-card';
    card.dataset.char = sym.c;
    card.dataset.name = sym.n.toLowerCase();
    card.dataset.code = formats.code.toLowerCase();
    card.dataset.categoryIndex = categoryIndex;
    card.dataset.isEmoji = isEmojiChar(sym.c) ? 'true' : 'false';

    // Glyph (click to copy character)
    const glyph = document.createElement('div');
    glyph.className = 'symbol-glyph';
    glyph.textContent = sym.c;
    glyph.setAttribute('role', 'button');
    glyph.setAttribute('tabindex', '0');
    glyph.setAttribute('aria-label', 'Copy character ' + sym.n);
    glyph.title = 'Click to copy: ' + sym.c;
    card.appendChild(glyph);

    // Name
    const name = document.createElement('p');
    name.className = 'symbol-name';
    name.textContent = sym.n;
    card.appendChild(name);

    // Format chips
    const chips = document.createElement('div');
    chips.className = 'format-chips';

    const chipData = [
        { label: formats.code, text: formats.code, title: 'Copy codepoint' },
        { label: 'HTML', text: formats.html, title: 'Copy HTML entity' },
        { label: 'CSS', text: formats.css, title: 'Copy CSS escape' },
        { label: 'JS', text: formats.js, title: 'Copy JS escape' }
    ];

    chipData.forEach(cd => {
        const chip = document.createElement('button');
        chip.className = 'format-chip';
        chip.type = 'button';
        chip.textContent = cd.label;
        chip.title = cd.title;
        chip.setAttribute('aria-label', cd.title + ': ' + cd.text);
        chip.addEventListener('click', (e) => {
            e.stopPropagation();
            copyText(cd.text).then(success => {
                if (success) {
                    flashChip(chip);
                    showToast('Copied: ' + cd.text);
                } else {
                    showToast('Copy failed');
                }
            });
        });
        chips.appendChild(chip);
    });

    card.appendChild(chips);

    // Click glyph to copy character
    const copyChar = () => {
        copyText(sym.c).then(success => {
            if (success) {
                showToast('Copied: ' + sym.c);
            } else {
                showToast('Copy failed');
            }
        });
    };

    glyph.addEventListener('click', (e) => {
        e.stopPropagation();
        copyChar();
    });

    glyph.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            copyChar();
        }
    });

    // Mobile: tap card to toggle selected (reveal chips)
    card.addEventListener('click', () => {
        if (window.innerWidth <= 480) {
            // Deselect others
            document.querySelectorAll('.symbol-card.selected').forEach(c => {
                if (c !== card) c.classList.remove('selected');
            });
            card.classList.toggle('selected');
        }
    });

    return card;
}

function renderAll() {
    grid.innerHTML = '';
    categories.forEach((cat, i) => {
        grid.appendChild(renderCategory(cat, i));
    });
    initScrollSpy();
}

function renderCategoryOverlay() {
    categoryOverlay.innerHTML = '';
    categories.forEach((cat, i) => {
        const section = document.getElementById('cat-' + slugify(cat.name));
        if (!section || section.style.display === 'none') return;

        const item = document.createElement('button');
        item.className = 'overlay-item';
        item.type = 'button';
        item.textContent = cat.name;
        item.dataset.categoryIndex = i;
        item.addEventListener('click', () => {
            closeOverlay();
            const target = document.getElementById('cat-' + slugify(cat.name));
            if (target) {
                const offset = 140;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
        categoryOverlay.appendChild(item);
    });
    updateOverlayActive();
}

function openOverlay() {
    overlayOpen = true;
    renderCategoryOverlay();
    categoryOverlay.classList.add('open');
    categoryPill.setAttribute('aria-expanded', 'true');

    const backdrop = document.createElement('div');
    backdrop.className = 'overlay-backdrop';
    backdrop.id = 'overlay-backdrop';
    backdrop.addEventListener('click', closeOverlay);
    document.body.appendChild(backdrop);

    updateOverlayActive();
}

function closeOverlay() {
    overlayOpen = false;
    categoryOverlay.classList.remove('open');
    categoryPill.setAttribute('aria-expanded', 'false');
    const backdrop = document.getElementById('overlay-backdrop');
    if (backdrop) backdrop.remove();
}

function updateOverlayActive() {
    const items = categoryOverlay.querySelectorAll('.overlay-item');
    items.forEach(item => {
        item.classList.toggle('active',
            parseInt(item.dataset.categoryIndex) === currentCategoryIndex);
    });
}

// Scroll spy
function initScrollSpy() {
    if (sectionObserver) sectionObserver.disconnect();

    const sections = document.querySelectorAll('.category-section');

    sectionObserver = new IntersectionObserver((entries) => {
        if (isSearchActive) return;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = parseInt(entry.target.dataset.categoryIndex);
                currentCategoryIndex = idx;
                const cat = categories[idx];
                if (cat) {
                    categoryPillLabel.textContent = cat.name;
                    if (overlayOpen) updateOverlayActive();
                }
            }
        });
    }, { rootMargin: '-60px 0px -70% 0px' });

    sections.forEach(s => sectionObserver.observe(s));
}

// Filters (search + emoji toggle)
function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    const hasQuery = query.length > 0;

    isSearchActive = hasQuery;
    categoryPill.style.display = hasQuery ? 'none' : '';
    if (overlayOpen) closeOverlay();

    let visibleCount = 0;

    document.querySelectorAll('.category-section').forEach(section => {
        let sectionVisible = false;
        const cards = section.querySelectorAll('.symbol-card');
        cards.forEach(card => {
            const matchesSearch = !hasQuery ||
                card.dataset.name.includes(query) ||
                card.dataset.code.includes(query) ||
                card.dataset.char === query;
            const isEmoji = card.dataset.isEmoji === 'true';
            const passesEmoji = emojiFilter === 'all' ||
                (emojiFilter === 'hide' && !isEmoji) ||
                (emojiFilter === 'only' && isEmoji);
            const visible = matchesSearch && passesEmoji;
            card.style.display = visible ? '' : 'none';
            if (visible) {
                sectionVisible = true;
                visibleCount++;
            }
        });
        section.style.display = sectionVisible ? '' : 'none';
    });

    noResults.hidden = visibleCount > 0;

    if (!hasQuery) {
        initScrollSpy();
    }
}

// Event listeners
searchInput.addEventListener('input', () => {
    const value = searchInput.value;
    searchClear.hidden = !value;
    applyFilters();
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    applyFilters();
    searchInput.focus();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        searchClear.hidden = true;
        applyFilters();
        searchInput.blur();
    }
});

const NEXT_FILTER = { hide: 'only', only: 'all', all: 'hide' };
const FILTER_LABEL = { hide: 'Hide emoji', only: 'Emoji only', all: 'Show all' };

emojiToggle.addEventListener('click', () => {
    emojiFilter = NEXT_FILTER[emojiFilter];
    emojiToggle.dataset.state = emojiFilter;
    emojiToggle.textContent = FILTER_LABEL[emojiFilter];
    emojiToggle.setAttribute('aria-label', FILTER_LABEL[emojiFilter]);
    applyFilters();
});

categoryPill.addEventListener('click', () => {
    if (overlayOpen) {
        closeOverlay();
    } else {
        openOverlay();
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlayOpen) {
        closeOverlay();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderAll();
    applyFilters();
});
