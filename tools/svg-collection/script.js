// Theme management
function initTheme() {
  const themeToggle = document.getElementById('theme-toggle');
  if (!themeToggle) return;

  const htmlElement = document.documentElement;

  // Check for saved theme preference or default to system preference
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  if (initialTheme === 'dark') {
    htmlElement.setAttribute('data-theme', 'dark');
  }

  // Update toggle button icon
  updateThemeIcon();

  // Theme toggle event listener
  themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    if (newTheme === 'dark') {
      htmlElement.setAttribute('data-theme', 'dark');
    } else {
      htmlElement.removeAttribute('data-theme');
    }

    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const themeToggle = document.getElementById('theme-toggle');
  const iconContainer = themeToggle.querySelector('.theme-icon');
  const currentTheme = document.documentElement.getAttribute('data-theme');

  // Clear existing icon
  iconContainer.innerHTML = '';

  if (currentTheme === 'dark') {
    // Sun icon for light mode
    iconContainer.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
      </svg>
    `;
  } else {
    // Moon icon for dark mode
    iconContainer.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
      </svg>
    `;
  }
}

// SVG cache
const svgCache = new Map();

// Lazy loading with IntersectionObserver
const iconObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadIcon(entry.target);
      iconObserver.unobserve(entry.target);
    }
  });
}, { rootMargin: '100px' });

function loadIcon(placeholder) {
  const iconCard = placeholder.closest('.icon-card');
  const iconName = iconCard.dataset.icon;
  const placeholderId = placeholder.id;

  fetch(`icons/${iconName}.svg`)
    .then(response => {
      if (!response.ok) throw new Error('Failed to load icon');
      return response.text();
    })
    .then(svgContent => {
      placeholder.innerHTML = svgContent;
      placeholder.classList.add('loaded');
      svgCache.set(placeholderId, svgContent);
    })
    .catch(err => {
      console.error(`Failed to load icon ${iconName}:`, err);
      placeholder.classList.add('error');
    });
}

async function copyIcon(button, iconName, placeholderId) {
  let svgContent = svgCache.get(placeholderId);

  if (!svgContent) {
    try {
      const response = await fetch(`icons/${iconName}.svg`);
      if (!response.ok) throw new Error('Failed to load icon');
      svgContent = await response.text();
      svgCache.set(placeholderId, svgContent);
    } catch (err) {
      console.error('Copy failed:', err);
      alert('Copy failed - try again');
      return;
    }
  }

  try {
    await navigator.clipboard.writeText(svgContent);

    const originalHTML = button.innerHTML;
    button.classList.add('success');
    button.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
      </svg>
    `;

    setTimeout(() => {
      button.classList.remove('success');
      button.innerHTML = originalHTML;
    }, 2000);
  } catch (err) {
    console.error('Copy failed:', err);
    alert('Copy failed - try again');
  }
}

function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.innerHTML = `
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
      </svg>
    `;
  });

  const copyButtons = document.querySelectorAll('[id^="copy-"]');

  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const iconName = this.id.replace('copy-', '');
      const placeholderId = `svg-${iconName}`;
      copyIcon(this, iconName, placeholderId);
    });
  });
}

function initLazyLoading() {
  const placeholders = document.querySelectorAll('.icon-placeholder');
  placeholders.forEach(placeholder => {
    iconObserver.observe(placeholder);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initCopyButtons();
  initLazyLoading();
});
