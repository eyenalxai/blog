import { cn } from '@/lib/utils'
import { IconHome } from '@/components/ui/icons'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const Header = async () => {
  return (
    <header
      className={cn(
        'pl-6',
        'py-2',
        'sticky',
        'top-0',
        'z-50',
        'flex',
        'flex-row',
        'w-full',
        'shrink-0',
        'items-center',
        'justify-start',
        'backdrop-blur',

        'border-b',
        'gap-4'
      )}
    >
      <Button variant={'ghost'} asChild>
        <Link href={'/'}>
          <IconHome className={cn('h-6', 'w-6')} />
        </Link>
      </Button>
    </header>
  )
}
