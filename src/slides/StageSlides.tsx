import { useContent, useStage } from '../content/ContentContext';
import { StageDivider } from '../components/StageDivider';
import { StageRoute } from '../components/StageRoute';
import type { SlideProps } from './types';

export function StageDividerSlide({ stage }: SlideProps & { stage: number }) {
  const s = useStage(stage);
  const { stages } = useContent();
  return <StageDivider stage={s} total={stages.length} />;
}

export function StageRouteSlide({ page, stage }: SlideProps & { stage: number }) {
  const s = useStage(stage);
  const content = useContent();
  return <StageRoute stage={s} content={content} page={page} />;
}
