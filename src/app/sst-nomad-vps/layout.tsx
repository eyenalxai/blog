import type { Metadata } from "next"
import type { ReactNode } from "react"

const TITLE = "SST + Nomad + VPS"
const DESCRIPTION = "Simple Nomad deployment to a VPS using SST"

export const metadata: Metadata = {
	title: TITLE,
	description: DESCRIPTION,
	openGraph: {
		title: TITLE,
		description: DESCRIPTION,
		type: "website"
	}
}

export default function RootLayout({ children }: { children: ReactNode }) {
	return children
}
