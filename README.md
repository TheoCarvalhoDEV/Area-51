# Meus Imóveis (Gerador de Contratos) 📄🏠

Bem-vindo ao repositório do **Meus Imóveis**, uma plataforma moderna, leve e responsiva (Vanilla JS, HTML e CSS) desenvolvida para a geração automática de contratos de locação imobiliária e outros documentos com facilidade.

## 🚀 Funcionalidades

- **Pré-visualização em Tempo Real (Live Preview):** O documento é gerado e preenchido em tempo real enquanto você digita no formulário.
- **Link para Inquilino (Tenant Mode):** Gere um link criptografado para enviar pelo WhatsApp! O próprio inquilino preenche os dados pessoais dele no conforto do seu celular, e a plataforma cuida do resto.
- **Responsividade PWA:** Design focado na experiência Mobile (Bottom Sheet para pré-visualização, Menu lateral com Glassmorphism) e adaptação fluida para Desktop.
- **Armazenamento Local:** Usa `localStorage` para salvar os seus contratos e o perfil do locador localmente, garantindo total privacidade e velocidade.
- **Geração de PDF:** Exportação do contrato finalizado perfeitamente formatado para impressão ou envio via PDF (usando `html2pdf.js`).

## 🛠️ Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript Vanilla.
- **Design System:** Tema Claro Institucional (Azul Marinho e Cinza). Tipografia `Outfit`.
- **Dependências Externas:** Apenas o `html2pdf.bundle.min.js` (via CDN) para conversão da DOM em PDF.

## 💻 Como Rodar o Projeto (Local)

O projeto é 100% estático (Static Site). Você não precisa compilar nada nem usar Node.js.

1. Clone o repositório:
   ```bash
   git clone https://github.com/allaneguin/Area-51.git
   ```
2. Entre na pasta:
   ```bash
   cd Area-51
   ```
3. Abra o arquivo `index.html` em qualquer navegador moderno. 
*(Para a melhor experiência, use a extensão "Live Server" do VSCode).*

## 🌐 Hospedagem (GitHub Pages)

Este projeto foi construído para ser perfeitamente hospedado de forma **gratuita** usando o GitHub Pages.

Para ativar no seu GitHub:
1. Vá na aba **Settings** (Configurações) deste repositório.
2. Na barra lateral esquerda, clique em **Pages**.
3. Em "Source", selecione a branch `main` e a pasta `/(root)`.
4. Clique em **Save**. Em alguns minutos, seu site estará no ar!

---
Desenvolvido com foco na agilidade e melhor experiência do usuário (UX).
