import { ContentProvider } from './content/ContentContext';
import { Presenter } from './scene/Presenter';

export function App() {
  return (
    <ContentProvider>
      <Presenter />
    </ContentProvider>
  );
}
