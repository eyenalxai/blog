export const runtime = 'nodejs'

import { Post } from '@/components/post'
import { getPost, getPostMeta, getPostSlugs } from '@/lib/post'
import { PageParams } from '@/lib/types'
import { notFound } from 'next/navigation'

type BlogPageProps = {
  params: PageParams
}

export async function generateMetadata({ params }: BlogPageProps) {
  const postMeta = await getPostMeta(params.slug)

  if (!postMeta) {
    notFound()
  }

  return {
    title: postMeta.title,
    description: postMeta.excerpt,
    openGraph: {
      title: postMeta.title,
      description: postMeta.excerpt
    }
  }
}

export async function generateStaticParams() {
  const slugs = await getPostSlugs()

  return slugs.map(slug => ({
    params: {
      slug
    }
  }))
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { postHTML, postMeta } = await getPost(params)

  return <Post html={postHTML} meta={postMeta} />
}
