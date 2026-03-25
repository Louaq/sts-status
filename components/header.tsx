import Link from 'next/link'

export function Header() {
  const backUrl = process.env.NEXT_PUBLIC_SITE_BACK_URL
  const backTitle = process.env.NEXT_PUBLIC_SITE_BACK_TITLE
  const logo = process.env.NEXT_PUBLIC_SITE_LOGO
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '/'
  const siteTitle = process.env.NEXT_PUBLIC_SITE_TITLE

  return (
    <nav className='flex items-center justify-between py-1 mb-4'>
      <Link href={siteUrl} className='flex items-center gap-2'>
        {logo ? (
          <picture>
            <img src={logo} className='size-8 rounded-md' alt={siteTitle || ''} />
          </picture>
        ) : (
          <span className='font-semibold text-sm'>{siteTitle}</span>
        )}
      </Link>

      <div className='flex items-center gap-3'>
        {backUrl ? (
          <Link
            href={backUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='text-fg/60 hover:text-fg text-sm font-medium transition-colors'
          >
            Go to {backTitle || '主页'} ↗
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
