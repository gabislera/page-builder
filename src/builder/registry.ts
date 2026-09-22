import { Accordion, AccordionItem } from "./components/accordion.tsx";
import { AnnouncementBar } from "./components/announcement-bar.tsx";
import { Button } from "./components/button.tsx";
import { Card } from "./components/card.tsx";
import { Carousel, CarouselSlide } from "./components/carousel.tsx";
import { Container } from "./components/container.tsx";
import { Countdown } from "./components/countdown.tsx";
import { Divider } from "./components/divider.tsx";
import { Faq } from "./components/faq.tsx";
import { FloatingButtons } from "./components/floating-buttons.tsx";
import { Footer } from "./components/footer.tsx";
import { Form } from "./components/form.tsx";
import { Gallery } from "./components/gallery.tsx";
import { Header } from "./components/header.tsx";
import { Heading } from "./components/heading.tsx";
import { Html } from "./components/html.tsx";
import { Icon } from "./components/icon.tsx";
import { IconBox } from "./components/icon-box.tsx";
import { IconList } from "./components/icon-list.tsx";
import { Image } from "./components/image.tsx";
import { Logo } from "./components/logo.tsx";
import { MapEmbed } from "./components/map.tsx";
import { Menu } from "./components/menu.tsx";
import { Modal } from "./components/modal.tsx";
import { Page } from "./components/page.tsx";
import { PricingTable } from "./components/pricing-table.tsx";
import { ProgressBar } from "./components/progress-bar.tsx";
import { Section } from "./components/section.tsx";
import { ShareButtons } from "./components/share-buttons.tsx";
import { SocialIcons } from "./components/social-icons.tsx";
import { Spacer } from "./components/spacer.tsx";
import { StatCounter } from "./components/stat-counter.tsx";
import { TabItem, Tabs } from "./components/tabs.tsx";
import { Testimonial } from "./components/testimonial.tsx";
import { Text } from "./components/text.tsx";
import { Video } from "./components/video.tsx";
import type { AnyComponentDefinition } from "./core/types.ts";

/** Todos os componentes do builder. A chave é o `resolvedName` salvo no JSON. */
export const COMPONENTS: Record<string, AnyComponentDefinition> =
	Object.fromEntries(
		[
			Page,
			Header,
			Section,
			Footer,
			Container,
			Heading,
			Text,
			Button,
			Image,
			Video,
			Divider,
			Spacer,
			Form,
			Faq,
			Countdown,
			ProgressBar,
			StatCounter,
			AnnouncementBar,
			ShareButtons,
			MapEmbed,
			Modal,
			FloatingButtons,
			Html,
			Icon,
			IconList,
			IconBox,
			Logo,
			Menu,
			SocialIcons,
			Card,
			Testimonial,
			PricingTable,
			Gallery,
			Accordion,
			AccordionItem,
			Tabs,
			TabItem,
			Carousel,
			CarouselSlide,
		].map((def) => [def.type, def]),
	);

export function getDefinition(
	type: string,
): AnyComponentDefinition | undefined {
	return COMPONENTS[type];
}
