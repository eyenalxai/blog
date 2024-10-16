import { MemoizedCodeComponent } from "@/components/code-block"
import { isInline } from "@/lib/utils"
import type { MDXComponents } from "mdx/types"

const customComponents: MDXComponents = {
	code: (props) => {
		if (isInline(props.children)) return <code {...props} />

		const match = /language-(\w+)/.exec(props.className || "")
		if (!match) return <code {...props} />
		return <MemoizedCodeComponent key={Math.random()} {...props} language={match ? match[1] : ""} />
	}
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
	return {
		...components,
		...customComponents
	}
}
