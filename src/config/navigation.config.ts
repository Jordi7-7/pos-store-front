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
  List,
  FileText,
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
  label: string;
  path?: string; // Absolute path, e.g. '/dashboard', '/pos'
  icon: LucideIcon;
  permission?: string;
  children?: NavSubItem[];
}

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
    label: 'Punto de Venta (POS)',
    path: '/pos',
    icon: ShoppingBag,
    permission: APP_PERMISSIONS.VIEW_POS,
  },
  {
    id: 'sales',
    label: 'Ventas',
    path: '/ventas',
    icon: Receipt,
    permission: APP_PERMISSIONS.VIEW_SALES,
  },
  {
    id: 'inventory',
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
        label: 'Lotes de Inventario',
        path: '/inventario/lotes',
        icon: Boxes,
        permission: APP_PERMISSIONS.VIEW_PRODUCTS,
      },
      {
        id: 'inventory-create',
        label: 'Crear Producto',
        path: '/inventario/crear',
        icon: PlusCircle,
        permission: APP_PERMISSIONS.PRODUCTS_CREATE,
      },
    ],
  },
  {
    id: 'purchases',
    label: 'Compras',
    path: '/compras',
    icon: Truck,
    permission: APP_PERMISSIONS.VIEW_PURCHASES,
  },
  {
    id: 'customers',
    label: 'Directorio de Clientes',
    path: '/clientes',
    icon: Contact,
    permission: APP_PERMISSIONS.VIEW_CUSTOMERS,
  },
  {
    id: 'cash-registers-group',
    label: 'Cajas Registradoras',
    icon: CreditCard,
    children: [
      {
        id: 'cash-registers',
        label: 'Cajas',
        path: '/cajas/registradoras',
        icon: CreditCard,
        permission: APP_PERMISSIONS.VIEW_CASH_REGISTERS,
      },
      {
        id: 'cash-sessions',
        label: 'Historial de Cajas',
        path: '/cajas/historial',
        icon: History,
        permission: APP_PERMISSIONS.VIEW_CASH_SESSIONS,
      },
    ],
  },
  {
    id: 'reports-group',
    label: 'Reportes y Utilidades',
    icon: BarChart3,
    permission: APP_PERMISSIONS.VIEW_REPORTS,
    children: [
      {
        id: 'reports-cost-sales',
        label: 'Costo de Ventas',
        path: '/reportes/costo-ventas',
        icon: FileText,
        permission: APP_PERMISSIONS.VIEW_REPORTS,
      },
      {
        id: 'reports-product-sales',
        label: 'Ventas por Producto',
        path: '/reportes/ventas-productos',
        icon: ShoppingBag,
        permission: APP_PERMISSIONS.VIEW_REPORTS,
      },
      {
        id: 'reports-valued-inventory',
        label: 'Existencias Valuadas',
        path: '/reportes/existencias-valuadas',
        icon: Boxes,
        permission: APP_PERMISSIONS.VIEW_REPORTS,
      },
    ],
  },
  {
    id: 'users',
    label: 'Personal y Roles',
    path: '/usuarios',
    icon: Users,
    permission: APP_PERMISSIONS.VIEW_USERS,
  },
  {
    id: 'media',
    label: 'Multimedia / Galería',
    path: '/multimedia',
    icon: ImageIcon,
    permission: APP_PERMISSIONS.VIEW_MEDIA,
  },
  {
    id: 'tenant-settings',
    label: 'Configuración Negocio',
    path: '/configuracion',
    icon: Settings,
    permission: APP_PERMISSIONS.VIEW_SETTINGS,
  },
];
