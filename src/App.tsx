import { ContentProvider } from './content/ContentContext';
import { Presenter } from './scene/Presenter';
import { GameProvider } from './game/GameContext';
import { CommissionerProvider } from './commissioner/CommissionerContext';
import { RemoteHostProvider } from './remote/RemoteHost';

export function App() {
  return (
    <ContentProvider>
      <GameProvider>
        <CommissionerProvider>
          <RemoteHostProvider>
            <Presenter />
          </RemoteHostProvider>
        </CommissionerProvider>
      </GameProvider>
    </ContentProvider>
  );
}
