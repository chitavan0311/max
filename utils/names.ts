
const ADJECTIVES = ['Neon', 'Cyber', 'Swift', 'Solar', 'Void', 'Crystal', 'Glitch', 'Echo', 'Nova', 'Binary', 'Shadow', 'Spectral'];
const NOUNS = ['Banana', 'Raven', 'Panda', 'Cipher', 'Vortex', 'Orion', 'Pulse', 'Zenith', 'Matrix', 'Comet', 'Titan', 'Ghost'];

export const generateCodeName = () => {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${adj}${noun}-${num}`;
};
