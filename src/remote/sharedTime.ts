// Fælles tid for stopuret. Uden fjernbetjening er det bare Date.now(). Med
// fjernbetjening justeres uret til relæets ur, så telefon og skærm viser det samme.
let offset = 0;

export const sharedNow = () => Date.now() + offset;

export function setSharedOffset(ms: number) {
  offset = ms;
}
