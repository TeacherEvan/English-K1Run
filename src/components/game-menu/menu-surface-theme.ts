import { CLASSROOM_BRAND } from "@/lib/constants/classroom-brand";

export const MENU_OVERLAY_CLASS =
  "fixed inset-0 flex items-start justify-center overflow-x-hidden overflow-y-auto px-4 py-6 pointer-events-auto sm:px-6 sm:py-8 lg:items-center";

export const MENU_PANEL_CLASS =
  "mx-auto w-full max-w-5xl overflow-hidden rounded-4xl border p-6 shadow-[0_28px_80px_rgba(51,65,85,0.14)] sm:p-8 md:p-10";

export const MENU_ACTION_STACK_CLASS =
  "mx-auto flex w-full max-w-md flex-col gap-3 lg:mx-0";

export const MENU_OVERLAY_STYLE = {
  background: `radial-gradient(circle at top, color-mix(in oklch, ${CLASSROOM_BRAND.palette.sun} 36%, transparent), color-mix(in oklch, ${CLASSROOM_BRAND.palette.panel} 96%, white) 30%, color-mix(in oklch, ${CLASSROOM_BRAND.palette.sky} 20%, white) 100%)`,
} as const;

export const MENU_PANEL_STYLE = {
  background: `color-mix(in oklch, ${CLASSROOM_BRAND.palette.panel} 92%, white)`,
  borderColor: `color-mix(in oklch, ${CLASSROOM_BRAND.palette.sun} 44%, white)`,
} as const;
