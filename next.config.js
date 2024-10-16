import createMDX from "@next/mdx"
import { common } from "lowlight"
import rehypeHighlight from "rehype-highlight"
import rehypeKatex from "rehype-katex"
import rehypeSanitize from "rehype-sanitize"
import remarkMath from "remark-math"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["geist"],
	pageExtensions: ["mdx", "tsx"]
}

const withMDX = createMDX({
	options: {
		remarkPlugins: [remarkParse, remarkMath, remarkRehype],
		rehypePlugins: [rehypeSanitize, rehypeKatex, [rehypeHighlight, { languages: common }]]
	}
})

export default withMDX(nextConfig)
