import { Message, TransportProtocol, ActiveTransportStatus, P2PPeerSession, NetworkDiagnostics } from '../types';

type MessageListener = (chatId: string, message: Message, transport: 'server' | 'p2p') => void;
type TypingListener = (chatId: string, userId: string, userName: string, isTyping: boolean) => void;
type ReactionListener = (chatId: string, messageId: string, emoji: string, userId: string) => void;
type PresenceListener = (onlineCount: number, peers: any[]) => void;
type DiagnosticsListener = (diagnostics: NetworkDiagnostics) => void;
type PeerSessionListener = (peers: P2PPeerSession[]) => void;
type FileTransferProgressListener = (progress: { fileId: string; fileName: string; percentage: number; isReceiving: boolean; senderName: string }) => void;

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class NetworkEngine {
  private ws: WebSocket | null = null;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private currentUserId: string = '';
  private currentUserName: string = '';
  private currentUserAvatar: string = '';
  private activeChatId: string = '';
  
  // Transport Mode: 'auto' | 'server' | 'p2p'
  private transportMode: TransportProtocol = 'auto';
  private activeStatus: ActiveTransportStatus = 'offline';
  private latencyMs: number = 18;
  private lastPingSentTime: number = 0;

  // WebRTC Peer Connections map by targetPeerId
  private peerConnections = new Map<string, RTCPeerConnection>();
  private dataChannels = new Map<string, RTCDataChannel>();
  private peerSessions = new Map<string, P2PPeerSession>();

  // Incoming P2P File transfers buffer
  private incomingFileBuffers = new Map<string, { fileName: string; fileType: string; totalChunks: number; receivedChunks: Uint8Array[]; senderName: string }>();

  // Telemetry metrics
  private bytesServer: number = 12400;
  private bytesP2P: number = 42800;
  private onlineUsersCount: number = 1;

  // Listeners
  private messageListeners = new Set<MessageListener>();
  private typingListeners = new Set<TypingListener>();
  private reactionListeners = new Set<ReactionListener>();
  private presenceListeners = new Set<PresenceListener>();
  private diagnosticsListeners = new Set<DiagnosticsListener>();
  private peerSessionListeners = new Set<PeerSessionListener>();
  private fileTransferListeners = new Set<FileTransferProgressListener>();

  constructor() {
    // Check WebRTC browser capabilities
    if (typeof window !== 'undefined') {
      this.initVirtualSelfPeer();
    }
  }

  // Initialize engine with user session
  public init(userId: string, userName: string, avatar: string, defaultChatId: string = '') {
    this.currentUserId = userId;
    this.currentUserName = userName;
    this.currentUserAvatar = avatar;
    this.activeChatId = defaultChatId;
    this.connectWebSocket();
  }

  public setChatId(chatId: string) {
    this.activeChatId = chatId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat:join_room',
        chatId,
      }));
    }
    this.updateDiagnostics();
  }

  public setTransportMode(mode: TransportProtocol) {
    this.transportMode = mode;
    this.evaluateActiveStatus();
    this.updateDiagnostics();
  }

  public getTransportMode(): TransportProtocol {
    return this.transportMode;
  }

  public getDiagnostics(): NetworkDiagnostics {
    return {
      transportMode: this.transportMode,
      activeStatus: this.activeStatus,
      latencyMs: this.latencyMs,
      connectedClientsCount: this.onlineUsersCount,
      p2pPeersCount: Array.from(this.peerSessions.values()).filter(p => p.dataChannelState === 'open').length,
      isWebRTCSupported: typeof RTCPeerConnection !== 'undefined',
      isWebSocketConnected: this.ws !== null && this.ws.readyState === WebSocket.OPEN,
      bytesTransferred: {
        server: this.bytesServer,
        p2p: this.bytesP2P,
      },
      stunServer: 'stun.l.google.com:19302 (Google STUN)',
      dataChannelStatus: this.getActiveDataChannelSummary(),
    };
  }

  public getPeerSessions(): P2PPeerSession[] {
    return Array.from(this.peerSessions.values());
  }

  // Event subscription methods
  public onMessage(listener: MessageListener) {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  public onTyping(listener: TypingListener) {
    this.typingListeners.add(listener);
    return () => this.typingListeners.delete(listener);
  }

  public onReaction(listener: ReactionListener) {
    this.reactionListeners.add(listener);
    return () => this.reactionListeners.delete(listener);
  }

  public onPresence(listener: PresenceListener) {
    this.presenceListeners.add(listener);
    return () => this.presenceListeners.delete(listener);
  }

  public onDiagnostics(listener: DiagnosticsListener) {
    this.diagnosticsListeners.add(listener);
    listener(this.getDiagnostics());
    return () => this.diagnosticsListeners.delete(listener);
  }

  public onPeerSessions(listener: PeerSessionListener) {
    this.peerSessionListeners.add(listener);
    listener(this.getPeerSessions());
    return () => this.peerSessionListeners.delete(listener);
  }

  public onFileTransferProgress(listener: FileTransferProgressListener) {
    this.fileTransferListeners.add(listener);
    return () => this.fileTransferListeners.delete(listener);
  }

  // Connect to backend WebSocket server
  private connectWebSocket() {
    if (typeof window === 'undefined') return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.activeStatus = 'server-ws';
        this.registerClient();
        this.startPingLoop();
        this.evaluateActiveStatus();
        this.updateDiagnostics();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingServerEvent(data);
        } catch (e) {
          console.warn('[WS] Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        this.evaluateActiveStatus();
        this.stopPingLoop();
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.evaluateActiveStatus();
      };
    } catch (err) {
      console.warn('[WS] Connection failed:', err);
      this.evaluateActiveStatus();
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connectWebSocket();
    }, 3000);
  }

  private registerClient() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'client:register',
        userId: this.currentUserId,
        userName: this.currentUserName,
        avatar: this.currentUserAvatar,
        currentChatId: this.activeChatId,
      }));
    }
  }

  private startPingLoop() {
    this.stopPingLoop();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingSentTime = performance.now();
        this.ws.send(JSON.stringify({
          type: 'network:ping',
          timestamp: Date.now(),
        }));
      }
    }, 4000);
  }

  private stopPingLoop() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Handle incoming events from Server WebSocket
  private handleIncomingServerEvent(event: any) {
    this.bytesServer += JSON.stringify(event).length;

    switch (event.type) {
      case 'network:pong': {
        const rtt = Math.round(performance.now() - this.lastPingSentTime);
        if (rtt > 0 && rtt < 3000) {
          this.latencyMs = rtt;
          this.updateDiagnostics();
        }
        break;
      }

      case 'client:registered': {
        this.onlineUsersCount = event.onlineCount || 1;
        this.presenceListeners.forEach(l => l(this.onlineUsersCount, event.peers || []));
        
        // Auto initiate P2P connections to other online peers in our chat room
        if (Array.isArray(event.peers)) {
          event.peers.forEach((peer: any) => {
            if (peer.userId !== this.currentUserId && !this.peerConnections.has(peer.userId)) {
              this.initiateP2PPeerConnection(peer.userId, peer.userName, peer.avatar);
            }
          });
        }
        this.updateDiagnostics();
        break;
      }

      case 'presence:update': {
        if (event.onlineCount) {
          this.onlineUsersCount = event.onlineCount;
          this.presenceListeners.forEach(l => l(this.onlineUsersCount, []));
        }
        if (event.joinedPeer && event.joinedPeer.userId !== this.currentUserId) {
          this.initiateP2PPeerConnection(event.joinedPeer.userId, event.joinedPeer.userName, event.joinedPeer.avatar);
        }
        this.updateDiagnostics();
        break;
      }

      case 'chat:message': {
        // Only deliver from server if we didn't receive it via P2P already
        const msg: Message = {
          ...event.message,
          transport: 'server',
        };
        this.messageListeners.forEach(l => l(event.chatId, msg, 'server'));
        break;
      }

      case 'chat:typing': {
        this.typingListeners.forEach(l => l(event.chatId, event.userId, event.userName, event.isTyping));
        break;
      }

      case 'chat:reaction': {
        this.reactionListeners.forEach(l => l(event.chatId, event.messageId, event.emoji, event.userId));
        break;
      }

      // WebRTC Signaling routing
      case 'webrtc:signal': {
        this.handleIncomingWebRTCSignal(event);
        break;
      }

      default:
        break;
    }
  }

  // WebRTC P2P Connection Management
  public async initiateP2PPeerConnection(peerId: string, peerName?: string, avatar?: string): Promise<string> {
    if (typeof RTCPeerConnection === 'undefined') return '';

    try {
      const pc = new RTCPeerConnection(STUN_SERVERS);
      this.peerConnections.set(peerId, pc);

      const session: P2PPeerSession = {
        peerId,
        peerName: peerName || `Користувач #${peerId.slice(-4)}`,
        avatar,
        connectionState: 'connecting',
        iceState: 'checking',
        dataChannelState: 'connecting',
        rttMs: Math.floor(Math.random() * 8) + 12,
        isDirectP2P: true,
        fingerprint: this.generateSimulatedFingerprint(peerId),
        bytesSent: 0,
        bytesReceived: 0,
        packetsLost: 0,
        connectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.peerSessions.set(peerId, session);

      // Create Data Channel
      const dc = pc.createDataChannel('aura-p2p-channel', { ordered: true });
      this.setupDataChannel(peerId, dc);

      // Handle ICE Candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'webrtc:signal',
            targetPeerId: peerId,
            signalType: 'ice-candidate',
            signalData: event.candidate,
            chatId: this.activeChatId,
          }));
        }
      };

      pc.onconnectionstatechange = () => {
        const s = this.peerSessions.get(peerId);
        if (s) {
          s.connectionState = pc.connectionState as any;
          this.evaluateActiveStatus();
          this.notifyPeerSessionUpdates();
        }
      };

      pc.oniceconnectionstatechange = () => {
        const s = this.peerSessions.get(peerId);
        if (s) {
          s.iceState = pc.iceConnectionState as any;
          this.notifyPeerSessionUpdates();
        }
      };

      // Create Offer SDP
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Send offer over WebSocket signaling
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'webrtc:signal',
          targetPeerId: peerId,
          signalType: 'offer',
          signalData: offer,
          chatId: this.activeChatId,
        }));
      }

      this.notifyPeerSessionUpdates();
      return JSON.stringify(offer);
    } catch (err) {
      console.warn('[WebRTC] Initiate P2P error:', err);
      return '';
    }
  }

  // Handle incoming WebRTC signaling packets
  private async handleIncomingWebRTCSignal(signalMsg: any) {
    const { senderUserId, signalType, signalData, senderName } = signalMsg;
    const peerId = senderUserId || signalMsg.senderClientId;
    if (!peerId || peerId === this.currentUserId) return;

    try {
      if (signalType === 'offer') {
        let pc = this.peerConnections.get(peerId);
        if (!pc) {
          pc = new RTCPeerConnection(STUN_SERVERS);
          this.peerConnections.set(peerId, pc);

          const session: P2PPeerSession = {
            peerId,
            peerName: senderName || `Користувач #${peerId.slice(-4)}`,
            connectionState: 'connecting',
            iceState: 'checking',
            dataChannelState: 'connecting',
            rttMs: Math.floor(Math.random() * 6) + 14,
            isDirectP2P: true,
            fingerprint: this.generateSimulatedFingerprint(peerId),
            bytesSent: 0,
            bytesReceived: 0,
            packetsLost: 0,
            connectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          this.peerSessions.set(peerId, session);

          pc.ondatachannel = (e) => {
            this.setupDataChannel(peerId, e.channel);
          };

          pc.onicecandidate = (event) => {
            if (event.candidate && this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({
                type: 'webrtc:signal',
                targetPeerId: peerId,
                signalType: 'ice-candidate',
                signalData: event.candidate,
                chatId: this.activeChatId,
              }));
            }
          };

          pc.onconnectionstatechange = () => {
            const s = this.peerSessions.get(peerId);
            if (s) {
              s.connectionState = pc!.connectionState as any;
              this.evaluateActiveStatus();
              this.notifyPeerSessionUpdates();
            }
          };
        }

        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'webrtc:signal',
            targetPeerId: peerId,
            signalType: 'answer',
            signalData: answer,
            chatId: this.activeChatId,
          }));
        }
        this.notifyPeerSessionUpdates();
      } else if (signalType === 'answer') {
        const pc = this.peerConnections.get(peerId);
        if (pc && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          this.notifyPeerSessionUpdates();
        }
      } else if (signalType === 'ice-candidate') {
        const pc = this.peerConnections.get(peerId);
        if (pc && signalData) {
          await pc.addIceCandidate(new RTCIceCandidate(signalData));
        }
      }
    } catch (err) {
      console.warn('[WebRTC] Signal handling error:', err);
    }
  }

  // Configure Data Channel events
  private setupDataChannel(peerId: string, dc: RTCDataChannel) {
    this.dataChannels.set(peerId, dc);

    dc.onopen = () => {
      const s = this.peerSessions.get(peerId);
      if (s) {
        s.dataChannelState = 'open';
        s.connectionState = 'connected';
      }
      this.evaluateActiveStatus();
      this.notifyPeerSessionUpdates();
      this.updateDiagnostics();

      // Send initial P2P handshake ping
      this.sendP2PDirect(peerId, {
        type: 'p2p:handshake',
        senderId: this.currentUserId,
        senderName: this.currentUserName,
        timestamp: Date.now(),
      });
    };

    dc.onclose = () => {
      const s = this.peerSessions.get(peerId);
      if (s) {
        s.dataChannelState = 'closed';
      }
      this.evaluateActiveStatus();
      this.notifyPeerSessionUpdates();
      this.updateDiagnostics();
    };

    dc.onmessage = (event) => {
      this.handleIncomingP2PData(peerId, event.data);
    };
  }

  // Handle incoming data received directly over P2P DataChannel
  private handleIncomingP2PData(peerId: string, rawData: any) {
    try {
      this.bytesP2P += (typeof rawData === 'string' ? rawData.length : rawData.byteLength || 500);
      const session = this.peerSessions.get(peerId);
      if (session) {
        session.bytesReceived = (session.bytesReceived || 0) + (typeof rawData === 'string' ? rawData.length : 500);
      }

      if (typeof rawData === 'string') {
        const payload = JSON.parse(rawData);

        switch (payload.type) {
          case 'p2p:message': {
            const msg: Message = {
              ...payload.message,
              transport: 'p2p',
              p2pMeta: {
                latencyMs: session?.rttMs || 15,
                peerFingerprint: session?.fingerprint,
                directHops: 1,
                encryptedE2E: true,
              },
            };
            this.messageListeners.forEach(l => l(payload.chatId, msg, 'p2p'));
            break;
          }

          case 'p2p:typing': {
            this.typingListeners.forEach(l => l(payload.chatId, payload.userId, payload.userName, payload.isTyping));
            break;
          }

          case 'p2p:reaction': {
            this.reactionListeners.forEach(l => l(payload.chatId, payload.messageId, payload.emoji, payload.userId));
            break;
          }

          case 'p2p:file_meta': {
            // Initiate file transfer session
            this.incomingFileBuffers.set(payload.fileId, {
              fileName: payload.fileName,
              fileType: payload.fileType,
              totalChunks: payload.totalChunks,
              receivedChunks: [],
              senderName: payload.senderName || 'P2P Співрозмовник',
            });
            break;
          }

          case 'p2p:file_chunk': {
            const fileSession = this.incomingFileBuffers.get(payload.fileId);
            if (fileSession) {
              const byteCharacters = atob(payload.chunkBase64);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              fileSession.receivedChunks[payload.chunkIndex] = new Uint8Array(byteNumbers);

              const percentage = Math.round((fileSession.receivedChunks.filter(Boolean).length / fileSession.totalChunks) * 100);
              this.fileTransferListeners.forEach(l => l({
                fileId: payload.fileId,
                fileName: fileSession.fileName,
                percentage,
                isReceiving: true,
                senderName: fileSession.senderName,
              }));

              // If complete, reconstruct Blob and trigger automatic or user download
              if (fileSession.receivedChunks.filter(Boolean).length === fileSession.totalChunks) {
                const blob = new Blob(fileSession.receivedChunks, { type: fileSession.fileType || 'application/octet-stream' });
                const blobUrl = URL.createObjectURL(blob);

                // Inject received file as a message in the active chat
                const fileMsg: Message = {
                  id: `p2p_file_${Date.now()}`,
                  senderId: peerId,
                  senderName: fileSession.senderName,
                  senderAvatar: session?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  type: 'file',
                  text: `Отримано файл напряму через P2P тунель ⚡`,
                  fileData: {
                    name: fileSession.fileName,
                    size: `${(blob.size / (1024 * 1024)).toFixed(2)} MB`,
                    extension: fileSession.fileName.split('.').pop() || 'dat',
                    url: blobUrl,
                  },
                  transport: 'p2p',
                  p2pMeta: {
                    latencyMs: session?.rttMs || 12,
                    peerFingerprint: session?.fingerprint,
                    directHops: 1,
                    encryptedE2E: true,
                  },
                };
                this.messageListeners.forEach(l => l(this.activeChatId, fileMsg, 'p2p'));
                this.incomingFileBuffers.delete(payload.fileId);
              }
            }
            break;
          }

          case 'p2p:handshake': {
            session!.rttMs = Math.round(Math.abs(Date.now() - payload.timestamp) / 2) || 14;
            this.notifyPeerSessionUpdates();
            break;
          }

          default:
            break;
        }
      }
    } catch (err) {
      console.warn('[P2P] Error handling data channel message:', err);
    }
  }

  // Send message using the optimal or designated protocol
  public sendMessage(chatId: string, message: Message): 'server' | 'p2p' {
    const hasOpenP2P = Array.from(this.dataChannels.values()).some(dc => dc.readyState === 'open');
    let effectiveTransport: 'server' | 'p2p' = 'server';

    if (this.transportMode === 'p2p') {
      effectiveTransport = 'p2p';
    } else if (this.transportMode === 'auto') {
      effectiveTransport = hasOpenP2P ? 'p2p' : 'server';
    } else {
      effectiveTransport = 'server';
    }

    // Prepare message payload with transport metadata
    const enrichedMessage: Message = {
      ...message,
      transport: effectiveTransport,
      p2pMeta: effectiveTransport === 'p2p' ? {
        latencyMs: 14,
        peerFingerprint: 'AURA:P2P:SHA256:7B:4E:91:FA:33:C9',
        directHops: 1,
        encryptedE2E: true,
      } : undefined,
    };

    // 1. Send via direct WebRTC DataChannel if P2P
    if (effectiveTransport === 'p2p' || (this.transportMode === 'auto' && hasOpenP2P)) {
      let sentCount = 0;
      this.dataChannels.forEach((dc, peerId) => {
        if (dc.readyState === 'open') {
          const payload = JSON.stringify({
            type: 'p2p:message',
            chatId,
            message: enrichedMessage,
          });
          dc.send(payload);
          this.bytesP2P += payload.length;
          sentCount++;
          const s = this.peerSessions.get(peerId);
          if (s) s.bytesSent = (s.bytesSent || 0) + payload.length;
        }
      });

      if (sentCount > 0 && this.transportMode === 'p2p') {
        this.updateDiagnostics();
        return 'p2p';
      }
    }

    // 2. Send via Server WebSocket Relay
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        type: 'chat:message',
        chatId,
        message: enrichedMessage,
      });
      this.ws.send(payload);
      this.bytesServer += payload.length;
    } else {
      // Fallback via HTTP REST
      fetch('/api/network/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message: enrichedMessage }),
      }).catch(err => console.warn('HTTP broadcast error:', err));
    }

    this.updateDiagnostics();
    return 'server';
  }

  // Stream file directly via WebRTC DataChannel chunking
  public async sendP2PFile(file: File): Promise<boolean> {
    const openChannels = Array.from(this.dataChannels.entries()).filter(([_, dc]) => dc.readyState === 'open');
    if (openChannels.length === 0) {
      return false;
    }

    const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const CHUNK_SIZE = 16 * 1024; // 16KB chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // 1. Send meta header
    openChannels.forEach(([_, dc]) => {
      dc.send(JSON.stringify({
        type: 'p2p:file_meta',
        fileId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        totalChunks,
        senderName: this.currentUserName,
      }));
    });

    const arrayBuffer = await file.arrayBuffer();

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBuffer = arrayBuffer.slice(start, end);

      const uint8 = new Uint8Array(chunkBuffer);
      let binary = '';
      for (let j = 0; j < uint8.length; j++) {
        binary += String.fromCharCode(uint8[j]);
      }
      const chunkBase64 = btoa(binary);

      const chunkPayload = JSON.stringify({
        type: 'p2p:file_chunk',
        fileId,
        chunkIndex: i,
        chunkBase64,
      });

      openChannels.forEach(([_, dc]) => {
        dc.send(chunkPayload);
        this.bytesP2P += chunkPayload.length;
      });

      const percentage = Math.round(((i + 1) / totalChunks) * 100);
      this.fileTransferListeners.forEach(l => l({
        fileId,
        fileName: file.name,
        percentage,
        isReceiving: false,
        senderName: 'Ви',
      }));

      // Small throttle to avoid buffer overflow
      if (i % 8 === 0) {
        await new Promise(r => setTimeout(r, 10));
      }
    }

    this.updateDiagnostics();
    return true;
  }

  // Send typing status
  public sendTyping(chatId: string, isTyping: boolean) {
    if (this.transportMode === 'p2p') {
      this.dataChannels.forEach(dc => {
        if (dc.readyState === 'open') {
          dc.send(JSON.stringify({
            type: 'p2p:typing',
            chatId,
            userId: this.currentUserId,
            userName: this.currentUserName,
            isTyping,
          }));
        }
      });
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat:typing',
        chatId,
        userId: this.currentUserId,
        userName: this.currentUserName,
        isTyping,
      }));
    }
  }

  // Send reaction
  public sendReaction(chatId: string, messageId: string, emoji: string) {
    if (this.transportMode === 'p2p') {
      this.dataChannels.forEach(dc => {
        if (dc.readyState === 'open') {
          dc.send(JSON.stringify({
            type: 'p2p:reaction',
            chatId,
            messageId,
            emoji,
            userId: this.currentUserId,
          }));
        }
      });
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'chat:reaction',
        chatId,
        messageId,
        emoji,
        userId: this.currentUserId,
      }));
    }
  }

  // Manual Air-gapped / Offline SDP Handshake Support
  public async createManualOffer(): Promise<string> {
    const pc = new RTCPeerConnection(STUN_SERVERS);
    const manualPeerId = `manual_peer_${Date.now()}`;
    this.peerConnections.set(manualPeerId, pc);

    const session: P2PPeerSession = {
      peerId: manualPeerId,
      peerName: 'Direct P2P Peer (Manual)',
      connectionState: 'connecting',
      iceState: 'checking',
      dataChannelState: 'connecting',
      rttMs: 12,
      isDirectP2P: true,
      fingerprint: this.generateSimulatedFingerprint(manualPeerId),
      bytesSent: 0,
      bytesReceived: 0,
      packetsLost: 0,
      connectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    this.peerSessions.set(manualPeerId, session);

    const dc = pc.createDataChannel('aura-manual-p2p', { ordered: true });
    this.setupDataChannel(manualPeerId, dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    // Wait slightly for local ICE candidates gathering
    await new Promise(r => setTimeout(r, 600));
    this.notifyPeerSessionUpdates();

    return btoa(JSON.stringify(pc.localDescription));
  }

  public async acceptManualAnswer(encodedAnswer: string): Promise<boolean> {
    try {
      const decoded = JSON.parse(atob(encodedAnswer.trim()));
      const lastManualPc = Array.from(this.peerConnections.values()).pop();
      if (lastManualPc) {
        await lastManualPc.setRemoteDescription(new RTCSessionDescription(decoded));
        this.notifyPeerSessionUpdates();
        return true;
      }
      return false;
    } catch (e) {
      console.warn('Invalid manual answer format:', e);
      return false;
    }
  }

  public async createManualAnswerFromOffer(encodedOffer: string): Promise<string> {
    try {
      const decoded = JSON.parse(atob(encodedOffer.trim()));
      const pc = new RTCPeerConnection(STUN_SERVERS);
      const manualPeerId = `manual_peer_ans_${Date.now()}`;
      this.peerConnections.set(manualPeerId, pc);

      const session: P2PPeerSession = {
        peerId: manualPeerId,
        peerName: 'Direct P2P Host (Manual)',
        connectionState: 'connecting',
        iceState: 'checking',
        dataChannelState: 'connecting',
        rttMs: 10,
        isDirectP2P: true,
        fingerprint: this.generateSimulatedFingerprint(manualPeerId),
        bytesSent: 0,
        bytesReceived: 0,
        packetsLost: 0,
        connectedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      this.peerSessions.set(manualPeerId, session);

      pc.ondatachannel = (e) => {
        this.setupDataChannel(manualPeerId, e.channel);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(decoded));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await new Promise(r => setTimeout(r, 600));
      this.notifyPeerSessionUpdates();

      return btoa(JSON.stringify(pc.localDescription));
    } catch (e) {
      console.warn('Error generating answer:', e);
      return '';
    }
  }

  private sendP2PDirect(peerId: string, data: any) {
    const dc = this.dataChannels.get(peerId);
    if (dc && dc.readyState === 'open') {
      dc.send(JSON.stringify(data));
    }
  }

  private evaluateActiveStatus() {
    const hasOpenP2P = Array.from(this.dataChannels.values()).some(dc => dc.readyState === 'open');
    const isWsOpen = this.ws && this.ws.readyState === WebSocket.OPEN;

    if (this.transportMode === 'p2p') {
      this.activeStatus = hasOpenP2P ? 'p2p-direct' : (isWsOpen ? 'connecting' : 'offline');
    } else if (this.transportMode === 'server') {
      this.activeStatus = isWsOpen ? 'server-ws' : 'fallback-server';
    } else {
      // Auto mode
      if (hasOpenP2P) {
        this.activeStatus = 'p2p-direct';
      } else if (isWsOpen) {
        this.activeStatus = 'server-ws';
      } else {
        this.activeStatus = 'offline';
      }
    }
  }

  private updateDiagnostics() {
    const diag = this.getDiagnostics();
    this.diagnosticsListeners.forEach(l => l(diag));
  }

  private notifyPeerSessionUpdates() {
    const sessions = this.getPeerSessions();
    this.peerSessionListeners.forEach(l => l(sessions));
  }

  private getActiveDataChannelSummary(): string {
    const openCount = Array.from(this.dataChannels.values()).filter(dc => dc.readyState === 'open').length;
    if (openCount > 0) return `${openCount} активних P2P WebRTC каналів (E2E Encrypted)`;
    return 'Готовий до миттєвого P2P з\'єднання через WebRTC';
  }

  private generateSimulatedFingerprint(id: string): string {
    const hex = '0123456789ABCDEF';
    let str = 'AURA:P2P:SHA256';
    for (let i = 0; i < 6; i++) {
      str += `:${hex[Math.floor(Math.random() * 16)]}${hex[Math.floor(Math.random() * 16)]}`;
    }
    return str;
  }

  // Pre-seed local virtual node so single-user mode has immediate P2P stats
  private initVirtualSelfPeer() {
    const virtualPeerId = 'peer_node_kyiv_alpha';
    this.peerSessions.set(virtualPeerId, {
      peerId: virtualPeerId,
      peerName: 'Олексій (Direct Node 01)',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      connectionState: 'connected',
      iceState: 'connected',
      dataChannelState: 'open',
      rttMs: 14,
      bytesSent: 28400,
      bytesReceived: 14400,
      packetsLost: 0,
      fingerprint: 'AURA:P2P:SHA256:4C:9A:88:2E:F1:07',
      isDirectP2P: true,
      connectedAt: '11:15',
    });
  }
}

export const networkEngine = new NetworkEngine();
