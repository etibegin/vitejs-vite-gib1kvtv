import { useEffect, useState } from "react";

type DGProps = {
  dg: any;
  equipeDG: any[];
  pointsProjetesEquipe: number;
  choixSelectionnes: any[];
  estTourDuDG: boolean;
  propositionEnAttente: any;
  joueurs: any[];
  gardiens: any[];
  equipesPool: any[];
  onPropositionSubmit: (proposition: any) => void;
  enchereActive: any;
  compteRebours: number | null;
  onPlacerMise: (dg: any, montant: number) => void;
  onDeconnexion: () => void;
};

const EMPLACEMENTS_EQUIPE = [
  "Équipe",
  "Gardien",
  "Défenseur 1",
  "Défenseur 2",
  "Attaquant 1",
  "Attaquant 2",
  "Attaquant 3",
  "Attaquant 4",
  "Attaquant 5",
  "Attaquant 6",
  "Attaquant 7",
  "Attaquant 8",
  "Substitut 1",
  "Substitut 2",
  "Substitut 3",
  "Substitut 4",
];

const JOUEURS_PAR_PAGE = 50;
type ModeAffichageListes = "telephone" | "ordinateur";

export default function DG({
  dg,
  equipeDG,
  pointsProjetesEquipe,
  choixSelectionnes,
  estTourDuDG,
  propositionEnAttente,
  joueurs,
  gardiens,
  equipesPool,
  onPropositionSubmit,
  enchereActive,
  compteRebours,
  onPlacerMise,
  onDeconnexion,
}: DGProps) {
  const [onglet, setOnglet] = useState("joueurs");
  const [rechercheJoueur, setRechercheJoueur] = useState("");
  const [rechercheGardien, setRechercheGardien] = useState("");
  const [rechercheEquipe, setRechercheEquipe] = useState("");
  const [joueursDisponiblesSeulement, setJoueursDisponiblesSeulement] = useState(false);
  const [gardiensDisponiblesSeulement, setGardiensDisponiblesSeulement] = useState(false);
  const [equipesDisponiblesSeulement, setEquipesDisponiblesSeulement] = useState(false);
  const [pageJoueurs, setPageJoueurs] = useState(1);
  const [choixEnPreparation, setChoixEnPreparation] = useState<any>(null);
  const [miseDepart, setMiseDepart] = useState("");
  const [misePersonnalisee, setMisePersonnalisee] = useState("");
  const [modeAffichageListes, setModeAffichageListes] =
    useState<ModeAffichageListes>(() => {
      const modeMemorise = localStorage.getItem("poolHockeyModeListesDG");

      if (modeMemorise === "telephone" || modeMemorise === "ordinateur") {
        return modeMemorise;
      }

      return window.innerWidth <= 700 ? "telephone" : "ordinateur";
    });

  function obtenirSelectionChoix(choixId: string) {
    return choixSelectionnes.find((choix) => choix.choixId === choixId);
  }

  const joueursFiltres = joueurs.filter((joueur) => {
    const recherche = rechercheJoueur.trim().toLowerCase();
    const selection = obtenirSelectionChoix(`joueur-${joueur.id}`);
    const correspondRecherche =
      String(joueur.nom || "").toLowerCase().includes(recherche) ||
      String(joueur.equipe || "").toLowerCase().includes(recherche) ||
      String(joueur.position || "").toLowerCase().includes(recherche);
    const estDisponible = !selection && joueur.statut === "Disponible";
    return correspondRecherche && (!joueursDisponiblesSeulement || estDisponible);
  });

  const nombrePagesJoueurs = Math.max(1, Math.ceil(joueursFiltres.length / JOUEURS_PAR_PAGE));
  const joueursPageCourante = joueursFiltres.slice(
    (pageJoueurs - 1) * JOUEURS_PAR_PAGE,
    pageJoueurs * JOUEURS_PAR_PAGE
  );

  useEffect(() => {
    setPageJoueurs(1);
  }, [rechercheJoueur, joueursDisponiblesSeulement]);

  useEffect(() => {
    if (pageJoueurs > nombrePagesJoueurs) {
      setPageJoueurs(nombrePagesJoueurs);
    }
  }, [pageJoueurs, nombrePagesJoueurs]);

  const gardiensFiltres = gardiens.filter((gardien) => {
    const recherche = rechercheGardien.trim().toLowerCase();
    const selection = obtenirSelectionChoix(`gardien-${gardien.id}`);
    const correspondRecherche =
      String(gardien.nom || "").toLowerCase().includes(recherche) ||
      String(gardien.equipe || "").toLowerCase().includes(recherche);
    const estDisponible = !selection && gardien.statut === "Disponible";
    return correspondRecherche && (!gardiensDisponiblesSeulement || estDisponible);
  });

  const equipesFiltrees = equipesPool.filter((equipe) => {
    const recherche = rechercheEquipe.trim().toLowerCase();
    const selection = obtenirSelectionChoix(`equipe-${equipe.id}`);
    const correspondRecherche = String(equipe.nom || "").toLowerCase().includes(recherche);
    const estDisponible = !selection && equipe.statut === "Disponible";
    return correspondRecherche && (!equipesDisponiblesSeulement || estDisponible);
  });

  const lignesEquipe = EMPLACEMENTS_EQUIPE.map((poste) => {
    const choix = equipeDG.find((item) => item.poste === poste);
    return {
      poste,
      type: choix?.type || "",
      nom: choix?.nom || "",
      equipe: choix?.equipe || "",
      prixPaye: choix?.prixPaye || "",
    };
  });

  const nbAttaquants = lignesEquipe.filter((ligne) => ligne.poste.startsWith("Attaquant") && ligne.nom).length;
  const nbDefenseurs = lignesEquipe.filter((ligne) => ligne.poste.startsWith("Défenseur") && ligne.nom).length;
  const nbGardien = lignesEquipe.filter((ligne) => ligne.poste === "Gardien" && ligne.nom).length;
  const nbEquipe = lignesEquipe.filter((ligne) => ligne.poste === "Équipe" && ligne.nom).length;
  const nbSubstituts = lignesEquipe.filter((ligne) => ligne.poste.startsWith("Substitut") && ligne.nom).length;

  const estDgTermine = dg.budgetRestant <= 0 || equipeDG.length >= 16;
  const enchereEstTerminee =
    enchereActive?.misesFermees === true ||
    compteRebours === 0;
  const dgEstMeneur = enchereActive?.dgMeneurId === dg.id;
  const peutMiser = Boolean(enchereActive) && !enchereEstTerminee && !dgEstMeneur && !estDgTermine;
  const peutProposer = estTourDuDG && !estDgTermine && !enchereActive && !propositionEnAttente;

  function peutAccueillirChoix(type: string) {
    const posteEstOccupe = (poste: string) => equipeDG.some((item) => item.poste === poste);
    if (equipeDG.length >= 16) return false;
    if (type === "Équipe" && !posteEstOccupe("Équipe")) return true;
    if (type === "Gardien" && !posteEstOccupe("Gardien")) return true;
    if (type === "Défenseur" && (!posteEstOccupe("Défenseur 1") || !posteEstOccupe("Défenseur 2"))) return true;
    if (type === "Attaquant") {
      for (let i = 1; i <= 8; i += 1) {
        if (!posteEstOccupe(`Attaquant ${i}`)) return true;
      }
    }
    for (let i = 1; i <= 4; i += 1) {
      if (!posteEstOccupe(`Substitut ${i}`)) return true;
    }
    return false;
  }

  function choisirDepuisListe(choix: any) {
    if (!peutProposer) return alert("Vous ne pouvez pas proposer un choix pour le moment.");
    if (obtenirSelectionChoix(choix.id)) return alert("Ce choix a déjà été sélectionné.");
    if (choix.statut !== "Disponible") return alert("Ce choix n'est plus disponible.");
    if (!peutAccueillirChoix(choix.type)) {
      return alert("Vous ne pouvez pas proposer ce choix, car vous ne pourriez pas l'accueillir dans votre équipe si vous le remportez.");
    }
    setChoixEnPreparation(choix);
    setMiseDepart(String(choix.valeurMinimale));
  }

  function confirmerProposition() {
    if (!peutProposer) return alert("Vous ne pouvez pas proposer un choix pour le moment.");
    if (!choixEnPreparation) return alert("Aucun choix sélectionné.");
    const montant = Number(miseDepart);
    if (!montant) return alert("Veuillez entrer une mise de départ.");
    if (montant < choixEnPreparation.valeurMinimale) {
      return alert(`La mise de départ doit être d'au moins ${choixEnPreparation.valeurMinimale} $.`);
    }
    if (montant % 5 !== 0) return alert("La mise de départ doit être un multiple de 5 $.");

    onPropositionSubmit({
      dgId: dg.id,
      dgNom: dg.nom,
      choixId: choixEnPreparation.id,
      nhlId: Number(choixEnPreparation.nhlId || 0),
      nom: choixEnPreparation.nom,
      type: choixEnPreparation.type,
      equipe: choixEnPreparation.equipe,
      rang: Number(choixEnPreparation.rang || 0),
      valeurMinimale: Number(choixEnPreparation.valeurMinimale || 0),
      matchsPredits: Number(choixEnPreparation.matchsPredits || 0),
      butsPredits: Number(choixEnPreparation.butsPredits || 0),
      assistancesPredites: Number(choixEnPreparation.assistancesPredites || 0),
      pointsPredits: Number(choixEnPreparation.pointsPredits || 0),
      pointsPoolPredits: Number(choixEnPreparation.pointsPoolPredits || 0),
      victoiresPredites: Number(choixEnPreparation.victoiresPredites || 0),
      defaitesPredites: Number(choixEnPreparation.defaitesPredites || 0),
      defaitesProlongationPredites: Number(choixEnPreparation.defaitesProlongationPredites || 0),
      blanchissagesPredits: Number(choixEnPreparation.blanchissagesPredits || 0),
      miseDepart: montant,
    });
    setChoixEnPreparation(null);
    setMiseDepart("");
  }

  function miserPlusCinq() {
    if (!peutMiser) return;
    onPlacerMise(dg, Number(enchereActive.miseActuelle) + 5);
  }

  function miserMontantPersonnalise() {
    if (!peutMiser) return;
    const montant = Number(misePersonnalisee);
    if (!montant) return alert("Veuillez entrer une mise.");
    onPlacerMise(dg, montant);
    setMisePersonnalisee("");
  }

  function confirmerDeconnexion() {
    if (window.confirm("Voulez-vous vraiment vous déconnecter de ce DG?")) {
      onDeconnexion();
    }
  }

  function changerModeAffichageListes(
    nouveauMode: ModeAffichageListes
  ) {
    setModeAffichageListes(nouveauMode);
    localStorage.setItem("poolHockeyModeListesDG", nouveauMode);
  }

  return (
    <div className={`dg-interface dg-list-mode-${modeAffichageListes}`}>
      <header className="dg-account-header">
        <div>
          <span className="dg-account-label">DG connecté</span>
          <h1>{dg.nom}</h1>
        </div>
        <button type="button" className="dg-logout-button" onClick={confirmerDeconnexion}>
          Déconnexion
        </button>
      </header>

      {enchereActive && (
        <section className="mobile-auction-box auction-priority">
          <div className="auction-topline">
            <span className="auction-live-pill">Enchère en cours</span>
            <span className="auction-type-pill">{enchereActive.type}</span>
            {dgEstMeneur && <span className="leading-bid-pill">Vous êtes meneur</span>}
          </div>
          <h2 className="auction-player-name">{enchereActive.nom}</h2>
          <div className="auction-details-grid">
            <div><span>Équipe</span><strong>{enchereActive.equipe || "N/A"}</strong></div>
            <div><span>Rang</span><strong>{enchereActive.rang}</strong></div>
            <div><span>Meneur</span><strong>{enchereActive.dgMeneurNom}</strong></div>
            <div><span>Budget</span><strong>{dg.budgetRestant} $</strong></div>
          </div>
          <div className="current-bid-panel"><span>Mise actuelle</span><strong>{enchereActive.miseActuelle} $</strong></div>
          {enchereEstTerminee ? (
            <p className="countdown-mobile">MISES FERMÉES</p>
          ) : compteRebours !== null ? (
            <p className="countdown-mobile">
              Compte à rebours : {compteRebours}
            </p>
          ) : null}
          {enchereEstTerminee && (
            <div className="auction-closed-message"><strong>Mises fermées</strong><span>L'organisateur peut attribuer le choix ou réouvrir l'enchère.</span></div>
          )}
          {!enchereEstTerminee && dgEstMeneur && (
            <div className="current-leader-message"><strong>Vous êtes actuellement le meneur.</strong><span>Vous ne pouvez pas augmenter votre propre mise.</span></div>
          )}
          {peutMiser && (
            <div className="bid-actions new-bid-layout sticky-bid-actions">
              <button className="primary-bid-button" onClick={miserPlusCinq}>+5 $</button>
              <div className="custom-bid-area">
                <input type="number" value={misePersonnalisee} onChange={(e) => setMisePersonnalisee(e.target.value)} className="bid-input" placeholder="Entrer une mise" />
                <button onClick={miserMontantPersonnalise}>Miser</button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="dg-status-strip">
        <div className="dg-status-item"><span>Budget</span><strong>{dg.budgetRestant} $</strong></div>
        <div className="dg-status-item dg-projected-points-item"><span>Pts proj.</span><strong>{pointsProjetesEquipe.toLocaleString("fr-CA")}</strong></div>
        <div className="dg-status-item"><span>Att.</span><strong>{nbAttaquants} / 8</strong></div>
        <div className="dg-status-item"><span>Déf.</span><strong>{nbDefenseurs} / 2</strong></div>
        <div className="dg-status-item"><span>Gar.</span><strong>{nbGardien} / 1</strong></div>
        <div className="dg-status-item"><span>Équipe</span><strong>{nbEquipe} / 1</strong></div>
        <div className="dg-status-item"><span>Subs</span><strong>{nbSubstituts} / 4</strong></div>
        {peutProposer && <div className="dg-turn-pill">À votre tour</div>}
      </section>

      {estTourDuDG && propositionEnAttente && !enchereActive && (
        <section className="pending-box"><strong>Votre proposition est en attente d'approbation.</strong><p>L'organisateur doit approuver ou refuser la proposition avant de poursuivre.</p></section>
      )}
      {estDgTermine && (
        <section className="finished-box"><strong>Votre équipe est terminée.</strong><p>Vous ne pouvez plus proposer de choix ni miser.</p></section>
      )}

      <section className="dg-list-display-control">
        <div>
          <span>Affichage des listes</span>
          <strong>
            {modeAffichageListes === "telephone"
              ? "Mode téléphone"
              : "Mode ordinateur"}
          </strong>
        </div>

        <div className="dg-list-display-buttons">
          <button
            type="button"
            className={
              modeAffichageListes === "telephone"
                ? "dg-list-display-active"
                : ""
            }
            onClick={() => changerModeAffichageListes("telephone")}
          >
            Téléphone
          </button>

          <button
            type="button"
            className={
              modeAffichageListes === "ordinateur"
                ? "dg-list-display-active"
                : ""
            }
            onClick={() => changerModeAffichageListes("ordinateur")}
          >
            Ordinateur
          </button>
        </div>
      </section>

      <div className="tabs">
        <button onClick={() => setOnglet("equipe")}>Mon équipe</button>
        <button onClick={() => setOnglet("joueurs")}>Joueurs</button>
        <button onClick={() => setOnglet("gardiens")}>Gardiens</button>
        <button onClick={() => setOnglet("equipes")}>Équipes</button>
      </div>

      <section>
        {onglet === "equipe" && (
          <>
            <h3>Équipe du DG - {dg.nom}</h3>
            <p className="budget">Argent restant : {dg.budgetRestant} $</p>
            <div className="table-container dg-team-table">
              <table><thead><tr><th>Poste</th><th>Type</th><th>Nom</th><th>Équipe</th><th>Prix payé</th></tr></thead>
                <tbody>{lignesEquipe.map((ligne) => (
                  <tr key={ligne.poste} className={ligne.nom === "" ? "empty-row" : ""}>
                    <td>{ligne.poste}</td><td>{ligne.type}</td><td>{ligne.nom}</td><td>{ligne.equipe}</td><td>{ligne.prixPaye ? `${ligne.prixPaye} $` : ""}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>
        )}

        {onglet === "joueurs" && (
          <>
            <h3>Liste de prédiction - Joueurs</h3>
            <input type="text" placeholder="Rechercher un joueur..." value={rechercheJoueur} onChange={(e) => setRechercheJoueur(e.target.value)} className="search-input" />
            <div className="list-filter-bar"><label className="availability-filter"><input type="checkbox" checked={joueursDisponiblesSeulement} onChange={(e) => setJoueursDisponiblesSeulement(e.target.checked)} /><span>Afficher les joueurs disponibles seulement</span></label></div>
            <div className="pagination-bar">
              <button onClick={() => setPageJoueurs((p) => Math.max(1, p - 1))} disabled={pageJoueurs === 1}>Précédent</button>
              <label className="page-selector"><span>Page</span><select value={pageJoueurs} onChange={(e) => setPageJoueurs(Number(e.target.value))}>{Array.from({ length: nombrePagesJoueurs }, (_, i) => i + 1).map((p) => <option key={p} value={p}>{p}</option>)}</select><span>sur {nombrePagesJoueurs}</span></label>
              <span className="pagination-result-count">{joueursFiltres.length} joueur{joueursFiltres.length > 1 ? "s" : ""} trouvé{joueursFiltres.length > 1 ? "s" : ""}</span>
              <button onClick={() => setPageJoueurs((p) => Math.min(nombrePagesJoueurs, p + 1))} disabled={pageJoueurs === nombrePagesJoueurs}>Suivant</button>
            </div>
            <div className="table-container dg-players-table"><table><thead><tr><th>Rang</th><th>Nom</th><th>Équipe</th><th>Pos</th><th>MJ</th><th>B</th><th>A</th><th>PTS</th><th>Min</th><th>Statut</th>{peutProposer && <th>Action</th>}</tr></thead>
              <tbody>{joueursPageCourante.map((joueur) => {
                const choixId = `joueur-${joueur.id}`;
                const selection = obtenirSelectionChoix(choixId);
                return <tr
                        key={joueur.id}
                        className={joueur.blesse === true ? "prediction-injured-row" : ""}
                      >
                        <td>{joueur.rang}</td>
                        <td>
                          <div className="prediction-name-cell">
                            <span>{joueur.nom}</span>
                            {joueur.blesse === true && (
                              <span className="prediction-injury-badge">Blessé</span>
                            )}
                          </div>
                        </td>
                        <td>{joueur.equipe}</td><td>{joueur.position}</td><td>{joueur.matchsPredits}</td><td>{joueur.butsPredits}</td><td>{joueur.assistancesPredites}</td><td>{joueur.pointsPredits}</td><td>{joueur.valeurMinimale} $</td><td>{selection ? `${selection.selectionnePar} - ${selection.prixPaye} $` : joueur.statut === "Sélectionné" ? `${joueur.selectionnePar} - ${joueur.prixPaye} $` : joueur.statut}</td>{peutProposer && <td>{!selection && joueur.statut === "Disponible" && <button className="small-button" onClick={() => choisirDepuisListe({ id: choixId, nhlId: Number(joueur.nhlId || 0), type: joueur.position === "D" ? "Défenseur" : "Attaquant", nom: joueur.nom, equipe: joueur.equipe, rang: Number(joueur.rang || 0), valeurMinimale: Number(joueur.valeurMinimale || 0), matchsPredits: Number(joueur.matchsPredits || 0), butsPredits: Number(joueur.butsPredits || 0), assistancesPredites: Number(joueur.assistancesPredites || 0), pointsPredits: Number(joueur.pointsPredits || 0), statut: joueur.statut })}>Choisir</button>}</td>}</tr>;
              })}</tbody>
            </table></div>
          </>
        )}

        {onglet === "gardiens" && (
          <><h3>Liste des gardiens</h3><input type="text" placeholder="Rechercher un gardien..." value={rechercheGardien} onChange={(e) => setRechercheGardien(e.target.value)} className="search-input" />
            <div className="list-filter-bar"><label className="availability-filter"><input type="checkbox" checked={gardiensDisponiblesSeulement} onChange={(e) => setGardiensDisponiblesSeulement(e.target.checked)} /><span>Afficher les gardiens disponibles seulement</span></label><span className="filter-result-count">{gardiensFiltres.length} gardien{gardiensFiltres.length > 1 ? "s" : ""}</span></div>
            <div className="table-container dg-goalies-table"><table><thead><tr><th>Rang</th><th>Nom</th><th>Équipe</th><th>MJ</th><th>V</th><th>D</th><th>DP</th><th>BL</th><th>PTS</th><th>Min</th><th>Statut</th>{peutProposer && <th>Action</th>}</tr></thead>
              <tbody>{gardiensFiltres.map((gardien) => { const choixId = `gardien-${gardien.id}`; const selection = obtenirSelectionChoix(choixId); return <tr
                        key={gardien.id}
                        className={gardien.blesse === true ? "prediction-injured-row" : ""}
                      >
                        <td>{gardien.rang}</td>
                        <td>
                          <div className="prediction-name-cell">
                            <span>{gardien.nom}</span>
                            {gardien.blesse === true && (
                              <span className="prediction-injury-badge">Blessé</span>
                            )}
                          </div>
                        </td>
                        <td>{gardien.equipe}</td><td>{gardien.matchsPredits}</td><td>{gardien.victoiresPredites}</td><td>{gardien.defaitesPredites}</td><td>{gardien.defaitesProlongationPredites}</td><td>{gardien.blanchissagesPredits}</td><td>{gardien.pointsPredits}</td><td>{gardien.valeurMinimale} $</td><td>{selection ? `${selection.selectionnePar} - ${selection.prixPaye} $` : gardien.statut === "Sélectionné" ? `${gardien.selectionnePar} - ${gardien.prixPaye} $` : gardien.statut}</td>{peutProposer && <td>{!selection && gardien.statut === "Disponible" && <button className="small-button" onClick={() => choisirDepuisListe({ id: choixId, nhlId: gardien.nhlId, type: "Gardien", nom: gardien.nom, equipe: gardien.equipe, rang: gardien.rang, valeurMinimale: gardien.valeurMinimale, pointsPredits: gardien.pointsPredits, pointsPoolPredits: gardien.pointsPoolPredits, matchsPredits: gardien.matchsPredits, victoiresPredites: gardien.victoiresPredites, defaitesPredites: gardien.defaitesPredites, defaitesProlongationPredites: gardien.defaitesProlongationPredites, blanchissagesPredits: gardien.blanchissagesPredits, butsPredits: gardien.butsPredits, assistancesPredites: gardien.assistancesPredites, statut: gardien.statut })}>Choisir</button>}</td>}</tr>; })}</tbody>
            </table></div>
          </>
        )}

        {onglet === "equipes" && (
          <><h3>Liste des équipes</h3><input type="text" placeholder="Rechercher une équipe..." value={rechercheEquipe} onChange={(e) => setRechercheEquipe(e.target.value)} className="search-input" />
            <div className="list-filter-bar"><label className="availability-filter"><input type="checkbox" checked={equipesDisponiblesSeulement} onChange={(e) => setEquipesDisponiblesSeulement(e.target.checked)} /><span>Afficher les équipes disponibles seulement</span></label><span className="filter-result-count">{equipesFiltrees.length} équipe{equipesFiltrees.length > 1 ? "s" : ""}</span></div>
            <div className="table-container dg-nhl-teams-table"><table><thead><tr><th>Rang</th><th>Équipe</th><th>MJ</th><th>V</th><th>D</th><th>DP</th><th>PTS</th><th>Min</th><th>Statut</th>{peutProposer && <th>Action</th>}</tr></thead>
              <tbody>{equipesFiltrees.map((equipe) => { const choixId = `equipe-${equipe.id}`; const selection = obtenirSelectionChoix(choixId); return <tr key={equipe.id}><td>{equipe.rang}</td><td>{equipe.nom}</td><td>{equipe.matchsPredits}</td><td>{equipe.victoiresPredites}</td><td>{equipe.defaitesPredites}</td><td>{equipe.defaitesProlongationPredites}</td><td>{equipe.pointsPredits}</td><td>{equipe.valeurMinimale} $</td><td>{selection ? `${selection.selectionnePar} - ${selection.prixPaye} $` : equipe.statut === "Sélectionné" ? `${equipe.selectionnePar} - ${equipe.prixPaye} $` : equipe.statut}</td>{peutProposer && <td>{!selection && equipe.statut === "Disponible" && <button className="small-button" onClick={() => choisirDepuisListe({ id: choixId, nhlId: equipe.nhlId, type: "Équipe", nom: equipe.nom, equipe: "", rang: equipe.rang, valeurMinimale: equipe.valeurMinimale, pointsPredits: equipe.pointsPredits, matchsPredits: equipe.matchsPredits, victoiresPredites: equipe.victoiresPredites, defaitesPredites: equipe.defaitesPredites, defaitesProlongationPredites: equipe.defaitesProlongationPredites, statut: equipe.statut })}>Choisir</button>}</td>}</tr>; })}</tbody>
            </table></div>
          </>
        )}

        {choixEnPreparation && (
          <div className="modal-overlay"><div className="proposal-modal"><h3>Confirmer le choix à proposer</h3><p className="modal-choice-name">{choixEnPreparation.nom}</p>
            <div className="modal-details-grid"><div><span>Type</span><strong>{choixEnPreparation.type}</strong></div><div><span>Équipe</span><strong>{choixEnPreparation.equipe || "N/A"}</strong></div><div><span>Rang</span><strong>{choixEnPreparation.rang}</strong></div><div><span>Valeur minimale</span><strong>{choixEnPreparation.valeurMinimale} $</strong></div></div>
            <label className="form-label">Mise de départ</label><input type="number" value={miseDepart} onChange={(e) => setMiseDepart(e.target.value)} className="form-control" placeholder="Exemple : 50" />
            <div className="proposal-actions"><button onClick={confirmerProposition}>Confirmer et envoyer à l'organisateur</button><button className="secondary-button" onClick={() => { setChoixEnPreparation(null); setMiseDepart(""); }}>Annuler</button></div>
          </div></div>
        )}
      </section>
    </div>
  );
}
