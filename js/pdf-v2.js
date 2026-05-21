// ═══════════════════════════════════════════════════════
// Exportação para PDF (Impressão Nativa)
// ═══════════════════════════════════════════════════════

function generatePDF() {
  // Pegar o nome do contrato para sugerir como nome de arquivo
  const inputName = document.getElementById('contract-name');
  const nomeContrato = inputName && inputName.value ? inputName.value : 'Contrato';
  
  // Salvar o título original da página
  const originalTitle = document.title;
  
  // Mudar o título temporariamente (o Chrome usa isso como nome do arquivo .pdf)
  document.title = nomeContrato;
  
  // Chamar a tela de impressão do navegador
  window.print();
  
  // Restaurar o título original
  document.title = originalTitle;
}
