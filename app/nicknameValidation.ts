// Client-side nickname rules. The Supabase "validar_apelido" trigger may also
// check these, but the game must enforce them on its own: without Supabase
// configured (or if the trigger is missing) nothing else would stop a child
// from typing their real name.

const NICKNAME_PATTERN = /^[\p{L}\p{N} ]+$/u;
const LONG_NUMBER_PATTERN = /\d{3,}/;

// Common Brazilian first names and surnames, lowercase and without accents.
// Names that are also everyday words kids use in nicknames (rosa, flor, luz,
// sol, estrela, leão, lobo...) are intentionally left out.
const REAL_NAMES = new Set(`
ana maria mariana marina julia juliana luiza luisa luana laura larissa leticia
beatriz bia camila carolina carol clara cecilia alice helena heloisa valentina
sofia sophia isabela isabella isadora manuela manu lara lorena livia lais
gabriela gabi giovanna giovana fernanda fer amanda bruna bianca barbara debora
eduarda duda emanuelly emilly emily esther ester elisa eloa eloisa fabiana
fatima francisca gloria heloise ingrid iris jessica joana joyce jaqueline
kamila karina katia keila lavinia lucia luciana madalena marcia marta melissa
mirella milena monica nathalia natalia nicole olivia patricia paula paulina
priscila rafaela raquel rebeca regina renata rita roberta sabrina samara
sandra sara sarah silvia simone stella tatiana tereza teresa thais valeria
vanessa vera vivian yasmin yasmim agatha allana antonella catarina cristina
daniela denise elaine elen ellen fabiola flavia gisele graziela ivone jussara
kelly lilian luna marcela michele michelle nadia pietra rayssa sueli taina
tainara vitoria yara zilda jennifer
joao jose pedro paulo lucas luca mateus matheus gabriel rafael miguel arthur
artur heitor bernardo davi david enzo lorenzo theo teo gustavo guilherme
henrique felipe filipe samuel benjamin nicolas daniel anthony antonio
bruno caio carlos caua diego diogo eduardo edu emanuel enrico erick eric
fabio fernando francisco gael giovanni igor isaac ian joaquim jorge julio
kaique kaua leonardo leo lucca luiz luis marcelo marcos marco murilo nathan
otavio otto raul renan renato ricardo roberto rodrigo samuca sergio thiago
tiago thomas tomas vicente vinicius vitor victor wesley william yuri alexandre
andre anderson alan alex augusto benicio breno bryan cesar cristiano denis
elias emerson everton fabricio gilberto hugo ivan jonas jonathan juan kevin
leandro luan marcio mauricio mauro moises nelson noah oliver osvaldo patrick
paulinho rafa ruan ryan saulo sebastiao silvio valter walter washington
wagner wellington josue ezequiel levi lui joaozinho zeca ze chico
silva santos oliveira souza sousa lima pereira ferreira costa rodrigues almeida
nascimento carvalho araujo ribeiro gomes martins barbosa alves rocha dias
teixeira moreira cardoso mendes nunes cavalcanti vieira monteiro freitas
barros pinto correia melo campos fernandes goncalves azevedo moura castro
`.trim().split(/\s+/));

function normalize(word: string): string {
  return word.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

export function tidyNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Returns a message for the player, or null when the nickname is allowed. */
export function validateNickname(nickname: string): string | null {
  if (nickname.length < 2 || nickname.length > 15) return "O apelido deve ter entre 2 e 15 letras.";
  if (!NICKNAME_PATTERN.test(nickname)) return "Use só letras, números e espaços — sem símbolos.";
  if (LONG_NUMBER_PATTERN.test(nickname)) return "Não use números longos no apelido.";
  const words = nickname.split(" ").map((word) => normalize(word).replace(/\d+/g, ""));
  if (words.some((word) => REAL_NAMES.has(word))) {
    return "Isso parece um nome de verdade! Invente um apelido, como \"Onça Veloz\".";
  }
  return null;
}
