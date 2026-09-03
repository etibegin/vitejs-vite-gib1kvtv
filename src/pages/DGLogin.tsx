import { useState } from "react";

type DGLoginProps = {
  dgs: any[];

  onAjouterDG: (
    nom: string,
    nip: string
  ) => Promise<any | null>;

  onConnexionDGExistant: (
    dgId: number,
    nip: string
  ) => Promise<boolean>;
};

export default function DGLogin({
  dgs,
  onAjouterDG,
  onConnexionDGExistant,
}: DGLoginProps) {
  const [
    modeConnexion,
    setModeConnexion,
  ] = useState<
    "existant" | "nouveau"
  >("existant");

  const [
    dgExistantId,
    setDgExistantId,
  ] = useState("");

  const [
    nipExistant,
    setNipExistant,
  ] = useState("");

  const [
    nomNouveauDG,
    setNomNouveauDG,
  ] = useState("");

  const [
    nipNouveauDG,
    setNipNouveauDG,
  ] = useState("");

  const [
    connexionEnCours,
    setConnexionEnCours,
  ] = useState(false);

  async function rejoindreDGExistant() {
    const dgId = Number(dgExistantId);

    if (
      !Number.isInteger(dgId) ||
      dgId <= 0
    ) {
      alert(
        "Veuillez sélectionner votre DG."
      );

      return;
    }

    if (!nipExistant.trim()) {
      alert(
        "Veuillez entrer votre NIP."
      );

      return;
    }

    setConnexionEnCours(true);

    try {
      const connexionReussie =
        await onConnexionDGExistant(
          dgId,
          nipExistant
        );

      if (connexionReussie) {
        setNipExistant("");
      }
    } finally {
      setConnexionEnCours(false);
    }
  }

  async function creerNouveauDG() {
    const nomNettoye =
      nomNouveauDG.trim();
  
    const nipNettoye =
      nipNouveauDG.trim();
  
    if (!nomNettoye) {
      alert(
        "Veuillez entrer un nom de DG."
      );
  
      return;
    }
  
    if (!nipNettoye) {
      alert(
        "Veuillez choisir un NIP."
      );
  
      return;
    }
  
    setConnexionEnCours(true);
  
    try {
      const nouveauDG =
        await onAjouterDG(
          nomNettoye,
          nipNettoye
        );
  
      if (nouveauDG) {
        setNomNouveauDG("");
        setNipNouveauDG("");
      }
    } finally {
      setConnexionEnCours(false);
    }
  }

  function gererToucheConnexion(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" &&
      !connexionEnCours
    ) {
      rejoindreDGExistant();
    }
  }

  function gererToucheCreation(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (
      event.key === "Enter" &&
      !connexionEnCours
    ) {
      creerNouveauDG();
    }
  }

  return (
    <div>
      <h1>Pool Hockey Enchère</h1>

      <main className="dg-login-page">
        <section className="dg-login-card">
          <div className="dg-login-heading">
            <span>
              Accès participant
            </span>

            <h2>
              Rejoindre le repêchage
            </h2>

            <p>
              Reconnectez-vous à un DG existant
              ou créez un nouveau participant.
            </p>
          </div>

          <div className="dg-login-tabs">
            <button
              type="button"
              className={
                modeConnexion ===
                "existant"
                  ? "dg-login-tab-active"
                  : ""
              }
              onClick={() =>
                setModeConnexion(
                  "existant"
                )
              }
              disabled={
                connexionEnCours
              }
            >
              DG existant
            </button>

            <button
              type="button"
              className={
                modeConnexion ===
                "nouveau"
                  ? "dg-login-tab-active"
                  : ""
              }
              onClick={() =>
                setModeConnexion(
                  "nouveau"
                )
              }
              disabled={
                connexionEnCours
              }
            >
              Nouveau DG
            </button>
          </div>

          {modeConnexion ===
            "existant" && (
            <div className="dg-login-form">
              <label className="form-label">
                Choisir votre DG
              </label>

              <select
                value={dgExistantId}
                onChange={(event) =>
                  setDgExistantId(
                    event.target.value
                  )
                }
                className="form-control"
                disabled={
                  connexionEnCours
                }
              >
                <option value="">
                  Sélectionner un DG
                </option>

                {dgs.map((dg) => (
                  <option
                    key={dg.id}
                    value={dg.id}
                  >
                    {dg.nom}
                  </option>
                ))}
              </select>

              <label className="form-label">
                NIP
              </label>

              <input
                type="password"
                inputMode="numeric"
                value={nipExistant}
                onChange={(event) =>
                  setNipExistant(
                    event.target.value
                  )
                }
                onKeyDown={
                  gererToucheConnexion
                }
                className="form-control"
                placeholder="Votre NIP"
                autoComplete="off"
                disabled={
                  connexionEnCours
                }
              />

              <button
                type="button"
                onClick={
                  rejoindreDGExistant
                }
                disabled={
                  connexionEnCours
                }
              >
                {connexionEnCours
                  ? "Connexion..."
                  : "Rejoindre ce DG"}
              </button>

              {dgs.length === 0 && (
                <p className="dg-login-empty-message">
                  Aucun DG n'est encore inscrit.
                  Créez le premier participant.
                </p>
              )}
            </div>
          )}

          {modeConnexion ===
            "nouveau" && (
            <div className="dg-login-form">
              <label className="form-label">
                Nom du nouveau DG
              </label>

              <input
                type="text"
                value={nomNouveauDG}
                onChange={(event) =>
                  setNomNouveauDG(
                    event.target.value
                  )
                }
                className="form-control"
                placeholder="Nom du DG"
                autoComplete="off"
                disabled={
                  connexionEnCours
                }
              />

              <label className="form-label">
                Choisir un NIP
              </label>

              <input
                type="password"
                inputMode="numeric"
                value={nipNouveauDG}
                onChange={(event) =>
                  setNipNouveauDG(
                    event.target.value
                  )
                }
                onKeyDown={
                  gererToucheCreation
                }
                className="form-control"
                placeholder="NIP du DG"
                autoComplete="new-password"
                disabled={
                  connexionEnCours
                }
              />

              <button
                type="button"
                onClick={
                  creerNouveauDG
                }
                disabled={
                  connexionEnCours
                }
              >
                {connexionEnCours
                  ? "Création..."
                  : "Créer mon DG"}
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
