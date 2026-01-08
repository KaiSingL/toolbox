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

// Copy functionality
function initCopyButtons() {
  const copyButtons = document.querySelectorAll('[id^="copy-"]');

  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const svgId = this.id.replace('copy-', 'svg-');
      const svgElement = document.getElementById(svgId);

      if (svgElement) {
        const svgCode = svgElement.outerHTML;

        navigator.clipboard.writeText(svgCode).then(() => {
          // Success feedback
          const originalHTML = button.innerHTML;
          button.classList.add('success');
          button.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          `;

          // Reset after 2 seconds
          setTimeout(() => {
            button.classList.remove('success');
            button.innerHTML = originalHTML;
          }, 2000);
        }).catch(err => {
          console.error('Copy failed:', err);
          alert('Copy failed – try again');
        });
      }
    });
  });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initCopyButtons();
});