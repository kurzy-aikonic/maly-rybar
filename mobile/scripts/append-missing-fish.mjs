#!/usr/bin/env node
/**
 * Doplní do ../../data/fish.json druhy podle source_cards, které v JSON ještě nejsou.
 * Latinské názvy a základní údaje = standardní česká karta / literatura (ne z OCR).
 *
 * Spusť z mobile: node scripts/append-missing-fish.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "..");
const fishPath = path.join(root, "data", "fish.json");
const cardsDir = path.join(root, "source_cards");

const slugAliases = {
  "perlin-ostrobrichy": "perlin-ostrobrihy",
  "lipan-podhorni": "lipan-podhorny"
};

/** @type {Record<string, { name_cz: string; name_lat: string; family_cz: string; min_size_cm: number; closed_season: string; is_premium: boolean; taste_group?: string; marks: string[]; similar: string[]; tips: string; intro: string; rulesExtra?: { label: string; value: string }[]; fr?: string; en: string; de: string; ru: string }>} */
const META = {
  "candat-vychodni": {
    name_cz: "Candat vychodni",
    name_lat: "Sander volgensis",
    family_cz: "Okounovití (Percidae)",
    min_size_cm: 0,
    closed_season: "viz NV — často jako candát obecný",
    is_premium: true,
    marks: ["Blízce příbuzný candátovi", "Výskyt spíše východní soustava"],
    similar: ["Candat obecny"],
    tips: "V ČR vzácný; ověř výskyt a režim lovu v NV.",
    intro:
      "Východní poddruh/skupina candáta známá z povodí Volhy a souvisejících území. V českých vodách spíše marginální; určení vyžaduje zkušenost.",
    en: "Volga pikeperch",
    de: "Wolga-Zander",
    ru: "Volžskij sudak"
  },
  "cejn-perletovy": {
    name_cz: "Cejn perletovy",
    name_lat: "Ballerus sapa",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Celoročně hájený",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 5",
    marks: [
      "Stříbřité oko se žlutým nádechem",
      "Na kartě též Abramis sapa (synonymum)"
    ],
    similar: ["Cejn siny", "Cejn velky"],
    tips: "Celoročně hájený — lov dle NV.",
    intro:
      "Bentofág hlubších řek; v ČR dolní Morava a Dyje. Jiný taxon než cejn siný (Abramis ballerus).",
    en: "White eye",
    fr: "Brême du Danube",
    de: "Zobel",
    ru: "Beloglazka"
  },
  "cejn-siny": {
    name_cz: "Cejn siny",
    name_lat: "Abramis ballerus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 5",
    marks: [
      "Namodralý hřbet",
      "Samci: bradavky nad řitní ploutví",
      "Ohrožený druh"
    ],
    similar: ["Cejn velky", "Cejnek maly", "Cejn perletovy"],
    tips: "Match, bolognes, feeder; ohrožený druh.",
    intro:
      "Zálesák; řídký výskyt v ČR, více na Moravě a Dyji. Od cejna perleťového (Ballerus sapa) jiný druh.",
    en: "Blue bream",
    fr: "Zope",
    de: "Zope",
    ru: "Siniec"
  },
  "cejnek-maly": {
    name_cz: "Cejnek maly",
    name_lat: "Blicca bjoerkna",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["Cejn okrouhlý / stříbřitý profil", "Křínek, skalák"],
    similar: ["Cejn velky", "Plotice obecna", "Podoustev ricni"],
    tips: "Plavaná a položená; veka, těsto, kroupy.",
    intro:
      "Běžná bílá ryba nížin; od cejna siného (Abramis ballerus) jiný taxon.",
    en: "Silver bream",
    fr: "Brême bordelière",
    de: "Güster",
    ru: "Gustera"
  },
  "drsek-vetsi": {
    name_cz: "Drsek vetsi",
    name_lat: "Zingel zingel",
    family_cz: "Okounovití (Percidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: true,
    marks: ["Dunajský areál", "Příbuzný drsku menšímu"],
    similar: ["Drsek mensi"],
    tips: "Chráněný / hájený — ověř v NV.",
    intro:
      "Dunajský druh příbuzný drsku menšímu (Zingel streber). V ČR výskyt velmi omezený; režim ochrany vždy ověř.",
    en: "Volga zingel",
    de: "Zingel",
    ru: "Volžskij čop"
  },
  "hlavac-cernousty": {
    name_cz: "Hlavac cernousty",
    name_lat: "Neogobius melanostomus",
    family_cz: "Hlaváčovití (Gobiidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["Invazní hlaváč", "Přísavný terč z břišních ploutví"],
    similar: ["Hlavacka mramorovana"],
    tips: "Invazní druh; ověř NV.",
    intro:
      "Neogobius melanostomus; šíření Morava, Dyje, Labe.",
    en: "Round goby",
    fr: "Gobie à taches noires",
    de: "Schwarzmundgrundel",
    ru: "Byčok-krugljak"
  },
  "hlavacka-mramorovana": {
    name_cz: "Hlavacka mramorovana",
    name_lat: "Proterorhinus marmoratus",
    family_cz: "Hlaváčovití (Gobiidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    marks: ["Trubičkovité nozdry", "Dunajský hlaváč"],
    similar: ["Hlavac cernousty"],
    tips: "Skrytý život; sportovní lov na kartě ne.",
    intro:
      "Proterorhinus marmoratus; Mušov, Dyje, Morava.",
    en: "Tubenose goby",
    fr: "Baveuse",
    de: "Marmorierte Grundel",
    ru: "Byčok-cucik"
  },
  "hlavatka-obecna": {
    name_cz: "Hlavatka obecna",
    name_lat: "Hucho hucho",
    family_cz: "Lososovití (Salmonidae)",
    min_size_cm: 65,
    closed_season: "01.01.-30.09.",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 1",
    marks: ["Velká hlava", "Lososovitý tvar", "Predátor"],
    similar: ["Losos obecny", "Pstruh obecny forma potocni"],
    tips: "Přívlač a muška; vždy NV.",
    intro:
      "Hucho hucho; parmové pásmo, ohrožený druh.",
    en: "Danubian salmon",
    fr: "Saumon de Danube",
    de: "Huchen",
    ru: "Dunajskij losos"
  },
  "hrouzek-beloploutvy": {
    name_cz: "Hrouzek beloploutvy",
    name_lat: "Romanogobio albipinnatus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 4",
    marks: ["Bělavé párové ploutve", "Dunaj, Morava, Dyje"],
    similar: ["Hrouzek obecny"],
    tips: "Lehká plavaná; tenký vlasec.",
    intro:
      "Romanogobio albipinnatus — záznam Podoustev říční v atlasu nyní Vimba vimba.",
    en: "Whitefinned gudgeon",
    fr: "Goujon bianco",
    de: "Weißflossiger Gründling",
    ru: "Beloperyj peskar"
  },
  "hrouzek-kressleruv": {
    name_cz: "Hrouzek kessleruv",
    name_lat: "Romanogobio kessleri",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Celoročně hájený",
    is_premium: true,
    marks: [
      "Hroužek — 2 vousky",
      "Postranní čára se zdvojenými skvrnami",
      "Dunaj; kriticky ohrožený"
    ],
    similar: ["Hrouzek obecny", "Hrouzek beloploutvy"],
    tips: "Celoročně hájený — určení a ochrana.",
    intro:
      "Romanogobio kessleri — hroužek Kesslerův; omezený výskyt v dunajském povodí, kriticky ohrožený.",
    en: "Kessler's gudgeon",
    fr: "Goujon du Kessler",
    de: "Kesslergründling",
    ru: "Dněstrovskij dlinnyj peskar"
  },
  "hrouzek-obecny": {
    name_cz: "Hrouzek obecny",
    name_lat: "Gobio gobio",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 4",
    marks: ["2 vousky", "Namodralý hřbet", "Nástražní rybka"],
    similar: ["Hrouzek beloploutvy"],
    tips: "Plavaná, položená; žížalky, těsto; háček 14–18.",
    intro: "Gobio gobio — hroužek obecný; hejna v tekoucích i stojatých vodách.",
    en: "Common gudgeon",
    fr: "Goujon commun",
    de: "Gründling",
    ru: "Obyknovennyj peskar"
  },
  "jelec-proudnik": {
    name_cz: "Jelec proudnik",
    name_lat: "Leuciscus leuciscus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 5",
    marks: ["Stříbřité boky", "Tření po proudu", "Nástražní rybka"],
    similar: ["Jelec tloust", "Jelec jesen", "Ouklej obecna"],
    tips: "Mušky, drobná třpytka; lehký prut.",
    intro:
      "Leuciscus leuciscus — jelec proudník; téměř po celé ČR, typická nástražní ryba.",
    en: "Dace",
    fr: "Vandoise",
    de: "Hasel",
    ru: "Jelec"
  },
  "jeseter-maly": {
    name_cz: "Jeseter maly",
    name_lat: "Acipenser ruthenus",
    family_cz: "Jeseterovití (Acipenseridae)",
    min_size_cm: 30,
    closed_season: "16.03.-15.06.",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["Štítky místo šupin", "4 vousky", "Kriticky ohrožený"],
    similar: [],
    tips: "Dle karty položená; kriticky ohrožený — NV.",
    intro:
      "Sterlet; Dunaj a ojediněle Morava/Dyje; kriticky ohrožený v ČR.",
    en: "Sterlet",
    fr: "Sterlet",
    de: "Sterlet",
    ru: "Sterljad"
  },
  "jezdik-obecny": {
    name_cz: "Jezdik obecny",
    name_lat: "Gymnocephalus cernua",
    family_cz: "Okounovití (Percidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 4",
    marks: ["Okounovitý druh při dně", "Lidově švec"],
    similar: ["Jezdik zluty", "Okoun ricni"],
    tips: "Plavaná, položená; žížaly.",
    intro:
      "Gymnocephalus cernua — ježdík obecný (ruffe). Hořavka je jiný taxon (Rhodeus amarus).",
    en: "Pope (ruffe)",
    fr: "Grémille commune",
    de: "Kaulbarsch",
    ru: "Jerš"
  },
  "karas-stribrity": {
    name_cz: "Karas stribrity",
    name_lat: "Carassius gibelio",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 3",
    marks: ["Gynogeneze", "Hřbetní ploutev vydutá", "Invazní"],
    similar: ["Karas obecny"],
    tips: "Jemná akce; jako karas obecný.",
    intro:
      "C. gibelio v atlasu; na kartách často Carassius auratus. Zavlečen v 60. letech.",
    en: "Prussian carp",
    fr: "Carpe prussienne",
    de: "Giebel",
    ru: "Serebrjanyj karas"
  },
  "koljuska-triosna": {
    name_cz: "Koljuska triosna",
    name_lat: "Gasterosteus aculeatus",
    family_cz: "Koljuškovití (Gasterosteidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 5",
    marks: ["Tři hřbetní ostny", "Kostěné štítky", "Čeřínkování"],
    similar: [],
    tips: "Lov do čeřínku; Pelecus je v atlasu jako ostrucha.",
    intro:
      "Gasterosteus aculeatus — koljuška tříostná; neostrucha křivocará.",
    en: "Three-spined stickleback",
    fr: "Épinoche à trois épines",
    de: "Großer Stichling",
    ru: "Trechiglaja koljuška"
  },
  "losos-obecny": {
    name_cz: "Losos obecny",
    name_lat: "Salmo salar",
    family_cz: "Lososovití (Salmonidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení (zákon)",
    is_premium: true,
    marks: ["Anadromní", "Celoročně hájený dle § 13", "Losos 2000"],
    similar: ["Pstruh obecny forma morska"],
    tips: "V ČR vymizelý; reintrodukce; vždy NV.",
    intro:
      "Salmo salar; u nás celoročně hájen dle zákona; karta vs. zákon v atlasu.",
    en: "Atlantic salmon",
    fr: "Saumon atlantique",
    de: "Lachs",
    ru: "Blagorodnyj losos"
  },
  "mrenka-mramorova": {
    name_cz: "Mrenka mramorovana",
    name_lat: "Barbatula barbatula",
    family_cz: "Střevličkovití (Nemacheilidae / Cobitidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 4",
    marks: ["Šest vousků", "Mramorované boky", "Bez zubů v tlamě"],
    similar: [],
    tips: "Střevle potoční v atlasu = Phoxinus phoxinus (jiný druh než tato mřenka).",
    intro:
      "Barbatula barbatula; střevle potoční = Phoxinus phoxinus.",
    en: "Stone loach",
    fr: "Loche franche",
    de: "Schmerle",
    ru: "Golec"
  },
  "okounek-pstruhovy": {
    name_cz: "Okounek pstruhovy",
    name_lat: "Micropterus salmoides",
    family_cz: "Okounovití (Centrarchidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 1",
    marks: [
      "Velká tlamice — hranice ústní dutiny za okem",
      "Dvě hřbetní ploutve",
      "Tmavozelený hřbet"
    ],
    similar: ["Okoun ricni"],
    tips: "Přívlač a muška; umělé nástrahy.",
    intro:
      "Largemouth bass; nepůvodní u nás (1889 Třeboňsko); rekord ČR 1,12 kg / 39 cm.",
    en: "Largemouth bass",
    fr: "Perche truitée",
    de: "Forellenbarsch",
    ru: "Bolšerotyj okuň"
  },
  "ostrucha-krivocara": {
    name_cz: "Ostrucha krivocara",
    name_lat: "Pelecus cultratus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: true,
    taste_group: "Chuť (karta): neuvedeno — druh hájen",
    marks: [
      "Velmi dlouhé prsní ploutve",
      "Extrémně štíhlé tělo",
      "Morava a Dyje — dolní toky"
    ],
    similar: [],
    tips: "Celoročně hájená; v atlasu jen informace.",
    intro:
      "Sabrefish; v ČR dolní Morava a Dyje; vejce se vyvíjejí unášena proudem.",
    en: "Sabrefish",
    fr: "Rasoir",
    de: "Ziege",
    ru: "Čechon"
  },
  "ouklej-obecna": {
    name_cz: "Ouklej obecna",
    name_lat: "Alburnus alburnus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 5",
    marks: ["Stříbřitá", "Úzké tělo", "Jedna hřbetní"],
    similar: ["Plotice obecna", "Ouklejka pruhovana"],
    tips: "Plavaná a muška; malé kuličky těsta, bílé červy.",
    intro:
      "Planktonofág cejnového pásma; rekord ČR 0,225 kg / 27,5 cm, Bečva 2, 2007.",
    en: "Bleak",
    fr: "Ablette commune",
    de: "Ukelei",
    ru: "Obyknovennaja ukleja"
  },
  "ouklejka-pruhovana": {
    name_cz: "Ouklejka pruhovana",
    name_lat: "Alburnoides bipunctatus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: true,
    taste_group: "Chuť (karta): neuvedeno — druh hájen",
    marks: [
      "Dvě tečky u kořene ocasu",
      "Tmavší pruh po boku",
      "VU v ČR"
    ],
    similar: ["Ouklej obecna"],
    tips: "Celoročně hájená; lidově čorek.",
    intro:
      "Spirlin; proudové úseky toků; rekord ČR 17,7 cm, Svitava 1, 2015.",
    en: "Spirlin",
    fr: "Spirlin",
    de: "Schneider",
    ru: "Bystrjanka"
  },
  "parma-obecna": {
    name_cz: "Parma obecna",
    name_lat: "Barbus barbus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 40,
    closed_season: "16.03.-15.06.",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 3",
    marks: ["Čtyři vousky", "Protáhlé tělo", "Parmové pásmo"],
    similar: ["Plotice obecna", "Jelec tloust"],
    tips: "Plavaná a položená; rousnice, těsto, sýr.",
    intro:
      "Parma obecná = Barbus barbus (barbeau); rekord ČR 6,25 kg / 82 cm, Otava 5, 1998.",
    en: "Barbel",
    fr: "Barbeau commun",
    de: "Barbe",
    ru: "Usač"
  },
  "piskor-pruhovany": {
    name_cz: "Piskor pruhovany",
    name_lat: "Misgurnus fossilis",
    family_cz: "Sekavcovití (Cobitidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: true,
    taste_group: "Chuť (karta): neuvedeno — druh hájen",
    marks: ["10 vousků", "Střevní dýchání", "EN v ČR"],
    similar: [],
    tips: "Celoročně hájený (EN); sekavec podunajský v atlasu = Cobitis elongatoides, ne Misgurnus.",
    intro:
      "Misgurnus fossilis; Romanogobio belingi je jiný taxon. Sekavec podunajský = Cobitis elongatoides.",
    en: "Weather loach (mudfish)",
    fr: "Loche d'étang",
    de: "Schlammpeitzger",
    ru: "Vjun (piskun)"
  },
  "podoustev-ricni": {
    name_cz: "Podoustev ricni",
    name_lat: "Vimba vimba",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 25,
    closed_season: "16.03.-15.06.",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 3",
    marks: ["Dlouhá řitní ploutev", "Hejna", "Labe, Odra, Morava"],
    similar: ["Cejnek maly", "Parma obecna"],
    tips: "Plavaná a položená; larvy chrostíků, červi, veka.",
    intro:
      "Vimba vimba; Romanogobio albipinnatus = hroužek běloploutvý.",
    en: "Vimba",
    fr: "Serte",
    de: "Zährte",
    ru: "Rybec"
  },
  "sekavcik-balkansky": {
    name_cz: "Sekavcik balkansky",
    name_lat: "Sabanejewia balcanica",
    family_cz: "Sekavcovití (Cobitidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: true,
    taste_group: "Chuť (karta): neuvedeno — druh hájen",
    marks: ["Šest vousků", "Trubičkové nozdry", "Bečva, Dunajské povodí"],
    similar: ["Sekavec podunajsky"],
    tips: "Celoročně hájený (CR); kriticky ohrožený.",
    intro:
      "Povodí Dunaje, v ČR Bečva; dříve často Cobitis elongata. Celoročně hájený.",
    en: "Balkan spiny loach",
    fr: "Loche de Danube",
    de: "Balkanischer Steinbeißer",
    ru: "Peredneaziatskaja ščipovka"
  },
  "sekavec-podunajsky": {
    name_cz: "Sekavec podunajsky",
    name_lat: "Cobitis elongatoides",
    family_cz: "Sekavcovití (Cobitidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: true,
    taste_group: "Chuť (karta): neuvedeno — druh hájen",
    marks: ["Šest vousků", "Trn pod okem", "Písčité dno"],
    similar: ["Sekavcik balkansky", "Piskor pruhovany"],
    tips: "Celoročně hájený (EN); odlišný od Misgurnus (piskoř pruhovaný).",
    intro:
      "Cobitis elongatoides; Misgurnus fossilis = piskoř pruhovaný — jiný druh.",
    en: "Danube spined loach",
    fr: "Loche de rivière",
    de: "Steinbeißer",
    ru: "Ščipovka"
  },
  "sih-marena": {
    name_cz: "Sih marena",
    name_lat: "Coregonus maraena",
    family_cz: "Lososovití (Salmonidae) — podčeleď síhové",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["Pelagiální síh", "Stříbřité boky", "Prsní ploutev nažlutlá"],
    similar: ["Sih peled"],
    tips: "Plavaná, položená, přívlač, muška; žížaly, mušky, marmyšky.",
    intro:
      "Nepůvodní (1882); chladné rybníky a údolní nádrže; průměr úlovků 0,3–0,5 kg.",
    en: "Common whitefish",
    fr: "Lavaret",
    de: "Groß Maräne",
    ru: "Prochodnyj sig"
  },
  "sih-peled": {
    name_cz: "Sih peled",
    name_lat: "Coregonus peled",
    family_cz: "Lososovití (Salmonidae) — podčeleď síhové",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["Stříbřitý síh", "Dovezen 1970", "Křížení s marénou plodné"],
    similar: ["Sih marena"],
    tips: "Plavaná, položená, přívlač, muška; drobné nástrahy, plankton.",
    intro:
      "Nepůvodní (1970); chov jako maréna; čisté populace u nás zanikly; průměr úlovků 0,3–0,5 kg.",
    en: "Peled whitefish",
    fr: "Grand powan",
    de: "Peledmaräne",
    ru: "Peljad"
  },
  "slunecnice-pestra": {
    name_cz: "Slunecnice pestra",
    name_lat: "Lepomis gibbosus",
    family_cz: "Měnicovití (Centrarchidae); karta: okounovití",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["Červené oko", "Skvrna na žaberním víčku u samce", "Zavlečena 1929"],
    similar: [],
    tips: "Plavaná, přívlač, muška; malá živočišná nástraha.",
    intro:
      "Nepůvodní; tůně, kanály; samec hlídá jikry; rekord délka 21,5 cm Labe 2018.",
    en: "Crappie",
    fr: "Perche-soleil",
    de: "Sonnenbarsch",
    ru: "Carek"
  },
  "strevle-potocni": {
    name_cz: "Strevle potocni",
    name_lat: "Phoxinus phoxinus",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Celoroční hájení",
    is_premium: false,
    taste_group: "Chuť (karta): neuvedeno — druh hájen",
    marks: ["Neúplná postr. čára", "Samci červené břicho v tření", "Pstruhové toky"],
    similar: [],
    tips: "Celoročně hájená; mřenka mramorovaná = Barbatula (jiný druh).",
    intro:
      "Phoxinus phoxinus — zranitelný druh pstruhových vod; záměna s mřenkou vyloučena.",
    en: "Common minnow",
    fr: "Vairon commune",
    de: "Elritze",
    ru: "Goljan"
  },
  "sumecek-americky": {
    name_cz: "Sumecek americky",
    name_lat: "Ameiurus nebulosus",
    family_cz: "Sumečkovití (Ictaluridae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: true,
    taste_group: "Chuť (karta): stupeň 2",
    marks: ["8 vousků", "Trny v prsních ploutvích", "Dovezen 1890"],
    similar: ["Sumec velky"],
    tips: "Plavaná, položená; žížaly; pozor na trny; A. melas na jihu Čech.",
    intro:
      "Bahno a tůně; rekord 1,24 kg Labe 2012; průměr 0,15–0,25 kg.",
    en: "Brown bullhead",
    fr: "Poisson-chat",
    de: "Zwergwels",
    ru: "Amerikanskij somik-koška"
  },
  "tolstolobik-bily": {
    name_cz: "Tolstolobik bily",
    name_lat: "Hypophthalmichthys molitrix",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 3",
    marks: ["Fytoplankton", "Hejna pod hladinou", "Plůdek 1965"],
    similar: ["Tolstolobik pestry", "Amur bily"],
    tips: "Plavaná, položená; těstoviny a luštěniny; rekord 40 kg Labe 2006.",
    intro:
      "Filtruje řasy a sinice; úniky při povodních; kříženci s pestrým.",
    en: "Silver carp",
    fr: "Carpe argentée",
    de: "Silberkarpfen",
    ru: "Belyj tolstolobik"
  },
  "tolstolobik-pestry": {
    name_cz: "Tolstolobik pestry",
    name_lat: "Hypophthalmichthys nobilis",
    family_cz: "Kaprovití (Cyprinidae)",
    min_size_cm: 0,
    closed_season: "Nehajena",
    is_premium: false,
    taste_group: "Chuť (karta): stupeň 3",
    marks: ["Velká hlava", "Zooplankton", "Plůdek 1964"],
    similar: ["Tolstolobik bily"],
    tips: "Náhodově u kapra/amura; rekord 45 kg Prušánky 2012.",
    intro:
      "Zooplankton v dospělosti; stejný režim úniků a líhní jako bílý druh.",
    en: "Big head carp",
    fr: "Carpe marmoréene",
    de: "Marmorkarpfen",
    ru: "Pestryj tolstolobik"
  }
};

