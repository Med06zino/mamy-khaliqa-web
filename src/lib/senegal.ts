/**
 * Découpage géographique du Sénégal pour les formulaires de livraison.
 *
 * Structure :
 *  - 14 régions officielles
 *  - Pour Dakar : communes et quartiers populaires détaillés
 *  - Pour les autres régions : villes principales
 */

export interface SenegalZone {
  region: string;
  communes: string[];
}

export const SENEGAL_REGIONS: string[] = [
  "Dakar",
  "Thiès",
  "Diourbel",
  "Fatick",
  "Kaolack",
  "Kaffrine",
  "Kolda",
  "Louga",
  "Matam",
  "Saint-Louis",
  "Sédhiou",
  "Tambacounda",
  "Ziguinchor",
  "Kédougou",
];

/** Communes / quartiers regroupés par région */
export const SENEGAL_COMMUNES: Record<string, string[]> = {
  Dakar: [
    // Dakar Plateau & Centre
    "Plateau",
    "Médina",
    "Grand-Dakar",
    "Biscuiterie",
    "HLM",
    "Point E",
    "Fann-Point E-Amitié",
    "Mermoz-Sacré-Cœur",
    // Banlieue Nord
    "Parcelles Assainies",
    "Camberène",
    "Yeumbeul Nord",
    "Yeumbeul Sud",
    "Malika",
    "Keur Massar",
    "Jaxaay-Parcelles-Niakoul Rab",
    // Pikine
    "Pikine",
    "Guinaw Rails",
    "Thiaroye",
    "Thiaroye-sur-Mer",
    "Dalifort-Foirail",
    "Djidah Thiaroye Kao",
    // Guédiawaye
    "Guédiawaye",
    "Sam Notaire",
    "Golf Sud",
    "Médina Gounass",
    "Ndiarème-Limamoulaye",
    // Rufisque
    "Rufisque",
    "Bargny",
    "Diamniadio",
    "Sébikotane",
    "Sangalkam",
    // Presqu'île
    "Les Almadies",
    "Ouakam",
    "Ngor",
    "Yoff",
    "Cambérène",
    // Grand Dakar
    "Sicap Liberté",
    "Dieuppeul-Derklé",
    "Fass-Gueule Tapée-Colobane",
    "Bene Tally",
    "Grange",
  ],

  "Thiès": [
    "Thiès Nord",
    "Thiès Est",
    "Thiès Ouest",
    "Mbour",
    "Tivaouane",
    "Saly",
    "Joal-Fadiouth",
    "Ngaparou",
    "Popenguine",
  ],

  "Diourbel": ["Diourbel", "Mbacké", "Touba", "Bambey"],
  "Fatick":   ["Fatick", "Gossas", "Foundiougne"],
  "Kaolack":  ["Kaolack", "Guinguinéo", "Nioro du Rip"],
  "Kaffrine": ["Kaffrine", "Koungheul", "Birkelane", "Malem-Hodar"],
  "Kolda":    ["Kolda", "Vélingara", "Médina Yoro Fula"],
  "Louga":    ["Louga", "Linguère", "Kébémer"],
  "Matam":    ["Matam", "Kanel", "Ranérou"],
  "Saint-Louis": ["Saint-Louis", "Dagana", "Podor", "Richard-Toll"],
  "Sédhiou":  ["Sédhiou", "Bounkiling", "Goudomp"],
  "Tambacounda": ["Tambacounda", "Bakel", "Goudiry", "Koumpentoum"],
  "Ziguinchor": ["Ziguinchor", "Bignona", "Oussouye"],
  "Kédougou": ["Kédougou", "Saraya", "Salemata"],
};

/** Retourne les communes d'une région donnée */
export function getCommunesByRegion(region: string): string[] {
  return SENEGAL_COMMUNES[region] ?? [];
}
