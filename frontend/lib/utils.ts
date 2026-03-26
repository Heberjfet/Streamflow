export const colors = {
  background: '#050505',
  primary: '#A855F7',
  secondary: '#D946EF',
  surface: '#121212',
  border: '#262626',
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1AA',
} as const;

export const gradients = {
  radialPrimary: 'radial-gradient(circle at center, rgba(168, 85, 247, 0.1) 0%, transparent 70%)',
  button: 'linear-gradient(135deg, #A855F7 0%, #D946EF 100%)',
} as const;

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getMinioUrl(path: string): string {
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost:9000';
  return `http://${endpoint}/${path}`;
}
