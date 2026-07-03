export type EmpowerNavItem = {
  label: string;
  href: string;
  icon: string;
};

export const EMPOWER_HOME: EmpowerNavItem = {
  label: 'Home',
  href: '/empower',
  icon: 'wm-home',
};

export const EMPOWER_EDIT_NAV: EmpowerNavItem[] = [
  { label: 'Initiatives', href: '/empower/initiatives', icon: 'wm-apps' },
  { label: 'Team view', href: '/empower/team-view', icon: 'wm-groups' },
];

export const EMPOWER_DATA_NAV: EmpowerNavItem[] = [
  { label: 'Analytics', href: '/empower/analytics', icon: 'wm-bar-chart' },
  { label: 'Conversations', href: '/empower/conversations', icon: 'wm-forum' },
];

export const EMPOWER_FOOTER_NAV: EmpowerNavItem[] = [
  { label: 'Admin', href: '/empower/admin', icon: 'wm-admin-panel-settings' },
  { label: 'Settings', href: '/empower/settings', icon: 'wm-settings' },
];

export function isEmpowerNavActive(pathname: string, href: string): boolean {
  if (href === '/empower') return pathname === '/empower';
  return pathname === href || pathname.startsWith(`${href}/`);
}
