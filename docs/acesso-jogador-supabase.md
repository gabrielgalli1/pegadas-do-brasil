# Acesso do jogador com Supabase

## Variáveis do servidor

Copie `.env.local.example` para `.env.local` e configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PIN_SECRET_V1`

As duas últimas variáveis são privadas. Elas não podem usar o prefixo
`NEXT_PUBLIC_`, aparecer em logs ou ser incluídas no Git. O `PIN_SECRET_V1`
deve ter uma cópia segura fora do repositório e não pode mudar enquanto
existirem contas criadas com a versão 1.

## Rotas

### `POST /api/player/create`

Recebe `nickname`, `pin` e `avatarId`. Quando a requisição traz uma sessão
anônima no cabeçalho `Authorization`, converte o mesmo usuário para preservar
seu progresso e devolve uma nova sessão. Sem sessão, cria um usuário com a API
administrativa, grava `jogadores` e inicia a sessão com o cliente público. O
registro em `jogadores` é gravado antes da conversão e restaurado se a
atualização do Auth falhar. Para contas novas, uma falha ao inserir em
`jogadores` ou iniciar a sessão remove o usuário criado.

O campo `jogadores.avatar_id` aceita `null`, pois a tela de acesso aparece antes
da escolha do avatar. Quando o jogador escolhe um personagem no menu, o jogo
atualiza esse campo normalmente.

### `POST /api/player/login`

Consulta `login_bloqueado_ate`, deriva a senha no servidor e tenta o login.
Somente `invalid_credentials` registra uma tentativa incorreta. Rede, timeout
e rate limit não aumentam o contador. O sucesso zera o contador e devolve a
sessão para `supabase.auth.setSession()` no navegador.

## Regras do identificador

O apelido de exibição passa por `tidyNickname()` e `validateNickname()`. Para
o login, ele é convertido para minúsculas, sem acentos, espaços ou símbolos.
Essa forma normalizada é usada no e-mail interno, no HMAC e nas funções de
tentativa. A senha do Auth é `HMAC-SHA256(PIN_SECRET_V1, apelido + PIN)` com
marcação da versão; o PIN puro nunca é enviado ao Supabase Auth.

Enquanto o e-mail e a senha dependerem do apelido, contas protegidas não podem
editar o apelido diretamente. Uma futura troca exigirá uma rota própria para
atualizar apelido, e-mail interno e senha de forma coordenada.

## Jogo sem conta

Antes de continuar sem uma conta, a tela explica que o progresso ficará salvo
somente no aparelho atual e poderá ser perdido ao trocar de dispositivo ou
limpar os dados do navegador.
