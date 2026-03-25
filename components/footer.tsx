import { ThemeSwitch } from '@/components/theme-switch'

export function Footer() {
  return (
    <footer className='text-fg/60 flex items-center justify-between py-8 text-sm'>
      <div>
        {process.env.NEXT_PUBLIC_FOOTER_TEXT || (
          <>
            Powered by{' '}
            <a
              href='https://github.com/sparanoid/sts'
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-500'
            >
              sts
            </a>
          </>
        )}
      </div>
      <ThemeSwitch />
    </footer>
  )
}
