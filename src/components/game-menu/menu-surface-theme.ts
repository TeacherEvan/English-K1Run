import { CLASSROOM_BRAND } from "@/lib/constants/classroom-brand";

const MENU_PALETTE = {
  shell: CLASSROOM_BRAND.palette?.shell ?? "oklch(0.985 0.018 95)",
  panel: CLASSROOM_BRAND.palette?.panel ?? "oklch(0.988 0.02 92)",
  sand: CLASSROOM_BRAND.palette?.sand ?? "oklch(0.95 0.03 90)",
  ink: CLASSROOM_BRAND.palette?.ink ?? "oklch(0.24 0.03 250)",
  sky: CLASSROOM_BRAND.palette?.sky ?? "oklch(0.82 0.08 236)",
  ocean: CLASSROOM_BRAND.palette?.ocean ?? "oklch(0.7 0.1 238)",
  leaf: CLASSROOM_BRAND.palette?.leaf ?? "oklch(0.81 0.11 145)",
  sun: CLASSROOM_BRAND.palette?.sun ?? "oklch(0.88 0.1 95)",
} as const;

export const MENU_OVERLAY_CLASS =
  "fixed inset-0 flex items-start justify-center overflow-x-hidden overflow-y-scroll px-4 py-6 pointer-events-auto sm:px-6 sm:py-8 lg:items-center";

export const MENU_PANEL_CLASS =
  "mx-auto w-full max-w-5xl overflow-hidden rounded-4xl border p-6 shadow-[0_28px_80px_rgba(51,65,85,0.14)] sm:p-8 md:p-10";

export const MENU_ACTION_STACK_CLASS =
  "mx-auto flex w-full max-w-md flex-col gap-3 lg:mx-0";

export const MENU_BRAND_PILL_CLASS =
  "menu-home-brand-pill inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] shadow-sm";

export const MENU_HERO_COPY_CLASS =
  "menu-home-copy min-w-0 w-full max-w-[32rem] space-y-3";

export const MENU_HERO_HEADING_CLASS =
  "menu-home-heading max-w-full text-[clamp(2.9rem,5.8vw,4.85rem)] font-black leading-[0.95] tracking-[-0.045em] wrap-anywhere";

export const MENU_HERO_BODY_CLASS =
  "menu-home-instructions mx-auto max-w-[24rem] text-[clamp(1.02rem,2vw,1.22rem)] font-medium leading-[1.45] wrap-anywhere lg:mx-0";

export const MENU_SCORE_CARD_CLASS =
  "menu-best-time-card mt-2 w-full max-w-sm rounded-[1.75rem] border p-5 shadow-[0_18px_46px_rgba(120,87,23,0.22)]";

export const MENU_UTILITY_GROUP_CLASS =
  "rounded-[1.6rem] border p-3 shadow-[0_12px_28px_rgba(120,87,23,0.08)]";

export const MENU_UTILITY_EYEBROW_CLASS =
  "px-2 pb-2 text-xs font-bold uppercase tracking-[0.14em]";

export const MENU_ACTION_TEXT_CLASS =
  "menu-action-copy flex min-w-0 flex-1 flex-col items-start leading-tight";

export const MENU_ACTION_SUBTITLE_LIGHT_CLASS =
  "mt-1 text-sm font-medium text-white/78";

export const MENU_ACTION_SUBTITLE_MUTED_CLASS =
  "mt-1 text-sm font-medium";

export const MENU_PRIMARY_ACTION_CLASS =
  "menu-action-card menu-action-card--start menu-primary-action h-21 gap-4 rounded-3xl border px-5 text-[1.35rem] font-bold text-white shadow-[0_18px_28px_rgba(22,163,74,0.24)] hover:-translate-y-0.5 focus-visible:ring-[3px] sm:px-6";

export const MENU_SECONDARY_ACTION_CLASS =
  "menu-action-card menu-action-card--challenge menu-secondary-action h-19 gap-4 rounded-3xl border text-xl font-bold text-white shadow-[0_16px_24px_rgba(183,110,19,0.2)] hover:-translate-y-0.5";

