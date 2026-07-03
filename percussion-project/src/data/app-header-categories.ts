import type { IWuAppHeaderMenuItem } from '@npm-questionpro/wick-ui-lib';

/** Product switcher categories for WuAppHeader (QuestionPro suite navigation). */
export const APP_HEADER_CATEGORIES: IWuAppHeaderMenuItem[] = [
  {
    name: 'Employee Experience',
    logo: 'https://cdn.questionpro.com/images/productSwitcher/e315.png',
    desc: 'Employee experience and engagement',
    active: true,
    order: 1,
    products: [
      {
        name: 'Employee Experience',
        link: '/studies',
        icon: 'e315',
        active: true,
        order: 1,
      },
      {
        name: 'Empower',
        link: '/empower',
        icon: 'e324',
        active: true,
        order: 2,
      },
    ],
  },
];
