import type { ImageSourcePropType } from "react-native";

/**
 * Mapování pole `image` z `data/fish.json` na soubory v `mobile/assets/fish/`.
 *
 * Postup při přidání fotky:
 * 1. Soubor dej do `mobile/assets/fish/` (např. `jelec-tloust.webp`).
 * 2. V `fish.json` u druhu nastav stejný název souboru v `image`.
 * 3. Sem do `fishImageMap` přidej řádek (Metro potřebuje statické `require`):
 *    `"jelec-tloust.webp": require("../../assets/fish/jelec-tloust.webp"),`
 * 4. Z adresáře `mobile` spusť `npm run check-fish-assets` — upozorní na chybějící soubor nebo chybějící mapu.
 *
 * Část souborů může být dočasně kopií jedné fotky — v atlasu pak nahraď skutečnými snímky druhů.
 */
const fishImageMap: Record<string, ImageSourcePropType> = {
  "amur-bily.webp": require("../../assets/fish/amur-bily.webp"),
  "bolen-dravy.webp": require("../../assets/fish/bolen-dravy.webp"),
  "candat-obecny.webp": require("../../assets/fish/candat-obecny.webp"),
  "candat-vychodni.webp": require("../../assets/fish/candat-vychodni.webp"),
  "cejn-perletovy.webp": require("../../assets/fish/cejn-perletovy.webp"),
  "cejn-siny.webp": require("../../assets/fish/cejn-siny.webp"),
  "cejn-velky.webp": require("../../assets/fish/cejn-velky.webp"),
  "cejnek-maly.webp": require("../../assets/fish/cejnek-maly.webp"),
  "drsek-mensi.webp": require("../../assets/fish/drsek-mensi.webp"),
  "drsek-vetsi.webp": require("../../assets/fish/drsek-vetsi.webp"),
  "hlavac-cernousty.webp": require("../../assets/fish/hlavac-cernousty.webp"),
  "hlavacka-mramorovana.webp": require("../../assets/fish/hlavacka-mramorovana.webp"),
  "hlavatka-obecna.webp": require("../../assets/fish/hlavatka-obecna.webp"),
  "horavka-duhova.webp": require("../../assets/fish/horavka-duhova.webp"),
  "hrouzek-beloploutvy.webp": require("../../assets/fish/hrouzek-beloploutvy.webp"),
  "hrouzek-kressleruv.webp": require("../../assets/fish/hrouzek-kressleruv.webp"),
  "hrouzek-obecny.webp": require("../../assets/fish/hrouzek-obecny.webp"),
  "jelec-jesen.webp": require("../../assets/fish/jelec-jesen.webp"),
  "jelec-proudnik.webp": require("../../assets/fish/jelec-proudnik.webp"),
  "jelec-tloust.webp": require("../../assets/fish/jelec-tloust.webp"),
  "jeseter-maly.webp": require("../../assets/fish/jeseter-maly.webp"),
  "jezdik-obecny.webp": require("../../assets/fish/jezdik-obecny.webp"),
  "jezdik-zluty.webp": require("../../assets/fish/jezdik-zluty.webp"),
  "kapr-obecny.webp": require("../../assets/fish/kapr-obecny.webp"),
  "karas-obecny.webp": require("../../assets/fish/karas-obecny.webp"),
  "karas-stribrity.webp": require("../../assets/fish/karas-stribrity.webp"),
  "koljuska-triosna.webp": require("../../assets/fish/koljuska-triosna.webp"),
  "lin-obecny.webp": require("../../assets/fish/lin-obecny.webp"),
  "lipan-podhorny.webp": require("../../assets/fish/lipan-podhorny.webp"),
  "losos-obecny.webp": require("../../assets/fish/losos-obecny.webp"),
  "mnik-jednovousy.webp": require("../../assets/fish/mnik-jednovousy.webp"),
  "mrenka-mramorova.webp": require("../../assets/fish/mrenka-mramorova.webp"),
  "okoun-ricni.webp": require("../../assets/fish/okoun-ricni.webp"),
  "okounek-pstruhovy.webp": require("../../assets/fish/okounek-pstruhovy.webp"),
  "ostroretka-stehovava.webp": require("../../assets/fish/ostroretka-stehovava.webp"),
  "ostrucha-krivocara.webp": require("../../assets/fish/ostrucha-krivocara.webp"),
  "ouklej-obecna.webp": require("../../assets/fish/ouklej-obecna.webp"),
  "ouklejka-pruhovana.webp": require("../../assets/fish/ouklejka-pruhovana.webp"),
  "parma-obecna.webp": require("../../assets/fish/parma-obecna.webp"),
  "perlin-ostrobrihy.webp": require("../../assets/fish/perlin-ostrobrihy.webp"),
  "piskor-pruhovany.webp": require("../../assets/fish/piskor-pruhovany.webp"),
  "plotice-obecna.webp": require("../../assets/fish/plotice-obecna.webp"),
  "podoustev-ricni.webp": require("../../assets/fish/podoustev-ricni.webp"),
  "pstruh-duhovy.webp": require("../../assets/fish/pstruh-duhovy.webp"),
  "pstruh-obecny-forma-morska.jpg": require("../../assets/fish/pstruh-obecny-forma-morska.jpg"),
  "pstruh-obecny-forma-potocni.jpg": require("../../assets/fish/pstruh-obecny-forma-potocni.jpg"),
  "sekavcik-balkansky.webp": require("../../assets/fish/sekavcik-balkansky.webp"),
  "sekavec-podunajsky.webp": require("../../assets/fish/sekavec-podunajsky.webp"),
  "sih-marena.webp": require("../../assets/fish/sih-marena.webp"),
  "sih-peled.webp": require("../../assets/fish/sih-peled.webp"),
  "siven-americky.webp": require("../../assets/fish/siven-americky.webp"),
  "slunecnice-pestra.webp": require("../../assets/fish/slunecnice-pestra.webp"),
  "slunka-obecna.webp": require("../../assets/fish/slunka-obecna.webp"),
  "stika-obecna.webp": require("../../assets/fish/stika-obecna.webp"),
  "strevle-potocni.webp": require("../../assets/fish/strevle-potocni.webp"),
  "strevlicka-vychodni.webp": require("../../assets/fish/strevlicka-vychodni.webp"),
  "sumec-velky.webp": require("../../assets/fish/sumec-velky.webp"),
  "sumecek-americky.webp": require("../../assets/fish/sumecek-americky.webp"),
  "tolstolobik-bily.webp": require("../../assets/fish/tolstolobik-bily.webp"),
  "tolstolobik-pestry.webp": require("../../assets/fish/tolstolobik-pestry.webp"),
  "uhor-ricni.webp": require("../../assets/fish/uhor-ricni.webp"),
  "vranka-obecna.webp": require("../../assets/fish/vranka-obecna.webp"),
  "vranka-pruhoploutva.webp": require("../../assets/fish/vranka-pruhoploutva.webp")
};

export function getFishImageSource(
  imageFile: string | undefined | null
): ImageSourcePropType | null {
  if (!imageFile) return null;
  return fishImageMap[imageFile] ?? null;
}
