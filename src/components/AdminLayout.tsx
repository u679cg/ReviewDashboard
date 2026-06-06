import {
  AuditOutlined,
  BarChartOutlined,
  CalendarOutlined,
  FlagOutlined,
  FileTextOutlined,
  HomeOutlined,
  NotificationOutlined,
  PictureOutlined,
  ReadOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Alert, Button, Layout, Menu } from 'antd'
import type { MenuProps } from 'antd'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAdminModuleRefresh } from '../contexts/AdminModuleRefreshContext'
import { useAdminOverviewContext } from '../contexts/AdminOverviewContext'
import { formatTime } from '../utils/date'
import { StatCard } from './StatCard'

const { Sider, Content } = Layout

const menuItems: MenuProps['items'] = [
  {
    key: '/audit',
    icon: <AuditOutlined />,
    label: '审核中心',
    children: [
      { key: '/audit/posts', icon: <FileTextOutlined />, label: <NavLink to="/audit/posts">动态审核</NavLink> },
      { key: '/audit/users', icon: <TeamOutlined />, label: <NavLink to="/audit/users">按用户审核</NavLink> },
      { key: '/audit/reports', icon: <NotificationOutlined />, label: <NavLink to="/audit/reports">举报复审</NavLink> },
      { key: '/audit/knowledge', icon: <ReadOutlined />, label: <NavLink to="/audit/knowledge">科普投稿</NavLink> },
    ],
  },
  {
    key: '/operations',
    icon: <BarChartOutlined />,
    label: '运营管理',
    children: [
      { key: '/operations/banners', icon: <PictureOutlined />, label: <NavLink to="/operations/banners">Banner管理</NavLink> },
      { key: '/operations/challenges', icon: <FlagOutlined />, label: <NavLink to="/operations/challenges">挑战活动</NavLink> },
      { key: '/operations/fortune', icon: <CalendarOutlined />, label: <NavLink to="/operations/fortune">福运卡</NavLink> },
      { key: '/operations/knowledge', icon: <ReadOutlined />, label: <NavLink to="/operations/knowledge">科普页</NavLink> },
      { key: '/operations/official-info', icon: <HomeOutlined />, label: <NavLink to="/operations/official-info">官方资讯</NavLink> },
    ],
  },
]

export function AdminLayout() {
  const location = useLocation()
  const { overview, error, updatedAt } = useAdminOverviewContext()
  const { isRefreshing, refreshCurrentModule } = useAdminModuleRefresh()
  const title = sectionTitle(location.pathname)

  return (
    <Layout className="dashboard-shell antd-dashboard-shell">
      <Sider className="sidebar" width={280} breakpoint="lg" collapsedWidth={0}>
        <div className="brand-box">
          <span className="brand-mark">管</span>
          <div>
            <p className="eyebrow">PaperCut Admin</p>
            <h1>剪纸后台管理</h1>
          </div>
        </div>
        <Menu
          className="nav-stack"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={[location.pathname.startsWith('/operations') ? '/operations' : '/audit']}
          items={menuItems}
        />
        <section className="refresh-box">
          <p>角标刷新</p>
          <strong>每 60 秒</strong>
          <span>{updatedAt ? `角标：${formatTime(updatedAt)}` : '等待首次刷新'}</span>
          <Button type="primary" loading={isRefreshing} onClick={() => void refreshCurrentModule()}>
            刷新当前模块
          </Button>
        </section>
      </Sider>

      <Content className="content-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">后台管理工作台</p>
            <h2>{title}</h2>
          </div>
          <div className="stat-grid" aria-label="审核统计">
            <StatCard label="动态总数" value={overview.totalPosts} tone="rice" />
            <StatCard label="未审核动态" value={overview.pendingPosts} tone="red" />
            <StatCard label="已审核动态" value={overview.reviewedPosts} tone="green" />
            <StatCard label="未复审举报" value={overview.pendingReports} tone="orange" />
            <StatCard label="科普投稿" value={overview.pendingKnowledgeSubmissions} tone="red" />
            <StatCard label="进行中挑战" value={overview.activeChallenges} tone="red" />
          </div>
        </header>
        {error && <Alert className="error-banner" type="error" message={error} showIcon />}
        <section className="workspace">
          <Outlet />
        </section>
      </Content>
    </Layout>
  )
}

function sectionTitle(pathname: string) {
  if (pathname === '/audit/users') return '审核中心 · 按用户审核'
  if (pathname === '/audit/reports') return '审核中心 · 举报复审'
  if (pathname === '/audit/knowledge') return '审核中心 · 科普投稿'
  if (pathname.startsWith('/operations')) return '运营管理'
  return '审核中心 · 动态审核'
}
