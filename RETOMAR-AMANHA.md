# Pegadas do Brasil — ponto de retomada

Trabalho na branch fase-bonus-emblemas. Gabriel autorizou o envio desta branch ao GitHub em 03/11/2026 para continuar em outro PC. Não fazer merge ou deploy sem nova aprovação.

## Implementado
- Fase bônus de encaixar os cinco emblemas regionais no mapa do Brasil. Arrastar ou selecionar e tocar; dicas para erros, progresso salvo e celebração final.
- Liberação após concluir a fase inicial e as cinco regiões.
- Cartão bônus centralizado na jornada; instrução de desbloqueio acima dele, alinhada.
- Conclusão do Sul preserva mensagem e emblema, com VOLTAR À JORNADA e JOGAR FASE BÔNUS lado a lado.
- Faixa inferior do bônus unificada: ícone de toque, instrução, contador e cinco estrelas.
- Mapa ampliado; paisagens contínuas por região, mais contraste e cores; contornos claros.
- Posição final do mapa: translate(10%,-8%) no desktop e translate(6%,-8%) em telas menores.
- Título e subtítulo na mesma caixa dourada, ambos reduzidos. Título 2.65cqw, subtítulo .9cqw.

## Em decisão
Gabriel pediu novas opções de fundo. Foram geradas três: paisagem panorâmica, clareira tropical e diário de explorador. Depois foram geradas prévias das três com Ari no canto inferior esquerdo. Nenhuma foi aplicada ao jogo ainda. Escolher o fundo antes de trocar o ativo atual. No jogo, manter o mascote como elemento separado para evitar duplicação.

As seis imagens estão versionadas em `docs/referencias-bonus/`: três fundos e três prévias com Ari. As prévias servem para comparação; não foram aplicadas à tela.

## Continuar em outro computador
```sh
git fetch origin
git switch fase-bonus-emblemas
npm ci
npm run dev
```
Se o repositório ainda não existir, clone e selecione a branch:
```sh
git clone --branch fase-bonus-emblemas https://github.com/gabrielgalli1/pegadas-do-brasil.git
cd pegadas-do-brasil
npm ci
npm run dev
```
Use Node 22.13 ou superior. Consulte `.env.local.example` caso precise configurar a integração de contas; a prévia do bônus funciona sem ela.

## Prévia
http://localhost:3000/?preview=bonus
Outras: ?preview=jornada-bonus, ?preview=bonus-bloqueado, ?preview=sul-final.
Iniciar se necessário: node node_modules/vinext/dist/cli.js dev --port 3000
A primeira compilação pode demorar. Evitar VERCEL=1 no dev: gerou erro de React. Configuração padrão com Cloudflare funcionou.

## Verificações
35 testes passaram na implementação inicial; 17 testes direcionados passaram após botão no Sul. Alterações recentes de layout passaram git diff --check. Mapa ampliado foi conferido visualmente; ajustes finais de título/posição devem ser conferidos com o novo fundo.

## Próximo passo
Escolher/aplicar o fundo aprovado, revisar layout final, validar e apresentar localmente. A branch foi preparada para envio ao GitHub; merge e deploy Vercel ficam para depois da aprovação final.
