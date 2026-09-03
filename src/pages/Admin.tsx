import { useState } from "react";
import * as XLSX from "xlsx";

type AdminProps = {
  propositionEnAttente: any;
  enchereActive: any;
  compteRebours: number | null;
  prochainDG: any;
  ordreDGIds: number[];
  dgs: any[];
  derniereAttributionAnnulable: any;
  historiqueAttributions: any[];

  onImporterListesExcel: (donneesImportees: any) => void;
  onTirerOrdreAleatoire: () => void;
  onRefuserProposition: () => void;
  onApprouverProposition: () => void;
  onDemarrerCompteRebours: () => void;
  onAnnulerCompteRebours: () => void;
  onFermerMisesImmediatement: () => void;
  onReouvrirEnchere: () => void;
  onAttribuerChoixAuGagnant: () => void;
  onAnnulerEnchereActive: () => void;
  onAnnulerDerniereAttribution: () => void;
  onAnnulerAttributionHistorique: (attribution: any) => void;
  onAfficherEntreDeuxEncheres: () => void;
  onExporterEquipesCSV: () => void;
  onReinitialiserSauvegarde: () => void;
  onAjouterDG: (nomDG: string) => void;
  onSupprimerDG: (dgId: number) => void;
  onImporterDonneesNhl: (
    donnees: any[]
  ) => Promise<boolean>;
};

