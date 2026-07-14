// State
const grid = document.getElementById('symbol-grid');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const categoryNav = document.getElementById('category-nav');
const noResults = document.getElementById('no-results');
const toast = document.getElementById('toast');
const categories = window.CATEGORIES || [];

let toastTimer = null;
let sectionObserver = null;
let isSearchActive = false;

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
    title.innerHTML = cat.name + '<span class="category-note">' + cat.note + '</span>';
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

function renderCategoryNav() {
    categoryNav.innerHTML = '';
    categories.forEach((cat, i) => {
        const chip = document.createElement('a');
        chip.className = 'category-chip';
        chip.href = '#cat-' + slugify(cat.name);
        chip.textContent = cat.name;
        chip.dataset.categoryIndex = i;
        chip.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.getElementById('cat-' + slugify(cat.name));
            if (target) {
                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
        categoryNav.appendChild(chip);
    });
}

// Scroll spy
function initScrollSpy() {
    if (sectionObserver) sectionObserver.disconnect();

    const sections = document.querySelectorAll('.category-section');
    const chips = categoryNav.querySelectorAll('.category-chip');

    sectionObserver = new IntersectionObserver((entries) => {
        if (isSearchActive) return;
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const idx = entry.target.dataset.categoryIndex;
                chips.forEach(c => {
                    c.classList.toggle('active', c.dataset.categoryIndex === idx);
                });
            }
        });
    }, { rootMargin: '-80px 0px -70% 0px' });

    sections.forEach(s => sectionObserver.observe(s));
}

// Search
function performSearch(query) {
    query = query.trim().toLowerCase();

    if (!query) {
        isSearchActive = false;
        // Show all
        document.querySelectorAll('.symbol-card').forEach(c => {
            c.style.display = '';
        });
        document.querySelectorAll('.category-section').forEach(s => {
            s.style.display = '';
        });
        noResults.hidden = true;
        categoryNav.style.display = '';
        initScrollSpy();
        return;
    }

    isSearchActive = true;
    categoryNav.style.display = 'none';
    let visibleCount = 0;

    document.querySelectorAll('.category-section').forEach(section => {
        let sectionVisible = false;
        const cards = section.querySelectorAll('.symbol-card');
        cards.forEach(card => {
            const matches = card.dataset.name.includes(query) ||
                            card.dataset.code.includes(query) ||
                            card.dataset.char === query;
            card.style.display = matches ? '' : 'none';
            if (matches) {
                sectionVisible = true;
                visibleCount++;
            }
        });
        section.style.display = sectionVisible ? '' : 'none';
    });

    noResults.hidden = visibleCount > 0;
}

// Event listeners
searchInput.addEventListener('input', () => {
    const value = searchInput.value;
    searchClear.hidden = !value;
    performSearch(value);
});

searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    performSearch('');
    searchInput.focus();
});

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        searchInput.value = '';
        searchClear.hidden = true;
        performSearch('');
        searchInput.blur();
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderCategoryNav();
    renderAll();
});
