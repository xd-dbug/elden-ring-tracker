import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Run', end: true },
  { to: '/endings', label: 'Endings' },
  { to: '/bosses', label: 'Bosses' },
  { to: '/settings', label: 'Settings' },
]

export default function TabBar() {
  return (
    <nav className="tab-bar" aria-label="Main">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} end={t.end}>
          {t.label}
        </NavLink>
      ))}
    </nav>
  )
}
