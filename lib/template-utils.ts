import type { Template } from "@/lib/types";
import { TEMPLATES } from "@/lib/templates";

export type CategoryType = "professional" | "bold" | "minimal" | "colorful" | "dark";

const CATEGORY_INFO: Record<CategoryType, { label: string; icon: string; description: string }> = {
  professional: {
    label: "Professional",
    icon: "💼",
    description: "Clean, corporate, and authoritative designs",
  },
  bold: {
    label: "Bold",
    icon: "⚡",
    description: "High-energy, eye-catching layouts",
  },
  minimal: {
    label: "Minimal",
    icon: "✨",
    description: "Simple, elegant, focused designs",
  },
  colorful: {
    label: "Colorful",
    icon: "🎨",
    description: "Vibrant, creative, visually rich",
  },
  dark: {
    label: "Dark",
    icon: "🖤",
    description: "Luxury, premium, sophisticated",
  },
};

export function getCategoryInfo(category: CategoryType) {
  return CATEGORY_INFO[category];
}

export function getTemplatesByCategory(category: CategoryType): Template[] {
  return TEMPLATES.filter((t) => t.category === category);
}

export function getPopularTemplates(): Template[] {
  return TEMPLATES.filter((t) => t.isFeatured).slice(0, 6);
}

export function getNewTemplates(): Template[] {
  return TEMPLATES.filter((t) => t.isNew).slice(0, 4);
}

export function getTemplateById(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}

export function searchTemplates(query: string): Template[] {
  const q = query.toLowerCase();
  return TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.tag?.toLowerCase().includes(q)
  );
}

export function getAllCategories(): CategoryType[] {
  return ["professional", "bold", "minimal", "colorful", "dark"];
}
