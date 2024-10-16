import "./globals.css"
import "./code-style.css"
import "katex/dist/katex.min.css"
import { Providers } from "@/components/providers"
import { cn } from "@/lib/utils"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import type { Metadata, Viewport } from "next"
import type { ReactNode } from "react"

const TITLE = "A blog personal, blogal person made, blog person madea, made blog persona"
const DESCRIPTION =
	"I made a personal blog, a blog made personally, person made blogal, the blog person madi, made person logiba, bloga lipe adomrans, roblagon amadipes, blogs maidenal persons, blogaperson maideni, emablog radin poesla, dograb minalpseo, erblog madio sanpel, bloger mandiosa elp, lediblog namosap, persona diblog ameil, bermado blogasin peol, admani blogerosp le, logas pinomed breal, personm adlogai ble, pblog aodien rmsal, personal blogi mande."

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		type: "website"
	}
}

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 1,
	userScalable: false,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "0 0% 100%" },
		{ media: "(prefers-color-scheme: dark)", color: "222.2 84% 4.9%" }
	]
}

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={cn("font-sans", "antialiased", GeistSans.variable, GeistMono.variable)}>
				<Providers attribute="class" defaultTheme="system" enableSystem>
					<article
						className={cn(
							"container",
							"mx-auto",
							"mt-12",
							"mb-24",
							"p-4",
							"max-w-screen-lg",
							"prose",
							"prose-slate",
							"dark:prose-invert",
							["prose-pre:bg-background", "prose-pre:text-primary", "prose-pre:p-0"]
						)}
					>
						{children}
					</article>
				</Providers>
			</body>
		</html>
	)
}
