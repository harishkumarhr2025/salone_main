import {
  IconLayoutDashboard,
  IconMan,
  IconCar,
  IconHome2,
  IconTools,
  IconReport,
  IconBrandWhatsapp,
} from '@tabler/icons';
import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    id: uniqueId(),
    title: 'Guest Entry',
    icon: IconMan,
    href: '/guest-entry',
  },
  {
    navlabel: true,
    subheader: 'Room',
  },
  {
    id: uniqueId(),
    title: 'Room',
    icon: IconHome2,
    href: '/room-management',
  },
  {
    navlabel: true,
    subheader: 'Employee Managements',
  },
  {
    id: uniqueId(),
    title: 'Employee',
    icon: IconCar,
    href: '/manage-employee',
  },
  {
    navlabel: true,
    subheader: 'Product Managements',
  },
  {
    id: uniqueId(),
    title: 'Manage Product',
    icon: IconCar,
    href: '/product-manage',
  },
  {
    navlabel: true,
    subheader: 'Agents',
  },
  {
    id: uniqueId(),
    title: 'Manage Agents',
    icon: IconCar,
    href: '/agents',
  },
  {
    navlabel: true,
    subheader: 'WhatsApp',
  },
  {
    id: uniqueId(),
    title: 'WA Templates',
    icon: IconBrandWhatsapp,
    href: '/whatsapp-templates',
  },
  {
    navlabel: true,
    subheader: 'Access Control',
  },
  {
    id: uniqueId(),
    title: 'Roles',
    icon: IconTools,
    href: '/roles',
  },
];

export default Menuitems;
