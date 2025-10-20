import Imap from "node-imap";
import { EventEmitter } from "events";
import { simpleParser, ParsedMail } from "mailparser";

const env = process.env;

export class EmailSyncService extends EventEmitter {
  private imaps: Imap[] = [];
  private reconnectDelay = 5000;

  private accounts = [
    { user: env.EMAIL1_USER!, password: env.EMAIL1_PASS!, host: env.EMAIL1_HOST! },
    { user: env.EMAIL2_USER!, password: env.EMAIL2_PASS!, host: env.EMAIL2_HOST! }
  ];

  constructor() { super(); }

  async start() {
    await Promise.all(this.accounts.map(acc => this.connectAccount(acc)));
  }

  private connectAccount(acc: { user: string; password: string; host: string }) {
    return new Promise<void>(resolve => {
      const imap = new Imap({
        user: acc.user,
        password: acc.password,
        host: acc.host,
        port: 993,
        tls: true
      });

      const handleError = (err: any) => {
        this.emit("error", { account: acc.user, err });
        setTimeout(() => this.connectAccount(acc), this.reconnectDelay);
      };

      imap.once("ready", () => this.onReady(imap, acc));
      imap.once("error", handleError);
      imap.once("end", () => handleError(new Error("IMAP connection closed")));
      imap.connect();
      this.imaps.push(imap);
      resolve();
    });
  }

  private async onReady(imap: Imap, acc: { user: string }) {
    imap.openBox("INBOX", true, async (err, box) => {
      if (err) return this.emit("error", err);
      this.fetchRecent(imap, acc);
      this.watchMailbox(imap, box, acc);
    });
  }

  private fetchRecent(imap: Imap, acc: { user: string }) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    imap.search(["SINCE", since], (err, results) => {
      if (err || !results?.length) return;
      const fetch = imap.fetch(results, { bodies: "" });
      fetch.on("message", msg => this.handleMessage(msg, acc));
    });
  }

  private watchMailbox(imap: Imap, box: any, acc: { user: string }) {
    imap.on("mail", () => {
      const fetch = imap.seq.fetch(box.messages.total, { bodies: "" });
      fetch.on("message", msg => this.handleMessage(msg, acc));
    });

    const keepAlive = () => (imap as any).idle?.();
    keepAlive();
    setInterval(keepAlive, 29 * 60 * 1000);
  }

  private async handleMessage(msg: any, acc: { user: string }) {
    msg.on("body", async (stream: NodeJS.ReadableStream) => {
      try {
        const parsed: ParsedMail = await simpleParser(stream as any) as ParsedMail;

        const toAddresses = Array.isArray(parsed.to)
          ? (parsed.to as any[]).map(t => t.address)
          : parsed.to?.value?.map(v => v.address) || [];

        this.emit("email", {
          id: parsed.messageId,
          accountId: acc.user,
          folder: "INBOX",
          subject: parsed.subject || "(No Subject)",
          body: parsed.text || "",
          from: parsed.from?.text || "",
          to: toAddresses,
          date: parsed.date || new Date(),
          aiCategory: "Uncategorized",
          indexedAt: new Date()
        });
      } catch (err) {
        this.emit("error", { account: acc.user, err });
      }
    });
  }
}
