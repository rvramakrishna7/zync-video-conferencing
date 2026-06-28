/**
 * hooks/useWebRTC.js — Manages all WebRTC peer connections.
 */

import { useEffect, useRef, useState, useCallback } from "react";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const useWebRTC = (socket, roomCode, user) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState(new Map());
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Refs persist across renders without triggering re-renders
  const localStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const screenStreamRef = useRef(null);

  // ── Get camera + mic ──────────────────────────────────────────────────────

  const initLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error("Camera/mic access failed:", err);
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = audioOnly;
        setLocalStream(audioOnly);
        setIsCamOff(true);
        return audioOnly;
      } catch {
        return null;
      }
    }
  }, []);

  // ── Create one peer connection ─────────────────────────────────────────────

  const createPeerConnection = useCallback(
    (targetSocketId, targetName) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);

      // Send discovered network paths to the remote peer via socket
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("ice-candidate", {
            targetSocketId,
            candidate: event.candidate,
          });
        }
      };

      // Remote video/audio arrived — add to peers state so UI renders their tile
      pc.ontrack = (event) => {
        setPeers((prev) => {
          const updated = new Map(prev);
          updated.set(targetSocketId, {
            ...(updated.get(targetSocketId) || {}),
            socketId: targetSocketId,
            name: targetName,
            stream: event.streams[0],
          });
          return updated;
        });
      };

      pc.oniceconnectionstatechange = () => {
        if (["disconnected", "failed"].includes(pc.iceConnectionState)) {
          removePeer(targetSocketId);
        }
      };

      // Share our local tracks with this peer
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      peerConnectionsRef.current[targetSocketId] = pc;
      return pc;
    },
    [socket],
  );

  // ── Caller: create and send an offer ──────────────────────────────────────

  const callPeer = useCallback(
    async (targetSocketId, targetName) => {
      const pc = createPeerConnection(targetSocketId, targetName);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("offer", { targetSocketId, offer });
    },
    [createPeerConnection, socket],
  );

  // ── Callee: receive offer, send answer ────────────────────────────────────

  const handleOffer = useCallback(
    async ({ offer, fromSocketId, fromName }) => {
      const pc = createPeerConnection(fromSocketId, fromName);
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("answer", { targetSocketId: fromSocketId, answer });
    },
    [createPeerConnection, socket],
  );

  // ── Caller: receive answer ────────────────────────────────────────────────

  const handleAnswer = useCallback(async ({ answer, fromSocketId }) => {
    const pc = peerConnectionsRef.current[fromSocketId];
    if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
  }, []);

  // ── Both sides: handle incoming ICE candidates ─────────────────────────────

  const handleIceCandidate = useCallback(
    async ({ candidate, fromSocketId }) => {
      const pc = peerConnectionsRef.current[fromSocketId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn("ICE candidate add failed (usually harmless):", err);
        }
      }
    },
    [],
  );

  // ── Remove a peer (left or disconnected) ──────────────────────────────────

  const removePeer = useCallback((socketId) => {
    peerConnectionsRef.current[socketId]?.close();
    delete peerConnectionsRef.current[socketId];
    setPeers((prev) => {
      const updated = new Map(prev);
      updated.delete(socketId);
      return updated;
    });
  }, []);

  // ── Media controls ────────────────────────────────────────────────────────

  // track.enabled = false silences/hides but keeps the connection alive
  const toggleMic = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    }
  }, []);

  const toggleCam = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setIsCamOff(!track.enabled);
    }
  }, []);

  // Screen share: replaces video track in all peer connections
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      Object.values(peerConnectionsRef.current).forEach((pc) => {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender && camTrack) sender.replaceTrack(camTrack);
      });
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];
        Object.values(peerConnectionsRef.current).forEach((pc) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) sender.replaceTrack(screenTrack);
        });
        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    }
  }, [isScreenSharing]);

  // ── Main effect: join room + wire socket events ───────────────────────────

  useEffect(() => {
    if (!socket || !roomCode || !user) return;
    let mounted = true;

    const setup = async () => {
      const stream = await initLocalStream();
      if (!mounted || !stream) return;

      socket.emit("join-room", {
        roomId: roomCode,
        userId: user._id,
        name: user.name,
      });

      // People already in the room 
      socket.on("room-participants", (participants) => {
        participants.forEach(({ socketId, name }) => {
          if (socketId !== socket.id) callPeer(socketId, name);
        });
      });

      // New person joined after us 
      socket.on("user-joined", ({ socketId, name }) => {
        setPeers((prev) => {
          const updated = new Map(prev);
          if (!updated.has(socketId))
            updated.set(socketId, { socketId, name, stream: null });
          return updated;
        });
      });

      socket.on("offer", handleOffer);
      socket.on("answer", handleAnswer);
      socket.on("ice-candidate", handleIceCandidate);
      socket.on("user-left", ({ socketId }) => removePeer(socketId));
    };

    setup();

    return () => {
      mounted = false;
      // Only stop tracks and close connections on true unmount
      // Socket cleanup prevents duplicate listeners on re-run
      socket.off("room-participants");
      socket.off("user-joined");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
      socket.off("user-left");
    };
    
  }, [socket, roomCode, user?._id]);

  // Separate effect — only runs true cleanup when component fully unmounts
    useEffect(() => {
      return () => {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
        peerConnectionsRef.current = {};
      };
    }, []); // empty array = only on mount/unmount, never in between

  return {
    localStream,
    peers,
    isMuted,
    isCamOff,
    isScreenSharing,
    toggleMic,
    toggleCam,
    toggleScreenShare,
  };
};

export default useWebRTC;
