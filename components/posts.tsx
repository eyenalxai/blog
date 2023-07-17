import { cn } from '@/lib/utils'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { PostMeta } from '@/lib/types'

type PostsProps = {
  posts: (PostMeta & { slug: string })[]
}

export const Posts = ({ posts }: PostsProps) => {
  return (
    <div className={cn('flex', 'flex-col', 'gap-8', ['mt-8', 'mb-24'])}>
      {posts.map(post => {
        const postDateFormatted = new Date(post.date).toLocaleDateString()
        return (
          <Card key={post.slug}>
            <CardHeader>
              <CardTitle>
                <Button
                  asChild
                  variant={'ghost'}
                  className={cn('text-2xl', 'font-bold')}
                >
                  <Link href={`/${post.slug}`}>{post.title}</Link>
                </Button>
              </CardTitle>
              <CardDescription>{post.excerpt}</CardDescription>
            </CardHeader>
            <CardFooter>
              <div
                className={cn('flex', 'flex-col', 'text-xs', 'text-slate-500')}
              >
                <p>{postDateFormatted}</p>
                <p>{post.author}</p>
              </div>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
