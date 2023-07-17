import { cn } from '@/lib/utils'
import { PostMeta } from '@/lib/types'

type PostProps = {
  html: string
  meta: PostMeta
}

export const Post = ({ html, meta }: PostProps) => {
  return (
    <div className={cn(['prose', 'dark:prose-invert'], 'mt-4', 'mb-24')}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
