// Cloudflare Worker: relæ til fjernbetjening + (valgfrit) værtsside for appen.
//
//   /ws/<RUMKODE>?role=screen|remote  → WebSocket til rummets Durable Object
//   /health                            → "ok"
//   alt andet                          → appen (dist/), hvis [assets] er sat op
//
// Hvert rum er én Durable Object. Skærmen sender sin fulde tilstand (snapshot),
// telefonen sender ændringer (patch). Relæet gemmer kun seneste snapshot (uden
// fotos) og sletter rummet efter 3 dages inaktivitet.
import { DurableObject } from 'cloudflare:workers';
import { parseClientMessage, ROOM_CODE_RE, type Peers, type Role, type ServerMessage } from '../src/remote/protocol';

interface Env {
  ROOMS: DurableObjectNamespace<Room>;
  ASSETS?: Fetcher;
}

const IDLE_MS = 3 * 24 * 60 * 60 * 1000;

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/health') return new Response('ok', { headers: { 'cache-control': 'no-store' } });
    const m = url.pathname.match(/^\/ws\/([^/]+)$/);
    if (m) {
      if (!ROOM_CODE_RE.test(m[1])) return new Response('Ugyldig rumkode', { status: 400 });
      if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('Forventer WebSocket', { status: 426 });
      return env.ROOMS.get(env.ROOMS.idFromName(m[1])).fetch(req);
    }
    if (env.ASSETS) return env.ASSETS.fetch(req);
    return new Response('Ikke fundet', { status: 404 });
  },
} satisfies ExportedHandler<Env>;

export class Room extends DurableObject<Env> {
  async fetch(req: Request): Promise<Response> {
    const role: Role = new URL(req.url).searchParams.get('role') === 'screen' ? 'screen' : 'remote';
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    this.ctx.acceptWebSocket(server, [role]);
    const snap = (await this.ctx.storage.get('snapshot')) ?? null;
    this.sendTo(server, { t: 'welcome', snap: snap as never, peers: this.peers(), server: Date.now() });
    this.broadcast(null, { t: 'peers', peers: this.peers() });
    await this.touch();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, data: string | ArrayBuffer): Promise<void> {
    const msg = parseClientMessage(data);
    if (!msg) return;
    const role = this.ctx.getTags(ws)[0] as Role;
    if (msg.t === 'ping') {
      this.sendTo(ws, { t: 'pong', id: msg.id, t0: msg.t0, server: Date.now() });
    } else if (msg.t === 'snapshot' && role === 'screen') {
      await this.ctx.storage.put('snapshot', msg.snap);
      this.broadcast('remote', { t: 'snapshot', snap: msg.snap });
      await this.touch();
    } else if (msg.t === 'patch' && role === 'remote') {
      this.broadcast('screen', { t: 'patch', patch: msg.patch });
      await this.touch();
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string): Promise<void> {
    try {
      ws.close(code, reason);
    } catch {
      /* allerede lukket */
    }
    this.broadcast(null, { t: 'peers', peers: this.peers(ws) });
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    this.broadcast(null, { t: 'peers', peers: this.peers(ws) });
  }

  /** Slet rummet efter længere tids inaktivitet. */
  async alarm(): Promise<void> {
    if (this.ctx.getWebSockets().length === 0) await this.ctx.storage.deleteAll();
    else await this.touch();
  }

  private async touch() {
    await this.ctx.storage.setAlarm(Date.now() + IDLE_MS);
  }

  private open(tag?: Role, except?: WebSocket) {
    return this.ctx.getWebSockets(tag).filter((w) => w !== except && w.readyState === WebSocket.OPEN);
  }

  private peers(except?: WebSocket): Peers {
    return { screens: this.open('screen', except).length, remotes: this.open('remote', except).length };
  }

  private sendTo(ws: WebSocket, msg: ServerMessage) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* forbindelsen er lukket */
    }
  }

  private broadcast(tag: Role | null, msg: ServerMessage) {
    const s = JSON.stringify(msg);
    for (const w of this.open(tag ?? undefined)) {
      try {
        w.send(s);
      } catch {
        /* ignorer */
      }
    }
  }
}
