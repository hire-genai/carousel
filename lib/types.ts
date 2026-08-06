export type InputMode = "topic" | "youtube" | "product" | "url" | "text";

export type FontFamily =
  | "Inter"
  | "Georgia"
  | "Oswald"
  | "Playfair Display"
  | "Roboto Mono"
  | "Space Grotesk";

export type HeadlineSize = "lg" | "xl" | "2xl" | "3xl";
export type BodySize = "xs" | "sm" | "base";
export type TextAlign = "left" | "center";
export type TextPosition = "top" | "middle" | "bottom";

export interface SlideDesign {
  bgType: "gradient" | "solid" | "image";
  bgGradient: string;
  bgColor: string;
  bgImage: string;
  bgOverlay: number;
  // Typography (Phase 4)
  fontFamily: FontFamily;
  headlineSize: HeadlineSize;
  bodySize: BodySize;
  textAlign: TextAlign;
  textPosition: TextPosition;
  headlineBold: boolean;
  headlineItalic: boolean;
  showDecos: boolean;
  textColor: string;
}

export interface Slide {
  headline: string;
  body: string;
  bullets?: string[];
  design?: SlideDesign;
}

export interface CarouselData {
  title: string;
  slides: Slide[];
}

export interface GenerateRequest {
  mode: InputMode;
  content: string;
  numSlides: number;
  audience?: string;
  tone?: string;
  topic?: string;
  keyPoints?: string[];
  painPoints?: string[];
}

export interface GenerateResponse {
  carousel?: CarouselData;
  carouselId?: string;
  error?: string;
}

export type LayoutStyle =
  | "bold-center"
  | "tag-headline"
  | "minimal-left"
  | "number-hero"
  | "accent-word"
  | "quote-center"
  | "profile-card"
  | "arrow-list";

export interface Template {
  id: string;
  name: string;
  category: "bold" | "minimal" | "colorful" | "professional" | "dark";
  description: string;
  preview: string;
  design: Partial<SlideDesign>;
  gradients: string[];
  // Visual identity
  layoutStyle: LayoutStyle;
  sampleHeadline: string;
  sampleBody: string;
  accentColor: string;
  tag?: string;
  bulletPoints?: string[];
  previewImages?: string[];
  isFeatured?: boolean;
  isNew?: boolean;
}

export interface BrandKitData {
  logoData: string | null;
  colors: string[];
  headingFont: FontFamily;
  bodyFont: FontFamily;
  accentColor: string;
}
