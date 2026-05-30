import Link from 'next/link'
import NavMenu from './NavMenu'
import styles from './Nav.module.scss'

export default function Nav() {
  return (
    <nav className={styles.nav}>
      <Link href="/" className={styles.siteName}>Recipes</Link>
      <NavMenu />
    </nav>
  )
}
