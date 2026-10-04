import { ContentProvider } from './content/ContentContext';
import { Presenter } from './scene/Presenter';
import { GameProvider } from './game/GameContext';
import { CommissionerProvider } from './commissioner/CommissionerContext';

export function App() {
  return (
    <ContentProvider>
      <GameProvider>
        <CommissionerProvider>
          <Presenter />
        </CommissionerProvider>
      </GameProvider>
    </ContentProvider>
  );
}
