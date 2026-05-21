const ContractsXML = `<?xml version="1.0" encoding="UTF-8"?>
<database>
  <contract id="locacao_residencial">
    <meta>
      <title>Locação de Imóvel (Modelo Gláucia)</title>
      <description>Contrato de locação idêntico ao modelo personalizado enviado, incluindo Termo de Vistoria.</description>
      <icon>home</icon>
      <color>teal</color>
      <category>Imobiliário</category>
    </meta>
    
    <fields>
      <!-- Locador -->
      <field section="Locador" name="nome_locador" label="Nome do Locador" type="text" />
      <field section="Locador" name="nac_locador" label="Nacionalidade" type="select">
        <option value="brasileiro(a)">Brasileiro(a)</option>
        <option value="estrangeiro(a)">Estrangeiro(a)</option>
      </field>
      <field section="Locador" name="est_civil_locador" label="Estado Civil" type="select">
        <option value="">Selecione...</option>
        <option value="solteiro(a)">Solteiro(a)</option>
        <option value="casado(a)">Casado(a)</option>
        <option value="divorciado(a)">Divorciado(a)</option>
        <option value="viúvo(a)">Viúvo(a)</option>
        <option value="separado(a) judicialmente">Separado(a) judicialmente</option>
        <option value="em união estável">União Estável</option>
      </field>
      <field section="Locador" name="rg_locador" label="RG (com Órgão Emissor)" type="text" />
      <field section="Locador" name="doc_locador" label="CPF" type="text" mask="cpfcnpj" />

      <!-- Locatário -->
      <field section="Locatário" name="nome_locatario" label="Nome do Locatário" type="text" />
      <field section="Locatário" name="nac_locatario" label="Nacionalidade" type="select">
        <option value="brasileiro(a)">Brasileiro(a)</option>
        <option value="estrangeiro(a)">Estrangeiro(a)</option>
      </field>
      <field section="Locatário" name="est_civil_locatario" label="Estado Civil" type="select">
        <option value="">Selecione...</option>
        <option value="solteiro(a)">Solteiro(a)</option>
        <option value="casado(a)">Casado(a)</option>
        <option value="divorciado(a)">Divorciado(a)</option>
        <option value="viúvo(a)">Viúvo(a)</option>
        <option value="separado(a) judicialmente">Separado(a) judicialmente</option>
        <option value="em união estável">União Estável</option>
      </field>
      <field section="Locatário" name="prof_locatario" label="Profissão" type="text" />
      <field section="Locatário" name="rg_locatario" label="RG (com Órgão Emissor)" type="text" />
      <field section="Locatário" name="doc_locatario" label="CPF" type="text" mask="cpfcnpj" />

      <!-- Imóvel -->
      <field section="Imóvel" name="desc_imovel" label="Descrição (Ex: Urbano de uso...)" type="textarea" />
      <field section="Imóvel" name="end_imovel" label="Endereço Completo do Imóvel" type="textarea" />
      <field section="Imóvel" name="cep_imovel" label="CEP" type="text" />
      <field section="Imóvel" name="mat_agua" label="Matrícula de Água" type="text" />
      <field section="Imóvel" name="uc_energia" label="Unidade Consumidora (Energia)" type="text" />

      <!-- Condições -->
      <field section="Condições" name="prazo_extenso" label="Prazo do Contrato" type="select">
        <option value="">Selecione o prazo...</option>
        <option value="06 (seis) meses">06 (seis) meses</option>
        <option value="12 (doze) meses (1 ano)">12 (doze) meses (1 ano)</option>
        <option value="24 (vinte e quatro) meses (2 anos)">24 (vinte e quatro) meses (2 anos)</option>
        <option value="30 (trinta) meses (2 anos e meio)">30 (trinta) meses (2 anos e meio)</option>
        <option value="36 (trinta e seis) meses (3 anos)">36 (trinta e seis) meses (3 anos)</option>
      </field>
      <field section="Condições" name="data_inicio" label="Data de Início" type="date" />
      <field section="Condições" name="data_termino" label="Data de Término (Automático)" type="date" readonly="true" />
      <field section="Condições" name="dia_vencimento" label="Dia de Vencimento" type="number" />

      <!-- Valores -->
      <field section="Valores" name="valor_aluguel" label="Valor Mensal (Ex: R$ 940,45)" type="text" />
      <field section="Valores" name="valor_extenso" label="Valor por Extenso" type="text" />
      <field section="Valores" name="valor_bonus" label="Bônus Adimplência (Ex: R$ 40,45)" type="text" />
      <field section="Valores" name="valor_bonus_extenso" label="Bônus por Extenso" type="text" />
      <field section="Valores" name="indice_reajuste" label="Índice de Reajuste (Ex: IGP-M/FGV)" type="text" />

      <!-- Conta -->
      <field section="Conta p/ Pagamento" name="banco" label="Banco (Ex: Banco do Brasil)" type="text" />
      <field section="Conta p/ Pagamento" name="agencia" label="Agência" type="text" />
      <field section="Conta p/ Pagamento" name="conta_banco" label="Conta (com dígito)" type="text" />
      <field section="Conta p/ Pagamento" name="tipo_conta" label="Tipo de Conta" type="select">
        <option value="">Selecione...</option>
        <option value="Conta Corrente">Conta Corrente</option>
        <option value="Conta Poupança">Conta Poupança</option>
        <option value="Conta Salário">Conta Salário</option>
        <option value="Conta Pagamento">Conta Pagamento</option>
      </field>

      <!-- Data e Local -->
      <field section="Data e Local" name="foro_cidade" label="Cidade do Foro / Data" type="text" />
      <field section="Data e Local" name="data_assinatura" label="Data da Assinatura" type="text" readonly="true" hidden="true" />
    </fields>

    <template>
      <![CDATA[
      <h1 style="font-size: 14pt; margin-bottom: 2rem; text-align: center;">CONTRATO DE LOCAÇÃO DE IMÓVEL</h1>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>LOCADOR:</strong> <span class="highlight" data-field="nome_locador">___</span>, <span class="highlight" data-field="nac_locador">___</span>, <span class="highlight" data-field="est_civil_locador">___</span>, RG <span class="highlight" data-field="rg_locador">___</span> e CPF <span class="highlight" data-field="doc_locador">___</span>.</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>LOCATÁRIO:</strong> <span class="highlight" data-field="nome_locatario">___</span>, <span class="highlight" data-field="nac_locatario">___</span>, <span class="highlight" data-field="est_civil_locatario">___</span>, <span class="highlight" data-field="prof_locatario">___</span>, RG <span class="highlight" data-field="rg_locatario">___</span> e CPF <span class="highlight" data-field="doc_locatario">___</span>.</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>IMÓVEL:</strong> <span class="highlight" data-field="desc_imovel">___</span>, situado na <span class="highlight" data-field="end_imovel">___</span>, CEP <span class="highlight" data-field="cep_imovel">___</span>.</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;">
            <strong>PRAZO:</strong> <span class="highlight" data-field="prazo_extenso">___</span> &nbsp;&nbsp;&nbsp; 
            <strong>INÍCIO:</strong> <span class="highlight" data-field="data_inicio">___</span> &nbsp;&nbsp;&nbsp; 
            <strong>TÉRMINO:</strong> <span class="highlight" data-field="data_termino">___</span>
          </td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>VENCIMENTO:</strong> PAGAMENTO ANTECIPADO até o dia <span class="highlight" data-field="dia_vencimento">___</span> de cada mês.</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>VALOR:</strong> <span class="highlight" data-field="valor_aluguel">___</span> (<span class="highlight" data-field="valor_extenso">___</span>).</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>BÔNUS ADIMPLÊNCIA/PONTUALIDADE:</strong> <span class="highlight" data-field="valor_bonus">___</span> (<span class="highlight" data-field="valor_bonus_extenso">___</span>).</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>REAJUSTE:</strong> Anual, conforme a variação acumulada do <span class="highlight" data-field="indice_reajuste">___</span>.</td>
        </tr>
      </table>
      
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
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>LOCADOR:</strong> <span class="highlight" data-field="nome_locador">___</span>, <span class="highlight" data-field="nac_locador">___</span>, <span class="highlight" data-field="est_civil_locador">___</span>, RG <span class="highlight" data-field="rg_locador">___</span> e CPF <span class="highlight" data-field="doc_locador">___</span>.</td>
        </tr>
        <tr>
          <td style="border: 1px solid black; padding: 8px;"><strong>LOCATÁRIO:</strong> <span class="highlight" data-field="nome_locatario">___</span>, <span class="highlight" data-field="nac_locatario">___</span>, <span class="highlight" data-field="est_civil_locatario">___</span>, <span class="highlight" data-field="prof_locatario">___</span>, RG <span class="highlight" data-field="rg_locatario">___</span> e CPF <span class="highlight" data-field="doc_locatario">___</span>.</td>
        </tr>
      </table>
      
      <p style="text-align: justify; margin-bottom: 1.5rem;"><strong>IMÓVEL PARA VISTORIA:</strong><br/>
      <span class="highlight" data-field="end_imovel">___</span>, CEP <span class="highlight" data-field="cep_imovel">___</span>.</p>
      
      <h2 style="text-align: center; font-size: 12pt; margin-top: 1rem; margin-bottom: 1rem;">LAUDO DE VISTORIA</h2>

      <p style="margin-bottom: 0.2rem;">SALA</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Porta em Madeira 0,80x2,10m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Janela em Vidro Temperado 1,0x1,20m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Lâmpada Fluorescente</td></tr>
      </table>

      <p style="margin-bottom: 0.2rem;">COZINHA</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Porta Vidro Temperado de correr</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Janela em Vidro Temperado cor Fumê 1,0x1,20m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Lâmpada Fluorescente</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Armário em MDF com Bancada de Granito (projeto anexo)</td></tr>
      </table>

      <p style="margin-bottom: 0.2rem;">SUÍTE</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Porta em Madeira 0,80x2,10m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Janela em Vidro Temperado cor Fumê 1,0x1,20m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Lâmpada Fluorescente</td></tr>
      </table>

      <p style="margin-bottom: 0.2rem;">SUÍTE - BANHEIRO</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Porta em Madeira 0,80x2,10m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Box de Vidro Temperado cor Incolor</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Chuveiro</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Pia de Granito com Cuba</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Bacia/Vaso com Caixa Acoplada</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Ducha higiênica</td></tr>
      </table>

      <p style="margin-bottom: 0.2rem;">QUARTO</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 1rem;">
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Porta em Madeira 0,80x2,10m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Janela em Vidro Temperado cor Fumê 1,0x1,20m</td></tr>
      </table>

      <p style="margin-bottom: 0.2rem;">BANHEIRO SOCIAL</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 2rem;">
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Porta em Madeira 0,80x2,10m</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Box de Vidro Temperado cor Incolor</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Chuveiro</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Pia de Granito com Cuba</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Bacia/Vaso com Caixa Acoplada</td></tr>
        <tr><td style="border: 1px solid black; padding: 4px 8px; width: 40px; text-align: center;">01</td><td style="border: 1px solid black; padding: 4px 8px;">Ducha higiênica</td></tr>
      </table>
      ]]>
    </template>
  </contract>
</database>
`;

