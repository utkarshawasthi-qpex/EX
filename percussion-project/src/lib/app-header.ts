import { APP_HEADER_CATEGORIES } from '@/data/app-header-categories';

export function isEmpowerPath(pathname: string): boolean {
  return pathname === '/empower' || pathname.startsWith('/empower/');
}

export function isStudiesPath(pathname: string): boolean {
  return pathname === '/studies' || pathname.startsWith('/studies/');
}

export function isEmployeeExperiencePath(pathname: string): boolean {
  return isStudiesPath(pathname) || pathname.startsWith('/projects');
}

export function getHeaderProductName(pathname: string): string {
  return isEmpowerPath(pathname) ? 'Empower' : 'Employee Experience';
}

export function getHeaderHomeLink(pathname: string): string {
  if (isEmpowerPath(pathname)) return '/empower';
  if (isStudiesPath(pathname)) return '/studies';
  return '/studies';
}

export function getHeaderCategories() {
  return APP_HEADER_CATEGORIES;
}
