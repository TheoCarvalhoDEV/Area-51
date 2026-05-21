// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Salvar estado original
  const originalPadding = element.style.padding;
  const originalBoxShadow = element.style.boxShadow;
  const originalWidth = element.style.width;
  const originalMaxWidth = element.style.maxWidth;
  const originalMargin = element.style.margin;
  
  // Forçar largura de 800px sem overlay (direto no DOM)
  element.style.padding = '0';
  element.style.boxShadow = 'none';
  element.style.width = '800px';
  element.style.maxWidth = '800px';
  element.style.margin = '0'; // Garante alinhamento à esquerda para não dar offset
  
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
    margin:       [20, 20, 20, 20],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul', 'p'] }
  };

  html2pdf().set(opt).from(element).save().then(() => {
    // Reverter estilos do container
    element.style.padding = originalPadding;
    element.style.boxShadow = originalBoxShadow;
    element.style.width = originalWidth;
    element.style.maxWidth = originalMaxWidth;
    element.style.margin = originalMargin;
    
    // Reverter highlights
    originalHighlights.forEach(orig => {
      orig.el.style.backgroundColor = orig.bg;
      orig.el.style.color = orig.color;
      orig.el.style.borderBottom = orig.borderBottom;
    });
    
    window.scrollTo(0, originalScrollY);
  });
}
