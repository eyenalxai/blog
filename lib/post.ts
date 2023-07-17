import * as fs from 'fs'
import matter from 'gray-matter'
import { notFound } from 'next/navigation'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import { PageParams, PostMeta } from '@/lib/types'

const parseContent = async (slug: string) => {
  const content = await getPostContent(slug)
  return content ? matter(content) : null
}

export const getPostSlugs = async () => {
  const files = await fs.promises.readdir('_posts')
  return files.map(fileName => fileName.replace('.md', ''))
}

export const getPostContent = (slug: string) =>
  fs.promises.readFile(`_posts/${slug}.md`, 'utf-8').catch(() => null)

export const getPostMeta = async (slug: string) => {
  const parsed = await parseContent(slug)
  return parsed
    ? ({ slug, ...parsed.data } as PostMeta & { slug: string })
    : undefined
}

export const getPostList = async () =>
  (await Promise.all((await getPostSlugs()).map(getPostMeta))).filter(
    post => post !== undefined
  ) as (PostMeta & { slug: string })[]

export const getPost = async ({ slug }: PageParams) => {
  const parsed = await parseContent(slug)
  if (!parsed) notFound()

  return {
    postHTML: String(
      await unified()
        .use(remarkParse)
        .use(remarkFrontmatter)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(parsed.content)
    ),
    postMeta: parsed.data as PostMeta
  }
}
