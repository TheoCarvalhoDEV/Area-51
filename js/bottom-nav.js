document.addEventListener('DOMContentLoaded', () => {
  const bottomNav = document.querySelector('.bottom-nav');
  if (!bottomNav) return;

  // Gerenciar o teclado no mobile para não sobrepor a navegação
  const manageKeyboardBehavior = () => {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      // Evitar adicionar múltiplos listeners no mesmo elemento
      if (!input.hasAttribute('data-nav-listener')) {
        input.setAttribute('data-nav-listener', 'true');
        
        input.addEventListener('focus', () => {
          if (window.innerWidth <= 768) {
            bottomNav.style.display = 'none';
          }
        });
        
        input.addEventListener('blur', () => {
          if (window.innerWidth <= 768) {
            bottomNav.style.display = ''; // Volta ao default do CSS
          }
        });
      }
    });
  };

  // Observar mudanças no DOM para aplicar listeners em inputs dinâmicos
  const observer = new MutationObserver(() => {
    manageKeyboardBehavior();
  });

  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    observer.observe(mainContent, { childList: true, subtree: true });
  }

  // Executar a primeira vez
  manageKeyboardBehavior();
});
