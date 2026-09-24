import { APP_HEADER_CATEGORIES } from '@/data/app-header-categories';

export function isEmpowerPath(pathname: string): boolean {
  return pathname === '/empower' || pathname.startsWith('/empower/');
}

export function isStudiesPath(pathname: string): boolean {
  return pathname === '/studies' || pathname.startsWith('/studies/');
}

export function isExLandingPath(pathname: string): boolean {
  return pathname === '/lifecycle' || pathname === '/studies';
}

export function isEmployeeListPath(pathname: string): boolean {
  return pathname === '/lifecycle/roster';
}

export function isEmployeeExperiencePath(pathname: string): boolean {
  return (
    isStudiesPath(pathname) ||
    pathname === '/lifecycle' ||
    pathname.startsWith('/lifecycle/') ||
    pathname.startsWith('/projects') ||
    is360SurveyFlowPath(pathname)
  )
}

/** 360 is authored inside a survey; these routes are not a separate product module. */
export function is360SurveyFlowPath(pathname: string): boolean {
  if (/^\/360\/surveys\/[^/]+\/edit/.test(pathname)) return true
  if (/^\/360\/reports\/[^/]+(\/preview)?\/?$/.test(pathname)) return true
  return false
}

export function getHeaderProductName(pathname: string): string {
  if (isEmpowerPath(pathname)) return 'Empower'
  return 'Employee Experience'
}

export function getHeaderHomeLink(pathname: string): string {
  if (isEmpowerPath(pathname)) return '/empower'
  return '/lifecycle'
}

export function getHeaderCategories() {
  return APP_HEADER_CATEGORIES
}

export type HeaderBreadcrumb = {
  label: string
  href: string
}

export function getHeaderBreadcrumbs(
  pathname: string,
  folderName = 'New folks',
): HeaderBreadcrumb[] {
  if (isExLandingPath(pathname)) {
    return [{ label: folderName, href: '/lifecycle' }]
  }

  if (pathname.startsWith('/lifecycle/roster/')) {
    return [
      { label: folderName, href: '/lifecycle' },
      { label: 'Manage Employee List', href: '/lifecycle/roster' },
      { label: 'Employee Profile', href: pathname },
    ]
  }
  if (pathname.startsWith('/lifecycle/roster')) {
    return [
      { label: folderName, href: '/lifecycle' },
      { label: 'Manage Employee List', href: '/lifecycle/roster' },
    ]
  }
  if (pathname.startsWith('/lifecycle/surveys')) {
    return [
      { label: folderName, href: '/lifecycle' },
      { label: 'Surveys', href: '/lifecycle/surveys' },
    ]
  }
  if (pathname.startsWith('/lifecycle/rules')) {
    return [
      { label: folderName, href: '/lifecycle' },
      { label: 'Rules', href: '/lifecycle/rules' },
    ]
  }
  if (pathname.startsWith('/lifecycle/distribution')) {
    return [
      { label: folderName, href: '/lifecycle' },
      { label: 'Distribution', href: '/lifecycle/distribution' },
    ]
  }
  if (pathname.startsWith('/lifecycle/settings')) {
    return [
      { label: folderName, href: '/lifecycle' },
      { label: 'Settings', href: '/lifecycle/settings' },
    ]
  }
  if (pathname.startsWith('/lifecycle/analytics')) {
    const crumbs: HeaderBreadcrumb[] = [
      { label: folderName, href: '/lifecycle' },
      { label: 'Analytics', href: '/lifecycle/analytics' },
    ]
    if (pathname.startsWith('/lifecycle/analytics/org-context')) {
      crumbs.push({ label: 'Org context', href: pathname })
    } else if (pathname.startsWith('/lifecycle/analytics/settings')) {
      crumbs.push({ label: 'Settings', href: pathname })
    } else if (pathname.startsWith('/lifecycle/analytics/list')) {
      crumbs.push({ label: 'Dashboards', href: pathname })
    } else if (pathname.startsWith('/lifecycle/analytics/pages/')) {
      crumbs.push({ label: 'Page', href: pathname })
    } else if (/^\/lifecycle\/analytics\/[^/]+/.test(pathname) && pathname !== '/lifecycle/analytics') {
      crumbs.push({ label: 'Dashboard', href: pathname })
    }
    return crumbs
  }

  if (is360SurveyFlowPath(pathname)) {
    const crumbs: HeaderBreadcrumb[] = [
      { label: folderName, href: '/lifecycle' },
      { label: '360 survey', href: pathname },
    ]
    return crumbs
  }

  if (isEmpowerPath(pathname)) {
    const crumbs: HeaderBreadcrumb[] = [{ label: 'Empower', href: '/empower' }]
    if (pathname === '/empower') return crumbs
    if (pathname.startsWith('/empower/initiatives')) {
      crumbs.push({ label: 'Initiatives', href: '/empower/initiatives' })
    } else if (pathname.startsWith('/empower/tasks')) {
      crumbs.push({ label: 'My Tasks', href: '/empower/tasks' })
    } else if (pathname.startsWith('/empower/team')) {
      crumbs.push({ label: 'Team view', href: pathname })
    } else if (pathname.startsWith('/empower/analytics')) {
      crumbs.push({ label: 'Analytics', href: '/empower/analytics' })
    } else if (pathname.startsWith('/empower/conversations')) {
      crumbs.push({ label: 'Conversations', href: '/empower/conversations' })
    } else if (pathname.startsWith('/empower/admin')) {
      crumbs.push({ label: 'Admin', href: '/empower/admin' })
    } else if (pathname.startsWith('/empower/settings')) {
      crumbs.push({ label: 'Settings', href: '/empower/settings' })
    }
    return crumbs
  }

  return [{ label: folderName, href: '/lifecycle' }]
}
