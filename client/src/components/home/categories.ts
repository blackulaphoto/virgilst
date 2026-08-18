import { Home, UtensilsCrossed, Briefcase, Stethoscope, HandCoins, Scale, type LucideIcon } from "lucide-react";

export type FastPathCategory = {
  key: string;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const fastPathCategories: FastPathCategory[] = [
  {
    key: "housing",
    title: "Housing",
    description: "Shelter, rent help, and housing stability programs.",
    href: "/resources/housing",
    icon: Home,
  },
  {
    key: "food",
    title: "Food",
    description: "Pantries, meal programs, and grocery support.",
    href: "/resources/food",
    icon: UtensilsCrossed,
  },
  {
    key: "jobs",
    title: "Jobs",
    description: "Find job openings, training, and career support.",
    href: "/jobs",
    icon: Briefcase,
  },
  {
    key: "healthcare",
    title: "Healthcare",
    description: "Clinics, mental health, and health coverage.",
    href: "/healthcare",
    icon: Stethoscope,
  },
  {
    key: "benefits",
    title: "Benefits",
    description: "CalFresh, CalWORKs, SSI, and other public benefits.",
    href: "/search?q=benefits",
    icon: HandCoins,
  },
  {
    key: "legal",
    title: "Legal",
    description: "Legal aid, expungement, and tenant rights support.",
    href: "/resources/legal",
    icon: Scale,
  },
];
