import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, Camera, Receipt, List } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/categories', icon: LayoutGrid, label: 'Categories' },
  { to: '/scan', icon: Camera, label: 'Scan' },
  { to: '/bills', icon: Receipt, label: 'Bills' },
  { to: '/activity', icon: List, label: 'Activity' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-border-light safe-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 transition-all duration-200 ${
                isActive ? 'text-accent scale-105' : 'text-text-tertiary'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-2xl transition-all duration-200 ${isActive ? 'bg-accent-light' : ''}`}>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className="text-[10px] font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
