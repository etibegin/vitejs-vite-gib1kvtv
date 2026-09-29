import { supabase } from "./lib/supabase";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import DG from "./pages/DG";
import Admin from "./pages/Admin";
import Display from "./pages/Display";
import DGLogin from "./pages/DGLogin";
import AdminLogin from "./pages/AdminLogin";
import {
  dgs as dgsDemo,
} from "./data/demoData";

const CLE_DG_CONNECTE =
  "poolHockeyDgSauvegardeId";

  function chargerSauvegarde() {
    return null;
  }

  function obtenirEcranInitial() {
    const params = new URLSearchParams(
      window.location.search
    );
  
    const mode = params.get("mode");
  
    if (mode === "admin") {
      return "admin-login";
    }
  
    if (mode === "display") {
      return "display";
    }
  
    const valeurDG =
      localStorage.getItem(
        CLE_DG_CONNECTE
      );
  
    const dgMemoriseId = Number(
      valeurDG || 0
    );
  
    if (
      Number.isInteger(dgMemoriseId) &&
      dgMemoriseId > 0
    ) {
      return "dg";
    }
  
    return "dg-login";
  }

async function hacherPin(pin: string) {
  const donnees = new TextEncoder().encode(pin);

  const empreinte = await crypto.subtle.digest(
    "SHA-256",
    donnees
  );

  return Array.from(new Uint8Array(empreinte))
    .map((octet) => octet.toString(16).padStart(2, "0"))
    .join("");
}

function convertirNombreSecurise(valeur: unknown) {
  const nombre = Number(valeur ?? 0);
  return Number.isFinite(nombre) ? nombre : 0;
}

function calculerPointsProjetesEquipe(equipe: any[]) {
  const obtenirPoints = (choix: any) =>
    choix.type === "Gardien"
      ? convertirNombreSecurise(choix.pointsPoolPredits ?? choix.pointsPredits)
      : convertirNombreSecurise(choix.pointsPredits);

  const meilleurs = (type: string, maximum: number) =>
    equipe
      .filter((choix) => choix.type === type)
      .sort((a, b) => obtenirPoints(b) - obtenirPoints(a))
      .slice(0, maximum);

  return [
    ...meilleurs("Attaquant", 8),
    ...meilleurs("Défenseur", 2),
    ...meilleurs("Gardien", 1),
    ...meilleurs("Équipe", 1),
  ].reduce((total, choix) => total + obtenirPoints(choix), 0);
}

