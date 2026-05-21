// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Cleanup highlights for PDF
  const clone = element.cloneNode(true);
  
  // Fix layout bugs by appending to DOM temporarily with fixed width
  clone.style.position = 'absolute';
  clone.style.left = '0';
  clone.style.top = '0';
  clone.style.zIndex = '-9999';
  clone.style.width = '800px';
  clone.style.maxWidth = '800px';
  clone.style.padding = '20px';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.background = 'white';
  
  clone.querySelectorAll('.highlight').forEach(el => {
    el.style.backgroundColor = 'transparent';
    el.style.color = '#000';
    el.style.borderBottom = 'none';
  });
  
  const opt = {
    margin:       [15, 15, 15, 15],
    filename:     (document.getElementById('contract-name').value || 'Contrato') + '.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul'] }
  };

  html2pdf().set(opt).from(clone).save();
}
