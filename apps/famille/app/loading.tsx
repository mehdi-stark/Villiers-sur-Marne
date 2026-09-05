import { SquelettePage } from "@ville/ui";

/** La forme de la page arrive AVANT ses données : jamais d'écran blanc entre deux pages. */
export default function Chargement() {
  return <SquelettePage cartes={2} lignes={5} />;
}
