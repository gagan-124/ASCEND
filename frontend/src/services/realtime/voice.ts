export class VoiceRealtimeService {
  private socket: WebSocket | null = null;

  public connect(url: string): void {
    if (this.socket) return;
    this.socket = new WebSocket(url);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const voiceRealtimeService = new VoiceRealtimeService();
