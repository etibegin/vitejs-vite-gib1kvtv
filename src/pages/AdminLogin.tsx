import { useState } from "react";

type AdminLoginProps = {
  onConnexionAdmin: (
    courriel: string,
    motDePasse: string
  ) => Promise<boolean>;
};

export default function AdminLogin({
  onConnexionAdmin,
}: AdminLoginProps) {
  const [courriel, setCourriel] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [connexionEnCours, setConnexionEnCours] =
    useState(false);

  async function soumettreConnexion() {
    const courrielNettoye = courriel.trim();

    if (!courrielNettoye) {
      alert("Veuillez entrer votre courriel.");
      return;
    }

    if (!motDePasse) {
      alert("Veuillez entrer votre mot de passe.");
      return;
    }

    setConnexionEnCours(true);

    const connexionReussie =
      await onConnexionAdmin(
        courrielNettoye,
        motDePasse
      );

    setConnexionEnCours(false);

    if (connexionReussie) {
      setMotDePasse("");
    }
  }

  function gererTouche(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter" && !connexionEnCours) {
      soumettreConnexion();
    }
  }

  return (
    <div>
      <h1>Pool Hockey Enchère</h1>

      <section className="login-screen">
        <h2>Accès organisateur</h2>

        <p>
          Connectez-vous avec le compte organisateur
          Supabase pour accéder aux contrôles du
          repêchage.
        </p>

        <label className="form-label">
          Courriel organisateur
        </label>

        <input
          type="email"
          value={courriel}
          onChange={(event) =>
            setCourriel(event.target.value)
          }
          onKeyDown={gererTouche}
          className="form-control"
          placeholder="votre.courriel@exemple.com"
          autoComplete="email"
          disabled={connexionEnCours}
        />

        <label className="form-label">
          Mot de passe
        </label>

        <input
          type="password"
          value={motDePasse}
          onChange={(event) =>
            setMotDePasse(event.target.value)
          }
          onKeyDown={gererTouche}
          className="form-control"
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          disabled={connexionEnCours}
        />

        <button
          onClick={soumettreConnexion}
          disabled={connexionEnCours}
        >
          {connexionEnCours
            ? "Connexion en cours..."
            : "Accéder à l'organisateur"}
        </button>
      </section>
    </div>
  );
}