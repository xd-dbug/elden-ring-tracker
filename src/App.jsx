import { HashRouter, Route, Routes } from 'react-router-dom'
import TabBar from './components/TabBar.jsx'
import { TrackerProvider } from './state/TrackerContext.jsx'
import Run from './pages/Run.jsx'
import Endings from './pages/Endings.jsx'
import Bosses from './pages/Bosses.jsx'
import BossDetail from './pages/BossDetail.jsx'
import Settings from './pages/Settings.jsx'

// HashRouter: GitHub Pages can't serve client-side routes, so /#/bosses avoids 404s on refresh.
export default function App() {
  return (
    <TrackerProvider>
      <HashRouter>
        <main className="app">
          <Routes>
            <Route path="/" element={<Run />} />
            <Route path="/endings" element={<Endings />} />
            <Route path="/bosses" element={<Bosses />} />
            <Route path="/bosses/:slug" element={<BossDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
        <TabBar />
      </HashRouter>
    </TrackerProvider>
  )
}
