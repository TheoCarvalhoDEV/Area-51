// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Clone o elemento EM MEMÓRIA (sem adicionar ao DOM)
  const clone = element.cloneNode(true);
  
  // Define os estilos do clone para uma renderização A4 perfeita no iframe do html2pdf
  clone.style.width = '800px';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.boxShadow = 'none';
  clone.style.border = 'none';
  clone.style.background = 'white';
  clone.style.position = 'static'; // Garante que não fuja da tela no worker
  clone.style.transform = 'none';
  clone.style.overflow = 'visible';
  clone.style.height = 'auto';
  clone.style.maxHeight = 'none';

  // Limpa highlights no clone
  clone.querySelectorAll('.highlight').forEach(el => {
    el.style.backgroundColor = 'transparent';
    el.style.color = '#000';
    el.style.borderBottom = 'none';
  });

  const filename = (document.getElementById('contract-name') ? document.getElementById('contract-name').value : 'Contrato_Locacao') + '.pdf';

  const opt = {
    margin:       [15, 15, 15, 15],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul', 'p'] }
  };

  // Envia o clone solto na memória. O html2pdf cuida de injetar num iframe e bater a foto.
  html2pdf().set(opt).from(clone).save().then(() => {
    console.log("PDF Gerado com sucesso usando Worker Sandboxed.");
  });
}
