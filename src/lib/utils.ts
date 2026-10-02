import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string): string {
  return format(new Date(date), 'MMM d, yyyy · h:mm a');
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getAppUrl(): string {
  // Check explicit environment variable (e.g. VITE_APP_URL in Render)
  const envUrl = import.meta.env.VITE_APP_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  // Fallback to window.location.origin in browser environment
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }

  return 'https://doubt-hub-3c0r.onrender.com';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

export function generateAvatarColor(str: string): string {
  const colors = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-rose-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-pink-500',
    'bg-cyan-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function isValidFileType(file: File, allowed: string[]): boolean {
  return allowed.some(
    (type) => file.type === type || file.name.toLowerCase().endsWith(type.replace('image/', '.').replace('application/', '.'))
  );
}

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_PDF_TYPES = ['application/pdf'];
export const ALLOWED_ATTACHMENT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES];

export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const BRANCHES = [
  'Computer Science',
  'Information Science',
  'Electronics & Communication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biotechnology',
  'Other',
];

export const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'misleading', label: 'Misleading information' },
  { value: 'duplicate', label: 'Duplicate question' },
  { value: 'other', label: 'Other' },
] as const;
