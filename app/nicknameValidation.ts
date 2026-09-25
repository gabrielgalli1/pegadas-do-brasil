// Client-side nickname rules. The Supabase "validar_apelido" trigger may also
// check these, but the game must enforce them on its own: without Supabase
// configured (or if the trigger is missing) nothing else would stop a child
// from typing their real name.

const NICKNAME_PATTERN = /^[\p{L}\p{N} ]+$/u;
const LONG_NUMBER_PATTERN = /\d{3,}/;

// Common Brazilian first names and surnames, lowercase and without accents.
// Names that are also everyday words kids use in nicknames (rosa, flor, luz,
// sol, lua, luna, estrela, leão, lobo...) and the game's own characters (Téo,
// the Centro-Oeste mascot) are intentionally left out.
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
kelly lilian marcela michele michelle nadia pietra rayssa sueli taina
tainara vitoria yara zilda jennifer
joao jose pedro paulo lucas luca mateus matheus gabriel rafael miguel arthur
artur heitor bernardo davi david enzo lorenzo gustavo guilherme
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

// Digits kids swap for letters ("Jo4o", "M4r1a"). 1 can stand for i or l.
const LEET: Record<string, string> = { "0": "o", "3": "e", "4": "a", "5": "s", "6": "g", "7": "t", "8": "b", "9": "g" };

// Reduces spelling variants to one form, so "Joaao", "Thiago"/"Tiago",
// "Kauã"/"Cauã" and "Isabella"/"Isabela" all compare equal.
function skeleton(word: string): string {
  return word
    .replace(/ph/g, "f")
    .replace(/th/g, "t")
    .replace(/y/g, "i")
    .replace(/w/g, "v")
    .replace(/k/g, "c")
    .replace(/h$/, "")
    .replace(/(\p{L})\1+/gu, "$1");
}

const REAL_NAME_SKELETONS = new Set([...REAL_NAMES].map(skeleton));

function looksLikeRealName(word: string): boolean {
  if (!/\p{L}/u.test(word)) return false; // plain numbers like "10" are fine
  const readings = /1/.test(word) ? [word.replace(/1/g, "i"), word.replace(/1/g, "l")] : [word];
  return readings.some((reading) => {
    const letters = reading.replace(/\d/g, (digit) => LEET[digit] ?? "");
    return REAL_NAMES.has(letters) || REAL_NAME_SKELETONS.has(skeleton(letters));
  });
}

export function tidyNickname(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Returns a message for the player, or null when the nickname is allowed. */
export function validateNickname(nickname: string): string | null {
  if (nickname.length < 2 || nickname.length > 15) return "O apelido deve ter entre 2 e 15 letras.";
  if (!NICKNAME_PATTERN.test(nickname)) return "Use só letras, números e espaços — sem símbolos.";
  if (LONG_NUMBER_PATTERN.test(nickname)) return "Não use números longos no apelido.";
  const words = normalize(nickname).split(" ");
  // Also check the words glued together, to catch names split by spaces ("Jo ão").
  if ([...words, words.join("")].some(looksLikeRealName)) {
    return "Isso parece um nome de verdade! Invente um apelido, como \"Onça Veloz\".";
  }
  return null;
}
