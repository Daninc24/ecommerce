// List of all Heroicons we're using in the application
// This helps with debugging and ensures all icons are available

export const ICONS = {
  // Navigation & UI
  ShoppingCartIcon: 'ShoppingCartIcon',
  UserIcon: 'UserIcon',
  Bars3Icon: 'Bars3Icon', // Hamburger menu
  XMarkIcon: 'XMarkIcon', // Close button
  Cog6ToothIcon: 'Cog6ToothIcon', // Settings
  ChartBarIcon: 'ChartBarIcon', // Dashboard
  
  // Actions
  PlusIcon: 'PlusIcon',
  MinusIcon: 'MinusIcon',
  TrashIcon: 'TrashIcon',
  PencilIcon: 'PencilIcon',
  EyeIcon: 'EyeIcon',
  ArrowRightIcon: 'ArrowRightIcon',
  ArrowLeftIcon: 'ArrowLeftIcon',
  ArrowUpIcon: 'ArrowUpIcon',
  ArrowDownIcon: 'ArrowDownIcon',
  
  // Shopping & Commerce
  ShoppingBagIcon: 'ShoppingBagIcon',
  CreditCardIcon: 'CreditCardIcon',
  CurrencyDollarIcon: 'CurrencyDollarIcon',
  
  // Status & Feedback
  CheckCircleIcon: 'CheckCircleIcon',
  XCircleIcon: 'XCircleIcon',
  ExclamationTriangleIcon: 'ExclamationTriangleIcon',
  InformationCircleIcon: 'InformationCircleIcon',
  StarIcon: 'StarIcon',
  
  // Features & Services
  TruckIcon: 'TruckIcon', // Shipping
  ShieldCheckIcon: 'ShieldCheckIcon', // Security
  ArrowPathIcon: 'ArrowPathIcon', // Returns/Refresh
  ClockIcon: 'ClockIcon', // Time
  
  // UI Controls
  MagnifyingGlassIcon: 'MagnifyingGlassIcon', // Search
  FunnelIcon: 'FunnelIcon', // Filter
  Squares2X2Icon: 'Squares2X2Icon', // Grid view
  ListBulletIcon: 'ListBulletIcon', // List view
  AdjustmentsHorizontalIcon: 'AdjustmentsHorizontalIcon', // Settings
};

// Available icons in Heroicons v2.0.18 (outline)
export const AVAILABLE_ICONS = [
  'ShoppingCartIcon',
  'UserIcon',
  'Bars3Icon',
  'XMarkIcon',
  'Cog6ToothIcon',
  'ChartBarIcon',
  'PlusIcon',
  'MinusIcon',
  'TrashIcon',
  'PencilIcon',
  'EyeIcon',
  'ArrowRightIcon',
  'ArrowLeftIcon',
  'ArrowUpIcon',
  'ArrowDownIcon',
  'ShoppingBagIcon',
  'CreditCardIcon',
  'CurrencyDollarIcon',
  'CheckCircleIcon',
  'XCircleIcon',
  'ExclamationTriangleIcon',
  'InformationCircleIcon',
  'StarIcon',
  'TruckIcon',
  'ShieldCheckIcon',
  'ArrowPathIcon',
  'ClockIcon',
  'MagnifyingGlassIcon',
  'FunnelIcon',
  'Squares2X2Icon',
  'ListBulletIcon',
  'AdjustmentsHorizontalIcon',
];

// Function to validate if an icon exists
export const validateIcon = (iconName) => {
  return AVAILABLE_ICONS.includes(iconName);
};

// Function to get fallback icon
export const getFallbackIcon = (iconName) => {
  const fallbackMap = {
    'TrendingUpIcon': 'ArrowUpIcon',
    'TrendingDownIcon': 'ArrowDownIcon',
    'ChartPieIcon': 'ChartBarIcon',
    'HomeIcon': 'UserIcon',
    'SettingsIcon': 'Cog6ToothIcon',
  };
  
  return fallbackMap[iconName] || 'InformationCircleIcon';
}; 