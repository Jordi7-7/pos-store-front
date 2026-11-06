import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  ShoppingBag,
  Receipt,
  Package,
  Truck,
  Users,
  Image as ImageIcon,
  Settings,
  BarChart3,
  Contact,
  History,
  CreditCard,
  Boxes,
  PlusCircle,
  Layers,
  List,
  FileText,
  ShoppingCart,
  Building2,
} from 'lucide-react';
import { APP_PERMISSIONS } from '@/constants/permissions';

export interface NavSubItem {
  id: string;
  label: string;
  path: string; // Absolute path, e.g. '/inventario/productos'
  icon: LucideIcon;
  permission?: string;
}

export interface NavItem {
  id: string;
  /** Sección del menú lateral en la que se agrupa; sin sección = arriba del todo. */
  section?: NavSection;
  label: string;
  path?: string; // Absolute path, e.g. '/dashboard', '/pos'
  icon: LucideIcon;
  permission?: string;
  children?: NavSubItem[];
}

/** Secciones del menú lateral, en el orden en que se muestran. */
export const NAV_SECTIONS = ['Ventas', 'Inventario', 'Análisis', 'Administración'] as const;
export type NavSection = (typeof NAV_SECTIONS)[number];

export const navigationConfig: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    permission: APP_PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    id: 'pos',
    section: 'Ventas',
    label: 'Punto de Venta (POS)',
    path: '/pos',
    icon: ShoppingBag,
    permission: APP_PERMISSIONS.VIEW_POS,
  },
  {
    id: 'sales',
    section: 'Ventas',
    label: 'Ventas',
    path: '/ventas',
    icon: Receipt,
    permission: APP_PERMISSIONS.VIEW_SALES,
  },
  {
    id: 'inventory',
    section: 'Inventario',
    label: 'Inventario',
    icon: Package,
    permission: APP_PERMISSIONS.VIEW_PRODUCTS,
    children: [
      {
        id: 'inventory-products',
        label: 'Productos',
        path: '/inventario/productos',
        icon: List,
        permission: APP_PERMISSIONS.VIEW_PRODUCTS,
      },
      {
        id: 'inventory-batches',
        label: 'Lotes',
        path: '/inventario/lotes',
        icon: Boxes,
        permission: APP_PERMISSIONS.VIEW_PRODUCTS,
      },
      {
        id: 'inventory-create',
        label: 'Crear producto',
        path: '/inventario/crear',
        icon: PlusCircle,
        permission: APP_PERMISSIONS.PRODUCTS_CREATE,
      },
      {
        id: 'inventory-create-variable',
        label: 'Crear con variantes',
        path: '/inventario/crear-compuesto',
        icon: Layers,
        permission: APP_PERMISSIONS.PRODUCTS_CREATE,
      },
    ],
  },
  {
    id: 'purchases-group',
    section: 'Inventario',
    label: 'Compras',
    icon: Truck,
    permission: APP_PERMISSIONS.VIEW_PURCHASES,
    children: [
      {
        id: 'purchases-create',
        label: 'Registrar compra',
        path: '/compras/registrar',
        icon: ShoppingCart,
        permission: APP_PERMISSIONS.PURCHASES_CREATE,
      },
      {
        id: 'purchases-history',
        label: 'Historial de compras',
        path: '/compras/historial',
        icon: History,
        permission: APP_PERMISSIONS.VIEW_PURCHASES,
      },
      {
        id: 'purchases-suppliers',
        label: 'Proveedores',
        path: '/compras/proveedores',
        icon: Building2,
        permission: APP_PERMISSIONS.VIEW_SUPPLIERS,
      },
    ],
  },
  {
    id: 'customers',
    section: 'Ventas',
    label: 'Clientes',
    path: '/clientes',
    icon: Contact,
    permission: APP_PERMISSIONS.VIEW_CUSTOMERS,
  },
  {
    id: 'cash-registers-group',
    section: 'Ventas',
    label: 'Cajas',
    icon: CreditCard,
    children: [
      {
        id: 'cash-registers',
        label: 'Cajas registradoras',
        path: '/cajas/registradoras',
        icon: CreditCard,
        permission: APP_PERMISSIONS.VIEW_CASH_REGISTERS,
      },
      {
        id: 'cash-sessions',
        label: 'Historial de turnos',
        path: '/cajas/historial',
        icon: History,
        permission: APP_PERMISSIONS.VIEW_CASH_SESSIONS,
      },
    ],
  },
  {
    id: 'reports-group',
    section: 'Análisis',
    label: 'Reportes',
    icon: BarChart3,
    permission: APP_PERMISSIONS.VIEW_REPORTS,
    children: [
      {
        id: 'reports-cost-sales',
        label: 'Costo de ventas',
        path: '/reportes/costo-ventas',
        icon: FileText,
        permission: APP_PERMISSIONS.VIEW_REPORTS,
      },
      {
        id: 'reports-product-sales',
        label: 'Ventas por producto',
        path: '/reportes/ventas-productos',
        icon: ShoppingBag,
        permission: APP_PERMISSIONS.VIEW_REPORTS,
      },
      {
        id: 'reports-valued-inventory',
        label: 'Existencias valuadas',
        path: '/reportes/existencias-valuadas',
        icon: Boxes,
        permission: APP_PERMISSIONS.VIEW_REPORTS,
      },
    ],
  },
  {
    id: 'users',
    section: 'Administración',
    label: 'Personal y roles',
    path: '/usuarios',
    icon: Users,
    permission: APP_PERMISSIONS.VIEW_USERS,
  },
  {
    id: 'media',
    section: 'Inventario',
    label: 'Galería',
    path: '/multimedia',
    icon: ImageIcon,
    permission: APP_PERMISSIONS.VIEW_MEDIA,
  },
  {
    id: 'tenant-settings',
    section: 'Administración',
    label: 'Configuración',
    path: '/configuracion',
    icon: Settings,
    permission: APP_PERMISSIONS.VIEW_SETTINGS,
  },
];