// Leitor interno: Transforma a string XML no objeto global que a aplicação entende
const Contracts = {};

(function parseContractsXML() {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(ContractsXML, "text/xml");
  const contractsNodes = xmlDoc.getElementsByTagName('contract');
  
  for (let i = 0; i < contractsNodes.length; i++) {
    const cNode = contractsNodes[i];
    const id = cNode.getAttribute('id');
    
    // Ler meta dados
    const metaNode = cNode.getElementsByTagName('meta')[0];
    const title = metaNode.getElementsByTagName('title')[0].textContent;
    const description = metaNode.getElementsByTagName('description')[0].textContent;
    const icon = metaNode.getElementsByTagName('icon')[0].textContent;
    const color = metaNode.getElementsByTagName('color')[0].textContent;
    const category = metaNode.getElementsByTagName('category')[0].textContent;
    
    // Ler campos dinâmicos do formulário
    const fieldsNode = cNode.getElementsByTagName('fields')[0];
    const fieldElements = fieldsNode.getElementsByTagName('field');
    const fields = [];
    
    for (let j = 0; j < fieldElements.length; j++) {
      const fNode = fieldElements[j];
      const fieldObj = {
        section: fNode.getAttribute('section'),
        name: fNode.getAttribute('name'),
        label: fNode.getAttribute('label'),
        type: fNode.getAttribute('type')
      };
      
      if (fNode.hasAttribute('mask')) fieldObj.mask = fNode.getAttribute('mask');
      if (fNode.hasAttribute('readonly')) fieldObj.readonly = fNode.getAttribute('readonly') === 'true';
      if (fNode.hasAttribute('hidden')) fieldObj.hidden = fNode.getAttribute('hidden') === 'true';
      
      if (fieldObj.type === 'select') {
        const optionElements = fNode.getElementsByTagName('option');
        fieldObj.options = [];
        for (let k = 0; k < optionElements.length; k++) {
          fieldObj.options.push({
            value: optionElements[k].getAttribute('value'),
            label: optionElements[k].textContent
          });
        }
      }
      fields.push(fieldObj);
    }
    
    // Ler template HTML
    const templateNode = cNode.getElementsByTagName('template')[0];
    // O textContent pega automaticamente o conteúdo limpo dentro do CDATA
    const templateContent = templateNode.textContent.trim(); 
    
    // Popular o objeto global Contracts
    Contracts[id] = {
      id, title, description, icon, color, category, fields, template: templateContent
    };
  }
})();
