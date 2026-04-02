/**
 * Identifikační údaje provozovatele aplikace (zobrazení v Právních informacích).
 */

export const LEGAL_OPERATOR_INFO = `Ing. Radek Aigel

Sídlo / místo podnikání: Janského 554/3, 779 00 Olomouc
IČ: 74258575
DIČ: CZ8408093518

Telefon: +420 723 061 013
E-mail: aigelradek@gmail.com`;

/** Volitelná URL úplného dokumentu (např. web s GDPR). Nastav v .env: EXPO_PUBLIC_LEGAL_INFO_URL */
export const LEGAL_INFO_WEB_URL = (process.env.EXPO_PUBLIC_LEGAL_INFO_URL ?? "").trim();
