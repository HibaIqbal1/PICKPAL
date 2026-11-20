import {
  Shirt, ShoppingBag, Store, Gift,
  Package, Sparkles, Gem, Coffee, Heart, Utensils
} from "lucide-react";

export interface Service {
  key: string;
  label: string;
  icon: any;
}

export interface TopCategory {
  key: string;
  label: string;
  emoji: string;
  accent: string;   // icon tint
  soft: string;      // icon background
  services: Service[];
}

export const TOP_CATEGORIES: TopCategory[] = [
  {
    key: "silk_textiles", label: "Silks, Textiles & Heritage", emoji: "🥻",
    accent: "#B8541F", soft: "#FBE6D8",
    services: [
      { key: "mysore_silk", label: "Mysore Silk Sarees", icon: Shirt },
      { key: "banarasi_saree", label: "Varanasi Silk Sarees", icon: Sparkles },
      { key: "kanchipuram_silk", label: "Kanchipuram Silks", icon: Gem },
      { key: "kolhapuri_chappal", label: "Kolhapuri Leather", icon: ShoppingBag },
      { key: "chikankari", label: "Lucknow Chikankari", icon: Shirt },
    ],
  },
  {
    key: "regional_sweets", label: "Regional Sweets & Gourmet", emoji: "🍬",
    accent: "#1F7A5C", soft: "#DCF0E7",
    services: [
      { key: "nandini_ghee", label: "Nandini Dairy & Ghee", icon: Utensils },
      { key: "mysore_pak", label: "Authentic Mysore Pak", icon: Heart },
      { key: "karachi_bakery", label: "Hyderabadi Biscuits", icon: Coffee },
      { key: "spices_tea", label: "Regional Spices & Tea", icon: Package },
      { key: "regional_snacks", label: "State Specialty Snacks", icon: Gift },
    ],
  },
  {
    key: "local_markets", label: "Iconic Local Bazaars", emoji: "🏬",
    accent: "#1F4E8C", soft: "#DCE7F5",
    services: [
      { key: "commercial_street", label: "Commercial St (Bangalore)", icon: Store },
      { key: "chandni_chowk", label: "Chandni Chowk (Delhi)", icon: Store },
      { key: "charminar_bazaar", label: "Charminar Bazaar (Hyd)", icon: Store },
      { key: "devaraja_market", label: "Devaraja Market (Mysore)", icon: Store },
    ],
  },
  {
    key: "handicrafts_gifts", label: "Crafts, Gifts & NRI Specials", emoji: "🎁",
    accent: "#7A3FA0", soft: "#EDE0F5",
    services: [
      { key: "channapatna_toys", label: "Channapatna Wooden Toys", icon: Gift },
      { key: "tanjore_paintings", label: "Tanjore & Heritage Art", icon: Gem },
      { key: "brassware", label: "Authentic Brassware & Idols", icon: Sparkles },
      { key: "nri_gift_hampers", label: "NRI Custom Gift Boxes", icon: Package },
    ],
  },
];
