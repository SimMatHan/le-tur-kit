import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/app.css';
import './styles/editor.css';
import './styles/commissioner.css';
import { installPhotoStore } from './content/photoStore';
import { App } from './App';
import { RemoteApp } from './remote/RemoteApp';
import { parseRemoteParams } from './remote/protocol';

installPhotoStore();

// ?remote=RUMKODE → telefonens fjernbetjening; ellers præsentationen.
const remote = parseRemoteParams(location.search, location.protocol.startsWith('http') ? location.origin : '');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{remote ? <RemoteApp room={remote.room} relay={remote.relay} /> : <App />}</StrictMode>,
);
