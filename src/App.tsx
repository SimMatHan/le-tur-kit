import { ContentProvider } from './content/ContentContext';
import { Presenter } from './scene/Presenter';
import { GameProvider } from './game/GameContext';

export function App() {
  return (
    <ContentProvider>
      <GameProvider>
        <Presenter />
      </GameProvider>
    </ContentProvider>
  );
}
