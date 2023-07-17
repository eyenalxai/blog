import { cn } from '@/lib/utils'
import { PostMeta } from '@/lib/types'
import { PostCard } from '@/components/post-card'

type PostsProps = {
  posts: (PostMeta & { slug: string })[]
}

export const Posts = ({ posts }: PostsProps) => {
  return (
    <div className={cn('flex', 'flex-col', 'gap-8', ['mt-8', 'mb-24'])}>
      {posts.map(post => (
        <PostCard key={post.slug} post={post} />
      ))}
    </div>
  )
}
