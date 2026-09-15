import { Button } from "./components/button.tsx";
import { Container } from "./components/container.tsx";
import { Countdown } from "./components/countdown.tsx";
import { Divider } from "./components/divider.tsx";
import { Faq } from "./components/faq.tsx";
import { FloatingButtons } from "./components/floating-buttons.tsx";
import { Footer } from "./components/footer.tsx";
import { Form } from "./components/form.tsx";
import { Header } from "./components/header.tsx";
import { Heading } from "./components/heading.tsx";
import { Html } from "./components/html.tsx";
import { Image } from "./components/image.tsx";
import { Modal } from "./components/modal.tsx";
import { Page } from "./components/page.tsx";
import { ProgressBar } from "./components/progress-bar.tsx";
import { Section } from "./components/section.tsx";
import { Spacer } from "./components/spacer.tsx";
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
			Modal,
			FloatingButtons,
			Html,
		].map((def) => [def.type, def]),
	);

export function getDefinition(
	type: string,
): AnyComponentDefinition | undefined {
	return COMPONENTS[type];
}
