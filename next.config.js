const withMDX = require("@next/mdx")()

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["geist"],
	pageExtensions: ["mdx", "tsx"]
}

module.exports = withMDX(nextConfig)
