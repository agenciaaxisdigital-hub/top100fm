type Props = { onClose: () => void };

export function LgpdTermsModal({ onClose }: Props) {
  return (
    <div
      className="popup-overlay"
      onClick={onClose}
      style={{ zIndex: 10000 }}
    >
      <div
        className="popup-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 720,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          borderRadius: 12,
        }}
      >
        <button
          className="popup-close"
          onClick={onClose}
          aria-label="Fechar termos"
          style={{ zIndex: 2 }}
        >
          ✕
        </button>

        {/* Cabeçalho institucional */}
        <header
          style={{
            background: "linear-gradient(135deg, #0a1f44 0%, #142a5c 100%)",
            color: "#fff",
            padding: "28px 32px 22px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.75,
              marginBottom: 6,
            }}
          >
            Política de Privacidade
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.25,
            }}
          >
            Termo de Consentimento para Tratamento de Dados Pessoais
          </h2>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              opacity: 0.85,
            }}
          >
            Em conformidade com a Lei nº 13.709/2018 (LGPD) · Versão 1.0 · Vigência: 24/04/2026
          </div>
        </header>

        {/* Corpo */}
        <div
          className="popup-body lgpd-body"
          style={{
            overflowY: "auto",
            padding: "24px 32px 28px",
            color: "#1f2937",
            fontSize: 14.5,
            lineHeight: 1.65,
          }}
        >
          <style>{`
            .lgpd-body h3 {
              font-size: 14px;
              font-weight: 700;
              color: #0a1f44;
              margin: 22px 0 8px;
              letter-spacing: 0.2px;
              text-transform: uppercase;
            }
            .lgpd-body h3:first-child { margin-top: 0; }
            .lgpd-body p { margin: 0 0 10px; }
            .lgpd-body ul { margin: 0 0 12px; padding-left: 20px; }
            .lgpd-body li { margin-bottom: 4px; }
            .lgpd-body .lead {
              padding: 14px 16px;
              background: #f4f6fb;
              border-left: 3px solid #0a1f44;
              border-radius: 4px;
              margin-bottom: 18px;
              color: #2c3e50;
            }
            .lgpd-body a { color: #0a1f44; font-weight: 600; }
          `}</style>

          <p className="lead">
            Este documento descreve, de forma transparente, como a <strong>Rádio TOP100 FM</strong>{" "}
            realiza o tratamento dos dados pessoais coletados no formulário de inscrição em
            promoções, em estrita observância à Lei Geral de Proteção de Dados Pessoais (Lei nº
            13.709/2018 – LGPD).
          </p>

          <h3>1. Controlador dos Dados</h3>
          <p>
            O controlador, responsável pelas decisões referentes ao tratamento dos dados pessoais
            coletados, é a <strong>Rádio TOP100 FM</strong>, pessoa jurídica inscrita no CNPJ sob o
            nº <strong>46.549.775/0001-11</strong>.
          </p>

          <h3>2. Dados Pessoais Coletados</h3>
          <p>Para viabilizar a participação na promoção, são coletados os seguintes dados:</p>
          <ul>
            <li>Nome completo;</li>
            <li>Número de telefone celular (WhatsApp), com DDD;</li>
            <li>Cadastro de Pessoas Físicas (CPF);</li>
            <li>Identificador de usuário no Instagram;</li>
            <li>Identificador ou link de perfil no Facebook.</li>
          </ul>

          <h3>3. Finalidades do Tratamento</h3>
          <p>Os dados acima são tratados exclusivamente para as seguintes finalidades:</p>
          <ul>
            <li>Validação da participação do titular na promoção;</li>
            <li>Identificação unívoca do participante e prevenção a cadastros duplicados;</li>
            <li>Comunicação de eventual premiação por meio do número informado;</li>
            <li>
              Verificação do cumprimento das regras do regulamento, incluindo a checagem dos
              perfis nas redes sociais.
            </li>
          </ul>

          <h3>4. Bases Legais</h3>
          <p>
            O tratamento dos dados pessoais fundamenta-se no <strong>consentimento</strong> livre,
            informado e inequívoco do titular (art. 7º, inciso I, da LGPD), manifestado mediante o
            aceite expresso deste Termo, bem como na <strong>execução de procedimentos preliminares
            relacionados a contrato</strong> de adesão à promoção (art. 7º, inciso V).
          </p>

          <h3>5. Compartilhamento de Dados</h3>
          <p>
            A Rádio TOP100 FM <strong>não comercializa</strong> dados pessoais. O compartilhamento
            ocorre apenas com operadores estritamente necessários à consecução das finalidades
            descritas — tais como provedores de infraestrutura tecnológica e agências responsáveis
            pela operação da promoção — e, quando aplicável, com autoridades públicas no
            cumprimento de obrigações legais ou regulatórias.
          </p>

          <h3>6. Período de Retenção</h3>
          <p>
            Os dados serão mantidos durante a vigência da promoção e por até <strong>5 (cinco)
            anos</strong> após o seu encerramento, prazo necessário para fins de prestação de
            contas, prevenção a fraudes e cumprimento de obrigações legais. Decorrido tal período,
            os dados serão eliminados ou anonimizados de forma segura.
          </p>

          <h3>7. Direitos do Titular</h3>
          <p>
            Nos termos do artigo 18 da LGPD, é assegurado ao titular, a qualquer tempo e mediante
            requisição, o exercício dos seguintes direitos:
          </p>
          <ul>
            <li>Confirmação da existência de tratamento;</li>
            <li>Acesso aos dados pessoais;</li>
            <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos;</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço;</li>
            <li>
              Revogação do consentimento e consequente eliminação dos dados tratados com base
              nele;
            </li>
            <li>Informação sobre as entidades com as quais os dados são compartilhados.</li>
          </ul>

          <h3>8. Canal de Atendimento ao Titular</h3>
          <p>
            Para exercer quaisquer dos direitos previstos na LGPD — em especial a{" "}
            <strong>solicitação de exclusão dos dados</strong> — o titular deverá encaminhar
            requerimento para o e-mail{" "}
            <a href="mailto:contatotop100fm@gmail.com">contatotop100fm@gmail.com</a>,
            informando nome completo e CPF utilizados no cadastro. As solicitações serão atendidas
            no menor prazo possível, observados os limites e exceções previstos em lei.
          </p>

          <h3>9. Medidas de Segurança</h3>
          <p>
            A Rádio TOP100 FM adota medidas técnicas e administrativas adequadas para proteger os
            dados pessoais contra acessos não autorizados, situações acidentais ou ilícitas de
            destruição, perda, alteração, comunicação ou difusão.
          </p>

          <h3>10. Aceite</h3>
          <p>
            Ao assinalar a opção <em>"Li e aceito o tratamento dos meus dados pessoais conforme a
            LGPD"</em> e enviar o formulário, o titular declara haver lido, compreendido e
            concordado integralmente com os termos aqui dispostos, autorizando o tratamento de
            seus dados pessoais para as finalidades descritas.
          </p>
        </div>

        {/* Rodapé */}
        <footer
          style={{
            borderTop: "1px solid #e5e7eb",
            padding: "14px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fafbfc",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            © Rádio TOP100 FM — CNPJ 46.549.775/0001-11
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#0a1f44",
              color: "#fff",
              border: "none",
              padding: "9px 20px",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: 0.3,
            }}
          >
            Entendi e fechar
          </button>
        </footer>
      </div>
    </div>
  );
}
