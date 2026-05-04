// Tipos compartilhados do painel admin

export type Promotion = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link: string | null;
  is_active: boolean;
  display_order: number;
  popup_duration_seconds: number;
  show_as_popup: boolean;
};

export type NewsItem = {
  id: string;
  title: string;
  content: string | null;
  summary: string | null;
  image_url: string | null;
  podcast_link: string | null;
  is_published: boolean | null;
  is_pinned: boolean | null;
  pinned_at: string | null;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  source_url?: string | null;
  source_name?: string | null;
  auto_generated?: boolean | null;
};

export type ProgItem = {
  id: string;
  day_of_week: number;
  program_name: string;
  presenter: string | null;
  start_time: string;
  end_time: string;
  display_order: number;
  is_active: boolean;
  flyer_url: string | null;
};

export type PodcastItemAdmin = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
};

export type EntryRow = {
  id: string;
  promotion_id: string;
  full_name: string;
  birth_date?: string | null;
  whatsapp: string;
  cpf: string;
  instagram: string;
  facebook: string;
  created_at: string;
  promotions?: { title: string } | null;
};

export const DAYS_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;
