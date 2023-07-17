export const runtime = 'nodejs'

import { getPostList } from '@/lib/post'
import { Posts } from '@/components/posts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title:
    'A blog personal, blogal person made, blog person madea, made blog persona',
  description:
    'I made a personal blog, a blog made personally, person made blogal, the blog person madi, made person logiba, bloga lipe adomrans, roblagon amadipes, blogs maidenal persons, blogaperson maideni, emablog radin poesla, dograb minalpseo, erblog madio sanpel, bloger mandiosa elp, lediblog namosap, persona diblog ameil, bermado blogasin peol, admani blogerosp le, logas pinomed breal, personm adlogai ble, pblog aodien rmsal, personal blogi mande.',
  openGraph: {
    title:
      'A blog personal, blogal person made, blog person madea, made blog persona',
    description:
      'I made a personal blog, a blog made personally, person made blogal, the blog person madi, made person logiba, bloga lipe adomrans, roblagon amadipes, blogs maidenal persons, blogaperson maideni, emablog radin poesla, dograb minalpseo, erblog madio sanpel, bloger mandiosa elp, lediblog namosap, persona diblog ameil, bermado blogasin peol, admani blogerosp le, logas pinomed breal, personm adlogai ble, pblog aodien rmsal, personal blogi mande.'
  }
}

export default async function IndexPage() {
  const posts = await getPostList()
  return <Posts posts={posts} />
}