export default function App() {
    const [ecran, setEcran] = useState(obtenirEcranInitial());
    const [
      sessionAdminActive,
      setSessionAdminActive,
    ] = useState(false);
    
    const [
      verificationSessionAdmin,
      setVerificationSessionAdmin,
    ] = useState(true);
  const [propositionEnAttente, setPropositionEnAttente] = useState<any>(null);
  const [enchereActive, setEnchereActive] = useState<any>(null);
  const [compteRebours, setCompteRebours] = useState<number | null>(null);
  const [decompteDemarreAt, setDecompteDemarreAt] =
  useState<string | null>(null);
  const [resultatDerniereEnchere, setResultatDerniereEnchere] =
    useState<any>(null);
    const sauvegardeInitiale = chargerSauvegarde();

    const [choixSelectionnes, setChoixSelectionnes] = useState<any[]>(
      sauvegardeInitiale?.choixSelectionnes || []
    );
  const [derniereAttributionAnnulable, setDerniereAttributionAnnulable] =
    useState<any>(null);
    const [historiqueAttributions, setHistoriqueAttributions] = useState<any[]>(
      sauvegardeInitiale?.historiqueAttributions || []
    );
  
    const [joueurs, setJoueurs] = useState<any[]>([]);
const [gardiens, setGardiens] = useState<any[]>([]);
const [equipesPool, setEquipesPool] = useState<any[]>([]);

const [
  chargementListesTermine,
  setChargementListesTermine,
] = useState(false);
function lireDgMemorise() {
  const valeur = localStorage.getItem(
    CLE_DG_CONNECTE
  );

  if (!valeur) {
    return null;
  }

  const identifiant = Number(valeur);

  if (
    !Number.isInteger(identifiant) ||
    identifiant <= 0
  ) {
    localStorage.removeItem(
      CLE_DG_CONNECTE
    );

    return null;
  }

  return identifiant;
}

const [
  dgConnecteId,
  setDgConnecteId,
] = useState<number | null>(
  lireDgMemorise
);

    const [ordreDGIds, setOrdreDGIds] = useState<number[]>(
      sauvegardeInitiale?.ordreDGIds || []
    );
  const [indexDGActuel, setIndexDGActuel] = useState(
    sauvegardeInitiale?.indexDGActuel || 0
  );

  

  const [dgs, setDgs] = useState<any[]>(
    sauvegardeInitiale?.dgs || dgsDemo
  );

  const [equipesParDG, setEquipesParDG] = useState<any>(
    sauvegardeInitiale?.equipesParDG || {}
  );

  
  const dgCreationEnCoursRef = useRef<number | null>(null);
  const [chargementDgsTermine, setChargementDgsTermine] =
  useState(false);
  const [chargementOrdreTermine, setChargementOrdreTermine] =
  useState(false);
  const dgConnecte =
  dgConnecteId !== null
    ? dgs.find(
        (dg) =>
          Number(dg.id) ===
          Number(dgConnecteId)
      ) || null
    : null;
  function enrichirChoixEquipe(choix: any) {
    if (choix.pointsPredits !== undefined && (choix.type !== "Gardien" || choix.pointsPoolPredits !== undefined)) return choix;
    const choixId = String(choix.choixId || "");
    let source: any = null;
    if (choixId.startsWith("joueur-")) source = joueurs.find((item) => Number(item.id) === Number(choixId.replace("joueur-", "")));
    else if (choixId.startsWith("gardien-")) source = gardiens.find((item) => Number(item.id) === Number(choixId.replace("gardien-", "")));
    else if (choixId.startsWith("equipe-")) source = equipesPool.find((item) => Number(item.id) === Number(choixId.replace("equipe-", "")));
    return {
      ...choix,
      pointsPredits: convertirNombreSecurise(choix.pointsPredits ?? source?.pointsPredits),
      pointsPoolPredits: convertirNombreSecurise(choix.pointsPoolPredits ?? source?.pointsPoolPredits ?? choix.pointsPredits ?? source?.pointsPredits),
    };
  }

  const equipesParDGEnrichies = Object.fromEntries(
    Object.entries(equipesParDG).map(([dgId, equipe]) => [dgId, Array.isArray(equipe) ? equipe.map(enrichirChoixEquipe) : []])
  );
  const pointsProjetesParDG: Record<number, number> = Object.fromEntries(
    dgs.map((dg) => [Number(dg.id), calculerPointsProjetesEquipe(equipesParDGEnrichies[dg.id] || [])])
  );
  const equipeDGConnecte = dgConnecte ? equipesParDGEnrichies[dgConnecte.id] || [] : [];
  const pointsProjetesEquipeDGConnecte = dgConnecte ? pointsProjetesParDG[Number(dgConnecte.id)] || 0 : 0;

  const prochainDGId =
  ordreDGIds.length > 0 ? ordreDGIds[indexDGActuel] : null;

const prochainDG =
  prochainDGId !== null
    ? dgs.find((dg) => dg.id === prochainDGId) || null
    : null;
    const estTourDuDGConnecte =
    dgConnecte && prochainDG
      ? dgConnecte.id === prochainDG.id
      : false;
      const [donneesNhl, setDonneesNhl] =
  useState<any[]>([]);

const [
  chargementDonneesNhlTermine,
  setChargementDonneesNhlTermine,
] = useState(false);

const typeDonneesNhlEnchere =
  enchereActive?.type === "Gardien"
    ? "Gardien"
    : enchereActive?.type === "Équipe"
    ? "Équipe"
    : "Joueur";

const profilNhlEnchere =
  enchereActive?.nhlId
    ? donneesNhl.find(
        (profil) =>
          profil.nhlId ===
            Number(enchereActive.nhlId) &&
          profil.typeChoix ===
            typeDonneesNhlEnchere
      ) || null
    : null;

    const typeDonneesNhlDerniereEnchere =
    resultatDerniereEnchere?.type ===
    "Gardien"
      ? "Gardien"
      : resultatDerniereEnchere?.type ===
        "Équipe"
        ? "Équipe"
        : "Joueur";
  
  const profilNhlDerniereEnchere =
    resultatDerniereEnchere?.nhlId
      ? donneesNhl.find(
          (profil) =>
            Number(profil.nhlId) ===
              Number(
                resultatDerniereEnchere.nhlId
              ) &&
            profil.typeChoix ===
              typeDonneesNhlDerniereEnchere
        ) || null
      : null;    

      
      
  async function annulerCompteRebours() {
    if (!enchereActive) {
      return;
    }

    await sauvegarderEnchereSupabase(
      {
        ...enchereActive,
        misesFermees: false,
      },
      null
    );
  }

  async function fermerMisesImmediatement() {
    if (!enchereActive) {
      alert("Aucune enchère active.");
      return;
    }

    if (enchereActive.misesFermees === true) {
      return;
    }

    const confirmation = window.confirm(
      `Fermer les mises immédiatement?\n\nMise actuelle : ${enchereActive.miseActuelle} $\nDG meneur : ${enchereActive.dgMeneurNom}`
    );

    if (!confirmation) {
      return;
    }

    await sauvegarderEnchereSupabase(
      {
        ...enchereActive,
        misesFermees: true,
      },
      null
    );
  }

  async function reouvrirEnchere() {
    if (!enchereActive) {
      alert("Aucune enchère active.");
      return;
    }

    const confirmation = window.confirm(
      `Réouvrir l'enchère?\n\nLes mises reprendront à partir de ${enchereActive.miseActuelle} $.`
    );

    if (!confirmation) {
      return;
    }

    await sauvegarderEnchereSupabase(
      {
        ...enchereActive,
        misesFermees: false,
      },
      null
    );
  }

  useEffect(() => {
    let composantActif = true;
  
    async function chargerDgsSupabase() {
      const { data, error } = await supabase
        .from("dgs")
        .select("*")
        .order("created_at", { ascending: true });
  
      if (error) {
        console.error(
          "Erreur lors du chargement des DG depuis Supabase :",
          error
        );
        return;
      }
  
      if (!composantActif) {
        return;
      }
  
      const dgsNormalises = (data || []).map((dgSupabase) => ({
        id: Number(dgSupabase.id),
        nom: dgSupabase.nom,
        budgetRestant: Number(dgSupabase.budget_restant),
        attaquants: 0,
        defenseurs: 0,
        gardiens: 0,
        equipes: 0,
        substituts: 0,
      }));
  
      setDgs(dgsNormalises);
setChargementDgsTermine(true);

if (
  dgCreationEnCoursRef.current !== null &&
  dgsNormalises.some(
    (dg) => dg.id === dgCreationEnCoursRef.current
  )
) {
  dgCreationEnCoursRef.current = null;
}
    }
  
    chargerDgsSupabase();
  
    const canalDgs = supabase
      .channel("changements-dgs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dgs",
        },
        () => {
          chargerDgsSupabase();
        }
      )
      .subscribe((statut) => {
        console.log("Statut Realtime des DG :", statut);
      });
  
    return () => {
      composantActif = false;
      supabase.removeChannel(canalDgs);
    };
  }, []);

  useEffect(() => {
    if (!chargementDgsTermine || !chargementOrdreTermine) {
      return;
    }
  
    if (!sessionAdminActive) {
      return;
    }
  
    const idsDgsExistants = dgs.map((dg) => dg.id);
  
    const ordreNettoye = ordreDGIds.filter((dgId) =>
      idsDgsExistants.includes(dgId)
    );
  
    const nouveauxIds = idsDgsExistants.filter(
      (dgId) => !ordreNettoye.includes(dgId)
    );
  
    const nouvelOrdre = [
      ...ordreNettoye,
      ...nouveauxIds,
    ];
  
    const ordreAChange =
      JSON.stringify(nouvelOrdre) !==
      JSON.stringify(ordreDGIds);
  
    let nouvelIndex = indexDGActuel;
  
    if (nouvelOrdre.length === 0) {
      nouvelIndex = 0;
    } else if (nouvelIndex >= nouvelOrdre.length) {
      nouvelIndex = 0;
    }
  
    const indexAChange =
      nouvelIndex !== indexDGActuel;
  
    if (ordreAChange || indexAChange) {
      sauvegarderEtatOrdreSupabase(
        nouvelOrdre,
        nouvelIndex
      );
    }
  }, [
    dgs,
    chargementDgsTermine,
    chargementOrdreTermine,
    ordreDGIds,
    indexDGActuel,
    sessionAdminActive,
  ]);
  

  function trouverProchainPosteDisponible(type: string, equipeActuelle: any[]) {
    const posteEstOccupe = (poste: string) =>
      equipeActuelle.some((item) => item.poste === poste);

    if (type === "Équipe" && !posteEstOccupe("Équipe")) {
      return "Équipe";
    }

    if (type === "Gardien" && !posteEstOccupe("Gardien")) {
      return "Gardien";
    }

    if (type === "Défenseur") {
      if (!posteEstOccupe("Défenseur 1")) return "Défenseur 1";
      if (!posteEstOccupe("Défenseur 2")) return "Défenseur 2";
    }

    if (type === "Attaquant") {
      for (let i = 1; i <= 8; i++) {
        const poste = `Attaquant ${i}`;
        if (!posteEstOccupe(poste)) return poste;
      }
    }

    for (let i = 1; i <= 4; i++) {
      const poste = `Substitut ${i}`;
      if (!posteEstOccupe(poste)) return poste;
    }

    return null;
  }

  function estDgTermineApresAttribution(
    dgId: number,
    equipesActualisees: Record<number, any[]>,
    budgetsActualises: Record<number, number>
  ) {
    const dg = dgs.find(
      (item) => Number(item.id) === Number(dgId)
    );

    if (!dg) {
      return true;
    }

    const equipe =
      equipesActualisees[dgId] || [];

    const budgetRestant =
      budgetsActualises[dgId] ??
      Number(dg.budgetRestant || 0);

    return (
      budgetRestant <= 0 ||
      equipe.length >= 16
    );
  }

  function trouverProchainIndexActif(
    indexDepart: number,
    equipesActualisees: Record<number, any[]> =
      equipesParDG,
    budgetsActualises: Record<number, number> = {}
  ) {
    if (ordreDGIds.length === 0) {
      return 0;
    }

    for (
      let decalage = 1;
      decalage <= ordreDGIds.length;
      decalage++
    ) {
      const indexCandidat =
        (indexDepart + decalage) %
        ordreDGIds.length;

      const dgCandidatId =
        ordreDGIds[indexCandidat];

      if (
        !estDgTermineApresAttribution(
          dgCandidatId,
          equipesActualisees,
          budgetsActualises
        )
      ) {
        return indexCandidat;
      }
    }

    return indexDepart;
  }

  async function tirerOrdreAleatoire() {
    if (ordreDGIds.length === 0) {
      alert(
        "Aucun DG n'est inscrit. Impossible de tirer un ordre."
      );
      return;
    }
  
    if (ordreDGIds.length === 1) {
      const sauvegardeReussie =
        await sauvegarderEtatOrdreSupabase(
          ordreDGIds,
          0
        );
  
      if (sauvegardeReussie) {
        alert(
          "Un seul DG est inscrit. Aucun tirage n'est nécessaire."
        );
      }
  
      return;
    }
  
    const ordreMelange = [...ordreDGIds];
  
    for (let index = ordreMelange.length - 1; index > 0; index--) {
      const indexAleatoire = Math.floor(
        Math.random() * (index + 1)
      );
  
      const valeurTemporaire = ordreMelange[index];
  
      ordreMelange[index] =
        ordreMelange[indexAleatoire];
  
      ordreMelange[indexAleatoire] =
        valeurTemporaire;
    }
  
    const sauvegardeReussie =
      await sauvegarderEtatOrdreSupabase(
        ordreMelange,
        0
      );
  
    if (sauvegardeReussie) {
      alert(
        "L'ordre des DG a été tiré aléatoirement."
      );
    }
  }
  

  async function approuverProposition() {
    if (!propositionEnAttente) {
      alert("Aucune proposition à approuver.");
      return;
    }
  
    if (enchereActive) {
      alert("Une enchère est déjà active.");
      return;
    }
  
    const propositionAApprouver = {
      ...propositionEnAttente,
    };
  
    const nouvelleEnchere = {
      
      choixId: propositionAApprouver.choixId,
    
      nhlId: Number(
        propositionAApprouver.nhlId || 0
      ),
    
      nom: propositionAApprouver.nom,
      type: propositionAApprouver.type,
      equipe:
        propositionAApprouver.equipe || "",
    
      rang: Number(
        propositionAApprouver.rang || 0
      ),
    
      valeurMinimale: Number(
        propositionAApprouver.valeurMinimale ||
          0
      ),
    
      matchsPredits: Number(
        propositionAApprouver.matchsPredits || 0
      ),
    
      butsPredits: Number(
        propositionAApprouver.butsPredits || 0
      ),
    
      assistancesPredites: Number(
        propositionAApprouver
          .assistancesPredites || 0
      ),
    
      pointsPredits: Number(
        propositionAApprouver.pointsPredits || 0
      ),
    
      pointsPoolPredits: Number(
        propositionAApprouver
          .pointsPoolPredits || 0
      ),
    
      victoiresPredites: Number(
        propositionAApprouver
          .victoiresPredites || 0
      ),
    
      defaitesPredites: Number(
        propositionAApprouver
          .defaitesPredites || 0
      ),
    
      defaitesProlongationPredites: Number(
        propositionAApprouver
          .defaitesProlongationPredites || 0
      ),
    
      blanchissagesPredits: Number(
        propositionAApprouver
          .blanchissagesPredits || 0
      ),
    
      miseDepart: Number(
        propositionAApprouver.miseDepart || 0
      ),
    
      miseActuelle: Number(
        propositionAApprouver.miseDepart || 0
      ),
    
      dgProposeurId:
        propositionAApprouver.dgId,
    
      dgProposeurNom:
        propositionAApprouver.dgNom,
    
      dgMeneurId:
        propositionAApprouver.dgId,
    
      dgMeneurNom:
        propositionAApprouver.dgNom,

      misesFermees: false,
    };
  
    const { error } = await supabase
      .from("etat_pool")
      .update({
        proposition_en_attente: null,
        enchere_active: nouvelleEnchere,
        decompte_demarre_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
  
    if (error) {
      console.error(
        "Erreur lors de l'approbation de la proposition :",
        error
      );
  
      alert(
        "Impossible de lancer l'enchère. Vérifiez la connexion Internet."
      );
  
      return;
    }
  
    setResultatDerniereEnchere(null);
    setDerniereAttributionAnnulable(null);
    setEcran("admin");
  }


  async function demarrerCompteRebours() {
    if (!enchereActive) {
      alert("Aucune enchère active.");
      return;
    }

    if (enchereActive.misesFermees === true) {
      alert("Réouvrez l'enchère avant de démarrer un nouveau décompte.");
      return;
    }
  
    if (compteRebours !== null) {
      alert(
        "Un compte à rebours est déjà en cours."
      );
  
      return;
    }
  
    const nouveauDebut = new Date().toISOString();
  
    const sauvegardeReussie =
      await sauvegarderEnchereSupabase(
        enchereActive,
        nouveauDebut
      );
  
    if (!sauvegardeReussie) {
      return;
    }
  }

  async function placerMise(
    dg: any,
    montant: number
  ) {
    if (!enchereActive) {
      alert("Aucune enchère active.");
      return;
    }
  
    if (
      enchereActive.misesFermees === true ||
      compteRebours === 0
    ) {
      alert(
        "Les mises sont fermées. Il n'est plus possible de placer une mise."
      );
      return;
    }
  
    if (enchereActive.dgMeneurId === dg.id) {
      alert(
        "Vous êtes déjà le meneur de cette enchère. Vous ne pouvez pas miser davantage."
      );
      return;
    }
  
    if (!montant || montant <= 0) {
      alert("Veuillez entrer une mise valide.");
      return;
    }
  
    if (montant % 5 !== 0) {
      alert("La mise doit être un multiple de 5 $.");
      return;
    }
  
    const { data, error } = await supabase.rpc(
      "placer_mise_atomique",
      {
        p_dg_id: dg.id,
        p_montant: montant,
      }
    );
  
    if (error) {
      console.error(
        "Erreur lors de la mise atomique :",
        error
      );
  
      alert(
        error.message ||
          "Impossible de placer la mise."
      );
  
      return;
    }
  
    console.log(
      "Mise atomique acceptée :",
      data
    );
  }

  async function attribuerChoixAuGagnant() {
    if (!enchereActive) {
      alert("Aucune enchère active à attribuer.");
      return;
    }
  
    if (
      enchereActive.misesFermees !== true &&
      compteRebours !== 0
    ) {
      alert(
        "Les mises doivent être fermées avant d'attribuer le choix."
      );
      return;
    }
  
    const gagnant = dgs.find(
      (dg) => dg.id === enchereActive.dgMeneurId
    );
  
    if (!gagnant) {
      alert("DG gagnant introuvable.");
      return;
    }
  
    const equipeGagnant =
      equipesParDG[gagnant.id] || [];
  
    const posteDisponible =
      trouverProchainPosteDisponible(
        enchereActive.type,
        equipeGagnant
      );
  
    if (!posteDisponible) {
      alert(
        "Aucune place disponible dans l'équipe du DG gagnant."
      );
      return;
    }
  
    if (
      enchereActive.miseActuelle >
      gagnant.budgetRestant
    ) {
      alert(
        "Le budget du DG gagnant est insuffisant."
      );
      return;
    }
  
    const idChoixEquipe = Date.now();
  
    const resultat = {
      choixId: enchereActive.choixId,
    
      nhlId: Number(
        enchereActive.nhlId || 0
      ),
    
      nom: enchereActive.nom,
    
      type: enchereActive.type,
    
      equipe:
        enchereActive.equipe || "",
    
      rang: Number(
        enchereActive.rang || 0
      ),
    
      gagnantId: Number(
        gagnant.id
      ),
    
      gagnantNom:
        gagnant.nom,
    
      prixFinal: Number(
        enchereActive.miseActuelle || 0
      ),
    
      dgProposeurNom:
        enchereActive.dgProposeurNom,
    };
  
    const nouveauChoixEquipe = {
      id: idChoixEquipe,
      choixId: enchereActive.choixId,
      nhlId: Number(enchereActive.nhlId || 0),
      poste: posteDisponible,
      type: enchereActive.type,
      nom: enchereActive.nom,
      equipe: enchereActive.equipe,
      prixPaye: Number(enchereActive.miseActuelle || 0),
      pointsPredits: Number(enchereActive.pointsPredits || 0),
      pointsPoolPredits: Number(enchereActive.pointsPoolPredits || enchereActive.pointsPredits || 0),
    };
  
    const nouvellesEquipesParDG = {
      ...equipesParDG,
    };
  
    nouvellesEquipesParDG[gagnant.id] = [
      ...equipeGagnant,
      nouveauChoixEquipe,
    ];
  
    const nouveauxChoixSelectionnes = [
      ...choixSelectionnes,
      {
        choixId: enchereActive.choixId,
        selectionnePar:
          enchereActive.dgMeneurNom,
        prixPaye:
          enchereActive.miseActuelle,
      },
    ];
  
    const nouvelHistorique = [
      ...historiqueAttributions,
      resultat,
    ];
  
    const nouvelleDerniereAttribution = {
      choixId: enchereActive.choixId,
      choixEquipeId: idChoixEquipe,
      gagnantId: gagnant.id,
      gagnantNom: gagnant.nom,
      prixFinal: enchereActive.miseActuelle,
      indexDGAvantAttribution:
        indexDGActuel,
    };
  
    const nouveauBudget =
      Number(gagnant.budgetRestant || 0) -
      Number(enchereActive.miseActuelle || 0);

    const budgetsApresAttribution: Record<
      number,
      number
    > = {
      [Number(gagnant.id)]: nouveauBudget,
    };

    const prochainIndex =
      trouverProchainIndexActif(
        indexDGActuel,
        nouvellesEquipesParDG,
        budgetsApresAttribution
      );
  
    const { error: erreurBudget } = await supabase
      .from("dgs")
      .update({
        budget_restant: nouveauBudget,
      })
      .eq("id", gagnant.id);
  
    if (erreurBudget) {
      console.error(
        "Erreur de mise à jour du budget :",
        erreurBudget
      );
  
      alert(
        "Impossible de mettre à jour le budget du gagnant."
      );
  
      return;
    }
  
    const sauvegardeReussie =
      await sauvegarderResultatsPoolSupabase(
        nouvellesEquipesParDG,
        nouveauxChoixSelectionnes,
        nouvelHistorique,
        resultat,
        nouvelleDerniereAttribution,
        prochainIndex,
        null,
        null
      );
  
    if (!sauvegardeReussie) {
      await supabase
        .from("dgs")
        .update({
          budget_restant: gagnant.budgetRestant,
        })
        .eq("id", gagnant.id);
  
      return;
    }
  
    setEcran("admin");
  }

  async function annulerEnchereActive() {
    if (!enchereActive) {
      alert(
        "Aucune enchère active à annuler."
      );
  
      return;
    }
  
    const sauvegardeReussie =
      await sauvegarderEnchereSupabase(
        null,
        null
      );
  
    if (!sauvegardeReussie) {
      return;
    }
  
    setResultatDerniereEnchere(null);
  
    alert(
      "L'enchère a été annulée. Aucun choix n'a été attribué."
    );
  
    setEcran("admin");
  }

  async function annulerDerniereAttribution() {
    if (!derniereAttributionAnnulable) {
      alert(
        "Aucune attribution récente à annuler."
      );
      return;
    }
  
    if (enchereActive || propositionEnAttente) {
      alert(
        "Impossible d'annuler une attribution pendant une proposition ou une enchère active."
      );
      return;
    }
  
    const attribution = historiqueAttributions.find(
      (item) =>
        item.choixId ===
        derniereAttributionAnnulable.choixId
    );
  
    if (!attribution) {
      alert(
        "L'attribution est introuvable dans l'historique."
      );
      return;
    }
  
    const confirmation = window.confirm(
      `Voulez-vous vraiment annuler la dernière attribution de ${attribution.nom} à ${attribution.gagnantNom}?`
    );
  
    if (!confirmation) {
      return;
    }
  
    const annulationReussie =
      await annulerAttributionPartagee(
        attribution,
        derniereAttributionAnnulable
          .indexDGAvantAttribution
      );
  
    if (annulationReussie) {
      alert(
        "La dernière attribution a été annulée."
      );
  
      setEcran("admin");
    }
  }

  function exporterEquipesCSV() {
    const lignes = [
      ["DG", "Poste", "Type", "Nom", "Équipe", "Prix payé"],
    ];
  
    dgs.forEach((dg) => {
      const equipe = equipesParDG[dg.id] || [];
  
      equipe.forEach((choix: any) => {
        lignes.push([
          dg.nom,
          choix.poste,
          choix.type,
          choix.nom,
          choix.equipe || "",
          String(choix.prixPaye),
        ]);
      });
    });
  
    const contenuCSV =
      "sep=;\n" +
      lignes
        .map((ligne) =>
          ligne
            .map((valeur) => `"${String(valeur).replace(/"/g, '""')}"`)
            .join(";")
        )
        .join("\n");
  
    const contenuAvecBOM = "\uFEFF" + contenuCSV;
  
    const blob = new Blob([contenuAvecBOM], {
      type: "text/csv;charset=utf-8;",
    });
  
    const url = URL.createObjectURL(blob);
    const lien = document.createElement("a");
  
    lien.href = url;
    lien.download = "equipes_pool_hockey.csv";
    lien.click();
  
    URL.revokeObjectURL(url);
  }
  
  useEffect(() => {
    let composantActif = true;
  
    async function chargerEtatPoolSupabase() {
      const { data, error } = await supabase
  .from("etat_pool")
  .select(
    `
      ordre_dg_ids,
      index_dg_actuel,
      proposition_en_attente,
      enchere_active,
      decompte_demarre_at,
      equipes_par_dg,
      choix_selectionnes,
      historique_attributions,
      resultat_derniere_enchere,
      derniere_attribution_annulable
    `
  )
  .eq("id", 1)
  .single();
  
      if (error) {
        console.error(
          "Erreur de chargement de l'ordre depuis Supabase :",
          error
        );
  
        return;
      }
  
      if (!composantActif) {
        return;
      }
  
      const ordreCharge = Array.isArray(data.ordre_dg_ids)
        ? data.ordre_dg_ids.map((id: number | string) =>
            Number(id)
          )
        : [];
  
      const indexCharge = Number(data.index_dg_actuel || 0);
  
      setOrdreDGIds(ordreCharge);
  
      setIndexDGActuel(
        ordreCharge.length === 0
          ? 0
          : Math.min(indexCharge, ordreCharge.length - 1)
      );
      setPropositionEnAttente(
        data.proposition_en_attente || null
      );
      
      setEnchereActive(
        data.enchere_active || null
      );
      
      setDecompteDemarreAt(
        data.decompte_demarre_at || null
      );

      setEquipesParDG(
        data.equipes_par_dg &&
          typeof data.equipes_par_dg === "object"
          ? data.equipes_par_dg
          : {}
      );
      
      setChoixSelectionnes(
        Array.isArray(data.choix_selectionnes)
          ? data.choix_selectionnes
          : []
      );
      
      setHistoriqueAttributions(
        Array.isArray(data.historique_attributions)
          ? data.historique_attributions
          : []
      );
      
      setResultatDerniereEnchere(
        data.resultat_derniere_enchere || null
      );
      
      setDerniereAttributionAnnulable(
        data.derniere_attribution_annulable || null
      );
      
      setChargementOrdreTermine(true);
    }
  
    chargerEtatPoolSupabase();
  
    const canalEtatPool = supabase
      .channel("changements-etat-pool")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "etat_pool",
          filter: "id=eq.1",
        },
        () => {
          chargerEtatPoolSupabase();
        }
      )
      .subscribe((statut) => {
        console.log(
          "Statut Realtime de l'ordre :",
          statut
        );
      });
  
    return () => {
      composantActif = false;
      supabase.removeChannel(canalEtatPool);
    };
  }, []);

  function reinitialiserSauvegarde() {
    const confirmation = window.confirm(
      "Voulez-vous vraiment réinitialiser toute la sauvegarde du repêchage?"
    );
  
    if (!confirmation) {
      return;
    }
  
    localStorage.removeItem(
      CLE_DG_CONNECTE
    );
    
    setDgConnecteId(null);
    
    window.location.reload();
  }

  async function importerListesExcel(
    donneesImportees: any
  ) {
    const joueursImportes =
      donneesImportees.joueurs || [];
  
    const gardiensImportes =
      donneesImportees.gardiens || [];
  
    const equipesImportees =
      donneesImportees.equipes || [];
  
    if (
      !Array.isArray(joueursImportes) ||
      !Array.isArray(gardiensImportes) ||
      !Array.isArray(equipesImportees)
    ) {
      alert(
        "Les données Excel importées ne sont pas valides."
      );
  
      return;
    }
  
    const confirmation = window.confirm(
      `Voulez-vous remplacer les listes actuelles par ${joueursImportes.length} joueurs, ${gardiensImportes.length} gardiens et ${equipesImportees.length} équipes?`
    );
  
    if (!confirmation) {
      return;
    }
  
    const { error } = await supabase
      .from("listes_prediction")
      .upsert(
        [
          {
            categorie: "joueurs",
            donnees: joueursImportes,
            updated_at: new Date().toISOString(),
          },
          {
            categorie: "gardiens",
            donnees: gardiensImportes,
            updated_at: new Date().toISOString(),
          },
          {
            categorie: "equipes",
            donnees: equipesImportees,
            updated_at: new Date().toISOString(),
          },
        ],
        {
          onConflict: "categorie",
        }
      );
  
    if (error) {
      console.error(
        "Erreur de sauvegarde des listes dans Supabase :",
        error
      );
  
      alert(
        "Impossible d'enregistrer les listes dans Supabase."
      );
  
      return;
    }
  
    alert(
      `Listes importées avec succès : ${joueursImportes.length} joueurs, ${gardiensImportes.length} gardiens et ${equipesImportees.length} équipes.`
    );
  }

  async function ajouterDG(
    nom: string,
    nip: string
  ) {
    setSessionAdminActive(false);
  
    const nomNettoye = String(
      nom || ""
    ).trim();
  
    const nipNettoye = String(
      nip || ""
    ).trim();
  
    if (!nomNettoye) {
      alert(
        "Veuillez entrer un nom de DG."
      );
  
      return null;
    }
  
    if (!/^\d{4}$/.test(nipNettoye)) {
      alert(
        "Le NIP doit contenir exactement 4 chiffres."
      );
  
      return null;
    }
  
    const dgExistant = dgs.find(
      (dg) =>
        String(dg.nom || "")
          .trim()
          .toLowerCase() ===
        nomNettoye.toLowerCase()
    );
  
    if (dgExistant) {
      alert(
        "Un DG utilise déjà ce nom."
      );
  
      return null;
    }
  
    const pinHash = await hacherPin(
      nipNettoye
    );
  
    const budgetInitial = 1100;
  
    const { data, error } = await supabase
      .from("dgs")
      .insert({
        nom: nomNettoye,
        pin_hash: pinHash,
        budget_restant:
          budgetInitial,
      })
      .select(
        "id, nom, budget_restant"
      )
      .single();
  
    if (error) {
      console.error(
        "Erreur lors de la création du DG :",
        error
      );
  
      if (error.code === "23505") {
        alert(
          "Ce nom de DG est déjà utilisé."
        );
      } else {
        alert(
          error.message ||
            "Impossible de créer le DG."
        );
      }
  
      return null;
    }
  
    const nouveauDgId = Number(
      data?.id || 0
    );
  
    if (
      !Number.isInteger(nouveauDgId) ||
      nouveauDgId <= 0
    ) {
      console.error(
        "Identifiant du DG absent :",
        data
      );
  
      alert(
        "Le DG a été créé, mais son identifiant n'a pas été retourné."
      );
  
      return null;
    }
  
    const nouveauDG = {
      id: nouveauDgId,
      nom:
        data?.nom ||
        nomNettoye,
      budgetRestant: Number(
        data?.budget_restant ??
          budgetInitial
      ),
      attaquants: 0,
      defenseurs: 0,
      gardiens: 0,
      equipes: 0,
      substituts: 0,
    };
  
    dgCreationEnCoursRef.current =
      nouveauDgId;
  
    const sessionOuverte =
      ouvrirSessionDG(
        nouveauDgId,
        nouveauDG
      );
  
    if (!sessionOuverte) {
      alert(
        "Le DG a été créé, mais son interface n'a pas pu être ouverte."
      );
  
      return null;
    }
  
    alert(
      `DG créé : ${nouveauDG.nom}`
    );
  
    return nouveauDG;
  }

  async function supprimerDG(
    dgId: number
  ) {
    if (
      enchereActive ||
      propositionEnAttente
    ) {
      alert(
        "Impossible de supprimer un DG pendant une proposition ou une enchère active."
      );
  
      return;
    }
  
    const equipeDuDG =
      equipesParDG[dgId] || [];
  
    if (equipeDuDG.length > 0) {
      alert(
        "Impossible de supprimer un DG qui a déjà des choix dans son équipe."
      );
  
      return;
    }
  
    const confirmation =
      window.confirm(
        "Voulez-vous vraiment supprimer ce DG?"
      );
  
    if (!confirmation) {
      return;
    }
  
    const { error } = await supabase
      .from("dgs")
      .delete()
      .eq("id", dgId);
  
    if (error) {
      console.error(
        "Erreur de suppression du DG :",
        error
      );
  
      alert(
        "Impossible de supprimer le DG."
      );
  
      return;
    }
  
    const nouvellesEquipesParDG = {
      ...equipesParDG,
    };
  
    delete nouvellesEquipesParDG[dgId];
  
    const sauvegardeReussie =
      await sauvegarderResultatsPoolSupabase(
        nouvellesEquipesParDG,
        choixSelectionnes,
        historiqueAttributions,
        resultatDerniereEnchere,
        derniereAttributionAnnulable,
        indexDGActuel,
        enchereActive,
        decompteDemarreAt
      );
  
    if (!sauvegardeReussie) {
      console.error(
        "Le DG a été supprimé, mais le nettoyage de son équipe a échoué."
      );
    }
  
    if (
      Number(dgConnecteId) ===
      Number(dgId)
    ) {
      localStorage.removeItem(
        CLE_DG_CONNECTE
      );
  
      setDgConnecteId(null);
      setEcran("dg-login");
    }
  
    alert("DG supprimé.");
  }

  

  async function connecterOrganisateur(
    courriel: string,
    motDePasse: string
  ) {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: courriel,
        password: motDePasse,
      });
  
    if (error) {
      console.error(
        "Erreur de connexion organisateur :",
        error
      );
  
      alert(
        "Connexion refusée. Vérifiez le courriel et le mot de passe."
      );
  
      return false;
    }
  
    if (!data.session) {
      alert(
        "Aucune session organisateur n'a été créée."
      );
    
      return false;
    }
    
    const estOrganisateur =
      await verifierRoleOrganisateur();
    
    if (!estOrganisateur) {
      await supabase.auth.signOut();
    
      alert(
        "Ce compte Supabase n'est pas autorisé comme organisateur."
      );
    
      return false;
    }
    
    setSessionAdminActive(true);
  
    if (!dgConnecteId && dgs.length > 0) {
      setDgConnecteId(dgs[0].id);
    }
  
    setEcran("admin");
  
    return true;
  }

