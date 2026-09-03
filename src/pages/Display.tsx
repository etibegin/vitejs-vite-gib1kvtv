import {
  useEffect,
  useRef,
  useState,
} from "react";

import type { CSSProperties } from "react";


type DisplayProps = {
  enchereActive: any;
  compteRebours: number | null;
  resultatDerniereEnchere: any;
  dgs: any[];
  equipesParDG: Record<number, any[]>;
  pointsProjetesParDG: Record<number, number>;
  prochainDG: any;
  ordreDGIds: number[];
  historiqueAttributions: any[];
  chargementDgsTermine: boolean;
  chargementOrdreTermine: boolean;
  profilNhlEnchere: any;
  profilNhlDerniereEnchere: any;
  chargementDonneesNhlTermine: boolean;
};

function obtenirInitiales(nom: string) {
  return String(nom || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((partie) => partie.charAt(0).toUpperCase())
    .join("");
}

function obtenirUrlSecurisee(valeur: unknown): string {
  if (typeof valeur === "string") return valeur.trim();

  if (valeur && typeof valeur === "object") {
    const objet = valeur as Record<string, unknown>;
    const proprietes = [
      "url",
      "src",
      "default",
      "imageUrl",
      "logoUrl",
      "heroImageUrl",
    ];

    for (const propriete of proprietes) {
      const valeurPossible = objet[propriete];
      if (typeof valeurPossible === "string") {
        return valeurPossible.trim();
      }
    }
  }

  return "";
}

function convertirNombre(valeur: unknown) {
  const nombre = Number(valeur ?? 0);
  return Number.isFinite(nombre) ? nombre : 0;
}

function creerStyleImage(url: string): CSSProperties {
  return url ? { backgroundImage: `url("${url}")` } : {};
}

export default function Display({
  enchereActive,
  compteRebours,
  resultatDerniereEnchere,
  dgs,
  equipesParDG,
  pointsProjetesParDG,
  prochainDG,
  ordreDGIds,
  historiqueAttributions,
  chargementDgsTermine,
  chargementOrdreTermine,
  profilNhlEnchere,
  profilNhlDerniereEnchere,
  chargementDonneesNhlTermine,
}: DisplayProps) {
  function obtenirStatsDG(dgId: number) {
    const equipe = equipesParDG[dgId] || [];

    return {
      attaquants: equipe.filter((choix: any) =>
        String(choix.poste || "").startsWith("Attaquant")
      ).length,
      defenseurs: equipe.filter((choix: any) =>
        String(choix.poste || "").startsWith("Défenseur")
      ).length,
      gardien: equipe.filter((choix: any) => choix.poste === "Gardien").length,
      equipeNHL: equipe.filter((choix: any) => choix.poste === "Équipe").length,
      substituts: equipe.filter((choix: any) =>
        String(choix.poste || "").startsWith("Substitut")
      ).length,
      total: equipe.length,
    };
  }

  const chargementTermine = chargementDgsTermine && chargementOrdreTermine;

  const dgsDansOrdre = ordreDGIds
    .map((dgId) => dgs.find((dg) => Number(dg.id) === Number(dgId)))
    .filter(Boolean) as any[];

  const idsDansOrdre = new Set(dgsDansOrdre.map((dg) => Number(dg.id)));
  const dgsTriesSelonOrdre = [
    ...dgsDansOrdre,
    ...dgs.filter((dg) => !idsDansOrdre.has(Number(dg.id))),
  ];

  const derniereAttribution =
    historiqueAttributions.length > 0
      ? historiqueAttributions[historiqueAttributions.length - 1]
      : null;

  const estGardien = enchereActive?.type === "Gardien";
  const estEquipe = enchereActive?.type === "Équipe";
  const estJoueur = Boolean(enchereActive) && !estGardien && !estEquipe;
  const misesFermees =
  enchereActive?.misesFermees === true;

  const [
    animationNouvelleMise,
    setAnimationNouvelleMise,
  ] = useState(false);
  
  const [
    animationNouveauMeneur,
    setAnimationNouveauMeneur,
  ] = useState(false);
  
  const [
    animationCompteRebours,
    setAnimationCompteRebours,
  ] = useState(false);
  
  const [variationMise, setVariationMise] = useState<number | null>(null);
  const [nouveauMeneurNom, setNouveauMeneurNom] = useState<string | null>(null);
  const [transitionFermeture, setTransitionFermeture] = useState(false);

  const misePrecedenteRef =
    useRef<number | null>(null);
  
  const meneurPrecedentRef =
    useRef<number | null>(null);
  
  const compteReboursPrecedentRef =
    useRef<number | null>(null);

  const encherePrecedenteRef = useRef<string | number | null>(null);
  const misesFermeesPrecedentesRef = useRef(false);
  const couleurPrincipale = profilNhlEnchere?.couleurPrincipale || "#002f6c";
  const couleurSecondaire = profilNhlEnchere?.couleurSecondaire || "#94a3b8";
  const imageJoueurUrl = obtenirUrlSecurisee(profilNhlEnchere?.imageUrl);
  const logoEquipeUrl = obtenirUrlSecurisee(profilNhlEnchere?.logoUrl);
  const statistiquesCarriere = profilNhlEnchere?.statistiquesCarriere || {};
  const statistiquesSaisons = Array.isArray(profilNhlEnchere?.statistiquesSaisons)
    ? profilNhlEnchere.statistiquesSaisons
    : [];

  const equipeAffichee =
    profilNhlEnchere?.equipeAbreviation || enchereActive?.equipe || "";
  const pointsPredictionGardien = convertirNombre(
    enchereActive?.pointsPoolPredits || enchereActive?.pointsPredits
  );

  const styleCouleursEquipe = {
    "--team-primary": couleurPrincipale,
    "--team-secondary": couleurSecondaire,
  } as CSSProperties;

  const saisonsHistoriquesGraphique = statistiquesSaisons
    .slice(-5)
    .map((saison: any) => ({
      saison: String(saison.saison || ""),
      matchsJoues: convertirNombre(saison.matchsJoues),
      buts: convertirNombre(saison.buts),
      assistances: convertirNombre(saison.assistances),
      points: convertirNombre(saison.points),
      pointsPool: convertirNombre(saison.pointsPool),
      pointsClassement: convertirNombre(saison.pointsClassement),
    }));

  function obtenirValeurGraphique(saison: any) {
    if (estGardien) return convertirNombre(saison.pointsPool);
    if (estEquipe) return convertirNombre(saison.pointsClassement);
    return convertirNombre(saison.points);
  }

  const predictionGraphique = estGardien
    ? pointsPredictionGardien
    : convertirNombre(enchereActive?.pointsPredits);

  const valeurMaximaleGraphique = Math.max(
    ...saisonsHistoriquesGraphique.map(obtenirValeurGraphique),
    predictionGraphique,
    1
  );

  const libelleGraphique = estGardien
    ? "Points du pool par saison"
    : estEquipe
      ? "Points au classement par saison"
      : "Production offensive par saison";

  const profilVendu = profilNhlDerniereEnchere;
  const venduEstEquipe = resultatDerniereEnchere?.type === "Équipe";
  const couleurVenduPrincipale = profilVendu?.couleurPrincipale || "#002f6c";
  const couleurVenduSecondaire = profilVendu?.couleurSecondaire || "#94a3b8";
  const portraitVenduUrl = obtenirUrlSecurisee(profilVendu?.imageUrl);
  const logoVenduUrl = obtenirUrlSecurisee(profilVendu?.logoUrl);
  const equipeVendue =
    profilVendu?.equipeAbreviation || resultatDerniereEnchere?.equipe || "LNH";

  const styleCouleursVendu = {
    "--team-primary": couleurVenduPrincipale,
    "--team-secondary": couleurVenduSecondaire,
  } as CSSProperties;

  useEffect(() => {
    const id = enchereActive?.choixId ?? null;
    if (!enchereActive) {
      encherePrecedenteRef.current = null;
      misePrecedenteRef.current = null;
      meneurPrecedentRef.current = null;
      misesFermeesPrecedentesRef.current = false;
      return;
    }
    if (encherePrecedenteRef.current !== id) {
      encherePrecedenteRef.current = id;
      misePrecedenteRef.current = Number(enchereActive.miseActuelle || 0);
      meneurPrecedentRef.current = Number(enchereActive.dgMeneurId || 0);
      misesFermeesPrecedentesRef.current = enchereActive.misesFermees === true;
    }
  }, [enchereActive?.choixId]);

  useEffect(() => {
    if (!enchereActive) return;
    const actuelle = Number(enchereActive.miseActuelle || 0);
    const precedente = misePrecedenteRef.current;
    if (precedente !== null && actuelle > precedente) {
      setAnimationNouvelleMise(true);
      setVariationMise(actuelle - precedente);
      const timer = window.setTimeout(() => {
        setAnimationNouvelleMise(false);
        setVariationMise(null);
      }, 950);
      misePrecedenteRef.current = actuelle;
      return () => window.clearTimeout(timer);
    }
    misePrecedenteRef.current = actuelle;
  }, [enchereActive?.miseActuelle]);

  useEffect(() => {
    if (!enchereActive) return;
    const actuel = Number(enchereActive.dgMeneurId || 0);
    const precedent = meneurPrecedentRef.current;
    if (precedent !== null && actuel !== precedent) {
      setAnimationNouveauMeneur(true);
      setNouveauMeneurNom(String(enchereActive.dgMeneurNom || ""));
      const timer = window.setTimeout(() => {
        setAnimationNouveauMeneur(false);
        setNouveauMeneurNom(null);
      }, 1250);
      meneurPrecedentRef.current = actuel;
      return () => window.clearTimeout(timer);
    }
    meneurPrecedentRef.current = actuel;
  }, [enchereActive?.dgMeneurId, enchereActive?.dgMeneurNom]);

  useEffect(() => {
    if (!enchereActive) return;
    const fermee = enchereActive.misesFermees === true;
    const precedente = misesFermeesPrecedentesRef.current;
    if (fermee && !precedente) {
      setTransitionFermeture(true);
      const timer = window.setTimeout(() => setTransitionFermeture(false), 850);
      misesFermeesPrecedentesRef.current = true;
      return () => window.clearTimeout(timer);
    }
    if (!fermee) setTransitionFermeture(false);
    misesFermeesPrecedentesRef.current = fermee;
  }, [enchereActive?.misesFermees]);

  useEffect(() => {
    if (
      compteRebours === null ||
      compteRebours <= 0
    ) {
      return;
    }
  
    if (
      compteReboursPrecedentRef.current !== null &&
      compteRebours !==
        compteReboursPrecedentRef.current
    ) {
      setAnimationCompteRebours(true);
  
      const timer =
        window.setTimeout(() => {
          setAnimationCompteRebours(false);
        }, 450);
  
      compteReboursPrecedentRef.current =
        compteRebours;
  
      return () =>
        window.clearTimeout(timer);
    }
  
    compteReboursPrecedentRef.current =
      compteRebours;
  }, [compteRebours]);

  if (!chargementTermine) {
    return (
      <div className="display-root">
        <main className="tv-loading-state">
          <div className="tv-loading-card">
            <span className="tv-loading-indicator" />
            <h2>Connexion au repêchage</h2>
            <p>Les données du pool sont en cours de chargement.</p>
          </div>
        </main>
      </div>
    );
  }

  if (!enchereActive && resultatDerniereEnchere) {
    return (
      <div className="display-root">
        <main className="winner-screen-premium" style={styleCouleursVendu}>
          <div className="winner-ambient-light winner-ambient-light-one" />
          <div className="winner-ambient-light winner-ambient-light-two" />

          {logoVenduUrl && (
            <div
              className="winner-background-logo"
              style={creerStyleImage(logoVenduUrl)}
              aria-hidden="true"
            />
          )}

          <section className="winner-stage">
            <div className="winner-banner">
              <span className="winner-banner-line" />
              <strong>VENDU!</strong>
              <span className="winner-banner-line" />
            </div>

            <div className="winner-card-premium">
              <div className="winner-visual-panel">
                <div className="winner-rank-badge">
                  <span>Rang</span>
                  <strong>#{resultatDerniereEnchere.rang || "N/D"}</strong>
                </div>

                <div className="winner-visual-initials">
                  {obtenirInitiales(resultatDerniereEnchere.nom)}
                </div>

                {!venduEstEquipe && portraitVenduUrl && (
                  <div
                    className="winner-player-portrait"
                    style={creerStyleImage(portraitVenduUrl)}
                    role="img"
                    aria-label={`Portrait de ${resultatDerniereEnchere.nom}`}
                  />
                )}

                {venduEstEquipe && logoVenduUrl && (
                  <div
                    className="winner-main-team-logo"
                    style={creerStyleImage(logoVenduUrl)}
                    role="img"
                    aria-label={`Logo de ${resultatDerniereEnchere.nom}`}
                  />
                )}

                {logoVenduUrl && !venduEstEquipe && (
                  <div
                    className="winner-corner-logo"
                    style={creerStyleImage(logoVenduUrl)}
                    aria-hidden="true"
                  />
                )}
              </div>

              <div className="winner-information-panel">
                <span className="winner-choice-type">
                  {resultatDerniereEnchere.type}
                </span>

                <h1 className="winner-choice-name">
                  {resultatDerniereEnchere.nom}
                </h1>

                <div className="winner-team-name">{equipeVendue}</div>

                <div className="winner-separator" />

                <span className="winner-label">Remporté par</span>
                <strong className="winner-dg-name">
                  {resultatDerniereEnchere.gagnantNom}
                </strong>

                <div className="winner-price-block">
                  <span>Prix final</span>
                  <strong>{convertirNombre(resultatDerniereEnchere.prixFinal)} $</strong>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!enchereActive) {
    return (
      <div className="display-root">
        <main className="tv-between-screen">
          <header className="tv-status-header">
            <div className="tv-status-live">
              <span className="tv-status-dot" />
              <div>
                <span className="tv-status-label">État du repêchage</span>
                <strong>En attente du prochain DG à proposer un choix</strong>
              </div>
            </div>

            <div className="tv-header-stats">
              <div><span>DG inscrits</span><strong>{dgs.length}</strong></div>
              <div><span>Choix attribués</span><strong>{historiqueAttributions.length}</strong></div>
            </div>
          </header>

          <section
            className={
              dgsTriesSelonOrdre.length > 12
                ? "tv-dg-board tv-dg-board-compact"
                : "tv-dg-board"
            }
          >
            <div className="tv-board-title">
              <div><span>Position</span><strong>Situation des DG</strong></div>
              <span className="tv-board-legend">Ordre de repêchage</span>
            </div>

            {dgsTriesSelonOrdre.length === 0 ? (
              <div className="tv-no-dgs-state">
                <span className="tv-status-dot" />
                <div><strong>Aucun DG inscrit</strong><p>En attente de l'inscription des participants.</p></div>
              </div>
            ) : (
              <div className="tv-dg-table-wrapper">
                <table className="tv-dg-table">
                  <thead>
                    <tr>
                      <th className="tv-rank-column">#</th>
                      <th>DG</th><th>Budget</th><th>Pts proj.</th><th>Att.</th><th>Déf.</th>
                      <th>Gar.</th><th>Équipe</th><th>Subs</th><th>Total</th><th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dgsTriesSelonOrdre.map((dg: any, index: number) => {
                      const stats = obtenirStatsDG(dg.id);
                      const estProchainDG = Number(dg.id) === Number(prochainDG?.id);
                      const estTermine = dg.budgetRestant <= 0 || stats.total >= 16;
                      const classes = [
                        estProchainDG ? "tv-current-dg-row" : "",
                        estTermine ? "tv-finished-dg-row" : "",
                      ].filter(Boolean).join(" ");

                      return (
                        <tr key={dg.id} className={classes}>
                          <td className="tv-rank-cell"><span>{index + 1}</span></td>
                          <td className="tv-dg-name-cell">
                            <strong>{dg.nom}</strong>
                            {estProchainDG && <span className="tv-turn-badge">À son tour</span>}
                          </td>
                          <td className="tv-budget-cell">{dg.budgetRestant} $</td>
                          <td className="tv-projected-points-cell"><strong>{Number(pointsProjetesParDG[Number(dg.id)] || 0).toLocaleString("fr-CA")}</strong></td>
                          <td>{stats.attaquants}<small>/8</small></td>
                          <td>{stats.defenseurs}<small>/2</small></td>
                          <td>{stats.gardien}<small>/1</small></td>
                          <td>{stats.equipeNHL}<small>/1</small></td>
                          <td>{stats.substituts}<small>/4</small></td>
                          <td className="tv-total-cell">{stats.total}<small>/16</small></td>
                          <td>
                            <span className={`tv-status-badge ${estTermine ? "tv-status-finished" : "tv-status-active"}`}>
                              {estTermine ? "Terminé" : "Actif"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className="tv-last-result">
            {derniereAttribution ? (
              <>
                <div className="tv-last-result-label"><span>Dernière attribution</span></div>
                <div className="tv-last-result-choice"><strong>{derniereAttribution.nom}</strong><span>{derniereAttribution.type}</span></div>
                <div className="tv-last-result-winner"><span>Remporté par</span><strong>{derniereAttribution.gagnantNom}</strong></div>
                <div className="tv-last-result-price"><span>Prix final</span><strong>{derniereAttribution.prixFinal} $</strong></div>
              </>
            ) : (
              <div className="tv-no-result">
                <span>Aucune attribution pour le moment</span>
                <strong>Le repêchage commencera avec le premier choix proposé.</strong>
              </div>
            )}
          </footer>
        </main>
      </div>
    );
  }

  return (
    <div className="display-root">
      <main className="tv-auction-screen" style={styleCouleursEquipe}>
        <header className="tv-auction-header">
          <div className="tv-auction-live-status">
            <span className="tv-auction-live-dot" />
            <div><span>Enchère en cours</span><strong>{enchereActive.type}</strong></div>
          </div>
          <div className="tv-auction-header-choice">
            <span>Choix proposé par</span><strong>{enchereActive.dgProposeurNom}</strong>
          </div>
        </header>

        {nouveauMeneurNom && (
          <div className="tv-new-leader-overlay" role="status" aria-live="polite">
            <span>Nouveau meneur</span>
            <strong>{nouveauMeneurNom}</strong>
          </div>
        )}

        {transitionFermeture && (
          <div className="tv-closing-overlay" role="status" aria-live="polite">
            <span>Fermeture des mises</span>
          </div>
        )}

        <div className="tv-auction-layout">
          <section className="tv-hockey-card">
            <div className="tv-card-background-mark">{equipeAffichee}</div>
            <div className="tv-card-top">
              <div className="tv-card-rank"><span>Rang</span><strong>#{enchereActive.rang || "N/D"}</strong></div>
              <div
                className={logoEquipeUrl ? "tv-card-team-logo tv-card-background-image" : "tv-card-team-logo"}
                style={creerStyleImage(logoEquipeUrl)}
              >
                {!logoEquipeUrl && <strong>{equipeAffichee || "NHL"}</strong>}
              </div>
            </div>

            <div className="tv-card-player-visual">
              <div className="tv-card-initials">{obtenirInitiales(enchereActive.nom)}</div>
              {!estEquipe && imageJoueurUrl && (
                <div className="tv-card-player-image-background" style={creerStyleImage(imageJoueurUrl)} role="img" aria-label={`Portrait de ${enchereActive.nom}`} />
              )}
              {estEquipe && logoEquipeUrl && (
                <div className="tv-card-team-logo-background" style={creerStyleImage(logoEquipeUrl)} role="img" aria-label={`Logo de ${enchereActive.nom}`} />
              )}
            </div>

            <div className="tv-card-identity">
              <span>{equipeAffichee || "LNH"}</span>
              <h2>{enchereActive.nom}</h2>
              <p>{estEquipe ? "Équipe de la LNH" : profilNhlEnchere?.position || enchereActive.type}</p>
            </div>

            <div className="tv-card-prediction">
              <div className="tv-card-prediction-title">
                <span>Prédiction du pool</span>
                <strong>Valeur minimale {convertirNombre(enchereActive.valeurMinimale)} $</strong>
              </div>

              {estJoueur && (
                <div className="tv-card-prediction-grid">
                  <div><span>MJ</span><strong>{convertirNombre(enchereActive.matchsPredits)}</strong></div>
                  <div><span>B</span><strong>{convertirNombre(enchereActive.butsPredits)}</strong></div>
                  <div><span>A</span><strong>{convertirNombre(enchereActive.assistancesPredites)}</strong></div>
                  <div className="tv-card-prediction-highlight"><span>PTS</span><strong>{convertirNombre(enchereActive.pointsPredits)}</strong></div>
                </div>
              )}

              {estGardien && (
                <div className="tv-card-prediction-grid tv-card-goalie-prediction">
                  <div><span>MJ</span><strong>{convertirNombre(enchereActive.matchsPredits)}</strong></div>
                  <div><span>V</span><strong>{convertirNombre(enchereActive.victoiresPredites)}</strong></div>
                  <div><span>BL</span><strong>{convertirNombre(enchereActive.blanchissagesPredits)}</strong></div>
                  <div className="tv-card-prediction-highlight"><span>PTS POOL</span><strong>{pointsPredictionGardien}</strong></div>
                </div>
              )}

              {estEquipe && (
                <div className="tv-card-prediction-grid">
                  <div><span>MJ</span><strong>{convertirNombre(enchereActive.matchsPredits)}</strong></div>
                  <div><span>V</span><strong>{convertirNombre(enchereActive.victoiresPredites)}</strong></div>
                  <div><span>DP</span><strong>{convertirNombre(enchereActive.defaitesProlongationPredites)}</strong></div>
                  <div className="tv-card-prediction-highlight"><span>PTS</span><strong>{convertirNombre(enchereActive.pointsPredits)}</strong></div>
                </div>
              )}
            </div>
          </section>

          <section className="tv-career-panel">
            <div className="tv-panel-heading">
              <div><span>Historique NHL</span><h2>Production en carrière</h2></div>
              <span className="tv-career-seasons-badge">{statistiquesSaisons.length} saisons affichées</span>
            </div>

            {!chargementDonneesNhlTermine ? (
              <div className="tv-career-empty"><strong>Chargement du profil</strong><p>Les statistiques NHL sont en cours de chargement.</p></div>
            ) : !profilNhlEnchere ? (
              <div className="tv-career-empty"><strong>Profil historique indisponible</strong><p>La carte utilise les données de prédiction disponibles.</p></div>
            ) : (
              <>
                <div className="tv-career-chart">
                  <div className="tv-chart-header">
                    <div><span>Cinq dernières saisons</span><strong>{libelleGraphique}</strong></div>
                    <div className="tv-chart-legend">
                      {estJoueur && <><span className="tv-legend-goals">Buts</span><span className="tv-legend-assists">Passes</span></>}
                      <span className="tv-legend-points">Points</span>
                      <span className="tv-legend-prediction">Prédiction</span>
                    </div>
                  </div>

                  <div className="tv-chart-area">
                    {saisonsHistoriquesGraphique.length === 0 ? (
                      <div className="tv-chart-empty"><strong>Aucun historique NHL</strong><span>La prédiction demeure disponible.</span></div>
                    ) : saisonsHistoriquesGraphique.map((saison: any) => {
                      const valeurPoints = obtenirValeurGraphique(saison);
                      const hauteurPoints = (valeurPoints / valeurMaximaleGraphique) * 100;
                      const hauteurButs = (saison.buts / valeurMaximaleGraphique) * 100;
                      const hauteurPasses = (saison.assistances / valeurMaximaleGraphique) * 100;

                      return (
                        <div className="tv-chart-season" key={saison.saison}>
                          <div className="tv-chart-bars">
                            {estJoueur && <div className="tv-chart-bar tv-chart-bar-goals" style={{ height: `${Math.max(hauteurButs, saison.buts ? 3 : 0)}%` }}><span>{saison.buts}</span></div>}
                            {estJoueur && <div className="tv-chart-bar tv-chart-bar-assists" style={{ height: `${Math.max(hauteurPasses, saison.assistances ? 3 : 0)}%` }}><span>{saison.assistances}</span></div>}
                            <div className="tv-chart-bar tv-chart-bar-points" style={{ height: `${Math.max(hauteurPoints, valeurPoints ? 3 : 0)}%` }}><span>{valeurPoints}</span></div>
                          </div>
                          <strong className="tv-chart-season-label">{saison.saison}</strong>
                        </div>
                      );
                    })}

                    <div className="tv-chart-season tv-chart-prediction-season">
                      <div className="tv-chart-bars">
                        <div
                          className="tv-chart-bar tv-chart-bar-prediction"
                          style={{ height: `${Math.max((predictionGraphique / valeurMaximaleGraphique) * 100, predictionGraphique ? 3 : 0)}%` }}
                        >
                          <span>{predictionGraphique}</span>
                        </div>
                      </div>
                      <strong className="tv-chart-season-label">Prédiction</strong>
                    </div>
                  </div>
                </div>

                {estJoueur && (
                  <div className="tv-career-totals">
                    <div><span>Matchs</span><strong>{convertirNombre(statistiquesCarriere.matchsJoues)}</strong></div>
                    <div><span>Buts</span><strong>{convertirNombre(statistiquesCarriere.buts)}</strong></div>
                    <div><span>Passes</span><strong>{convertirNombre(statistiquesCarriere.assistances)}</strong></div>
                    <div className="tv-career-total-highlight"><span>Points</span><strong>{convertirNombre(statistiquesCarriere.points)}</strong></div>
                  </div>
                )}

                {estGardien && (
                  <div className="tv-career-totals">
                    <div><span>Matchs</span><strong>{convertirNombre(statistiquesCarriere.matchsJoues)}</strong></div>
                    <div><span>Victoires</span><strong>{convertirNombre(statistiquesCarriere.victoires)}</strong></div>
                    <div><span>Blanchissages</span><strong>{convertirNombre(statistiquesCarriere.blanchissages)}</strong></div>
                    <div className="tv-career-total-highlight"><span>Points pool</span><strong>{convertirNombre(statistiquesCarriere.pointsPool)}</strong></div>
                  </div>
                )}

                {estEquipe && (
                  <div className="tv-career-totals">
                    <div><span>Matchs</span><strong>{convertirNombre(statistiquesCarriere.matchsJoues)}</strong></div>
                    <div><span>Victoires</span><strong>{convertirNombre(statistiquesCarriere.victoires)}</strong></div>
                    <div><span>DP</span><strong>{convertirNombre(statistiquesCarriere.defaitesProlongation)}</strong></div>
                    <div className="tv-career-total-highlight"><span>Points</span><strong>{convertirNombre(statistiquesCarriere.pointsClassement)}</strong></div>
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="tv-bid-panel">
          <div
  className={`tv-bid-current ${
    animationNouvelleMise
      ? "tv-new-bid-flash"
      : ""
  }`}
>
<span>Mise actuelle</span>
<strong>{convertirNombre(enchereActive.miseActuelle)} $</strong>
{variationMise !== null && variationMise > 0 && (
  <em className="tv-bid-increase">+{variationMise} $</em>
)}
</div>
<div
  className={`tv-bid-leader ${
    animationNouveauMeneur
      ? "tv-new-leader"
      : ""
  }`}
><span>DG meneur</span><strong>{enchereActive.dgMeneurNom}</strong></div>
            <div className="tv-bid-divider" />

            {enchereActive?.misesFermees === true ? (
  <div className="tv-countdown-closed">
    <span>Mises fermées</span>

    <strong>
      Prix final provisoire
    </strong>

    <b>
      {convertirNombre(
        enchereActive.miseActuelle
      )} $
    </b>

    <small>
      En attente de l'attribution
    </small>
  </div>
) : compteRebours !== null &&
  compteRebours > 0 ? (
    <div
    className={`tv-countdown-active ${
      animationCompteRebours
        ? "tv-countdown-pulse"
        : ""
    }`}
  >
    <span>Décompte</span>

    <strong>{compteRebours}</strong>
  </div>
) : (
  <div className="tv-countdown-waiting">
    <span>Enchère ouverte</span>

    <strong>
      En attente du décompte
    </strong>
  </div>
)}
          </aside>
        </div>
      </main>
    </div>
  );
}
