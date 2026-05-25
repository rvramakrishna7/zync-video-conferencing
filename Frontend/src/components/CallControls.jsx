/**
 * components/CallControls.jsx — Bottom control bar.
 * Mic, Camera, Screen Share, Raise Hand, Reactions, End Call.
 *
 * Each button emits a socket event OR toggles local state.
 * The "End Call" button is only shown to the host.
 */

import { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Button,
  Badge,
  Divider,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import PanToolIcon from "@mui/icons-material/PanTool";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";

// Quick emoji reactions available in the picker
const REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "😮", "🎉", "💯"];

const ControlBtn = ({ title, onClick, active, color, children, size = 48 }) => (
  <Tooltip title={title} placement="top">
    <IconButton
      onClick={onClick}
      sx={{
        width: { xs: 38, sm: size },
        height: { xs: 38, sm: size },
        borderRadius: 3,
        bgcolor: active
          ? `${color || "primary"}.main`
          : "rgba(255,255,255,0.08)",
        color: active ? "#fff" : "text.secondary",
        border: "1px solid",
        borderColor: active ? "transparent" : "rgba(255,255,255,0.1)",
        transition: "all 0.2s",
        "&:hover": {
          bgcolor: active
            ? `${color || "primary"}.dark`
            : "rgba(255,255,255,0.15)",
          transform: "translateY(-2px)",
        },
      }}
    >
      {children}
    </IconButton>
  </Tooltip>
);

const CallControls = ({
  isMuted,
  isCamOff,
  isScreenSharing,
  toggleMic,
  toggleCam,
  toggleScreenShare,
  socket,
  roomCode,
  userName,
  isHandRaised,
  onRaiseHand,
  onToggleChat,
  chatOpen,
  unreadCount,
  onEndCall,
  isHost,
}) => {
  const [showReactions, setShowReactions] = useState(false);

  const sendReaction = (emoji) => {
    socket?.emit("send-reaction", { roomId: roomCode, emoji, name: userName });
    setShowReactions(false);
  };

  return (
    <Box
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 0.5, sm: 1.5 },
        py: { xs: 1.5, sm: 2 },
        px: { xs: 1, sm: 3 },
        flexWrap: "wrap",
        background: "rgba(10,10,15,0.95)",
        borderTop: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Emoji picker — floats above the bar */}
      {showReactions && (
        <Box
          sx={{
            position: "absolute",
            bottom: "calc(100% + 12px)",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 0.5,
            bgcolor: "background.paper",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 3,
            p: 1,
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {REACTIONS.map((emoji) => (
            <IconButton
              key={emoji}
              onClick={() => sendReaction(emoji)}
              sx={{
                fontSize: "1.4rem",
                width: 40,
                height: 40,
                borderRadius: 2,
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.08)",
                  transform: "scale(1.2)",
                },
                transition: "transform 0.15s",
              }}
            >
              {emoji}
            </IconButton>
          ))}
        </Box>
      )}

      {/* Mic */}
      <ControlBtn
        title={isMuted ? "Unmute" : "Mute"}
        onClick={toggleMic}
        active={isMuted}
        color="error"
      >
        {isMuted ? <MicOffIcon /> : <MicIcon />}
      </ControlBtn>

      {/* Camera */}
      <ControlBtn
        title={isCamOff ? "Start camera" : "Stop camera"}
        onClick={toggleCam}
        active={isCamOff}
        color="error"
      >
        {isCamOff ? <VideocamOffIcon /> : <VideocamIcon />}
      </ControlBtn>

      {/* Screen share */}
      <ControlBtn
        title={isScreenSharing ? "Stop sharing" : "Share screen"}
        onClick={toggleScreenShare}
        active={isScreenSharing}
        color="primary"
      >
        {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
      </ControlBtn>

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          borderColor: "rgba(255,255,255,0.1)",
          mx: 0.5,
          display: { xs: "none", sm: "block" },
        }}
      />

      {/* Raise hand */}
      <ControlBtn
        title={isHandRaised ? "Lower hand" : "Raise hand"}
        onClick={onRaiseHand}
        active={isHandRaised}
        color="warning"
      >
        <PanToolIcon />
      </ControlBtn>

      {/* Emoji reactions */}
      <ControlBtn
        title="React"
        onClick={() => setShowReactions((p) => !p)}
        active={showReactions}
        color="secondary"
      >
        <EmojiEmotionsIcon />
      </ControlBtn>

      {/* Chat toggle with unread badge */}
      <Tooltip title="Chat" placement="top">
        <IconButton
          onClick={onToggleChat}
          sx={{
            width: 48,
            height: 48,
            borderRadius: 3,
            bgcolor: chatOpen ? "primary.main" : "rgba(255,255,255,0.08)",
            color: chatOpen ? "#fff" : "text.secondary",
            border: "1px solid",
            borderColor: chatOpen ? "transparent" : "rgba(255,255,255,0.1)",
            "&:hover": {
              bgcolor: chatOpen ? "primary.dark" : "rgba(255,255,255,0.15)",
            },
          }}
        >
          <Badge
            badgeContent={chatOpen ? 0 : unreadCount}
            color="error"
            max={9}
          >
            <ChatIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Divider
        orientation="vertical"
        flexItem
        sx={{
          borderColor: "rgba(255,255,255,0.1)",
          mx: 0.5,
          display: { xs: "none", sm: "block" },
        }}
      />

      {/* End call */}
      <Button
        variant="contained"
        onClick={onEndCall}
        startIcon={<CallEndIcon />}
        sx={{
          bgcolor: "#EF4444",
          "&:hover": { bgcolor: "#DC2626" },
          background: "none",
          backgroundColor: "#EF4444",
          boxShadow: "0 4px 15px rgba(239,68,68,0.4)",
          px: { xs: 1.5, sm: 2.5 },
          py: 1.2,
          borderRadius: 3,
          fontSize: "0.875rem",
          minWidth: { xs: "auto", sm: "unset" },
        }}
      >
        <Box sx={{ display: { xs: "none", sm: "block" } }}>
          {isHost ? "End for all" : "Leave"}
        </Box>
      </Button>
    </Box>
  );
};

export default CallControls;
