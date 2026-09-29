import type { Locale } from "@/i18n/dictionaries";

export type LegalKey = "terms" | "privacy" | "cookies";
export interface LegalDoc { title: string; updated: string; sections: Array<{ heading: string; body: string[] }> }

// Textos-base ajustados ao que a loja faz hoje. NÃO substituem revisão jurídica:
// confirmar com um advogado (prazos de devolução, dados recolhidos, enquadramento legal) antes de produção.
export const LEGAL: Record<Locale, Record<LegalKey, LegalDoc>> = {
  pt: {
    terms: {
      title: "Termos e condições",
      updated: "2026-09-29",
      sections: [
        { heading: "Aceitação", body: ["Ao criar uma conta ou fazer uma encomenda no Twisisa Market, aceita estes termos. Se não concordar, não utilize o serviço."] },
        { heading: "A sua conta", body: ["É responsável por manter a palavra-passe confidencial e por toda a actividade da conta.", "Os dados que fornece devem ser verdadeiros e estar actualizados."] },
        { heading: "Encomendas e preços", body: ["Os preços são apresentados em meticais (MZN).", "Uma encomenda só fica confirmada depois de o pagamento ser validado.", "Podemos recusar ou cancelar uma encomenda por falta de stock, erro de preço evidente ou suspeita de fraude, devolvendo o valor pago."] },
        { heading: "Pagamentos", body: ["Aceitamos M-Pesa, e-Mola e cartão. Os pagamentos são processados por prestadores externos e alguns exigem confirmação manual da nossa parte, o que pode demorar.", "Pode consultar o estado de cada pagamento na página da encomenda."] },
        { heading: "Cancelamentos e devoluções", body: ["Pode cancelar uma encomenda enquanto ainda não tiver sido enviada.", "As condições de entrega, troca e devolução são comunicadas na encomenda. Para qualquer pedido, fale com o suporte pelo chat."] },
        { heading: "Utilização aceitável", body: ["Não pode usar o serviço para fraude, para prejudicar outros utilizadores ou para tentar aceder a áreas restritas."] },
        { heading: "Alterações", body: ["Podemos actualizar estes termos. A data da última actualização aparece no topo desta página e continuar a usar o serviço significa aceitar a versão em vigor."] }
      ]
    },
    privacy: {
      title: "Política de privacidade",
      updated: "2026-09-29",
      sections: [
        { heading: "Quem somos", body: ["O Twisisa Market é uma loja online que opera em Moçambique. Esta política explica que dados recolhemos e como os usamos."] },
        { heading: "Dados que recolhemos", body: ["Conta: nome, email, telefone e palavra-passe.", "Compras: encomendas, pagamentos e o respectivo estado.", "Suporte: as mensagens que envia no chat.", "Técnicos: informação básica de ligação e de erros, necessária para segurança e funcionamento."] },
        { heading: "Para que usamos os dados", body: ["Processar encomendas e pagamentos, avisá-lo do estado das compras, prestar suporte, proteger o serviço contra fraude e gerir o programa de indicações."] },
        { heading: "Com quem os partilhamos", body: ["Apenas com prestadores necessários ao serviço: meios de pagamento (M-Pesa, e-Mola, cartão), alojamento e armazenamento de imagens. Não vendemos os seus dados."] },
        { heading: "Quanto tempo os guardamos", body: ["Enquanto a conta existir e durante o tempo exigido por obrigações legais, como os registos de encomendas e de facturação."] },
        { heading: "Os seus direitos", body: ["Pode pedir acesso, correcção ou eliminação dos seus dados. Faça o pedido pelo chat de suporte."] },
        { heading: "Segurança", body: ["Usamos ligação cifrada (HTTPS) e controlo de acessos. Nenhum sistema é totalmente seguro, por isso recomendamos uma palavra-passe forte e única."] },
        { heading: "Alterações", body: ["Podemos actualizar esta política. A data da última actualização aparece no topo."] }
      ]
    },
    cookies: {
      title: "Política de cookies",
      updated: "2026-09-29",
      sections: [
        { heading: "O que usamos", body: ["O site guarda pequenos dados no armazenamento do seu navegador. São essenciais: mantêm a sessão iniciada, o carrinho e o idioma escolhido. Sem eles o site não funciona correctamente."] },
        { heading: "Análise e publicidade", body: ["Neste momento não usamos cookies de análise nem de publicidade. Se isso mudar, pediremos o seu consentimento antes."] },
        { heading: "Serviços de terceiros", body: ["As fontes tipográficas do site são carregadas a partir do Google Fonts, cujo fornecedor pode receber o seu endereço IP quando a página abre."] },
        { heading: "Como gerir", body: ["Pode apagar os dados do site nas definições do navegador. Terá de iniciar sessão outra vez e o carrinho será esvaziado."] }
      ]
    }
  },
  en: {
    terms: {
      title: "Terms and conditions",
      updated: "2026-09-29",
      sections: [
        { heading: "Acceptance", body: ["By creating an account or placing an order at Twisisa Market you accept these terms. If you don't agree, please don't use the service."] },
        { heading: "Your account", body: ["You are responsible for keeping your password confidential and for all activity on your account.", "The information you provide must be true and kept up to date."] },
        { heading: "Orders and prices", body: ["Prices are shown in meticais (MZN).", "An order is only confirmed once payment has been validated.", "We may refuse or cancel an order because of missing stock, an obvious pricing error or suspected fraud, refunding what you paid."] },
        { heading: "Payments", body: ["We accept M-Pesa, e-Mola and card. Payments are processed by external providers and some require manual confirmation from us, which can take time.", "You can check each payment's status on the order page."] },
        { heading: "Cancellations and returns", body: ["You can cancel an order as long as it has not been shipped.", "Delivery, exchange and return conditions are communicated with your order. For any request, talk to support in the chat."] },
        { heading: "Acceptable use", body: ["You may not use the service for fraud, to harm other users or to try to access restricted areas."] },
        { heading: "Changes", body: ["We may update these terms. The date of the last update is shown at the top of this page, and continuing to use the service means accepting the current version."] }
      ]
    },
    privacy: {
      title: "Privacy policy",
      updated: "2026-09-29",
      sections: [
        { heading: "Who we are", body: ["Twisisa Market is an online store operating in Mozambique. This policy explains what data we collect and how we use it."] },
        { heading: "Data we collect", body: ["Account: name, email, phone and password.", "Purchases: orders, payments and their status.", "Support: the messages you send in the chat.", "Technical: basic connection and error information needed for security and operation."] },
        { heading: "How we use it", body: ["To process orders and payments, tell you about your purchases, provide support, protect the service against fraud and run the referral programme."] },
        { heading: "Who we share it with", body: ["Only with providers needed to run the service: payment methods (M-Pesa, e-Mola, card), hosting and image storage. We do not sell your data."] },
        { heading: "How long we keep it", body: ["While your account exists and for as long as legal obligations require, such as order and billing records."] },
        { heading: "Your rights", body: ["You can ask to access, correct or delete your data. Make the request through the support chat."] },
        { heading: "Security", body: ["We use encrypted connections (HTTPS) and access controls. No system is completely secure, so we recommend a strong, unique password."] },
        { heading: "Changes", body: ["We may update this policy. The date of the last update is shown at the top."] }
      ]
    },
    cookies: {
      title: "Cookie policy",
      updated: "2026-09-29",
      sections: [
        { heading: "What we use", body: ["The site stores small pieces of data in your browser. They are essential: they keep you signed in and remember your cart and chosen language. Without them the site won't work properly."] },
        { heading: "Analytics and advertising", body: ["We currently use no analytics or advertising cookies. If that changes, we will ask for your consent first."] },
        { heading: "Third-party services", body: ["The site's fonts are loaded from Google Fonts, whose provider may receive your IP address when the page opens."] },
        { heading: "How to manage them", body: ["You can clear the site's data in your browser settings. You will need to sign in again and your cart will be emptied."] }
      ]
    }
  }
};