async function deconnecterOrganisateur() {
  const { error } =
    await supabase.auth.signOut();

  if (error) {
    console.error(
      "Erreur de déconnexion organisateur :",
      error
    );

    alert(
      "Impossible de fermer la session organisateur."
    );

    return;
  }

  setSessionAdminActive(false);
  setEcran("admin-login");
}


async function connecterDGExistant(
  dgId: number,
  nip: string
) {
  setSessionAdminActive(false);

  const identifiantDG = Number(
    dgId
  );

  const nipNettoye = String(
    nip || ""
  ).trim();

  if (
    !Number.isInteger(
      identifiantDG
    ) ||
    identifiantDG <= 0
  ) {
    alert(
      "Veuillez sélectionner un DG valide."
    );

    return false;
  }

  if (!/^\d{4}$/.test(nipNettoye)) {
    alert(
      "Le NIP doit contenir exactement 4 chiffres."
    );

    return false;
  }

  const { data, error } =
    await supabase.rpc(
      "connecter_dg_existant",
      {
        p_dg_id: identifiantDG,
        p_nip: nipNettoye,
      }
    );

  if (error) {
    console.error(
      "Erreur de connexion au DG :",
      error
    );

    alert(
      error.message ||
        "Impossible de rejoindre ce DG."
    );

    return false;
  }

  const dgAutoriseId = Number(
    data?.id || 0
  );

  if (
    !Number.isInteger(
      dgAutoriseId
    ) ||
    dgAutoriseId <= 0
  ) {
    console.error(
      "Réponse RPC invalide :",
      data
    );

    alert(
      "La connexion au DG n'a pas pu être validée."
    );

    return false;
  }

  const dgDansListe = dgs.find(
    (dg) =>
      Number(dg.id) ===
      dgAutoriseId
  );

  const donneesSessionDG = {
    id: dgAutoriseId,

    nom: String(
      data?.nom ||
        dgDansListe?.nom ||
        ""
    ),

    budgetRestant: Number(
      data?.budgetRestant ??
        dgDansListe?.budgetRestant ??
        0
    ),

    attaquants: Number(
      dgDansListe?.attaquants || 0
    ),

    defenseurs: Number(
      dgDansListe?.defenseurs || 0
    ),

    gardiens: Number(
      dgDansListe?.gardiens || 0
    ),

    equipes: Number(
      dgDansListe?.equipes || 0
    ),

    substituts: Number(
      dgDansListe?.substituts || 0
    ),
  };

  const sessionOuverte =
    ouvrirSessionDG(
      dgAutoriseId,
      donneesSessionDG
    );

  if (!sessionOuverte) {
    alert(
      "Le DG a été validé, mais son interface n'a pas pu être ouverte."
    );

    return false;
  }

  return true;
}