const DEFAULT_METHODS = [
  { id: "float", label: "Plavaná", active: true },
  { id: "ledger", label: "Položená", active: true },
  { id: "spin", label: "Přívlač", active: false },
  { id: "fly", label: "Muškaření", active: false },
  { id: "other", label: "Ostatní", active: false }
];

function slugToId(slug) {
  return "fish_" + slug.replace(/-/g, "_");
}

function buildRecord(slug, m) {
  const names_i18n = {
    en: m.en,
    de: m.de,
    ru: m.ru
  };
  if (m.fr) names_i18n.fr = m.fr;

  const rulesRows = [
    m.min_size_cm > 0
      ? { label: "Zákonná míra (orientačně)", value: `${m.min_size_cm} cm` }
      : { label: "Zákonná míra", value: "viz NV (často bez univerzální míry)" },
    { label: "Doba hájení", value: m.closed_season }
  ];
  if (m.rulesExtra) rulesRows.push(...m.rulesExtra);

  const sections = [
    {
      id: "intro",
      title: "Přehled druhu",
      premium: false,
      paragraphs: [m.intro + " Údaje v atlasu doplň podle své karty a aktuálního NV."]
    },
    {
      id: "classification",
      title: "Zařazení",
      premium: false,
      rows: [
        { label: "Čeleď", value: m.family_cz },
        ...(m.taste_group
          ? [{ label: "Chuť / kvalita", value: m.taste_group }]
          : [])
      ]
    },
    {
      id: "rules",
      title: "Právní rámec",
      premium: false,
      intro: "Vždy ověř platné NV pro konkrétní revír — údaje jsou orientační.",
      rows: rulesRows
    },
    {
      id: "id_quick",
      title: "Rychlé rozpoznání",
      premium: false,
      bullets: m.marks
    },
    {
      id: "methods",
      title: "Způsob lovu / náčiní",
      premium: true,
      methods: DEFAULT_METHODS,
      rows: [
        { label: "Prut", value: "dle velikosti ryby a revíru" },
        { label: "Vlasec", value: "tenčí u drobných druhů, silnější u velkých kaprovitých" },
        { label: "Háček", value: "dle pravidel revíru" }
      ]
    },
    {
      id: "significance",
      title: "Význam a výskyt",
      premium: true,
      paragraphs: [
        "Detailní morfologii, přesné paprsky a rekordy doplníš z papírové karty nebo z oficiálních tabulek."
      ]
    }
  ];

  return {
    id: slugToId(slug),
    name_cz: m.name_cz,
    name_lat: m.name_lat,
    image: `${slug}.webp`,
    min_size_cm: m.min_size_cm,
    closed_season: m.closed_season,
    identification_marks: m.marks,
    similar_species: m.similar,
    tips: m.tips,
    is_premium: m.is_premium,
    detail: {
      family_cz: m.family_cz,
      ...(m.taste_group ? { taste_group: m.taste_group } : {}),
      names_i18n,
      sections
    }
  };
}

function main() {
  const fish = JSON.parse(fs.readFileSync(fishPath, "utf8"));
  const existingIds = new Set(fish.map((f) => f.id));
  const have = new Set(
    fish.map((f) => f.image.replace(/\.(webp|jpg|jpeg)$/i, ""))
  );
  let cards = [];
  if (fs.existsSync(cardsDir)) {
    cards = fs
      .readdirSync(cardsDir)
      .filter((f) => f.endsWith(".jpg"))
      .map((f) => f.replace(".jpg", ""));
  } else {
    cards = Object.keys(META);
  }

  const toAdd = [];
  for (const slug of cards) {
    const alias = slugAliases[slug] || slug;
    if (have.has(slug) || have.has(alias)) continue;
    if (existingIds.has(slugToId(slug))) continue;
    const meta = META[slug];
    if (!meta) {
      console.warn("Chybí META pro slug:", slug);
      continue;
    }
    toAdd.push(buildRecord(slug, meta));
    have.add(slug);
  }

  toAdd.sort((a, b) => a.name_cz.localeCompare(b.name_cz, "cs"));
  const merged = [...fish, ...toAdd];
  fs.writeFileSync(fishPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
  console.log("Přidáno druhů:", toAdd.length, "→ celkem", merged.length);
}

main();
