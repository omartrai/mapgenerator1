/**
 * Legal pages (French, the reference language for these documents).
 * {{field}} is replaced with the shop details from business.ts or a shop
 * figure; [[slug|text]] links to another legal page.
 *
 * These texts follow the usual structure for a Moroccan online shop
 * (loi 31-08 on consumer protection, loi 09-08 on personal data). Have them
 * reviewed by a legal professional before relying on them.
 */
export type LegalSlug = "mentions-legales" | "cgv" | "confidentialite";

export interface LegalSection {
  title: string;
  body: string[];
}

export interface LegalDoc {
  slug: LegalSlug;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}

export const LEGAL_SLUGS: LegalSlug[] = ["cgv", "confidentialite", "mentions-legales"];

const UPDATED = "12 novembre 2026";

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  "mentions-legales": {
    slug: "mentions-legales",
    title: "Mentions légales",
    updated: UPDATED,
    intro: "Informations sur l'éditeur et l'hébergeur du site {{brand}}.",
    sections: [
      {
        title: "Éditeur du site",
        body: [
          "Le site {{website}} est édité par {{legalName}}, {{legalForm}} au capital de {{capital}}, dont le siège est situé {{address}}, {{city}}, Maroc.",
          "Registre du commerce : {{rc}} — ICE : {{ice}} — Identifiant fiscal : {{taxId}}.",
          "Contact : {{email}} — {{phone}}.",
          "Directeur de la publication : {{publisher}}.",
        ],
      },
      {
        title: "Hébergement",
        body: [
          "Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com.",
          "Les commandes et fichiers associés sont stockés de manière privée chez le même hébergeur (Vercel Blob), dans un centre de données en Europe.",
        ],
      },
      {
        title: "Impression et livraison",
        body: [
          "Les posters sont imprimés, encadrés et livrés au Maroc par notre partenaire d'impression UrbanArt (urbanart.ma).",
        ],
      },
      {
        title: "Propriété intellectuelle",
        body: [
          "Les textes, visuels, logos et le studio de création de {{brand}} sont protégés. Toute reproduction sans autorisation écrite est interdite.",
          "Les données cartographiques proviennent d'OpenStreetMap © les contributeurs d'OpenStreetMap, sous licence ODbL (openstreetmap.org/copyright).",
          "Les posters de la Collection restent la propriété de leurs auteurs ; leur achat ne transfère aucun droit de reproduction.",
        ],
      },
      {
        title: "Données personnelles",
        body: ["Le traitement de vos données est décrit dans notre [[confidentialite|politique de confidentialité]]."],
      },
    ],
  },

  cgv: {
    slug: "cgv",
    title: "Conditions générales de vente",
    updated: UPDATED,
    intro:
      "Les présentes conditions s'appliquent à toute commande passée sur {{website}} auprès de {{legalName}} ({{brand}}). En validant une commande, vous les acceptez.",
    sections: [
      {
        title: "1. Produits",
        body: [
          "{{brand}} vend des posters de cartes personnalisés, créés par vous dans notre studio (lieu, style, textes, format, cadre), ainsi que des posters prêts à accrocher de notre Collection.",
          "L'aperçu à l'écran est fidèle à la composition imprimée ; de légères différences de couleur peuvent exister selon les écrans et le papier.",
        ],
      },
      {
        title: "2. Prix",
        body: [
          "Les prix sont indiqués en dirhams marocains (DH), toutes taxes comprises. Les frais de livraison ({{shipping}}) sont affichés avant la validation et offerts à partir de {{freeFrom}} d'achat.",
          "Le prix applicable est celui affiché au moment de la commande.",
        ],
      },
      {
        title: "3. Commande et confirmation",
        body: [
          "La commande est enregistrée après validation du formulaire. Un numéro de commande vous est communiqué à l'écran.",
          "Nous pouvons vous contacter par WhatsApp ou par téléphone pour confirmer la commande. Une commande non confirmée ou dont les coordonnées sont erronées peut être annulée.",
          "Pour les posters personnalisés, l'impression démarre après confirmation : vérifiez soigneusement l'orthographe des textes et le lieu avant de commander.",
        ],
      },
      {
        title: "4. Paiement",
        body: [
          "Le paiement s'effectue en espèces à la livraison, auprès du livreur, pour le montant total indiqué dans la commande.",
          "Le refus d'un colis commandé sans motif légitime peut entraîner le refus de commandes futures payables à la livraison.",
        ],
      },
      {
        title: "5. Livraison",
        body: [
          "Nous livrons partout au Maroc. Délais indicatifs à compter de la confirmation : 3 à 5 jours ouvrés pour un poster seul, 5 à 7 jours ouvrés pour un poster encadré.",
          "Vérifiez l'état du colis à la réception. En cas de dommage, émettez des réserves auprès du livreur et contactez-nous sous 48 heures avec des photos.",
        ],
      },
      {
        title: "6. Droit de rétractation",
        body: [
          "Conformément à la loi n° 31-08 édictant des mesures de protection du consommateur, vous disposez de 7 jours à compter de la réception pour vous rétracter, sans pénalité, à l'exception des frais de retour qui restent à votre charge.",
          "Ce droit ne s'applique pas aux produits confectionnés selon vos spécifications ou nettement personnalisés, ce qui est le cas des posters créés dans le studio (lieu, textes et options choisis par vous).",
          "Pour un poster de la Collection, informez-nous de votre rétractation par écrit ({{email}} ou WhatsApp) dans le délai ; le produit doit être retourné complet et en parfait état. Le remboursement intervient dans les 30 jours suivant la réception du retour.",
        ],
      },
      {
        title: "7. Produit défectueux ou erreur",
        body: [
          "Si votre poster arrive abîmé, présente un défaut d'impression ou ne correspond pas à votre commande, contactez-nous sous 7 jours avec des photos : nous le réimprimons ou le remplaçons sans frais, ou vous remboursons si ce n'est pas possible.",
          "Une erreur présente dans les informations que vous avez saisies (texte, lieu) ne constitue pas un défaut.",
        ],
      },
      {
        title: "8. Responsabilité",
        body: [
          "Vous garantissez disposer des droits sur les images ou logos que vous importez (icônes personnalisées) et nous dégagez de toute réclamation à ce sujet. Nous pouvons refuser un contenu illicite ou offensant.",
        ],
      },
      {
        title: "9. Données personnelles",
        body: ["Vos données sont traitées comme décrit dans notre [[confidentialite|politique de confidentialité]]."],
      },
      {
        title: "10. Réclamations et droit applicable",
        body: [
          "Pour toute question ou réclamation : {{email}} — {{phone}}. Nous recherchons toujours une solution amiable.",
          "Les présentes conditions sont soumises au droit marocain. À défaut d'accord amiable, le litige est porté devant les juridictions compétentes conformément à la loi n° 31-08.",
        ],
      },
    ],
  },

  confidentialite: {
    slug: "confidentialite",
    title: "Politique de confidentialité",
    updated: UPDATED,
    intro:
      "Cette politique explique quelles données {{brand}} collecte, pourquoi et comment vous pouvez exercer vos droits, conformément à la loi n° 09-08 relative à la protection des personnes physiques à l'égard du traitement des données à caractère personnel.",
    sections: [
      {
        title: "Responsable du traitement",
        body: [
          "{{legalName}}, {{address}}, {{city}} — {{email}}. Déclaration / autorisation CNDP : {{cndp}}.",
        ],
      },
      {
        title: "Données collectées",
        body: [
          "Lors d'une commande : nom, téléphone, e-mail, adresse et ville de livraison, instructions de livraison, contenu de la commande et la composition de votre poster (lieu, textes, icônes importées).",
          "Lors d'un avis : votre note, votre commentaire et votre prénom tel que vous l'indiquez.",
          "Si vous nous écrivez sur WhatsApp : votre numéro et vos messages liés à la commande.",
          "Données techniques nécessaires au fonctionnement du site (adresse IP, journaux techniques de l'hébergeur).",
        ],
      },
      {
        title: "Finalités",
        body: [
          "Traiter et livrer votre commande, la confirmer avec vous (WhatsApp ou téléphone), vous informer de son suivi, gérer le service client et les avis, respecter nos obligations légales et comptables, et prévenir la fraude.",
          "Nous ne vendons pas vos données et ne les utilisons pas pour de la publicité sans votre accord.",
        ],
      },
      {
        title: "Destinataires",
        body: [
          "UrbanArt, notre partenaire d'impression et de livraison au Maroc, et le transporteur : nom, téléphone, ville et adresse, uniquement pour produire et livrer la commande.",
          "Meta Platforms (WhatsApp Business) : votre numéro et les messages de confirmation, si la confirmation WhatsApp est utilisée.",
          "Vercel Inc. (hébergement du site et du stockage des commandes).",
        ],
      },
      {
        title: "Transferts hors du Maroc",
        body: [
          "L'hébergement (Vercel) et WhatsApp (Meta) impliquent un traitement de données hors du Maroc, notamment dans l'Union européenne et aux États-Unis, dans le cadre prévu par la loi n° 09-08 et avec des garanties contractuelles de ces prestataires.",
        ],
      },
      {
        title: "Durée de conservation",
        body: [
          "Les données de commande sont conservées le temps nécessaire au traitement et au service après-vente, puis archivées pour la durée exigée par les obligations comptables (jusqu'à 10 ans pour les pièces comptables). Les fichiers d'impression peuvent être supprimés après la livraison.",
        ],
      },
      {
        title: "Stockage sur votre appareil",
        body: [
          "Le site enregistre localement dans votre navigateur votre panier, votre brouillon de poster et votre langue. Ces informations restent sur votre appareil. Le site n'utilise pas de cookies publicitaires.",
        ],
      },
      {
        title: "Vos droits",
        body: [
          "Vous disposez d'un droit d'accès, de rectification et d'opposition pour motifs légitimes (articles 7 à 9 de la loi n° 09-08). Pour l'exercer, écrivez-nous à {{email}} en précisant votre numéro de commande.",
          "Vous pouvez aussi saisir la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP) — www.cndp.ma.",
        ],
      },
      {
        title: "Sécurité",
        body: [
          "Les commandes sont stockées de façon privée et ne sont accessibles qu'à l'équipe {{brand}} via un espace protégé par mot de passe.",
        ],
      },
    ],
  },
};
