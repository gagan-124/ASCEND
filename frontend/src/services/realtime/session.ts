export class SessionRealtimeService {
  private socket: WebSocket | null = null;

  public connectSession(sessionId: string): void {
    console.log(`[SessionRealtimeService] Boundary placeholder connecting to session ${sessionId}`);
  }

  public disconnectSession(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export const sessionRealtimeService = new SessionRealtimeService();