export const MENU_TERTIARY_ACTION_CLASS =
  "menu-action-card menu-action-card--map menu-tertiary-action h-19 gap-4 rounded-3xl border text-xl font-bold shadow-[0_10px_18px_rgba(120,87,23,0.12)] hover:-translate-y-0.5";

export const MENU_UTILITY_ACTION_CLASS =
  "menu-support-action h-[4.4rem] w-full min-w-0 justify-start gap-4 rounded-[1.4rem] border px-5 text-base font-semibold shadow-[0_10px_18px_rgba(120,87,23,0.08)] hover:-translate-y-0.5";

export const MENU_DIALOG_CLASS =
  "menu-dialog-shell border shadow-2xl";

export const MENU_SECTION_SURFACE_CLASS =
  "rounded-[1.65rem] border p-5 shadow-[0_20px_42px_rgba(120,53,15,0.08)]";

export const MENU_SECTION_TITLE_CLASS =
  "font-semibold leading-none";

export const MENU_SECTION_BODY_CLASS =
  "text-sm";

export const MENU_DIALOG_HEADER_TITLE_CLASS =
  "flex items-center gap-2 text-2xl";

export const MENU_DIALOG_DESCRIPTION_CLASS =
  "text-sm";

export const MENU_SUPPORT_LINK_CLASS =
  "menu-support-link mt-1 h-auto self-start p-0 text-sm font-semibold";

export const MENU_SETTINGS_SURFACE_CLASS =
  "menu-settings-surface mt-6 rounded-3xl border p-4 shadow-[0_18px_32px_rgba(120,53,15,0.1)]";

export const MENU_SETTINGS_TABS_LIST_CLASS =
  "menu-settings-tabs-list grid h-auto w-full min-w-0 grid-cols-2 gap-2 p-2 sm:grid-cols-4";

export const MENU_OPTION_GRID_CLASS =
  "grid gap-2";

export const MENU_OPTION_GRID_THREE_CLASS =
  "grid grid-cols-3 gap-2";

export const MENU_OPTION_GRID_TWO_CLASS =
  "grid grid-cols-2 gap-2";

export const MENU_SETTINGS_ROW_CLASS =
  "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between";

export const MENU_SETTINGS_COPY_CLASS =
  "space-y-1";

export const MENU_SETTINGS_CONTROL_CLASS =
  "h-auto min-h-12 rounded-2xl px-4 py-3 text-base font-semibold shadow-sm";

export const MENU_OVERLAY_STYLE = {
  background: `radial-gradient(circle at top, color-mix(in oklch, ${MENU_PALETTE.sun} 36%, transparent), color-mix(in oklch, ${MENU_PALETTE.panel} 96%, white) 30%, color-mix(in oklch, ${MENU_PALETTE.sky} 20%, white) 100%)`,
  scrollbarGutter: "stable both-edges",
} as const;

export const MENU_PANEL_STYLE = {
  background: `color-mix(in oklch, ${MENU_PALETTE.panel} 92%, white)`,
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 44%, white)`,
} as const;

export const MENU_BRAND_PILL_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 40%, white)`,
  background: `color-mix(in oklch, ${MENU_PALETTE.sun} 24%, white)`,
  color: `color-mix(in oklch, ${MENU_PALETTE.sun} 56%, ${MENU_PALETTE.ink})`,
} as const;

export const MENU_HERO_HEADING_STYLE = {
  color: MENU_PALETTE.ink,
} as const;

export const MENU_HERO_BODY_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 72%, white)`,
} as const;

export const MENU_SCORE_CARD_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 52%, white)`,
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.ink} 74%, ${MENU_PALETTE.sun} 12%), color-mix(in oklch, ${MENU_PALETTE.ink} 84%, black) 72%)`,
} as const;

export const MENU_UTILITY_GROUP_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 24%, white)`,
  background: `linear-gradient(180deg, color-mix(in oklch, ${MENU_PALETTE.panel} 94%, white), color-mix(in oklch, ${MENU_PALETTE.shell} 92%, white))`,
} as const;

