# Fase bônus — mapa de emblemas

Implementação local baseada nas duas propostas visuais aprovadas no chat.

## Experiência

- Cartão dourado compacto abaixo da trilha, bloqueado até concluir a fase inicial e as cinco regiões.
- Mapa com os contornos reais já utilizados pelo jogo, paisagens regionais e cinco silhuetas dos emblemas originais.
- Arraste com mouse/toque ou selecione um emblema e clique/toque no destino. Teclado: Tab e Enter/Espaço. Escape cancela a seleção.
- Erro oferece uma pista sem reiniciar ou remover encaixes.
- Cinco encaixes abrem a celebração da viagem completa; é possível voltar à jornada ou jogar novamente.
- A fase bônus não altera os pontos, a contagem das seis fases ou os seis emblemas existentes.

## Progresso

`bonusPlacedRegions` e `bonusCompleted` fazem parte do mesmo snapshot `PlayerProgress` utilizado pelo cache local e pelo JSON `fases` no Supabase. Sem migração de tabelas.

Saves antigos recebem valores padrão. O bônus só libera quando `completedPhase` é verdadeiro e `completedRegions` contém as cinco regiões distintas. O progresso do bônus é descartado ao normalizar um save que ainda não atende a esses requisitos. Repetir um bônus já concluído preserva sua conclusão.

## Revisão local

Com o servidor de desenvolvimento na porta 3000:

- `http://localhost:3000/?preview=jornada-bonus`: jornada completa e cartão liberado.
- `http://localhost:3000/?preview=bonus`: entra diretamente no bônus.
- `http://localhost:3000/?preview=bonus-bloqueado`: jornada inicial e cartão bloqueado.
- `http://localhost:3000/`: fluxo normal e progresso real do navegador.

Os três novos atalhos só funcionam em desenvolvimento e não gravam progresso nem acessam o Supabase. Para revisar a prévia não são necessárias credenciais. A narração nova usa a voz do navegador pelo mecanismo já existente até haver gravações específicas para o bônus.

Trabalho na branch local `fase-bonus-emblemas`. Publicação no GitHub/Vercel aguarda aprovação visual do usuário.