async function annulerAttributionPartagee(
  attribution: any,
  indexARestaurer: number | null
) {
  const gagnantId = Number(attribution.gagnantId);
  const choixId = attribution.choixId;
  const prixFinal = Number(attribution.prixFinal);

  const gagnant = dgs.find(
    (dg) => dg.id === gagnantId
  );

  if (!gagnant) {
    alert("DG gagnant introuvable.");
    return false;
  }

  const equipeGagnant =
    equipesParDG[gagnantId] || [];

  const nouvelleEquipeGagnant =
    equipeGagnant.filter(
      (choix: any) =>
        choix.choixId !== choixId
    );

  const nouvellesEquipesParDG = {
    ...equipesParDG,
  };

  nouvellesEquipesParDG[gagnantId] =
    nouvelleEquipeGagnant;

  const nouveauxChoixSelectionnes =
    choixSelectionnes.filter(
      (choix) =>
        choix.choixId !== choixId
    );

  const nouvelHistorique =
    historiqueAttributions.filter(
      (item) =>
        item.choixId !== choixId
    );

  const nouveauResultat =
    resultatDerniereEnchere?.choixId === choixId
      ? null
      : resultatDerniereEnchere;

  const nouvelleDerniereAttribution =
    derniereAttributionAnnulable?.choixId ===
    choixId
      ? null
      : derniereAttributionAnnulable;

  const nouvelIndex =
    indexARestaurer === null
      ? indexDGActuel
      : indexARestaurer;

  const nouveauBudget =
    gagnant.budgetRestant + prixFinal;

  const { error: erreurBudget } = await supabase
    .from("dgs")
    .update({
      budget_restant: nouveauBudget,
    })
    .eq("id", gagnantId);

  if (erreurBudget) {
    console.error(
      "Erreur de remboursement du DG :",
      erreurBudget
    );

    alert(
      "Impossible de rembourser le DG."
    );

    return false;
  }

  const sauvegardeReussie =
    await sauvegarderResultatsPoolSupabase(
      nouvellesEquipesParDG,
      nouveauxChoixSelectionnes,
      nouvelHistorique,
      nouveauResultat,
      nouvelleDerniereAttribution,
      nouvelIndex,
      enchereActive,
      decompteDemarreAt
    );

  if (!sauvegardeReussie) {
    await supabase
      .from("dgs")
      .update({
        budget_restant:
          gagnant.budgetRestant,
      })
      .eq("id", gagnantId);

    return false;
  }

  return true;
}

