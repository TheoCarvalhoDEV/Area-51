// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Cria um overlay temporário no topo de tudo para o html2canvas renderizar perfeitamente
  const overlay = document.createElement('div');
  overlay.style.position = 'absolute';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.minHeight = '100vh';
  overlay.style.backgroundColor = '#e5e7eb';
  overlay.style.zIndex = '999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  
  // Cria o container do PDF com largura exata
  const container = document.createElement('div');
  container.style.width = '800px';
  container.style.maxWidth = '800px';
  container.style.backgroundColor = 'white';
  container.style.color = 'black';
  container.style.fontFamily = 'Arial, Helvetica, sans-serif';
  container.style.fontSize = '11pt';
  container.style.lineHeight = '1.5';
  container.style.padding = '0';
  
  // Copia o HTML original
  container.innerHTML = element.innerHTML;
  
  // Limpa os highlights na cópia
  container.querySelectorAll('.highlight').forEach(el => {
    el.style.backgroundColor = 'transparent';
    el.style.color = 'black';
    el.style.borderBottom = 'none';
  });

  overlay.appendChild(container);
  document.body.appendChild(overlay);
  
  // Rola para o topo para evitar bugs de corte do html2canvas
  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  const filename = (document.getElementById('contract-name') ? document.getElementById('contract-name').value : 'Contrato_Locacao') + '.pdf';

  const opt = {
    margin:       [20, 20, 20, 20],
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, logging: false, useCORS: true, scrollY: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak:    { mode: ['css', 'legacy'], avoid: ['tr', 'td', 'h1', 'h2', 'ul', 'p'] }
  };

  html2pdf().set(opt).from(container).save().then(() => {
    document.body.removeChild(overlay);
    window.scrollTo(0, originalScrollY);
  });
}
