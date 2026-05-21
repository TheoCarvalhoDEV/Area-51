// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  // Clone o elemento para isolar de qualquer "overflow: hidden" ou "auto" dos pais
  const clone = element.cloneNode(true);
  
  // Posiciona o clone no topo esquerdo do body
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.width = '800px';
  clone.style.maxWidth = '800px';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.boxShadow = 'none';
  clone.style.zIndex = '999999';
  clone.style.backgroundColor = 'white';

  // Limpa highlights no clone
  clone.querySelectorAll('.highlight').forEach(el => {
    el.style.backgroundColor = 'transparent';
    el.style.color = '#000';
    el.style.borderBottom = 'none';
  });

  document.body.appendChild(clone);

  const filename = (document.getElementById('contract-name') ? document.getElementById('contract-name').value : 'Contrato_Locacao') + '.pdf';

  const opt = {
    margin:       [20, 20, 20, 20],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul', 'p'] }
  };

  html2pdf().set(opt).from(clone).save().then(() => {
    document.body.removeChild(clone);
    window.scrollTo(0, originalScrollY);
  });
}
