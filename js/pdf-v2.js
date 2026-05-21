// ═══════════════════════════════════════════════════════
// Exportação para PDF (Usando html2pdf.js)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  const element = document.getElementById('preview-content');
  if (!element) return;

  // Criar um novo elemento isolado (XML/HTML string) para evitar tela em branco e cortes
  const container = document.createElement('div');
  
  // Injetar os estilos exatos do editor.css dentro do HTML isolado
  container.innerHTML = `
    <style>
      .preview-document {
        font-family: Arial, Helvetica, sans-serif;
        font-size: 11pt;
        line-height: 1.5;
        color: black;
      }
      .preview-document p { margin-bottom: 1rem; text-align: justify; }
      .preview-document h1, .preview-document h2 { text-align: center; margin-bottom: 2rem; color: black; }
      .preview-document ul { margin-left: 40px; margin-bottom: 1rem; }
      .preview-document li { margin-bottom: 0.5rem; text-align: justify; }
      .preview-document table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
      .preview-document td, .preview-document th { border: 1px solid black; padding: 8px; text-align: left; }
      .signatures { display: flex; justify-content: space-around; flex-wrap: wrap; margin-top: 2rem; }
      .signature-block { width: 45%; text-align: center; margin-bottom: 2rem; }
      .signature-line { border-top: 1px solid black; padding-top: 0.5rem; }
      .highlight { background-color: transparent !important; color: black !important; border-bottom: none !important; }
    </style>
    <div class="preview-document" style="width: 800px; padding: 20px; background: white; margin: 0;">
      ${element.innerHTML}
    </div>
  `;

  const filename = (document.getElementById('contract-name') ? document.getElementById('contract-name').value : 'Contrato_Locacao') + '.pdf';

  // Opções do html2pdf limpas. Sem regras complexas de pagebreak que causam bugs e cortes.
  const opt = {
    margin:       15,
    filename:     filename,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, windowWidth: 800 },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Usar o container isolado
  html2pdf().set(opt).from(container).save().then(() => {
    console.log("PDF gerado usando container isolado (XML) com CSS injetado.");
  });
}