async function annulerAttributionHistorique(
  attribution: any
) {
  if (enchereActive || propositionEnAttente) {
    alert(
      "Impossible d'annuler une attribution pendant une proposition ou une enchère active."
    );
    return;
  }

  const confirmation = window.confirm(
    `Voulez-vous vraiment annuler l'attribution de ${attribution.nom} à ${attribution.gagnantNom} pour ${attribution.prixFinal} $?`
  );

  if (!confirmation) {
    return;
  }

  const annulationReussie =
    await annulerAttributionPartagee(
      attribution,
      null
    );

  if (annulationReussie) {
    alert(
      "L'attribution sélectionnée a été annulée."
    );
  }
}

function ouvrirModeDGOrganisateur() {
  if (!sessionAdminActive) {
    setEcran("dg-login");
    return;
  }

  if (!dgConnecteId) {
    alert(
      "Veuillez d'abord sélectionner votre DG dans le sélecteur de l'organisateur."
    );
    setEcran("admin");
    return;
  }

  const dgSelectionne = dgs.find((dg) => dg.id === dgConnecteId);

  if (!dgSelectionne) {
    alert(
      "Le DG sélectionné n'existe plus. Veuillez sélectionner ou créer un DG."
    );
    setDgConnecteId(null);
    setEcran("admin");
    return;
  }

  setEcran("dg");
}

