import { useContent } from '../content/ContentContext';

export function SlideFooter({ page, light = false }: { page?: number; light?: boolean }) {
  const { meta } = useContent();
  return (
    <div className="slide-footer" style={{ color: light ? 'var(--paper)' : 'var(--navy)' }}>
      <span className="brand">{meta.footer}</span>
      {page !== undefined && <span>{page}</span>}
    </div>
  );
}
