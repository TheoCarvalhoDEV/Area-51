const Contracts = {
  locacao_residencial: {
    id: 'locacao_residencial',
    title: 'Locação de Imóvel (Modelo Gláucia)',
    description: 'Contrato de locação idêntico ao modelo personalizado enviado, incluindo Termo de Vistoria.',
    icon: 'home',
    color: 'teal',
    category: 'Imobiliário',
    fields: [      { section: 'Locador', name: 'nome_locador', label: 'Nome do Locador', type: 'text' },
      { section: 'Locador', name: 'nac_locador', label: 'Nacionalidade', type: 'text' },
      { section: 'Locador', name: 'est_civil_locador', label: 'Estado Civil', type: 'text' },
      { section: 'Locador', name: 'rg_locador', label: 'RG (com Órgão Emissor)', type: 'text' },
      { section: 'Locador', name: 'doc_locador', label: 'CPF', type: 'text', mask: 'cpfcnpj' },

      { section: 'Locatário', name: 'nome_locatario', label: 'Nome do Locatário', type: 'text' },
      { section: 'Locatário', name: 'nac_locatario', label: 'Nacionalidade', type: 'text' },
      { section: 'Locatário', name: 'est_civil_locatario', label: 'Estado Civil', type: 'text' },
      { section: 'Locatário', name: 'prof_locatario', label: 'Profissão', type: 'text' },
      { section: 'Locatário', name: 'rg_locatario', label: 'RG (com Órgão Emissor)', type: 'text' },
      { section: 'Locatário', name: 'doc_locatario', label: 'CPF', type: 'text', mask: 'cpfcnpj' },

      { section: 'Imóvel', name: 'desc_imovel', label: 'Descrição (Ex: Urbano de uso...)', type: 'textarea' },
      { section: 'Imóvel', name: 'end_imovel', label: 'Endereço Completo do Imóvel', type: 'textarea' },
      { section: 'Imóvel', name: 'cep_imovel', label: 'CEP', type: 'text' },
      { section: 'Imóvel', name: 'mat_agua', label: 'Matrícula de Água', type: 'text' },
      { section: 'Imóvel', name: 'uc_energia', label: 'Unidade Consumidora (Energia)', type: 'text' },

      { section: 'Condições', name: 'prazo_extenso', label: 'Prazo (Ex: 01 (um) ano)', type: 'text' },
      { section: 'Condições', name: 'data_inicio', label: 'Data de Início (Ex: 01/06/2018)', type: 'text' },
      { section: 'Condições', name: 'data_termino', label: 'Data de Término (Ex: 31/05/2019)', type: 'text' },
      { section: 'Condições', name: 'dia_vencimento', label: 'Dia de Vencimento', type: 'number' },
      
      { section: 'Valores', name: 'valor_aluguel', label: 'Valor Mensal (Ex: R$ 940,45)', type: 'text' },
      { section: 'Valores', name: 'valor_extenso', label: 'Valor por Extenso', type: 'text' },
      { section: 'Valores', name: 'valor_bonus', label: 'Bônus Adimplência (Ex: R$ 40,45)', type: 'text' },
      { section: 'Valores', name: 'valor_bonus_extenso', label: 'Bônus por Extenso', type: 'text' },
      { section: 'Valores', name: 'indice_reajuste', label: 'Índice de Reajuste (Ex: IGP-M/FGV)', type: 'text' },
      
      { section: 'Conta p/ Pagamento', name: 'banco', label: 'Banco (Ex: Banco do Brasil)', type: 'text' },
      { section: 'Conta p/ Pagamento', name: 'agencia', label: 'Agência', type: 'text' },
      { section: 'Conta p/ Pagamento', name: 'conta_banco', label: 'Conta (com dígito)', type: 'text' },
      { section: 'Conta p/ Pagamento', name: 'tipo_conta', label: 'Tipo de Conta (Ex: Conta Poupança)', type: 'text' },

      { section: 'Data e Local', name: 'foro_cidade', label: 'Cidade do Foro / Data', type: 'text' },
      { section: 'Data e Local', name: 'data_assinatura', label: 'Data da Assinatura (Ex: 01 de junho de 2018)', type: 'text' }
    ],
    template: `      <h1 style="font-size: 14pt; margin-bottom: 2rem; text-align: center;">CONTRATO DE LOCAÇÃO DE IMÓVEL</h1>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>LOCADOR:</strong> <span class="highlight" data-field="nome_locador">___</span>, <span class="highlight" data-field="nac_locador">___</span>, <span class="highlight" data-field="est_civil_locador">___</span>, RG <span class="highlight" data-field="rg_locador">___</span> e CPF <span class="highlight" data-field="doc_locador">___</span>.</p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>LOCATÁRIO:</strong> <span class="highlight" data-field="nome_locatario">___</span>, <span class="highlight" data-field="nac_locatario">___</span>, <span class="highlight" data-field="est_civil_locatario">___</span>, <span class="highlight" data-field="prof_locatario">___</span>, RG <span class="highlight" data-field="rg_locatario">___</span> e CPF <span class="highlight" data-field="doc_locatario">___</span>.</p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>IMÓVEL:</strong> <span class="highlight" data-field="desc_imovel">___</span>, situado na <span class="highlight" data-field="end_imovel">___</span>, CEP <span class="highlight" data-field="cep_imovel">___</span>.</p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>PRAZO:</strong> <span class="highlight" data-field="prazo_extenso">___</span> &nbsp;&nbsp;&nbsp; <strong>INÍCIO:</strong> <span class="highlight" data-field="data_inicio">___</span> &nbsp;&nbsp;&nbsp; <strong>TÉRMINO:</strong> <span class="highlight" data-field="data_termino">___</span></p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>VENCIMENTO:</strong> PAGAMENTO ANTECIPADO até o dia <span class="highlight" data-field="dia_vencimento">___</span> de cada mês.</p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>VALOR:</strong> <span class="highlight" data-field="valor_aluguel">___</span> (<span class="highlight" data-field="valor_extenso">___</span>).</p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>BÔNUS ADIMPLÊNCIA/PONTUALIDADE:</strong> <span class="highlight" data-field="valor_bonus">___</span> (<span class="highlight" data-field="valor_bonus_extenso">___</span>)</p>
      
      <p style="text-align: justify; margin-bottom: 1.5rem;"><strong>REAJUSTE:</strong> Anual, conforme a variação acumulada do <span class="highlight" data-field="indice_reajuste">___</span>.</p>
      
      <p style="text-align: justify; margin-bottom: 1rem;">O LOCADOR e a LOCATÁRIA resolvem ajustar a locação do imóvel retro descrito, que ora contratam, sob as cláusulas e condições seguintes:</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>1.</strong> O imóvel objeto do presente contrato será para uso exclusivamente residencial, sendo que destinação diversa, sem a autorização expressa do LOCADOR, facultará a este rescindir o contrato de plano, sem gerar direito a indenização ou qualquer ônus por parte deste último. Sem prejuízo da obrigação da LOCATÁRIA de efetuar o pagamento das multas e despesas previstas neste contrato.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>2.</strong> A LOCATÁRIA se obriga a restituir o imóvel livre e desocupado, independente de quaisquer notificações, em condições idênticas à que recebeu.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>3.</strong> Findo o prazo estipulado, operar-se-á o término da avença somente através de notificação por escrito do locador, sendo que, na falta de tal notificação, ocorrerá a renovação automática do contrato por igual período e nas mesmas condições do presente pacto, conforme dispõe a lei do inquilinato.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>4.</strong> Ultrapassando o contrato, a data prevista, ou seja, tornando-se contrato por tempo indeterminado, poderá o LOCADOR rescindi-lo a qualquer tempo, desde que ocorra notificação por escrito à LOCATÁRIA, que ficará compelida a sair do imóvel dentro do prazo de 30 (trinta) dias, a contar do recebimento da notificação. Ocorrendo prorrogação, a LOCATÁRIA e o LOCADOR ficarão obrigados por todo o teor deste contrato.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>5.</strong> Os LOCATÁRIOS, juntamente com o LOCADOR, declaram que vistoriaram o imóvel deste Contrato, registrando suas reais condições por meio de fotografias, as quais seguem em anexo, passando a compor o presente contrato. Vistoria inicial essa que servirá como base comparativa na vistoria final, que ocorrerá no momento da entrega do imóvel, onde serão identificados possíveis danos e/ou alterações no imóvel.</p>

      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>6.</strong> Ao término do presente contrato, ou quando o imóvel for devolvido, a LOCATÁRIA deverá realizar os seguintes reparos:</p>
      <ul style="margin-left: 40px; margin-bottom: 1rem; text-align: justify;">
        <li>Pintura interna e garagem com tinta acrílica (Suvinil ou Glasurit) na cor pérola;</li>
        <li>Pintura externa com tinta acrílica (Suvinil Stand. Rende Muito) na cor camurça;</li>
        <li>Pintura de portão e gradil com esmalte sintético brilhante (Suvinil) na cor tabaco;</li>
        <li>Pintura do piso das calçadas com tinta para piso (Suvinil) na cor cinza escuro;</li>
        <li>Pintura do madeiramento e parte inferior do telhado da garagem com resina acrílica incolor;</li>
        <li>Pintura da parte superior de todo o telhado com resina acrílica na cor telha;</li>
        <li>Pintura das portas de madeira com verniz incolor ou na cor mogno;</li>
      </ul>

      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>7.</strong> Os LOCATÁRIOS entregarão em perfeito estado de funcionamento e sem quaisquer avarias, riscos, manchas ou outros defeitos os mobiliários e equipamentos que guarnecem a residência, conforme segue:</p>
      <ul style="margin-left: 40px; margin-bottom: 1rem; text-align: justify;">
        <li>01 (um) Armário de cozinha em MDF (projeto e foto anexos);</li>
        <li>01 (um) Automatizador de portão deslizante da marca Garen com 2 controles;</li>
      </ul>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>8.</strong> O aluguel mensal deverá ser pago mediante transferência bancária ao <strong><span class="highlight" data-field="banco">___</span></strong>, Agência <strong><span class="highlight" data-field="agencia">___</span></strong>, <strong><span class="highlight" data-field="tipo_conta">___</span></strong> <strong><span class="highlight" data-field="conta_banco">___</span></strong>, de titularidade do LOCADOR. Sobre o aluguel pago após o respectivo vencimento, incidirá multa moratória de 5% (cinco por cento) ao mês.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>9.</strong> Fica vedada a sublocação do imóvel ou a cessão dos direitos decorrentes deste instrumento a terceiros, mesmo que parcial ou temporária, seja a que título for, por parte da LOCATÁRIA, sem a anuência, por escrito, do LOCADOR.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>10.</strong> Além do aluguel mensal, incumbirá à LOCATÁRIA o pagamento de todas as despesas de manutenção (energia elétrica, água, etc.) e tributos incidentes (IPTU) sobre o imóvel, em seus respectivos vencimentos, devendo comprová-los ao LOCADOR sempre que solicitado, e, em especial, quando do encerramento do Contrato. A LOCATÁRIA providenciará a transferência de titularidade para suas responsabilidades junto aos serviços de abastecimento de água (Mat. <span class="highlight" data-field="mat_agua">___</span>) e energia (UC <span class="highlight" data-field="uc_energia">___</span>).</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>11.</strong> A LOCATÁRIA obriga-se a manter as dependências locadas em boas condições de higiene e limpeza, dentro das normas legais pertinentes.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>12.</strong> Qualquer benfeitoria ou construção que seja destinada ao imóvel objeto deste, deverá de imediato, ser submetida a autorização expressa do LOCADOR. Vindo a ser feita benfeitoria, sem a anuência do LOCADOR, faculta a este aceitá-la ou não, restando à LOCATÁRIA em caso do LOCADOR não as aceitar, modificar o imóvel da maneira que lhe foi entregue. As benfeitorias, consertos ou reparos farão parte integrante do imóvel, não assistindo à LOCATÁRIA o direito de retenção ou indenização sobre a mesma.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>13.</strong> O LOCADOR fica autorizado a vistoriar o imóvel, objeto da locação, mediante prévio agendamento com a LOCATÁRIA. As partes acordam se comunicar por escrito, via e-mail ou carta com AR. Constatando-se algum vício que possa afetar a estrutura física do imóvel ficará compelida a LOCATÁRIA a realizar o conserto, no prazo de 30 (trinta) dias. Não ocorrendo o conserto, o LOCADOR ficará facultado a RESCINDIR O CONTRATO, sem prejuízo dos numerários previstos neste.</p>

      <p style="text-align: justify; margin-bottom: 1rem;"><strong>14.</strong> Os contratantes elegem o foro de <strong><span class="highlight" data-field="foro_cidade">___</span></strong> para dirimir quaisquer avenças decorrentes do presente contrato.</p>

      <p style="text-align: justify; margin-bottom: 2rem;">E por estarem, assim, justas e contratadas, as partes assinam o presente instrumento particular em duas vias de igual teor, na presença de duas testemunhas, e que de tudo dão fé.</p>

      <p style="text-align: right; margin-bottom: 4rem;">
        <span class="highlight" data-field="foro_cidade">___</span>, <span class="highlight" data-field="data_assinatura">___</span>.
      </p>

      <div class="signatures" style="margin-bottom: 3rem;">
        <div class="signature-block">
          <div class="signature-line">
            Locador: <span class="highlight" data-field="nome_locador">___</span>
          </div>
        </div>
        <div class="signature-block">
          <div class="signature-line">
            Locatário: <span class="highlight" data-field="nome_locatario">___</span>
          </div>
        </div>
      </div>
      
      <div class="signatures">
        <div class="signature-block">
          <div class="signature-line">
            1ª Testemunha
          </div>
        </div>
        <div class="signature-block">
          <div class="signature-line">
            2ª Testemunha
          </div>
        </div>
      </div>

      <!-- PAGE BREAK PARA A VISTORIA -->
      <div style="page-break-before: always; margin-top: 50px;"></div>
      <h1 style="text-align: center; font-size: 14pt; margin-bottom: 2rem;">TERMO DE VISTORIA DE IMÓVEL RESIDENCIAL</h1>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>LOCADOR:</strong> <span class="highlight" data-field="nome_locador">___</span>, <span class="highlight" data-field="nac_locador">___</span>, <span class="highlight" data-field="est_civil_locador">___</span>, RG <span class="highlight" data-field="rg_locador">___</span> e CPF <span class="highlight" data-field="doc_locador">___</span>.</p>
      
      <p style="text-align: justify; margin-bottom: 0.5rem;"><strong>LOCATÁRIO:</strong> <span class="highlight" data-field="nome_locatario">___</span>, <span class="highlight" data-field="nac_locatario">___</span>, <span class="highlight" data-field="est_civil_locatario">___</span>, <span class="highlight" data-field="prof_locatario">___</span>, RG <span class="highlight" data-field="rg_locatario">___</span> e CPF <span class="highlight" data-field="doc_locatario">___</span>.</p>
      
      <p style="text-align: justify; margin-bottom: 1.5rem;"><strong>IMÓVEL PARA VISTORIA:</strong><br>
      <span class="highlight" data-field="end_imovel">___</span>, CEP <span class="highlight" data-field="cep_imovel">___</span>.</p>
      
      <h2 style="text-align: center; font-size: 12pt; margin-top: 2rem; margin-bottom: 1rem;">LAUDO DE VISTORIA</h2>

      <p><strong>SALA</strong></p>
      <ul style="margin-left: 40px; margin-bottom: 1rem;">
        <li>01 - Porta em Madeira 0,80x2,10m</li>
        <li>01 - Janela em Vidro Temperado 1,0x1,20m</li>
        <li>01 - Lâmpada Fluorescente</li>
      </ul>

      <p><strong>COZINHA</strong></p>
      <ul style="margin-left: 40px; margin-bottom: 1rem;">
        <li>01 - Porta Vidro Temperado de correr</li>
        <li>01 - Janela em Vidro Temperado cor Fumê 1,0x1,20m</li>
        <li>01 - Lâmpada Fluorescente</li>
        <li>01 - Armário em MDF com Bancada de Granito (projeto anexo)</li>
      </ul>

      <p><strong>SUÍTE</strong></p>
      <ul style="margin-left: 40px; margin-bottom: 1rem;">
        <li>01 - Porta em Madeira 0,80x2,10m</li>
        <li>01 - Janela em Vidro Temperado cor Fumê 1,0x1,20m</li>
        <li>01 - Lâmpada Fluorescente</li>
      </ul>

      <p><strong>SUÍTE - BANHEIRO</strong></p>
      <ul style="margin-left: 40px; margin-bottom: 1rem;">
        <li>01 - Porta em Madeira 0,80x2,10m</li>
        <li>01 - Box de Vidro Temperado cor Incolor</li>
        <li>01 - Chuveiro</li>
        <li>01 - Pia de Granito com Cuba</li>
        <li>01 - Bacia/Vaso com Caixa Acoplada</li>
        <li>01 - Ducha higiênica</li>
      </ul>

      <p><strong>QUARTO</strong></p>
      <ul style="margin-left: 40px; margin-bottom: 1rem;">
        <li>01 - Porta em Madeira 0,80x2,10m</li>
        <li>01 - Janela em Vidro Temperado cor Fumê 1,0x1,20m</li>
      </ul>

      <p><strong>BANHEIRO SOCIAL</strong></p>
      <ul style="margin-left: 40px; margin-bottom: 2rem;">
        <li>01 - Porta em Madeira 0,80x2,10m</li>
        <li>01 - Box de Vidro Temperado cor Incolor</li>
        <li>01 - Chuveiro</li>
        <li>01 - Pia de Granito com Cuba</li>
        <li>01 - Bacia/Vaso com Caixa Acoplada</li>
        <li>01 - Ducha higiênica</li>
      </ul>
    `
  }
};
