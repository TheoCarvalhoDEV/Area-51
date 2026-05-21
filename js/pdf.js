// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Cleanup highlights for PDF
  const clone = element.cloneNode(true);
  
  // Remover os estilos que simulam uma "folha de papel" na tela
  clone.style.padding = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.background = 'white';
  
  clone.querySelectorAll('.highlight').forEach(el => {
    el.style.backgroundColor = 'transparent';
    el.style.color = '#000';
    el.style.borderBottom = 'none';
  });

  const opt = {
    margin:       [20, 20, 20, 20],
    filename:     (document.getElementById('contract-name').value || 'Contrato') + '.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(clone).save();
}