export const MENU_UTILITY_EYEBROW_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.sun} 52%, ${MENU_PALETTE.ink})`,
} as const;

export const MENU_PRIMARY_ACTION_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.leaf} 28%, ${MENU_PALETTE.ink})`,
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.leaf} 78%, ${MENU_PALETTE.ocean} 10%), color-mix(in oklch, ${MENU_PALETTE.leaf} 58%, ${MENU_PALETTE.ink}) 100%)`,
  boxShadow: "0 18px 28px rgba(22,163,74,0.24)",
} as const;

export const MENU_PRIMARY_ACTION_HOVER_STYLE = {
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.leaf} 72%, ${MENU_PALETTE.ocean} 16%), color-mix(in oklch, ${MENU_PALETTE.leaf} 52%, ${MENU_PALETTE.ink}) 100%)`,
} as const;

export const MENU_SECONDARY_ACTION_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 22%, ${MENU_PALETTE.ink})`,
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.sun} 78%, ${MENU_PALETTE.ink} 12%), color-mix(in oklch, ${MENU_PALETTE.sun} 46%, ${MENU_PALETTE.ink}) 100%)`,
} as const;

export const MENU_TERTIARY_ACTION_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 24%, white)`,
  background: `color-mix(in oklch, ${MENU_PALETTE.panel} 88%, white)`,
  color: MENU_PALETTE.ink,
} as const;

export const MENU_TERTIARY_SUBTITLE_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 58%, white)`,
} as const;

export const MENU_UTILITY_ACTION_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 24%, white)`,
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.panel} 92%, white), color-mix(in oklch, ${MENU_PALETTE.shell} 88%, white))`,
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 84%, ${MENU_PALETTE.sun} 12%)`,
} as const;

export const MENU_UTILITY_ACTION_ACTIVE_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 42%, white)`,
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.sun} 22%, white), color-mix(in oklch, ${MENU_PALETTE.panel} 86%, ${MENU_PALETTE.leaf} 10%))`,
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 80%, ${MENU_PALETTE.sun} 16%)`,
} as const;

export const MENU_UTILITY_SUBTITLE_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 56%, white)`,
} as const;

export const MENU_DIALOG_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 24%, white)`,
  background: `linear-gradient(180deg, color-mix(in oklch, ${MENU_PALETTE.panel} 96%, white), color-mix(in oklch, ${MENU_PALETTE.shell} 94%, white))`,
} as const;

export const MENU_DIALOG_TITLE_STYLE = {
  color: MENU_PALETTE.ink,
} as const;

export const MENU_DIALOG_DESCRIPTION_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 62%, white)`,
} as const;

export const MENU_SECTION_SURFACE_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 22%, white)`,
  background: `linear-gradient(145deg, color-mix(in oklch, ${MENU_PALETTE.panel} 92%, white), color-mix(in oklch, ${MENU_PALETTE.shell} 90%, ${MENU_PALETTE.leaf} 6%))`,
} as const;

export const MENU_SECTION_TITLE_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.sun} 46%, ${MENU_PALETTE.ink})`,
} as const;

export const MENU_SECTION_BODY_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 64%, white)`,
} as const;

export const MENU_SETTINGS_TABS_LIST_STYLE = {
  background: `color-mix(in oklch, ${MENU_PALETTE.sun} 14%, white)`,
} as const;

export const MENU_SETTINGS_SURFACE_STYLE = {
  borderColor: `color-mix(in oklch, ${MENU_PALETTE.sun} 24%, white)`,
  background: `linear-gradient(155deg, color-mix(in oklch, ${MENU_PALETTE.panel} 94%, white), color-mix(in oklch, ${MENU_PALETTE.shell} 90%, ${MENU_PALETTE.leaf} 8%) 50%, color-mix(in oklch, ${MENU_PALETTE.shell} 92%, ${MENU_PALETTE.sun} 10%))`,
} as const;

export const MENU_SUPPORT_LINK_STYLE = {
  color: `color-mix(in oklch, ${MENU_PALETTE.ink} 56%, white)`,
} as const;

export const MENU_SUPPORT_LINK_HOVER_STYLE = {
  color: MENU_PALETTE.ink,
} as const;
