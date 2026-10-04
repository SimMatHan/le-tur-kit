// WebSocket-forbindelse til relæet: genopkobler automatisk og måler forskellen
// mellem relæets ur og det lokale ur (til stopuret).
import { estimateOffset, socketUrl, type ClientMessage, type ClockSample, type Role, type ServerMessage } from './protocol';
import { setSharedOffset } from './sharedTime';

export type ConnStatus = 'connecting' | 'open' | 'closed';

interface Options {
  relayUrl: string;
  room: string;
  role: Role;
  onMessage: (m: ServerMessage) => void;
  onStatus: (s: ConnStatus) => void;
}

export class RelayConnection {
  private ws: WebSocket | null = null;
  private stopped = false;
  private retry = 0;
  private retryTimer: number | undefined;
  private pingTimer: number | undefined;
  private pingId = 0;
  private samples: ClockSample[] = [];
  private queue: string[] = [];

  constructor(private opts: Options) {
    this.connect();
  }

  private connect() {
    if (this.stopped) return;
    this.opts.onStatus('connecting');
    let ws: WebSocket;
    try {
      ws = new WebSocket(socketUrl(this.opts.relayUrl, this.opts.room, this.opts.role));
    } catch {
      this.scheduleRetry();
      return;
    }
    this.ws = ws;
    ws.onopen = () => {
      this.retry = 0;
      this.opts.onStatus('open');
      for (const m of this.queue.splice(0)) ws.send(m);
      this.ping();
      window.clearInterval(this.pingTimer);
      this.pingTimer = window.setInterval(() => this.ping(), 5000);
    };
    ws.onmessage = (ev) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (msg.t === 'pong') {
        this.samples = [...this.samples, { t0: msg.t0, t1: Date.now(), server: msg.server }].slice(-9);
        setSharedOffset(estimateOffset(this.samples));
      }
      this.opts.onMessage(msg);
    };
    ws.onclose = () => {
      window.clearInterval(this.pingTimer);
      if (this.ws === ws) this.ws = null;
      if (!this.stopped) {
        this.opts.onStatus('closed');
        this.scheduleRetry();
      }
    };
    ws.onerror = () => ws.close();
  }

  private scheduleRetry() {
    window.clearTimeout(this.retryTimer);
    const delay = Math.min(10_000, 500 * 2 ** this.retry++);
    this.retryTimer = window.setTimeout(() => this.connect(), delay);
  }

  private ping() {
    this.send({ t: 'ping', id: ++this.pingId, t0: Date.now() });
  }

  send(msg: ClientMessage) {
    const s = JSON.stringify(msg);
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(s);
    else if (msg.t !== 'ping') this.queue = [...this.queue.filter((q) => !q.startsWith('{"t":"snapshot"') || msg.t !== 'snapshot'), s].slice(-20);
  }

  close() {
    this.stopped = true;
    window.clearTimeout(this.retryTimer);
    window.clearInterval(this.pingTimer);
    this.ws?.close();
    this.ws = null;
    setSharedOffset(0);
    this.opts.onStatus('closed');
  }
}
