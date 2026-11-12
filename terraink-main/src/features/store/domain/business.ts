/**
 * The shop's legal identity, shown in the legal notice, terms of sale and
 * privacy policy. Empty fields appear highlighted as "[à compléter]" on
 * those pages until they are filled in.
 */
export const BUSINESS = {
  /** Brand shown to customers. */
  brand: "Noria",
  /** Raison sociale (e.g. "Noria SARL AU") or the auto-entrepreneur's full name. */
  legalName: "",
  /** Forme juridique (SARL, SARL AU, auto-entrepreneur…). */
  legalForm: "",
  /** Capital social, for companies (e.g. "10 000 DH"). */
  capital: "",
  /** Siège social / adresse professionnelle. */
  address: "",
  city: "",
  /** Registre du commerce (RC) and its city. */
  rc: "",
  /** Identifiant Commun de l'Entreprise. */
  ice: "",
  /** Identifiant fiscal. */
  taxId: "",
  /** Customer contact. */
  email: "",
  phone: "",
  /** Directeur de la publication (usually the manager). */
  publisher: "",
  /** CNDP receipt / authorisation number (loi 09-08), once filed. */
  cndp: "",
  /** Website address. */
  website: "",
} as const;

export type BusinessField = keyof typeof BUSINESS;
