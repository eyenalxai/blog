export const runtime = 'nodejs'

import { getPostList } from '@/lib/post'
import { Posts } from '@/components/posts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'A Blog',
  description: 'Just a blog',
  openGraph: {
    title: 'A Blog',
    description: 'Just a blog'
  }
}

export default async function IndexPage() {
  const posts = await getPostList()
  return <Posts posts={posts} />
}
