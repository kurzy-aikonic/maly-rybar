import type {
  FishDetailSection,
  FishRecord,
  ResolvedFishSection
} from "../types/fish";

function buildFallbackSections(fish: FishRecord): FishDetailSection[] {
  const sections: FishDetailSection[] = [];

  if (fish.tips?.trim()) {
    sections.push({
      id: "tips",
      title: "Tip k lovu",
      premium: false,
      paragraphs: [fish.tips]
    });
  }

  sections.push(
    {
      id: "rules",
      title: "Právní rámec",
      premium: false,
      rows: [
        {
          label: "Zákonná míra",
          value:
            typeof fish.min_size_cm === "number" && fish.min_size_cm > 0
              ? `${fish.min_size_cm} cm`
              : fish.min_size_cm === 0
                ? "bez zákonné míry (ověř NV)"
                : "viz platné NV"
        },
        { label: "Doba hájení", value: fish.closed_season }
      ]
    },
    {
      id: "quick_id",
      title: "Rychlé rozpoznání",
      premium: false,
      bullets: fish.identification_marks
    }
  );

  if (fish.similar_species?.length) {
    sections.push({
      id: "similar",
      title: "Podobné druhy",
      premium: false,
      rows: fish.similar_species.map((name) => ({ label: "•", value: name }))
    });
  }

  sections.push({
    id: "card_note",
    title: "O této kartě",
    premium: false,
    paragraphs: [
      "Úplná odborná karta (morfologie, biologie, náčiní, metody lovu) se u tohoto druhu postupně doplňuje — vzor mají kapr a pstruh obecný. Výše jsou vždy platné základní údaje z databáze."
    ]
  });

  sections.push(
    {
      id: "morphology",
      title: "Znaky (morfologie, paprsky)",
      premium: true,
      paragraphs: [
        "Počty paprsků, šupiny a přesné znaky pro určování podle metodik doplníme. Do té doby použij sekci rychlé rozpoznání výše."
      ]
    },
    {
      id: "biology_angling",
      title: "Biologie, potrava a lov",
      premium: true,
      paragraphs: [
        "Rozšířený popis barvy, tření, nástrah a náčiní přidáme ve stejné struktuře jako u vzorových druhů."
      ]
    },
    {
      id: "significance",
      title: "Význam, výskyt, zajímavosti",
      premium: true,
      paragraphs: [
        "Doplníme souhrn významu druhu v českých vodách a praktické poznámky pro rybáře."
      ]
    }
  );

  return sections;
}

export function resolveFishSections(
  fish: FishRecord,
  isPremium: boolean
): ResolvedFishSection[] {
  const raw =
    fish.detail?.sections?.length && fish.detail.sections.length > 0
      ? fish.detail.sections
      : buildFallbackSections(fish);

  return raw.map((s) => ({
    ...s,
    locked: Boolean(s.premium) && !isPremium
  }));
}

export function getFishDetailHeader(fish: FishRecord) {
  const d = fish.detail;
  return {
    family_cz: d?.family_cz,
    taste_group: d?.taste_group,
    names_i18n: d?.names_i18n
  };
}
