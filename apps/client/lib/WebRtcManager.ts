import { useMediaStore } from "@/store/mediaStore";
import { Socket } from "socket.io-client";

export class WebRTCManager {
  private socket: Socket;
  private localStream: MediaStream | null = null;
  private peers: Map<string, RTCPeerConnection> = new Map();
  private remoteStreams: Map<string, MediaStream> = new Map();
  private maxPeerConnections = 10;

  constructor(socket: Socket) {
    this.socket = socket;
    this.setupSocketListeners();
  }

  async initLocalMedia(audio = true, video = true) {
    if (!this.localStream) {
      console.log("aviable",navigator.mediaDevices)
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });
    }
    return this.localStream;
  }

  setupSocketListeners() {
    // incoming signaling from server
    this.socket.on("webrtc-signaling", async ({ from, data }) => {
      let pc = this.peers.get(from);

      // OFFER RECEIVED
      if (data.offer) {

        //reject a connection request when capacity is reached
        if (this.peers.size >= this.maxPeerConnections) {
          this.socket.emit("webrtc-signaling", {
            to: from,
            data: { reject: true, reason: "max-peers-reached" }
          });
          console.warn("Rejected connection request from", from, "because max peers reached")
          return;
        }

        await this.initLocalMedia();
        pc = this.createPeer(from);

        await pc.setRemoteDescription(data.offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socket.emit("webrtc-signaling", {
          to: from,
          data: { answer: pc.localDescription },
        });
        return;
      }

      // ANSWER RECEIVED
      if (data.answer) {
        await pc?.setRemoteDescription(data.answer);
      }

      // ICE CANDIDATE RECEIVED
      if (data.ice) {
        try {
          await pc?.addIceCandidate(data.ice);
        } catch (err) {
          console.warn("ICE error", err);
        }
      }
      if (data.reject) {
        console.log("Peer refused connection, reason:", data.reason);
        // Clean up attempt
        this.cleanupPeer(from);
        return;
      }
    });
  }

  private createPeer(peerSocketId: string) {
    if (this.peers.has(peerSocketId)) return this.peers.get(peerSocketId)!;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // attach local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) =>
        pc.addTrack(track, this.localStream!)
      );
    }

    // send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("webrtc-signaling", {
          to: peerSocketId,
          data: { ice: event.candidate },
        });
      }
    };

    // receive remote stream
    pc.ontrack = (event) => {
      const stream = event.streams[0];
      if(!stream) return;
      this.remoteStreams.set(peerSocketId, stream);
      useMediaStore.getState().addRemoteStream(peerSocketId,stream)
      this.attachRemoteAudio(peerSocketId);
    };

    // clean up on disconnect
    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected" ||
        pc.connectionState === "closed"
      ) {
        this.closePeer(peerSocketId);
      }
    };

    this.peers.set(peerSocketId, pc);
    return pc;
  }

  async callPeer(peerData: { playerId: string, socketId: string }, myId: string) {
    // ID RULE: only call if myId > peerId
    if (myId <= peerData.playerId) return;
    console.log("Im calling peer", peerData.playerId, myId)
    await this.initLocalMedia();
    const pc = this.createPeer(peerData.socketId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    this.socket.emit("webrtc-signaling", {
      to: peerData.socketId,
      data: { offer: pc.localDescription },
    });
  }

  closePeer(peerSocketId: string) {
    const pc = this.peers.get(peerSocketId);
    if (pc) {
      pc.close();
    }
    this.peers.delete(peerSocketId);
    this.remoteStreams.delete(peerSocketId);

    useMediaStore.getState().removeRemoteStream(peerSocketId);

    const audio = document.getElementById(`audio-${peerSocketId}`);
    if (audio) audio.remove();
  }

  // create audio element and play stream
  attachRemoteAudio(peerSocketId: string) {
    let audio = document.getElementById(`audio-${peerSocketId}`) as HTMLAudioElement;

    if (!audio) {
      audio = document.createElement("audio");
      audio.id = `audio-${peerSocketId}`;
      audio.autoplay = true;
      audio.playsInline = true;
      document.body.appendChild(audio);
    }

    const stream = this.remoteStreams.get(peerSocketId);
    if (stream) {
      audio.srcObject = stream;
      audio.play().catch((e) => { console.error("Remote audio play failed", e); });
    }
  }

  cleanupPeer(peerId: string) {
  const pc = this.peers.get(peerId);
  if (!pc) return; // already cleaned

  try {
    // 1. Stop transceivers (some browsers require this)
    if (pc.getTransceivers) {
      pc.getTransceivers().forEach(t => {
        try { t.stop && t.stop(); } catch (_) {}
      });
    }

    // 2. Stop all local tracks attached to this peer (optional)
    pc.getSenders().forEach(sender => {
      try { sender.track?.stop(); } catch (_) {}
      try { sender.replaceTrack(null); } catch (_) {}
    });

    // 3. Stop all remote tracks (video/audio)
    pc.getReceivers().forEach(receiver => {
      try { receiver.track?.stop(); } catch (_) {}
    });

    // 4. Close the peer connection
    try { pc.close(); } catch (_) {}

  } catch (err) {
    console.warn("Error while cleaning peer:", peerId, err);
  }

  // 5. Remove from map
  this.peers.delete(peerId);

  // 6. Remove media elements (if you're generating video elements)
  const el = document.getElementById(`video-${peerId}`);
  if (el) el.remove();

  console.log(`Cleaned up peer: ${peerId}`);
}

}

