import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { PostMeta } from '@/lib/types'

type PostCardProps = {
  post: PostMeta & { slug: string }
}

export const PostCard = ({ post }: PostCardProps) => {
  const postDateFormatted = new Date(post.date).toLocaleDateString()
  return (
    <Link href={`/${post.slug}`}>
      <Card key={post.slug}>
        <CardHeader>
          <CardTitle>{post.title}</CardTitle>
          <CardDescription>{post.excerpt}</CardDescription>
        </CardHeader>
        <CardFooter>
          <div className={cn('flex', 'flex-col', 'text-xs', 'text-slate-500')}>
            <p>{postDateFormatted}</p>
            <p>{post.author}</p>
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
