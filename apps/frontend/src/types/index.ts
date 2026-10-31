// Shared frontend type definitions

/** Standard backend response envelope (see backend utils/api-response.ts). */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  code?: string;
}

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number };
}

export interface NavItem {
  name: string;
  href: string;
  icon: string;
}

