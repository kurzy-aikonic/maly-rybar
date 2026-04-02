/**
 * Informační minimum pro uživatele (GDPR, spotřebitel, odpovědnost za obsah).
 * Údaje provozovatele: `src/constants/legalOperator.ts`.
 */

export const LEGAL_SECTIONS: { title: string; body: string }[] = [
  {
    title: "Účel aplikace a odpovědnost za údaje o rybaření",
    body: `Aplikace „Malý rybář“ slouží k výuce, přípravě na rybářský průkaz a bezpečnému chování u vody. Údaje o druzích ryb (míry, hájení, popisy) vycházejí z dat v aplikaci a obecně dostupných zdrojů a jsou pouze informativní.

Před lovem a na konkrétním revíru vždy platí zákon, návní řád příslušného uživatele revírů a pokyny spolku. Provozovatel neodpovídá za rozhodnutí učiněná výhradně podle údajů v aplikaci bez ověření u úřadu nebo spolku.`
  },
  {
    title: "Osobní údaje a zpracování (GDPR)",
    body: `Pokud se přihlásíš e-mailem nebo využiješ synchronizaci účtu, zpracováváme údaje potřebné k provozu účtu (zejména identifikátor uživatele, e-mail, údaje profilu, které zadáš, a případně záznamy aktivit, které aplikace ukládá podle svého nastavení).

Údaje zpracováváme za účelem poskytnutí služby, zlepšování aplikace a plnění právních povinností. Zpracování může probíhat u poskytovatelů technických služeb (hosting databáze, autentizace, případně platby a analytika), a to v souladu s jejich podmínkami a standardními smluvními doložkami.

Doba uchování: po dobu existence účtu a nezbytně po jeho zrušení, pokud to vyžaduje zákon. Máš právo na přístup, opravu, výmaz, omezení zpracování, přenositelnost (kde to dává smysl), námitku a odvolání souhlasu u zpracování na jeho základě. Můžeš podat stížnost u Úřadu pro ochranu osobních údajů (www.uoou.cz).

Úplný text zásad zpracování osobních údajů může provozovatel zveřejnit na webu — v aplikaci je odkaz v zápatí právních informací, pokud je URL nastavena.`
  },
  {
    title: "Děti a souhlas zákonného zástupce",
    body: `Aplikace cílí na děti v rozmezí věku uvedeném v úvodním nastavení. Zpracování osobních údajů dítěte musí být v souladu s GDPR — v ČR do 15 let je obvykle nutný souhlas nebo pokyn rodiče či jiného zákonného zástupce.

V úvodní obrazovce je proto vyžadován souhlas zákonného zástupce s používáním aplikace. Rodiče by měli s dítětem projít sekci Právní informace a nastavení účtu.`
  },
  {
    title: "Digitální obsah a předplatné",
    body: `Některé funkce mohou být nabízeny jako placené (Premium). Nákup probíhá přes platební bránu obchodu aplikací (Apple App Store / Google Play) podle jejich podmínek.

Odstoupení od smlouvy a reklamace se řídí občanským zákoníkem a podmínkami příslušného obchodu. Účtenku a historii předplatného najdeš v účtu u Apple nebo Google.`
  },
  {
    title: "Cookies a podobné technologie",
    body: `Mobilní aplikace jako taková běžně nepoužívá cookies. Pokud otevřeš odkazy do webového prohlížeče (např. ČRS), platí zásady cookies daného webu.`
  },
  {
    title: "Změny a kontakt",
    body: `Provozovatel může tyto informace aktualizovat. Datum poslední úpravy uvádíme v zápatí tohoto textu.

Pro žádosti týkající se osobních údajů použij kontaktní údaje provozovatele uvedené v bloku Provozovatel níže.`
  }
];

export const LEGAL_FOOTER = `Text je informativní a nenahrazuje individuální právní poradu. Poslední úprava shrnutí v aplikaci: 2026-03-31.`;
