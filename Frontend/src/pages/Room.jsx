/**
 * pages/Room.jsx — The video call page. Orchestrates all sub-components.
 *
 * This page is the "conductor" — it doesn't hold much logic itself.
 * It delegates to:
 *   useWebRTC   → peer connection management
 *   VideoGrid   → renders all video tiles
 *   CallControls→ buttons at the bottom
 *   ChatSidebar → collapsible right panel
 *   EmojiReactions → floating emoji overlay
 *   MeetingSummary → end-of-call AI modal
 *
 * Layout:
 *   ┌─────────────────────────────┬───────────┐
 *   │                             │           │
 *   │        VideoGrid            │  Chat     │
 *   │                             │  Sidebar  │
 *   │                             │ (toggles) │
 *   ├─────────────────────────────┴───────────┤
 *   │              CallControls               │
 *   └─────────────────────────────────────────┘
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, CircularProgress, Snackbar, Alert, Stack, Avatar, Chip, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import IosShareIcon from "@mui/icons-material/IosShare";
import PanToolIcon from "@mui/icons-material/PanTool";

import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import useWebRTC from "../hooks/useWebRTC";

import VideoGrid from "../components/VideoGrid";
import CallControls from "../components/CallControls";
import ChatSidebar from "../components/ChatSidebar";
import EmojiReactions from "../components/EmojiReactions";
import MeetingSummary from "../components/MeetingSummary";

import { roomAPI } from "../services/api";

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  // Room metadata
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [raisedHands, setRaisedHands] = useState([]); // { name, userId }
  const [showSummary, setShowSummary] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", severity: "info" });

  // Track call duration and chat log for AI summary
  const startTimeRef = useRef(Date.now());
  const chatLogRef = useRef([]);
  const chatOpenRef = useRef(false); // ref so socket listener always has latest value without re-registering

  // ── Initialize WebRTC — all peer connection logic is in this hook ─────────
  const {
    localStream, peers,
    isMuted, isCamOff, isScreenSharing,
    toggleMic, toggleCam, toggleScreenShare,
  } = useWebRTC(socket, roomCode, user);

  // ── Fetch room metadata on mount ──────────────────────────────────────────

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const { data } = await roomAPI.get(roomCode);
        setRoom(data.room);
      } catch (err) {
        setError(err.response?.data?.message || "Room not found or meeting has ended");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [roomCode]);

  // ── Socket listeners for room-level events ────────────────────────────────

  useEffect(() => {
    if (!socket) return;

    // Track chat messages for AI summary (separate from what ChatSidebar renders)
    // Uses chatOpenRef.current instead of chatOpen state — so this listener
    // is registered ONCE and never removed/re-added when chat toggles
    socket.on("receive-message", ({ message, sender, timestamp }) => {
      chatLogRef.current.push(`${sender}: ${message}`);
      if (!chatOpenRef.current) setUnreadCount((c) => c + 1);
    });
    socket.on("hand-raised", ({ name }) => {
      setRaisedHands((prev) => [...prev, name]);
      showToast(`✋ ${name} raised their hand`, "info");
      // Auto-lower after 30 seconds
      setTimeout(() => {
        setRaisedHands((prev) => prev.filter((n) => n !== name));
      }, 30000);
    });

    socket.on("hand-lowered", ({ userId }) => {
      // Remove from raised hands (simplified — in production match by userId)
      setRaisedHands((prev) => prev.slice(1));
    });

    return () => {
      socket.off("receive-message");
      socket.off("hand-raised");
      socket.off("hand-lowered");
    };
  }, [socket]);

  // ── Chat open clears unread count ──────────────────────────────────────────

  // ── Chat open clears unread count + keeps ref in sync ─────────────────────

  useEffect(() => {
    chatOpenRef.current = chatOpen; // keep ref updated so socket listener reads latest value
    if (chatOpen) setUnreadCount(0);
  }, [chatOpen]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const showToast = (message, severity = "info") => {
    setToast({ open: true, message, severity });
  };

  const handleRaiseHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    if (newState) {
      socket?.emit("raise-hand", { roomId: roomCode, userId: user?._id, name: user?.name });
    } else {
      socket?.emit("lower-hand", { roomId: roomCode, userId: user?._id });
    }
  };

  const handleEndCall = async () => {
    const isHost = room?.host?._id === user?._id || room?.host === user?._id;

    if (isHost) {
      try {
        await roomAPI.end(roomCode);
      } catch (err) {
        console.error("Failed to end room:", err);
      }
    }

    // Show AI summary before leaving
    setShowSummary(true);
  };

  const handleSummaryClose = () => {
    setShowSummary(false);
    navigate("/");
  };

  const getDuration = () => {
    return Math.floor((Date.now() - startTimeRef.current) / 1000);
  };

  // ── Invite / Share link ────────────────────────────────────────────────────

  const handleInvite = async () => {
    // The full joinable URL — anyone who opens this lands directly in the room
    const joinLink = `${window.location.origin}/room/${roomCode}`;

    /**
     * Web Share API — on mobile this opens the native share sheet
     * (WhatsApp, SMS, Gmail, copy link, etc.)
     * navigator.share is only available on mobile browsers and some desktop browsers.
     * We check for it first and fall back to clipboard copy on desktop.
     */
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${room?.title || "Zync Meeting"}`,
          text: `Join my Zync meeting — ${room?.title || roomCode}`,
          url: joinLink,
        });
      } catch {
        // User cancelled the share sheet — not an error
      }
    } else {
      // Desktop fallback — copy to clipboard
      await navigator.clipboard.writeText(joinLink);
      showToast("📋 Link copied! Share it to invite others.", "success");
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: "background.default" }}>
        <CircularProgress sx={{ color: "primary.main" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100vh", bgcolor: "background.default", gap: 2 }}>
        <Typography variant="h5" fontWeight={600}>{error}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ cursor: "pointer", "&:hover": { color: "primary.light" } }} onClick={() => navigate("/")}>
          ← Back to home
        </Typography>
      </Box>
    );
  }

  const isHost = room?.host?._id === user?._id || room?.host === user?._id;

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default", overflow: "hidden" }}>

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      <Box sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1.5}>
          <Box sx={{ width: 28, height: 28, borderRadius: "8px", background: "linear-gradient(135deg, #7C3AED, #06B6D4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff" }}>Z</Typography>
          </Box>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            {room?.title || roomCode}
          </Typography>
          <Chip label={roomCode} size="small" sx={{ bgcolor: "rgba(255,255,255,0.06)", color: "text.secondary", fontSize: "0.7rem", fontFamily: "monospace", display: { xs: "none", sm: "flex" } }} />
        </Stack>

        {/* Raised hands indicator */}
        {raisedHands.length > 0 && (
          <Stack direction="row" sx={{ alignItems: "center" }} spacing={0.75}>
            <PanToolIcon sx={{ color: "warning.main", fontSize: 18 }} />
            <Typography variant="caption" color="warning.main" fontWeight={600}>
              {raisedHands[0]} raised hand
            </Typography>
          </Stack>
        )}

        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
          <Typography variant="caption" color="text.secondary">
            {1 + peers.size} participant{1 + peers.size !== 1 ? "s" : ""}
          </Typography>

          {/* Invite button — native share sheet on mobile, clipboard on desktop */}
          <Tooltip title="Invite people" placement="bottom">
            <IconButton
              onClick={handleInvite}
              size="small"
              sx={{
                color: "primary.main",
                bgcolor: "rgba(13,148,136,0.1)",
                border: "1px solid rgba(13,148,136,0.3)",
                borderRadius: 2,
                px: 1.5,
                py: 0.5,
                gap: 0.5,
                "&:hover": { bgcolor: "rgba(13,148,136,0.2)" },
                // Show share icon on mobile, copy icon on desktop
                // Both are always rendered — CSS controls which shows
              }}
            >
              {/* Share icon — shown on mobile via Web Share API */}
              <IosShareIcon sx={{ fontSize: 16, display: { xs: "block", sm: "none" } }} />
              {/* Copy icon — shown on desktop */}
              <ContentCopyIcon sx={{ fontSize: 16, display: { xs: "none", sm: "block" } }} />
              <Typography variant="caption" fontWeight={600} sx={{ fontSize: "0.75rem" }}>
                Invite
              </Typography>
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Main area: Video + Chat ──────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Video grid fills available space */}
        <VideoGrid
          localStream={localStream}
          peers={peers}
          isMuted={isMuted}
          isCamOff={isCamOff}
          localUser={user}
        />

        {/* Chat sidebar — always mounted so socket listener never misses messages */}
        {/* hidden prop hides it visually without unmounting */}
        <ChatSidebar
          socket={socket}
          roomCode={roomCode}
          user={user}
          onClose={() => setChatOpen(false)}
          hidden={!chatOpen}
        />
      </Box>

      {/* ── Controls bar ─────────────────────────────────────────────────── */}
      <CallControls
        isMuted={isMuted}
        isCamOff={isCamOff}
        isScreenSharing={isScreenSharing}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        toggleScreenShare={toggleScreenShare}
        socket={socket}
        roomCode={roomCode}
        userName={user?.name}
        isHandRaised={isHandRaised}
        onRaiseHand={handleRaiseHand}
        onToggleChat={() => setChatOpen((p) => !p)}
        chatOpen={chatOpen}
        unreadCount={unreadCount}
        onEndCall={handleEndCall}
        isHost={isHost}
      />

      {/* ── Floating emoji overlay ───────────────────────────────────────── */}
      <EmojiReactions socket={socket} />

      {/* ── AI Summary modal ─────────────────────────────────────────────── */}
      <MeetingSummary
        open={showSummary}
        roomCode={roomCode}
        chatLog={chatLogRef.current}
        duration={getDuration()}
        onClose={handleSummaryClose}
      />

      {/* ── Toast notifications ──────────────────────────────────────────── */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity={toast.severity} sx={{ borderRadius: 2 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Room;
