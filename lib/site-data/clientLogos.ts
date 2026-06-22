/** Maps roster display names to files under public/images/client-logos/. */
export const CLIENT_LOGO_SRC_BY_NAME: Readonly<Record<string, string>> = {
  "Ambuja Neotia": "/images/client-logos/AmbujaNeotia.png",
  "Annapurna Finance": "/images/client-logos/AnnapurnaMicroFinance.jpg",
  "Bureau of Indian Standards": "/images/client-logos/BIS.jpg",
  BSPHCL: "/images/client-logos/BSPHCL.jpg",
  "Canara Bank": "/images/client-logos/CanaraBank.jpg",
  "CRI Pumps": "/images/client-logos/CRIPumps.jpg",
  "D. Goenka School": "/images/client-logos/GDGoenka.jpg",
  "Essel Utilities": "/images/client-logos/EsselUtilities.jpg",
  "FHI 360": "/images/client-logos/FHI360.png",
  "Franklin Templeton Investments": "/images/client-logos/FranklinTempleton.jpg",
  "Government of Bihar": "/images/client-logos/BiharGovernment.jpg",
  HDFC: "/images/client-logos/HDFCLogo.jpg",
  Hyundai: "/images/client-logos/HyundaiLogo.jpg",
  "IDBI Bank": "/images/client-logos/IDBIBankLogo.png",
  "Income Tax Department": "/images/client-logos/IncomeTaxdepartment.png",
  IndianOil: "/images/client-logos/GOILogo.jpg",
  "JSW": "/images/client-logos/JSW.png",
  "L&T": "/images/client-logos/LandT.png",
  "Maruti Suzuki": "/images/client-logos/MarutiSuzuki.png",
  MECON: "/images/client-logos/MECON.jpg",
  SAIL: "/images/client-logos/SAIL.png",
  Shriram: "/images/client-logos/ShriramTransportFianance.png",
  "SITI Networks": "/images/client-logos/SITICable.png",
  "Sonalika International": "/images/client-logos/Sonalika.jpg",
  "Survey of India": "/images/client-logos/SurveyofIndia.jpg",
  "Syndicate Bank": "/images/client-logos/SyndicateBank.png",
  "Tata Motors": "/images/client-logos/TataMotors.jpg",
  Titan: "/images/client-logos/Titan.png",
  "Ujjivan Small Finance Bank": "/images/client-logos/UjjivanBank.jpg",
  "Usha International": "/images/client-logos/USHA.png",
};

export function resolveClientLogoSrc(name: string, explicitSrc?: string): string | undefined {
  if (explicitSrc) return explicitSrc;
  return CLIENT_LOGO_SRC_BY_NAME[name];
}