export default function Admin({
  propositionEnAttente,
  enchereActive,
  compteRebours,
  prochainDG,
  ordreDGIds = [],
  dgs = [],
  derniereAttributionAnnulable,
  historiqueAttributions = [],
  onImporterListesExcel,
  onTirerOrdreAleatoire,
  onRefuserProposition,
  onApprouverProposition,
  onDemarrerCompteRebours,
  onAnnulerCompteRebours,
  onFermerMisesImmediatement,
  onReouvrirEnchere,
  onAttribuerChoixAuGagnant,
  onAnnulerEnchereActive,
  onAnnulerDerniereAttribution,
  onAnnulerAttributionHistorique,
  onAfficherEntreDeuxEncheres,
  onExporterEquipesCSV,
  onReinitialiserSauvegarde,
  onAjouterDG,
  onSupprimerDG,
  onImporterDonneesNhl,
}: AdminProps) {
  const [ongletAdmin, setOngletAdmin] = useState("enchere");
  const [nouveauNomDG, setNouveauNomDG] = useState("");
  const [rechercheHistorique, setRechercheHistorique] = useState("");

  const nombreDGActifs = dgs.filter(
    (dg) => dg.budgetRestant > 0
  ).length;

  const misesFermees =
    enchereActive?.misesFermees === true ||
    compteRebours === 0;

  const historiqueFiltre = historiqueAttributions.filter((attribution) => {
    const recherche = rechercheHistorique.trim().toLowerCase();

    return (
      String(attribution.nom || "")
        .toLowerCase()
        .includes(recherche) ||
      String(attribution.type || "")
        .toLowerCase()
        .includes(recherche) ||
      String(attribution.equipe || "")
        .toLowerCase()
        .includes(recherche) ||
      String(attribution.gagnantNom || "")
        .toLowerCase()
        .includes(recherche) ||
      String(attribution.dgProposeurNom || "")
        .toLowerCase()
        .includes(recherche)
    );
  });

  function lireNhlId(ligne: any) {
    const valeur =
      ligne.NHLId ??
      ligne.NhlId ??
      ligne.nhlId ??
      ligne.NHLID ??
      ligne["NHL Id"] ??
      ligne["NHL ID"] ??
      ligne["NHL_Id"] ??
      ligne["nhl_id"] ??
      0;
  
    if (
      valeur === null ||
      valeur === undefined ||
      String(valeur).trim() === ""
    ) {
      return 0;
    }
  
    const valeurNettoyee = String(valeur)
      .trim()
      .replace(/\s/g, "")
      .replace(/\.0$/, "");
  
    const nhlId = Number(valeurNettoyee);
  
    if (!Number.isInteger(nhlId) || nhlId <= 0) {
      return 0;
    }
  
    return nhlId;
  }

  function importerFichierExcel(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const fichier = event.target.files?.[0];

    if (!fichier) {
      return;
    }

    const lecteur = new FileReader();

    lecteur.onload = (e) => {
      const contenu = e.target?.result;

      if (!contenu) {
        alert("Impossible de lire le fichier.");
        return;
      }

      const workbook = XLSX.read(contenu, {
        type: "array",
      });

      const feuilleJoueurs = workbook.Sheets["Joueurs"];
      const feuilleGardiens = workbook.Sheets["Gardiens"];
      const feuilleEquipes = workbook.Sheets["Equipes"];

      if (!feuilleJoueurs || !feuilleGardiens || !feuilleEquipes) {
        alert(
          "Le fichier doit contenir les feuilles Joueurs, Gardiens et Equipes."
        );
        return;
      }

      const joueursImportes: any[] =
        XLSX.utils.sheet_to_json(feuilleJoueurs);

      const gardiensImportes: any[] =
        XLSX.utils.sheet_to_json(feuilleGardiens);

      const equipesImportees: any[] =
        XLSX.utils.sheet_to_json(feuilleEquipes);

        const joueursNormalises = joueursImportes.map(
          (joueur, index) => ({
            id: index + 1,
            nhlId: lireNhlId(joueur),
            rang: Number(joueur.Rang),
            nom: String(joueur.Nom || ""),
            equipe: String(joueur.Equipe || ""),
            position: String(joueur.Position || ""),
            matchsPredits: Number(joueur.MJ || 0),
            butsPredits: Number(joueur.B || 0),
            assistancesPredites: Number(joueur.A || 0),
            pointsPredits: Number(joueur.PTS || 0),
            valeurMinimale: Number(
              joueur.ValeurMinimale || 0
            ),
            statut: "Disponible",
            selectionnePar: "",
            prixPaye: 0,
          })
        );

        const gardiensNormalises = gardiensImportes.map(
          (gardien, index) => {
            const victoiresPredites = Number(
              gardien.V || 0
            );
        
            const defaitesProlongationPredites = Number(
              gardien.DP || 0
            );
        
            const blanchissagesPredits = Number(
              gardien.BL || 0
            );
        
            const butsPredits = Number(
              gardien.B || 0
            );
        
            const assistancesPredites = Number(
              gardien.A || 0
            );
        
            const pointsPoolPredits =
              2 * victoiresPredites +
              defaitesProlongationPredites +
              3 * blanchissagesPredits +
              butsPredits +
              assistancesPredites;
        
            return {
              id: index + 1,
              nhlId: lireNhlId(gardien),
              rang: Number(gardien.Rang),
              nom: String(gardien.Nom || ""),
              equipe: String(gardien.Equipe || ""),
              matchsPredits: Number(gardien.MJ || 0),
              victoiresPredites,
              defaitesPredites: Number(
                gardien.D || 0
              ),
              defaitesProlongationPredites,
              blanchissagesPredits,
              butsPredits,
              assistancesPredites,
              pointsPoolPredits,
              pointsPredits: Number(
                gardien.PTS || pointsPoolPredits
              ),
              valeurMinimale: Number(
                gardien.ValeurMinimale || 0
              ),
              statut: "Disponible",
              selectionnePar: "",
              prixPaye: 0,
            };
          }
        );

        const equipesNormalisees = equipesImportees.map(
          (equipe, index) => ({
            id: index + 1,
            nhlId: lireNhlId(equipe),
            rang: Number(equipe.Rang),
            nom: String(equipe.Nom || ""),
            matchsPredits: Number(equipe.MJ || 0),
            victoiresPredites: Number(equipe.V || 0),
            defaitesPredites: Number(equipe.D || 0),
            defaitesProlongationPredites: Number(
              equipe.DP || 0
            ),
            pointsPredits: Number(
              equipe.PTS || 0
            ),
            valeurMinimale: Number(
              equipe.ValeurMinimale || 0
            ),
            statut: "Disponible",
            selectionnePar: "",
            prixPaye: 0,
          })
        );
        const choixSansNhlId = [
          ...joueursNormalises
            .filter((joueur) => !joueur.nhlId)
            .map((joueur) => joueur.nom),
        
          ...gardiensNormalises
            .filter((gardien) => !gardien.nhlId)
            .map((gardien) => gardien.nom),
        
          ...equipesNormalisees
            .filter((equipe) => !equipe.nhlId)
            .map((equipe) => equipe.nom),
        ];
        
        if (choixSansNhlId.length > 0) {
          const exempleNoms = choixSansNhlId
            .slice(0, 10)
            .join(", ");
        
          const confirmation = window.confirm(
            `${choixSansNhlId.length} choix n'ont pas de NHLId valide. Exemples : ${exempleNoms}. Voulez-vous quand même importer le fichier?`
          );
        
          if (!confirmation) {
            return;
          }
        }
        const joueursSansNhlId =
        joueursNormalises.filter(
          (joueur) => joueur.nhlId <= 0
        );
      
      const gardiensSansNhlId =
        gardiensNormalises.filter(
          (gardien) => gardien.nhlId <= 0
        );
      
      const equipesSansNhlId =
        equipesNormalisees.filter(
          (equipe) => equipe.nhlId <= 0
        );
      
      const nombreSansNhlId =
        joueursSansNhlId.length +
        gardiensSansNhlId.length +
        equipesSansNhlId.length;
      
      console.log("Validation des NHLId importés :", {
        joueursImportes: joueursNormalises.length,
        joueursAvecNhlId:
          joueursNormalises.length -
          joueursSansNhlId.length,
        gardiensImportes: gardiensNormalises.length,
        gardiensAvecNhlId:
          gardiensNormalises.length -
          gardiensSansNhlId.length,
        equipesImportees: equipesNormalisees.length,
        equipesAvecNhlId:
          equipesNormalisees.length -
          equipesSansNhlId.length,
      });
      
      if (nombreSansNhlId > 0) {
        const nomsSansNhlId = [
          ...joueursSansNhlId.map(
            (joueur) => joueur.nom
          ),
          ...gardiensSansNhlId.map(
            (gardien) => gardien.nom
          ),
          ...equipesSansNhlId.map(
            (equipe) => equipe.nom
          ),
        ];
      
        const exemples = nomsSansNhlId
          .slice(0, 10)
          .join(", ");
      
        const confirmation = window.confirm(
          `${nombreSansNhlId} choix n'ont pas de NHLId valide. Exemples : ${exemples}. Voulez-vous quand même continuer l'import?`
        );
      
        if (!confirmation) {
          return;
        }
      }

      console.log(
        "Exemples de joueurs normalisés :",
        joueursNormalises.slice(0, 5).map(
          (joueur) => ({
            nom: joueur.nom,
            nhlId: joueur.nhlId,
          })
        )
      );
      
      console.log(
        "Exemples de gardiens normalisés :",
        gardiensNormalises.slice(0, 5).map(
          (gardien) => ({
            nom: gardien.nom,
            nhlId: gardien.nhlId,
          })
        )
      );
      
      console.log(
        "Exemples d'équipes normalisées :",
        equipesNormalisees.slice(0, 5).map(
          (equipe) => ({
            nom: equipe.nom,
            nhlId: equipe.nhlId,
          })
        )
      );

      onImporterListesExcel({
        joueurs: joueursNormalises,
        gardiens: gardiensNormalises,
        equipes: equipesNormalisees,
      });

      event.target.value = "";
    };

    lecteur.readAsArrayBuffer(fichier);
  }

  function confirmerAnnulationEnchere() {
    const confirmation = window.confirm(
      "Voulez-vous vraiment annuler cette enchère? Aucun choix ne sera attribué."
    );

    if (confirmation) {
      onAnnulerEnchereActive();
    }
  }

  function confirmerAnnulationDerniereAttribution() {
    const confirmation = window.confirm(
      "Voulez-vous vraiment annuler la dernière attribution? Le choix sera retiré de l'équipe et le DG sera remboursé."
    );

    if (confirmation) {
      onAnnulerDerniereAttribution();
    }
  }

  function ajouterNouveauDG() {
    const nomNettoye = nouveauNomDG.trim();

    if (!nomNettoye) {
      alert("Veuillez entrer un nom de DG.");
      return;
    }

    onAjouterDG(nomNettoye);
    setNouveauNomDG("");
  }

  async function importerDonneesNhlJson(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const fichier = event.target.files?.[0];
  
    if (!fichier) {
      return;
    }
  
    if (!fichier.name.toLowerCase().endsWith(".json")) {
      alert(
        "Veuillez sélectionner un fichier JSON."
      );
  
      event.target.value = "";
      return;
    }
  
    try {
      const contenu = await fichier.text();
      const donnees = JSON.parse(contenu);
  
      if (!Array.isArray(donnees)) {
        alert(
          "Le fichier JSON doit contenir un tableau de profils NHL."
        );
  
        event.target.value = "";
        return;
      }
  
      if (donnees.length === 0) {
        alert(
          "Le fichier JSON ne contient aucun profil."
        );
  
        event.target.value = "";
        return;
      }
  
      const importReussi =
        await onImporterDonneesNhl(donnees);
  
      if (importReussi) {
        event.target.value = "";
      }
    } catch (error) {
      console.error(
        "Erreur de lecture du fichier NHL :",
        error
      );
  
      alert(
        "Le fichier JSON est invalide ou impossible à lire."
      );
  
      event.target.value = "";
    }
  }

  return (
    <div className="admin-page">
      <h1>Interface Organisateur</h1>

      <section className="admin-status-bar">
        <div className="admin-status-item">
          <span>État du pool</span>
          <strong>
            {enchereActive
              ? "Enchère active"
              : propositionEnAttente
              ? "Proposition en attente"
              : "Entre deux enchères"}
          </strong>
        </div>

        <div className="admin-status-item">
          <span>DG actifs</span>
          <strong>
            {nombreDGActifs} / {dgs.length}
          </strong>
        </div>

        <div className="admin-status-item">
          <span>Choix attribués</span>
          <strong>{historiqueAttributions.length}</strong>
        </div>

        <div className="admin-status-item">
          <span>Prochain DG</span>
          <strong>{prochainDG?.nom || "Aucun"}</strong>
        </div>
      </section>

      <nav className="admin-tabs">
        <button
          className={ongletAdmin === "enchere" ? "admin-tab-active" : ""}
          onClick={() => setOngletAdmin("enchere")}
        >
          Enchère
        </button>

        <button
          className={ongletAdmin === "dgs" ? "admin-tab-active" : ""}
          onClick={() => setOngletAdmin("dgs")}
        >
          DG et ordre
        </button>
        {dgs.length === 0 && (
  <div className="admin-empty-state">
    <h3>Aucun DG inscrit</h3>

    <p>
      Les participants peuvent créer leur DG avec le lien DG,
      ou l'organisateur peut ajouter son propre DG ci-dessous.
    </p>
  </div>
)}



        <button
          className={ongletAdmin === "donnees" ? "admin-tab-active" : ""}
          onClick={() => setOngletAdmin("donnees")}
        >
          Données
        </button>

        <button
          className={
            ongletAdmin === "historique" ? "admin-tab-active" : ""
          }
          onClick={() => setOngletAdmin("historique")}
        >
          Historique
        </button>

        <button
          className={
            ongletAdmin === "parametres" ? "admin-tab-active" : ""
          }
          onClick={() => setOngletAdmin("parametres")}
        >
          Paramètres
        </button>
      </nav>

      {ongletAdmin === "enchere" && (
        <div className="admin-tab-content">
          <section className="next-dg-admin-card">
            <span>Prochain DG à proposer un choix</span>
            <strong>{prochainDG?.nom || "Aucun DG"}</strong>
          </section>

          {propositionEnAttente && (
            <section className="admin-proposal-card">
              <div className="admin-card-heading">
                <div>
                  <span className="admin-warning-pill">
                    Approbation requise
                  </span>

                  <h2>Proposition en attente</h2>
                </div>
              </div>

              <div className="admin-info-grid">
                <div>
                  <span>DG proposeur</span>
                  <strong>{propositionEnAttente.dgNom}</strong>
                </div>

                <div>
                  <span>Choix</span>
                  <strong>{propositionEnAttente.nom}</strong>
                </div>

                <div>
                  <span>Type</span>
                  <strong>{propositionEnAttente.type}</strong>
                </div>

                <div>
                  <span>Équipe</span>
                  <strong>
                    {propositionEnAttente.equipe || "N/A"}
                  </strong>
                </div>

                <div>
                  <span>Rang</span>
                  <strong>{propositionEnAttente.rang}</strong>
                </div>

                <div>
                  <span>Mise de départ</span>
                  <strong>
                    {propositionEnAttente.miseDepart} $
                  </strong>
                </div>
              </div>

              <div className="proposal-actions">
                <button
                  className="confirm-button"
                  onClick={onApprouverProposition}
                >
                  Approuver et lancer l'enchère
                </button>

                <button
                  className="secondary-button"
                  onClick={onRefuserProposition}
                >
                  Refuser la proposition
                </button>
              </div>
            </section>
          )}

          {!propositionEnAttente && !enchereActive && (
            <section className="admin-empty-state">
              <h2>Aucune enchère active</h2>

              <p>
                En attente d’une proposition du prochain DG.
              </p>

              <button onClick={onAfficherEntreDeuxEncheres}>
                Afficher l’écran entre deux enchères
              </button>
            </section>
          )}

          {enchereActive && (
            <section className="admin-auction-card">
              <div className="admin-card-heading">
                <div>
                  <span className="admin-live-pill">
                    Enchère en cours
                  </span>

                  <h2>{enchereActive.nom}</h2>
                </div>

                <span className="admin-auction-type">
                  {enchereActive.type}
                </span>
              </div>

              <div className="admin-auction-layout">
                <div className="admin-info-grid">
                  <div>
                    <span>Équipe</span>
                    <strong>{enchereActive.equipe || "N/A"}</strong>
                  </div>

                  <div>
                    <span>Rang</span>
                    <strong>{enchereActive.rang}</strong>
                  </div>

                  <div>
                    <span>DG proposeur</span>
                    <strong>{enchereActive.dgProposeurNom}</strong>
                  </div>

                  <div>
                    <span>DG meneur</span>
                    <strong>{enchereActive.dgMeneurNom}</strong>
                  </div>
                </div>

                <div className="admin-current-bid">
                  <span>Mise actuelle</span>
                  <strong>{enchereActive.miseActuelle} $</strong>

                  {compteRebours !== null && (
                    <p className="countdown-admin">
                      {compteRebours === 0
                        ? "Mises fermées"
                        : `Décompte : ${compteRebours}`}
                    </p>
                  )}
                </div>
              </div>

              <div className="admin-primary-controls">
                {!misesFermees && (
                  <>
                    <button
                      className="countdown-button"
                      onClick={onDemarrerCompteRebours}
                      disabled={compteRebours !== null}
                    >
                      Démarrer le compte à rebours
                    </button>

                    <button
                      className="secondary-button"
                      onClick={onAnnulerCompteRebours}
                      disabled={compteRebours === null}
                    >
                      Annuler le décompte
                    </button>

                    <button
                      className="close-bids-button"
                      onClick={onFermerMisesImmediatement}
                    >
                      Fermer les mises maintenant
                    </button>
                  </>
                )}

                {misesFermees && (
                  <>
                    <button
                      className="confirm-button"
                      onClick={onAttribuerChoixAuGagnant}
                    >
                      Attribuer le choix au gagnant
                    </button>

                    <button
                      className="reopen-auction-button"
                      onClick={onReouvrirEnchere}
                    >
                      Réouvrir l'enchère
                    </button>
                  </>
                )}
              </div>

              {misesFermees && (
                <div className="winner-ready">
                  Les mises sont fermées. Le choix peut être attribué à{" "}
                  <strong>{enchereActive.dgMeneurNom}</strong>, ou l'enchère
                  peut être réouverte en conservant la mise actuelle.
                </div>
              )}

              <div className="admin-danger-zone">
                <div>
                  <strong>Annulation de l’enchère</strong>

                  <p>
                    Cette action ferme l’enchère sans attribuer le choix.
                  </p>
                </div>

                <button
                  className="danger-button"
                  onClick={confirmerAnnulationEnchere}
                >
                  Annuler l'enchère
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      {ongletAdmin === "dgs" && (
        <div className="admin-tab-content">
          <section>
            <div className="admin-section-heading">
              <div>
                <h2>Ordre de repêchage</h2>
                <p>
                  Le premier DG de la liste est celui qui commence.
                </p>
              </div>

              <button onClick={onTirerOrdreAleatoire}>
                Tirer l'ordre aléatoirement
              </button>
            </div>

            <ol className="draft-order-list admin-draft-order">
              {ordreDGIds.map((dgId, index) => {
                const dg = dgs.find((item) => item.id === dgId);
                const estProchainDG = dg?.id === prochainDG?.id;

                return (
                  <li
                    key={dgId}
                    className={
                      estProchainDG ? "admin-current-dg-order" : ""
                    }
                  >
                    <span>{index + 1}</span>

                    <strong>{dg?.nom || "DG inconnu"}</strong>

                    {estProchainDG && (
                      <em>À son tour</em>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>

          <section>
            <h2>Ajouter un DG</h2>

            <div className="admin-inline-form">
              <input
                type="text"
                value={nouveauNomDG}
                onChange={(e) => setNouveauNomDG(e.target.value)}
                className="form-control"
                placeholder="Nom du nouveau DG"
              />

              <button onClick={ajouterNouveauDG}>
                Ajouter le DG
              </button>
            </div>

            <p className="admin-help-text">
              Un DG ajouté par l’organisateur reçoit temporairement le PIN
              0000.
            </p>
          </section>

          <section>
            <h2>Liste des DG</h2>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>DG</th>
                    <th>Budget restant</th>
                    <th>Statut</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {dgs.map((dg) => {
                    const estActif = dg.budgetRestant > 0;

                    return (
                      <tr key={dg.id}>
                        <td>
                          <strong>{dg.nom}</strong>
                        </td>

                        <td>{dg.budgetRestant} $</td>

                        <td>
                          {estActif ? (
                            <span className="status-active">Actif</span>
                          ) : (
                            <span className="status-finished">
                              Terminé
                            </span>
                          )}
                        </td>

                        <td>
                          <button
                            className="danger-button compact-button"
                            onClick={() => onSupprimerDG(dg.id)}
                          >
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {ongletAdmin === "donnees" && (
        <div className="admin-tab-content">
          <section>
            <h2>Import Excel des listes de prédiction</h2>

            <p>
              Le fichier doit contenir les feuilles Joueurs, Gardiens et
              Equipes.
            </p>

            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importerFichierExcel}
              className="form-control"
            />
          </section>

          <section>
  <h2>Données historiques NHL</h2>

  <p>
    Importer les profils enrichis contenant les portraits,
    les couleurs d'équipe, les statistiques de carrière et
    les cinq dernières saisons.
  </p>

  <input
    type="file"
    accept=".json,application/json"
    onChange={importerDonneesNhlJson}
    className="form-control"
  />

  <p className="admin-help-text">
    Le fichier doit contenir un tableau JSON. Les profils
    existants seront mis à jour selon le type de choix et le
    NHLId.
  </p>
</section>

          <section>
            <h2>Export des résultats</h2>

            <p>
              Exporter les équipes actuelles dans un fichier CSV compatible
              avec Excel.
            </p>

            <button
              className="confirm-button"
              onClick={onExporterEquipesCSV}
            >
              Exporter les équipes en CSV
            </button>
          </section>

          <section className="admin-data-info">
            <h2>État des données</h2>

            <div className="admin-info-grid">
              <div>
                <span>DG inscrits</span>
                <strong>{dgs.length}</strong>
              </div>

              <div>
                <span>Choix attribués</span>
                <strong>{historiqueAttributions.length}</strong>
              </div>

              <div>
                <span>Sauvegarde</span>
                <strong>Automatique</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {ongletAdmin === "historique" && (
        <div className="admin-tab-content">
          <section>
            <div className="admin-section-heading">
              <div>
                <h2>Historique des attributions</h2>

                <p>
                  Recherchez une attribution ou annulez une attribution
                  précise.
                </p>
              </div>

              <span className="admin-count-pill">
                {historiqueFiltre.length} résultat
                {historiqueFiltre.length > 1 ? "s" : ""}
              </span>
            </div>

            <input
              type="text"
              value={rechercheHistorique}
              onChange={(e) => setRechercheHistorique(e.target.value)}
              className="search-input"
              placeholder="Rechercher un choix, un DG, un type ou une équipe..."
            />

            {historiqueAttributions.length === 0 && (
              <div className="admin-empty-state">
                <p>Aucun choix attribué pour le moment.</p>
              </div>
            )}

            {historiqueAttributions.length > 0 &&
              historiqueFiltre.length === 0 && (
                <div className="admin-empty-state">
                  <p>Aucune attribution ne correspond à la recherche.</p>
                </div>
              )}

            {historiqueFiltre.length > 0 && (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Choix</th>
                      <th>Type</th>
                      <th>Équipe</th>
                      <th>Gagnant</th>
                      <th>Prix</th>
                      <th>Proposé par</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {historiqueFiltre.map((attribution) => {
                      const indexOriginal =
                        historiqueAttributions.findIndex(
                          (item) =>
                            item.choixId === attribution.choixId
                        );

                      const estDerniereAttribution =
                        indexOriginal ===
                        historiqueAttributions.length - 1;

                      return (
                        <tr
                          key={`${attribution.choixId}-${indexOriginal}`}
                          className={
                            estDerniereAttribution
                              ? "latest-attribution-row"
                              : ""
                          }
                        >
                          <td>{indexOriginal + 1}</td>
                          <td>
                            <strong>{attribution.nom}</strong>

                            {estDerniereAttribution && (
                              <span className="latest-attribution-label">
                                Dernière
                              </span>
                            )}
                          </td>

                          <td>{attribution.type}</td>
                          <td>{attribution.equipe || "N/A"}</td>
                          <td>{attribution.gagnantNom}</td>
                          <td>{attribution.prixFinal} $</td>
                          <td>{attribution.dgProposeurNom}</td>

                          <td>
                            <button
                              className="danger-button compact-button"
                              onClick={() =>
                                onAnnulerAttributionHistorique(
                                  attribution
                                )
                              }
                            >
                              Annuler
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2>Correction rapide</h2>

            {!derniereAttributionAnnulable && (
              <p>Aucune attribution récente à annuler.</p>
            )}

            {derniereAttributionAnnulable && (
              <div className="admin-correction-card">
                <div>
                  <span>Dernière attribution</span>

                  <strong>
                    {derniereAttributionAnnulable.gagnantNom}
                  </strong>

                  <p>
                    Prix payé :{" "}
                    {derniereAttributionAnnulable.prixFinal} $
                  </p>
                </div>

                <button
                  className="danger-button"
                  onClick={
                    confirmerAnnulationDerniereAttribution
                  }
                >
                  Annuler la dernière attribution
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {ongletAdmin === "parametres" && (
        <div className="admin-tab-content">
          <section>
            <h2>Sauvegarde locale</h2>

            <div className="admin-success-card">
              <strong>Sauvegarde automatique active</strong>

              <p>
                Les DG, les équipes, l’ordre, l’historique et les listes
                importées sont sauvegardés dans ce navigateur.
              </p>
            </div>
          </section>

          <section className="admin-danger-settings">
            <h2>Zone de réinitialisation</h2>

            <p>
              La réinitialisation efface les données sauvegardées du
              repêchage dans ce navigateur.
            </p>

            <button
              className="danger-button"
              onClick={onReinitialiserSauvegarde}
            >
              Réinitialiser toute la sauvegarde
            </button>
          </section>
        </div>
      )}
    </div>
  );
}