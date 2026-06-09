import { Navigate, Route, Routes } from 'react-router'
import './App.css'
import { AdminLayout } from './components/AdminLayout'
import { AdminModuleRefreshProvider } from './contexts/AdminModuleRefreshContext'
import { AdminOverviewProvider } from './contexts/AdminOverviewContext'
import { AuditKnowledgePage } from './pages/audit/AuditKnowledgePage'
import { AuditPostsPage } from './pages/audit/AuditPostsPage'
import { AuditReportsPage } from './pages/audit/AuditReportsPage'
import { AuditUsersPage } from './pages/audit/AuditUsersPage'
import { BannersPage } from './pages/operations/BannersPage'
import { ChallengesPage } from './pages/operations/ChallengesPage'
import { FortunePage } from './pages/operations/FortunePage'
import { KnowledgePage } from './pages/operations/KnowledgePage'
import { OfficialInfoPage } from './pages/operations/OfficialInfoPage'
import { TechniqueVideosPage } from './pages/operations/TechniqueVideosPage'

function App() {
  return (
    <AdminOverviewProvider>
      <AdminModuleRefreshProvider>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/audit/posts" replace />} />
            <Route path="/audit/posts" element={<AuditPostsPage />} />
            <Route path="/audit/users" element={<AuditUsersPage />} />
            <Route path="/audit/reports" element={<AuditReportsPage />} />
            <Route path="/audit/knowledge" element={<AuditKnowledgePage />} />
            <Route path="/operations/banners" element={<BannersPage />} />
            <Route path="/operations/challenges" element={<ChallengesPage />} />
            <Route path="/operations/fortune" element={<FortunePage />} />
            <Route path="/operations/knowledge" element={<KnowledgePage />} />
            <Route path="/operations/official-info" element={<OfficialInfoPage />} />
            <Route path="/operations/technique-videos" element={<TechniqueVideosPage />} />
            <Route path="*" element={<Navigate to="/audit/posts" replace />} />
          </Route>
        </Routes>
      </AdminModuleRefreshProvider>
    </AdminOverviewProvider>
  )
}

export default App