async function sauvegarderEtatOrdreSupabase(
  nouvelOrdre: number[],
  nouvelIndex: number
) {
  const indexSecurise =
    nouvelOrdre.length === 0
      ? 0
      : Math.min(
          Math.max(nouvelIndex, 0),
          nouvelOrdre.length - 1
        );

  const { error } = await supabase
    .from("etat_pool")
    .upsert(
      {
        id: 1,
        ordre_dg_ids: nouvelOrdre,
        index_dg_actuel: indexSecurise,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (error) {
    console.error(
      "Erreur de sauvegarde de l'ordre dans Supabase :",
      error
    );

    alert(
      "Impossible de sauvegarder l'ordre de repêchage dans Supabase."
    );

    return false;
  }

  return true;
}

async function sauvegarderPropositionSupabase(
  proposition: any | null
) {
  const { error } = await supabase
    .from("etat_pool")
    .update({
      proposition_en_attente: proposition,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error(
      "Erreur de sauvegarde de la proposition dans Supabase :",
      error
    );

    alert(
      "Impossible de transmettre la proposition. Vérifiez la connexion Internet et réessayez."
    );

    return false;
  }

  return true;
}

async function soumettrePropositionSupabase(
  proposition: any
) {
  const { data, error } = await supabase.rpc(
    "soumettre_proposition_dg",
    {
      p_proposition: proposition,
    }
  );

  if (error) {
    console.error(
      "Erreur de soumission de la proposition :",
      error
    );

    alert(
      error.message ||
        "Impossible de transmettre la proposition."
    );

    return;
  }

  alert(
    `Proposition envoyée à l'organisateur : ${data.nom} à partir de ${data.miseDepart} $.`
  );
}

async function refuserPropositionSupabase() {
  if (!propositionEnAttente) {
    alert("Aucune proposition à refuser.");
    return;
  }

  const suppressionReussie =
    await sauvegarderPropositionSupabase(null);

  if (!suppressionReussie) {
    return;
  }

  alert("La proposition a été refusée.");
}

async function sauvegarderEnchereSupabase(
  nouvelleEnchere: any | null,
  nouveauDebutDecompte: string | null
) {
  const { error } = await supabase
    .from("etat_pool")
    .update({
      enchere_active: nouvelleEnchere,
      decompte_demarre_at: nouveauDebutDecompte,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error(
      "Erreur de sauvegarde de l'enchère dans Supabase :",
      error
    );

    alert(
      "Impossible de mettre à jour l'enchère. Vérifiez la connexion Internet et réessayez."
    );

    return false;
  }

  return true;
}

function deconnecterDG() {
  localStorage.removeItem(
    CLE_DG_CONNECTE
  );

  setDgConnecteId(null);

  setEcran("dg-login");
}

function ouvrirSessionDG(
  dgId: number,
  donneesDG?: any
) {
  const identifiantDG = Number(dgId);

  if (
    !Number.isInteger(identifiantDG) ||
    identifiantDG <= 0
  ) {
    console.error(
      "Identifiant DG invalide :",
      dgId
    );

    return false;
  }

  if (donneesDG) {
    const dgNormalise = {
      ...donneesDG,
      id: identifiantDG,
      nom: String(
        donneesDG.nom || ""
      ),
      budgetRestant: Number(
        donneesDG.budgetRestant ??
          donneesDG.budget_restant ??
          0
      ),
      attaquants: Number(
        donneesDG.attaquants || 0
      ),
      defenseurs: Number(
        donneesDG.defenseurs || 0
      ),
      gardiens: Number(
        donneesDG.gardiens || 0
      ),
      equipes: Number(
        donneesDG.equipes || 0
      ),
      substituts: Number(
        donneesDG.substituts || 0
      ),
    };

    setDgs((dgsActuels) => {
      const dgExisteDeja =
        dgsActuels.some(
          (dg) =>
            Number(dg.id) ===
            identifiantDG
        );

      if (dgExisteDeja) {
        return dgsActuels.map(
          (dg) =>
            Number(dg.id) ===
            identifiantDG
              ? {
                  ...dg,
                  ...dgNormalise,
                }
              : dg
        );
      }

      return [
        ...dgsActuels,
        dgNormalise,
      ];
    });
  }

  localStorage.setItem(
    CLE_DG_CONNECTE,
    String(identifiantDG)
  );

  setDgConnecteId(
    identifiantDG
  );

  setEcran("dg");

  return true;
}


async function sauvegarderResultatsPoolSupabase(
  nouvellesEquipesParDG: any,
  nouveauxChoixSelectionnes: any[],
  nouvelHistorique: any[],
  nouveauResultat: any | null,
  nouvelleDerniereAttribution: any | null,
  nouvelIndexDG: number,
  nouvelleEnchere: any | null = enchereActive,
  nouveauDebutDecompte: string | null = decompteDemarreAt
) {
  const indexSecurise =
    ordreDGIds.length === 0
      ? 0
      : Math.min(
          Math.max(nouvelIndexDG, 0),
          ordreDGIds.length - 1
        );

  const { error } = await supabase
    .from("etat_pool")
    .update({
      equipes_par_dg: nouvellesEquipesParDG,
      choix_selectionnes: nouveauxChoixSelectionnes,
      historique_attributions: nouvelHistorique,
      resultat_derniere_enchere: nouveauResultat,
      derniere_attribution_annulable:
        nouvelleDerniereAttribution,
      index_dg_actuel: indexSecurise,
      enchere_active: nouvelleEnchere,
      decompte_demarre_at: nouveauDebutDecompte,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error(
      "Erreur de sauvegarde des résultats du pool :",
      error
    );

    alert(
      "Impossible de sauvegarder les résultats du pool dans Supabase."
    );

    return false;
  }

  return true;
}

async function verifierRoleOrganisateur() {
  const { data, error } = await supabase.rpc(
    "est_organisateur"
  );

  if (error) {
    console.error(
      "Erreur de vérification du rôle organisateur :",
      error
    );

    return false;
  }

  return data === true;
}

async function importerDonneesNhl(
  donneesImportees: any[]
) {
  if (!Array.isArray(donneesImportees)) {
    alert(
      "Les données NHL importées ne sont pas valides."
    );

    return false;
  }

  const typesValides = [
    "Joueur",
    "Gardien",
    "Équipe",
  ];

  const erreurs: string[] = [];
  const nhlIdsRencontres = new Set<string>();

  const donneesNormalisees =
    donneesImportees.map(
      (profil, index) => {
        const typeChoix = String(
          profil.typeChoix || ""
        ).trim();

        const nhlId = Number(
          profil.nhlId || 0
        );

        const nom = String(
          profil.nom || ""
        ).trim();

        if (!typesValides.includes(typeChoix)) {
          erreurs.push(
            `Ligne ${index + 1} : typeChoix invalide.`
          );
        }

        if (
          !Number.isInteger(nhlId) ||
          nhlId <= 0
        ) {
          erreurs.push(
            `Ligne ${index + 1} : NHLId invalide.`
          );
        }

        if (!nom) {
          erreurs.push(
            `Ligne ${index + 1} : nom absent.`
          );
        }

        const cleUnique =
          `${typeChoix}-${nhlId}`;

        if (nhlIdsRencontres.has(cleUnique)) {
          erreurs.push(
            `Ligne ${index + 1} : doublon ${cleUnique}.`
          );
        }

        nhlIdsRencontres.add(cleUnique);

        const statistiquesSaisons =
          Array.isArray(
            profil.statistiquesSaisons
          )
            ? profil.statistiquesSaisons
            : [];

        return {
          type_choix: typeChoix,
          nhl_id: nhlId,
          nom,
          equipe_abreviation: String(
            profil.equipeAbreviation || ""
          ).trim(),
          position: String(
            profil.position || ""
          ).trim(),
          image_url: String(
            profil.imageUrl || ""
          ).trim() || null,
          hero_image_url: String(
            profil.heroImageUrl || ""
          ).trim() || null,
          logo_url: String(
            profil.logoUrl || ""
          ).trim() || null,
          couleur_principale: String(
            profil.couleurPrincipale ||
              "#002f6c"
          ).trim(),
          couleur_secondaire: String(
            profil.couleurSecondaire ||
              "#94a3b8"
          ).trim(),
          statistiques_carriere:
            profil.statistiquesCarriere &&
            typeof profil.statistiquesCarriere ===
              "object"
              ? profil.statistiquesCarriere
              : {},
          statistiques_saisons:
            statistiquesSaisons,
          updated_at:
            new Date().toISOString(),
        };
      }
    );

  if (erreurs.length > 0) {
    console.error(
      "Erreurs dans le fichier NHL :",
      erreurs
    );

    alert(
      `L'import contient ${erreurs.length} erreur(s). Consultez la console. Première erreur : ${erreurs[0]}`
    );

    return false;
  }

  const joueurs = donneesNormalisees.filter(
    (profil) =>
      profil.type_choix === "Joueur"
  ).length;

  const gardiens = donneesNormalisees.filter(
    (profil) =>
      profil.type_choix === "Gardien"
  ).length;

  const equipes = donneesNormalisees.filter(
    (profil) =>
      profil.type_choix === "Équipe"
  ).length;

  const sansCinqSaisons =
    donneesNormalisees.filter(
      (profil) =>
        profil.statistiques_saisons.length <
        5
    );

  const sansPortrait =
    donneesNormalisees.filter(
      (profil) =>
        profil.type_choix !== "Équipe" &&
        !profil.image_url
    );

  const confirmation = window.confirm(
    `Importer ${donneesNormalisees.length} profils NHL?\n\nJoueurs : ${joueurs}\nGardiens : ${gardiens}\nÉquipes : ${equipes}\nMoins de 5 saisons : ${sansCinqSaisons.length}\nSans portrait : ${sansPortrait.length}`
  );

  if (!confirmation) {
    return false;
  }

  const tailleLot = 100;

  for (
    let debut = 0;
    debut < donneesNormalisees.length;
    debut += tailleLot
  ) {
    const lot = donneesNormalisees.slice(
      debut,
      debut + tailleLot
    );

    const { error } = await supabase
      .from("donnees_nhl")
      .upsert(
        lot,
        {
          onConflict:
            "type_choix,nhl_id",
        }
      );

    if (error) {
      console.error(
        "Erreur d'import des données NHL :",
        error
      );

      alert(
        `L'import a échoué au profil ${debut + 1}. Aucun nouveau lot ne sera envoyé.`
      );

      return false;
    }
  }

  alert(
    `${donneesNormalisees.length} profils NHL ont été enregistrés dans Supabase.`
  );

  return true;
}

useEffect(() => {
  if (!chargementDgsTermine) {
    return;
  }

  const identifiantMemorise =
    lireDgMemorise();

  if (!identifiantMemorise) {
    if (ecran === "dg") {
      setDgConnecteId(null);
      setEcran("dg-login");
    }

    return;
  }

  const dgMemorise = dgs.find(
    (dg) =>
      Number(dg.id) ===
      identifiantMemorise
  );

  if (dgMemorise) {
    setDgConnecteId(
      identifiantMemorise
    );

    return;
  }

  if (
    dgCreationEnCoursRef.current ===
    identifiantMemorise
  ) {
    return;
  }

  localStorage.removeItem(
    CLE_DG_CONNECTE
  );

  setDgConnecteId(null);

  if (ecran === "dg") {
    setEcran("dg-login");
  }
}, [
  chargementDgsTermine,
  dgs,
  ecran,
]);



useEffect(() => {
  if (
    !enchereActive ||
    compteRebours !== 0 ||
    enchereActive.misesFermees === true
  ) {
    return;
  }

  sauvegarderEnchereSupabase(
    {
      ...enchereActive,
      misesFermees: true,
    },
    null
  );
}, [compteRebours, enchereActive]);

useEffect(() => {
  if (!enchereActive || !decompteDemarreAt) {
    setCompteRebours(null);
    return;
  }

  function actualiserCompteRebours() {
    const heureDepart = new Date(
      decompteDemarreAt
    ).getTime();

    const tempsEcoule = Date.now() - heureDepart;

    if (tempsEcoule >= 9000) {
      setCompteRebours(0);
      return;
    }

    if (tempsEcoule >= 6000) {
      setCompteRebours(1);
      return;
    }

    if (tempsEcoule >= 3000) {
      setCompteRebours(2);
      return;
    }

    setCompteRebours(3);
  }

  actualiserCompteRebours();

  const intervalle = window.setInterval(
    actualiserCompteRebours,
    250
  );

  return () => {
    window.clearInterval(intervalle);
  };
}, [enchereActive, decompteDemarreAt]);

useEffect(() => {
  let composantActif = true;

  async function chargerListesPredictionSupabase() {
    const { data, error } = await supabase
      .from("listes_prediction")
      .select("categorie, donnees")
      .order("categorie", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Erreur de chargement des listes de prédiction :",
        error
      );

      return;
    }

    if (!composantActif) {
      return;
    }

    const ligneJoueurs = (data || []).find(
      (ligne) => ligne.categorie === "joueurs"
    );

    const ligneGardiens = (data || []).find(
      (ligne) => ligne.categorie === "gardiens"
    );

    const ligneEquipes = (data || []).find(
      (ligne) => ligne.categorie === "equipes"
    );

    setJoueurs(
      Array.isArray(ligneJoueurs?.donnees)
        ? ligneJoueurs.donnees
        : []
    );

    setGardiens(
      Array.isArray(ligneGardiens?.donnees)
        ? ligneGardiens.donnees
        : []
    );

    setEquipesPool(
      Array.isArray(ligneEquipes?.donnees)
        ? ligneEquipes.donnees
        : []
    );

    setChargementListesTermine(true);
  }

  chargerListesPredictionSupabase();

  const canalListesPrediction = supabase
    .channel("changements-listes-prediction")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "listes_prediction",
      },
      () => {
        chargerListesPredictionSupabase();
      }
    )
    .subscribe((statut) => {
      console.log(
        "Statut Realtime des listes :",
        statut
      );
    });

  return () => {
    composantActif = false;

    supabase.removeChannel(
      canalListesPrediction
    );
  };
}, []);

useEffect(() => {
  let composantActif = true;

  async function verifierSessionOrganisateur() {
    const { data, error } =
      await supabase.auth.getSession();

    if (!composantActif) {
      return;
    }

    if (error) {
      console.error(
        "Erreur de lecture de la session organisateur :",
        error
      );

      setSessionAdminActive(false);
      setVerificationSessionAdmin(false);
      return;
    }

    let sessionOrganisateurValide = false;

if (data.session) {
  sessionOrganisateurValide =
    await verifierRoleOrganisateur();

  if (!sessionOrganisateurValide) {
    await supabase.auth.signOut();
  }
}

setSessionAdminActive(
  sessionOrganisateurValide
);

setVerificationSessionAdmin(false);


    const params = new URLSearchParams(
      window.location.search
    );

    if (
      params.get("mode") === "admin" &&
      sessionOrganisateurValide

    ) {
      setEcran("admin");
    }
  }

  verifierSessionOrganisateur();

  const {
    data: abonnementAuthentification,
  } = supabase.auth.onAuthStateChange(
    (_evenement, session) => {
      if (!composantActif) {
        return;
      }
    
      if (!session) {
        setSessionAdminActive(false);
        setVerificationSessionAdmin(false);
    
        const params = new URLSearchParams(
          window.location.search
        );
    
        if (params.get("mode") === "admin") {
          setEcran("admin-login");
        }
    
        return;
      }
    
      verifierRoleOrganisateur().then(
        async (estOrganisateur) => {
          if (!composantActif) {
            return;
          }
    
          if (!estOrganisateur) {
            await supabase.auth.signOut();
    
            setSessionAdminActive(false);
            setEcran("admin-login");
            return;
          }
    
          setSessionAdminActive(true);
          setVerificationSessionAdmin(false);
    
          const params = new URLSearchParams(
            window.location.search
          );
    
          if (params.get("mode") === "admin") {
            setEcran("admin");
          }
        }
      );
    }
    
  );

  return () => {
    composantActif = false;

    abonnementAuthentification.subscription.unsubscribe();
  };
}, []);

useEffect(() => {
  let composantActif = true;

  async function chargerDonneesNhlSupabase() {
    const { data, error } = await supabase
      .from("donnees_nhl")
      .select(
        `
          id,
          type_choix,
          nhl_id,
          nom,
          equipe_abreviation,
          position,
          image_url,
          hero_image_url,
          logo_url,
          couleur_principale,
          couleur_secondaire,
          statistiques_carriere,
          statistiques_saisons
        `
      )
      .order("nom", {
        ascending: true,
      });

    if (error) {
      console.error(
        "Erreur de chargement des données NHL :",
        error
      );

      return;
    }

    if (!composantActif) {
      return;
    }

    const donneesNormalisees = (data || []).map(
      (ligne) => ({
        id: Number(ligne.id),
        typeChoix: ligne.type_choix,
        nhlId: Number(ligne.nhl_id),
        nom: ligne.nom,
        equipeAbreviation:
          ligne.equipe_abreviation || "",
        position: ligne.position || "",
        imageUrl: ligne.image_url || "",
        heroImageUrl: ligne.hero_image_url || "",
        logoUrl: ligne.logo_url || "",
        couleurPrincipale:
          ligne.couleur_principale || "#002f6c",
        couleurSecondaire:
          ligne.couleur_secondaire || "#94a3b8",
        statistiquesCarriere:
          ligne.statistiques_carriere || {},
        statistiquesSaisons: Array.isArray(
          ligne.statistiques_saisons
        )
          ? ligne.statistiques_saisons
          : [],
      })
    );

    setDonneesNhl(donneesNormalisees);
    setChargementDonneesNhlTermine(true);
  }

  chargerDonneesNhlSupabase();

  const canalDonneesNhl = supabase
    .channel("changements-donnees-nhl")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "donnees_nhl",
      },
      () => {
        chargerDonneesNhlSupabase();
      }
    )
    .subscribe((statut) => {
      console.log(
        "Statut Realtime des données NHL :",
        statut
      );
    });

  return () => {
    composantActif = false;
    supabase.removeChannel(canalDonneesNhl);
  };
}, []);

