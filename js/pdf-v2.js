// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Criar clone fiel para isolar de barras de rolagem mas mantendo o CSS da página
  const clone = element.cloneNode(true);
  
  // Limpar bordas e sombras para não ficar parecendo "papel sobre papel"
  clone.style.border = 'none';
  clone.style.boxShadow = 'none';
  clone.style.padding = '0'; // A margem será aplicada apenas no PDF (opt.margin)
  clone.style.margin = '0';
  clone.style.background = 'white';
  
  // Forçar dimensões corretas para a foto A4 e posicionar na tela visível
  clone.style.width = '800px';
  clone.style.maxWidth = '800px';
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '0';
  clone.style.zIndex = '999999';
  
  // Herdar explicitamente fontes para não ficar "feio" ou com Times New Roman
  const computedStyle = window.getComputedStyle(element);
  clone.style.fontFamily = computedStyle.fontFamily || 'Arial, Helvetica, sans-serif';
  clone.style.fontSize = computedStyle.fontSize || '11pt';
  clone.style.lineHeight = computedStyle.lineHeight || '1.5';
  clone.style.color = 'black';

  // Processar highlights para impressão (remover fundo colorido)
  clone.querySelectorAll('.highlight').forEach(el => {
    el.style.backgroundColor = 'transparent';
    el.style.color = 'black';
    el.style.borderBottom = 'none';
  });

  // OBRIGATÓRIO: Anexar ao body para que o html2canvas possa ver o elemento real com seus estilos
  document.body.appendChild(clone);
  
  // Rolar para o topo para que o html2canvas não capture a tela cortada
  const originalScrollY = window.scrollY;
  window.scrollTo(0, 0);

  const filename = (document.getElementById('contract-name') ? document.getElementById('contract-name').value : 'Contrato_Locacao') + '.pdf';

  const opt = {
    margin:       15,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, scrollY: 0, scrollX: 0 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(opt).from(clone).save().then(() => {
    // Limpar o clone da tela após a foto
    document.body.removeChild(clone);
    window.scrollTo(0, originalScrollY);
  });
}
