/**
 * Silencia o ruído interno do Baileys no console.
 *
 * O Baileys despeja objetos de criptografia (sessionEntry, chainKey, ratchet)
 * direto no console quando reconecta. Não é erro: é log de depuração dele.
 * Embuta a tela e faz parecer que algo quebrou.
 *
 * Regra: só passa o que for string. Todo o output deste projeto é string
 * com o prefixo [teixo-zap]. Objeto jogado no console = ruído da biblioteca.
 *
 * Requerido antes de qualquer outro require.
 */

const originalLog = console.log.bind(console);
const originalInfo = console.info.bind(console);

console.log = (...args) => {
  if (args.length > 0 && args.every((a) => typeof a === 'string')) {
    originalLog(...args);
  }
};

console.info = (...args) => {
  if (args.length > 0 && args.every((a) => typeof a === 'string')) {
    originalInfo(...args);
  }
};

console.debug = () => {};
