export type RecordedNarration = string | readonly string[];

// Each key is the exact fallback text already spoken by the game. As the
// studio recordings arrive, adding them here replaces browser speech without
// changing the challenge components.
export const recordedNarrations: Record<string, RecordedNarration> = {
  "Primeiro, escolha seu avatar. Segundo, inicie a aventura e entre na jornada pelo Brasil. Terceiro, avance pelas fases. Complete uma fase de cada vez e aprenda sobre o Brasil.": [
    "/narracoes/geral-escolha-avatar.mp3",
    "/narracoes/geral-inicie-aventura.mp3",
    "/narracoes/geral-avance-fases.mp3",
  ],
  "Avatar escolhido! Agora você pode iniciar a aventura.": "/narracoes/geral-avatar-escolhido.mp3",
  "Escolha seu avatar antes de iniciar a aventura.": "/narracoes/geral-escolha-avatar.mp3",

  "Qual dessas silhuetas representa o Brasil?": "/narracoes/inicial-01-pergunta.mp3",
  "Muito bem! Essa é a silhueta do Brasil!": "/narracoes/inicial-01-acerto.mp3",
  "Quase! Observe o formato de cada país e tente novamente.": "/narracoes/inicial-01-erro.mp3",
  "Em qual continente o Brasil está localizado?": "/narracoes/inicial-02-pergunta.mp3",
  "Muito bem! O Brasil está localizado na América do Sul!": "/narracoes/inicial-02-acerto.mp3",
  "Quase! Observe o mapa e tente novamente.": "/narracoes/inicial-02-erro.mp3",
  "Qual oceano banha o litoral do Brasil?": "/narracoes/inicial-03-pergunta.mp3",
  "Muito bem! O Oceano Atlântico banha o litoral do Brasil!": "/narracoes/inicial-03-acerto.mp3",
  "Quase! Observe o litoral do Brasil e tente novamente.": "/narracoes/inicial-03-erro.mp3",
  "Observe o mapa. Quantas unidades federativas o Brasil possui? Conte os 26 estados e o Distrito Federal.": "/narracoes/inicial-04-pergunta.mp3",
  "Muito bem! O Brasil possui 26 estados e o Distrito Federal, formando 27 unidades federativas!": "/narracoes/inicial-04-acerto.mp3",
  "Quase! Conte cada parte colorida do mapa, incluindo o Distrito Federal, e tente novamente.": "/narracoes/inicial-04-erro.mp3",
  "Qual destas paisagens está presente no Brasil?": "/narracoes/inicial-05-pergunta.mp3",
  "Muito bem! A Floresta Amazônica está presente no Brasil e é uma das maiores florestas tropicais do mundo!": "/narracoes/inicial-05-acerto.mp3",
  "Quase! Observe a vegetação e o clima de cada paisagem e tente novamente.": "/narracoes/inicial-05-erro.mp3",

  "Bem-vindo, explorador! Toque na Região Norte no mapa do Brasil.": "/narracoes/norte-01-instrucao.mp3",
  "Muito bem! Você encontrou a Região Norte!": "/narracoes/norte-01-acerto.mp3",
  "Quase! Observe a parte superior do mapa e tente novamente.": "/narracoes/norte-01-erro.mp3",
  "Quantos estados fazem parte da Região Norte? Conte cada parte colorida do mapa e escolha: cinco, seis, sete ou oito.": "/narracoes/norte-02-pergunta.mp3",
  "Muito bem! A Região Norte possui sete estados: Acre, Amapá, Amazonas, Pará, Rondônia, Roraima e Tocantins.": "/narracoes/norte-02-acerto.mp3",
  "Quase! Conte cada estado colorido e tente novamente.": "/narracoes/norte-02-erro.mp3",
  "Qual é o maior estado do Brasil em extensão territorial? Compare os estados destacados no mapa e escolha: Amazonas, Pará, Mato Grosso ou Minas Gerais.": "/narracoes/norte-03-pergunta.mp3",
  "Muito bem! O Amazonas é o maior estado do Brasil em extensão territorial e fica na Região Norte!": "/narracoes/norte-03-acerto.mp3",
  "Quase! Compare o tamanho dos quatro estados destacados e tente novamente.": "/narracoes/norte-03-erro.mp3",
  "Qual é o habitat natural do boto-cor-de-rosa? Observe as imagens e escolha: rio da Amazônia, mar com recifes, praia ou lago nas montanhas nevadas.": "/narracoes/norte-04-pergunta.mp3",
  "Muito bem! O boto-cor-de-rosa vive em água doce, nos rios da Amazônia!": "/narracoes/norte-04-acerto.mp3",
  "Quase! Compare os ambientes e pense em onde o boto vive na natureza. Tente novamente.": "/narracoes/norte-04-erro.mp3",
  "Qual destas plantas é um símbolo da Amazônia? Observe as imagens e escolha: vitória-régia, girassol, cacto ou roseira.": "/narracoes/norte-05-pergunta.mp3",
  "Muito bem! A vitória-régia é uma planta aquática e um símbolo da Amazônia!": "/narracoes/norte-05-acerto.mp3",
  "Quase! Procure a planta com grandes folhas redondas que flutuam na água. Tente novamente.": "/narracoes/norte-05-erro.mp3",
  "Falta uma peça no mapa da Região Norte! Arraste a peça que falta para o espaço pontilhado. Você também pode tocar em uma peça e depois no espaço vazio. Escolha entre Bahia, Acre, Paraná e Goiás.": "/narracoes/norte-06-instrucao.mp3",
  "Muito bem! Você encaixou o Acre e completou o mapa da Região Norte!": "/narracoes/norte-06-acerto.mp3",
  "Essa peça não encaixa. Compare os formatos e tente novamente!": "/narracoes/norte-06-erro.mp3",
  "Parabéns, explorador! Você concluiu os seis desafios da Região Norte!": "/narracoes/norte-06-conclusao.mp3",
};