async function afficherEntreDeuxEncheres() {
  const { error } = await supabase
    .from("etat_pool")
    .update({
      resultat_derniere_enchere: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    console.error(
      "Erreur lors de l'affichage entre deux enchères :",
      error
    );

    alert(
      "Impossible d'afficher l'écran entre deux enchères."
    );

    return;
  }

  setEcran("admin");
}


  
  return (
    <div>
    {sessionAdminActive && ecran !== "admin-login" && (
  <div className="app-nav">
    <button onClick={() => setEcran("admin")}>Organisateur</button>
    <button onClick={ouvrirModeDGOrganisateur}>
  Mode DG
</button>
    <button onClick={() => setEcran("display")}>Écran public</button>

    <button className="danger-button" onClick={deconnecterOrganisateur}>
      Déconnexion organisateur
    </button>
  </div>
)}

{sessionAdminActive && ecran !== "admin-login" && (
  <div className="dg-selector">
    <span>DG contrôlé par l'organisateur : </span>

    {dgs.map((dg) => (
      <button
        key={dg.id}
        onClick={() => setDgConnecteId(dg.id)}
        className={dg.id === dgConnecteId ? "active-dg-button" : ""}
      >
        {dg.nom}
      </button>
    ))}
  </div>
)}
{ecran === "admin-login" &&
  verificationSessionAdmin && (
    <div className="loading-screen">
      <h1>Pool Hockey Enchère</h1>

      <section>
        <h2>Vérification de la session</h2>

        <p>
          La session organisateur est en cours de
          vérification.
        </p>
      </section>
    </div>
  )}
{ecran === "admin-login" &&
  !verificationSessionAdmin && (
    <AdminLogin
      onConnexionAdmin={
        connecterOrganisateur
      }
    />
  )}

{ecran === "dg-login" && (
  <DGLogin
    dgs={dgs}
    onAjouterDG={ajouterDG}
    onConnexionDGExistant={
      connecterDGExistant
    }
  />
)}

{ecran === "dg" && (
  dgConnecte ? (
    chargementListesTermine ? (
      <DG
        dg={dgConnecte}
        equipeDG={equipeDGConnecte}
        pointsProjetesEquipe={pointsProjetesEquipeDGConnecte}
        choixSelectionnes={
          choixSelectionnes
        }
        estTourDuDG={
          estTourDuDGConnecte
        }
        propositionEnAttente={
          propositionEnAttente
        }
        joueurs={joueurs}
        gardiens={gardiens}
        equipesPool={equipesPool}
        onPropositionSubmit={
          soumettrePropositionSupabase
        }
        enchereActive={enchereActive}
        compteRebours={compteRebours}
        onPlacerMise={placerMise}
        onDeconnexion={
          deconnecterDG
        }
      />
    ) : (
      <div className="loading-screen">
        <h1>Pool Hockey Enchère</h1>

        <section>
          <h2>
            Chargement des listes
          </h2>

          <p>
            Les listes de prédictions sont
            en cours de chargement.
          </p>
        </section>
      </div>
    )
  ) : (
    <DGLogin
      dgs={dgs}
      onAjouterDG={ajouterDG}
      onConnexionDGExistant={
        connecterDGExistant
      }
    />
  )
)}

{ecran === "admin" && (
  <Admin
    propositionEnAttente={propositionEnAttente}
    enchereActive={enchereActive}
    compteRebours={compteRebours}
    prochainDG={prochainDG}
    ordreDGIds={ordreDGIds}
    dgs={dgs}
    derniereAttributionAnnulable={derniereAttributionAnnulable}
    historiqueAttributions={historiqueAttributions}
    onImporterListesExcel={importerListesExcel}
    onTirerOrdreAleatoire={tirerOrdreAleatoire}
    onRefuserProposition={refuserPropositionSupabase}
    onApprouverProposition={approuverProposition}
    onDemarrerCompteRebours={demarrerCompteRebours}
    onAnnulerCompteRebours={annulerCompteRebours}
    onFermerMisesImmediatement={fermerMisesImmediatement}
    onReouvrirEnchere={reouvrirEnchere}
    onAttribuerChoixAuGagnant={attribuerChoixAuGagnant}
    onAnnulerEnchereActive={annulerEnchereActive}
    onAnnulerDerniereAttribution={annulerDerniereAttribution}
    onAnnulerAttributionHistorique={annulerAttributionHistorique}
    onAfficherEntreDeuxEncheres={
      afficherEntreDeuxEncheres
    }
    onExporterEquipesCSV={exporterEquipesCSV}
    onReinitialiserSauvegarde={reinitialiserSauvegarde}
    onAjouterDG={ajouterDG}
    onSupprimerDG={supprimerDG}
    onImporterDonneesNhl={
      importerDonneesNhl
    }
  />
)}

{ecran === "display" && (
  <Display
    enchereActive={enchereActive}
    compteRebours={compteRebours}
    resultatDerniereEnchere={
      resultatDerniereEnchere
    }
    dgs={dgs}
    equipesParDG={equipesParDGEnrichies}
    pointsProjetesParDG={pointsProjetesParDG}
    prochainDG={prochainDG}
    ordreDGIds={ordreDGIds}
    historiqueAttributions={
      historiqueAttributions
    }
    chargementDgsTermine={
      chargementDgsTermine
    }
    chargementOrdreTermine={
      chargementOrdreTermine
    }
    profilNhlEnchere={
      profilNhlEnchere
    }
    chargementDonneesNhlTermine={
      chargementDonneesNhlTermine
    }
    profilNhlDerniereEnchere={
      profilNhlDerniereEnchere
    }
  />
)}
    </div>
  );
}
