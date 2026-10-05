import { useContent } from '../content/ContentContext';

export function SlideFooter({ page, light = false }: { page?: number; light?: boolean }) {
  const { meta } = useContent();
  return (
    <div className="slide-footer" style={light ? { color: 'var(--muted-dark)' } : undefined}>
      <span className="brand">{meta.footer}</span>
      {page !== undefined && <span className="page">{String(page).padStart(2, '0')}</span>}
    </div>
  );
}
