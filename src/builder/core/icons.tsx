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

/** Ícones disponíveis em botões, listas e redes sociais. Salvos por nome. */
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

export function IconView({
	name,
	size,
	className,
}: {
	name: string;
	size?: number | string;
	className?: string;
}) {
	const entry = ICONS[name];
	if (!entry) return null;
	const { Icon } = entry;
	return (
		<Icon
			className={className}
			width={size ?? "1em"}
			height={size ?? "1em"}
			aria-hidden="true"
		/>
	);
}
