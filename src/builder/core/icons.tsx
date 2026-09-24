import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Facebook,
  Gift,
  Heart,
  Instagram,
  icons,
  Linkedin,
  Lock,
  type LucideIcon,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Rocket,
  Send,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  ThumbsUp,
  Timer,
  Twitter,
  User,
  Users,
  Youtube,
  Zap,
} from "lucide-react";

/**
 * Featured icons ("Populares" in the picker), with Portuguese names.
 * Keys are names already saved in pages: never rename or remove them.
 * Some are custom aliases (e.g. "whatsapp" → MessageCircle,
 * "check-circle" → CheckCircle2) that differ from the lucide name.
 */
export const ICONS: Record<string, { label: string; Icon: LucideIcon }> = {
  "arrow-right": { label: "Seta direita", Icon: ArrowRight },
  "arrow-left": { label: "Seta esquerda", Icon: ArrowLeft },
  "arrow-up": { label: "Seta cima", Icon: ArrowUp },
  "arrow-down": { label: "Seta baixo", Icon: ArrowDown },
  "chevron-right": { label: "Avançar", Icon: ChevronRight },
  "chevron-down": { label: "Expandir", Icon: ChevronDown },
  check: { label: "Check", Icon: Check },
  "check-circle": { label: "Check círculo", Icon: CheckCircle2 },
  "badge-check": { label: "Selo", Icon: BadgeCheck },
  "shield-check": { label: "Garantia", Icon: ShieldCheck },
  lock: { label: "Cadeado", Icon: Lock },
  star: { label: "Estrela", Icon: Star },
  heart: { label: "Coração", Icon: Heart },
  "thumbs-up": { label: "Joinha", Icon: ThumbsUp },
  sparkles: { label: "Brilho", Icon: Sparkles },
  zap: { label: "Raio", Icon: Zap },
  rocket: { label: "Foguete", Icon: Rocket },
  gift: { label: "Presente", Icon: Gift },
  "shopping-cart": { label: "Carrinho", Icon: ShoppingCart },
  "credit-card": { label: "Cartão", Icon: CreditCard },
  download: { label: "Download", Icon: Download },
  "external-link": { label: "Link externo", Icon: ExternalLink },
  send: { label: "Enviar", Icon: Send },
  play: { label: "Play", Icon: Play },
  calendar: { label: "Calendário", Icon: Calendar },
  clock: { label: "Relógio", Icon: Clock },
  timer: { label: "Cronômetro", Icon: Timer },
  user: { label: "Usuário", Icon: User },
  users: { label: "Usuários", Icon: Users },
  mail: { label: "E-mail", Icon: Mail },
  phone: { label: "Telefone", Icon: Phone },
  "map-pin": { label: "Local", Icon: MapPin },
  whatsapp: { label: "WhatsApp", Icon: MessageCircle },
  instagram: { label: "Instagram", Icon: Instagram },
  facebook: { label: "Facebook", Icon: Facebook },
  youtube: { label: "YouTube", Icon: Youtube },
  linkedin: { label: "LinkedIn", Icon: Linkedin },
  twitter: { label: "X / Twitter", Icon: Twitter },
};

/* ------------------------------------------------------------------ */
/* Full lucide library                                                 */
/* ------------------------------------------------------------------ */

const LUCIDE = icons as Record<string, LucideIcon>;

/** Lucide names the generic conversion gets wrong. */
const KEBAB_EXCEPTIONS: Record<string, string> = {
  ArrowDown01: "arrow-down-0-1",
  ArrowDown10: "arrow-down-1-0",
  ArrowDownAZ: "arrow-down-a-z",
  ArrowDownZA: "arrow-down-z-a",
  ArrowUp01: "arrow-up-0-1",
  ArrowUp10: "arrow-up-1-0",
  ArrowUpAZ: "arrow-up-a-z",
  ArrowUpZA: "arrow-up-z-a",
  CalendarX2: "calendar-x-2",
  Grid2x2: "grid-2x2",
  Grid2x2Check: "grid-2x2-check",
  Grid2x2Plus: "grid-2x2-plus",
  Grid2x2X: "grid-2x2-x",
  Grid3x2: "grid-3x2",
  Grid3x3: "grid-3x3",
};

/** "BadgePercent" → "badge-percent" (lucide name). */
function toKebab(pascal: string): string {
  return (
    KEBAB_EXCEPTIONS[pascal] ??
    pascal
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .replace(/([a-z])(\d)/g, "$1-$2")
      .toLowerCase()
  );
}

/** "badge-percent" → "BadgePercent". */
const toPascal = (kebab: string) =>
  kebab
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

/** All lucide icons, by kebab name (for the picker). */
export const ALL_ICON_NAMES: string[] = Object.keys(LUCIDE).map(toKebab).sort();

/** Readable name: Portuguese label of popular icons, or the lucide name. */
export function iconLabel(name: string): string {
  return ICONS[name]?.label ?? name.replace(/-/g, " ");
}

/** Component for a saved icon: aliases/popular first, then the full lucide set. */
export function resolveIcon(name: string | undefined): LucideIcon | null {
  if (!name) return null;
  return ICONS[name]?.Icon ?? LUCIDE[toPascal(name)] ?? null;
}

export function IconView({
  name,
  size,
  className,
  strokeWidth,
}: {
  name: string;
  size?: number | string;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = resolveIcon(name);
  if (!Icon) return null;
  return (
    <Icon
      className={className}
      width={size ?? "1em"}
      height={size ?? "1em"}
      strokeWidth={strokeWidth}
      aria-hidden="true"
    />
  );
}
