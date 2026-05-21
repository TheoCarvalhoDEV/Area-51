// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Função para subir a árvore do DOM destravando rolagens e limites de altura nos pais
  const stylesToRestore = [];
  let current = element.parentElement;
  
  while (current && current !== document.body) {
    const computed = window.getComputedStyle(current);
    stylesToRestore.push({
      element: current,
      overflow: current.style.overflow,
      overflowY: current.style.overflowY,
      maxHeight: current.style.maxHeight,
      height: current.style.height,
      position: current.style.position
    });
    
    // Destrava rolagens e alturas que causam cortes no html2canvas
    current.style.overflow = 'visible';
    current.style.overflowY = 'visible';
    current.style.maxHeight = 'none';
    current.style.height = 'auto';
    
    // Se for posicionado de forma fixa, muda temporariamente para relative
    if (computed.position === 'fixed') {
      current.style.position = 'relative';
    }
    
    current = current.parentElement;
  }

  // Salvar estilos originais do próprio elemento
  const originalPadding = element.style.padding;
  const originalBoxShadow = element.style.boxShadow;
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalMargin = element.style.margin;
  
  // Ajustar o elemento para formato A4 direto no DOM real
  element.style.padding = '0';
  element.style.boxShadow = 'none';
  element.style.width = '800px';
  element.style.maxWidth = '800px';
  element.style.margin = '0'; // Alinha à esquerda para o html2canvas não dar offset
  
  // Salvar e modificar os highlights
  const originalHighlights = [];
  element.querySelectorAll('.highlight').forEach(el => {
    originalHighlights.push({
      el: el,
      bg: el.style.backgroundColor,
      color: el.style.color,
      borderBottom: el.style.borderBottom
    });
    el.style.backgroundColor = 'transparent';
    el.style.color = '#000';
    el.style.borderBottom = 'none';
  });
  
  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  const filename = (document.getElementById('contract-name') ? document.getElementById('contract-name').value : 'Contrato_Locacao') + '.pdf';

  const opt = {
    margin:       [15, 15, 15, 15],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul', 'p'] }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    // Restaurar estilos do próprio container
    element.style.padding = originalPadding;
    element.style.boxShadow = originalBoxShadow;
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.margin = originalMargin;
    
    // Restaurar highlights
    originalHighlights.forEach(orig => {
      orig.el.style.backgroundColor = orig.bg;
      orig.el.style.color = orig.color;
      orig.el.style.borderBottom = orig.borderBottom;
    });
    
    // Restaurar estilos de todos os pais destravados
    stylesToRestore.forEach(item => {
      item.element.style.overflow = item.overflow;
      item.element.style.overflowY = item.overflowY;
      item.element.style.maxHeight = item.maxHeight;
      item.element.style.height = item.height;
      item.element.style.position = item.position;
    });

    window.scrollTo(0, originalScrollY);
  });
}
