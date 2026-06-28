/**
 * components/ChatSidebar.jsx — Real-time chat panel.
 */

import { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  Divider,
  Avatar,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";

const ChatSidebar = ({ socket, roomCode, user, onClose, hidden  }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null); // reference to invisible div at the bottom of messages

  // Listen for incoming messages from other participants
  useEffect(() => {
    if (!socket) return;

    const handleMessage = ({ message, sender, timestamp }) => {
      setMessages((prev) => [
        ...prev,
        { message, sender, timestamp, id: Date.now() },
      ]);
    };

    socket.on("receive-message", handleMessage);

    // Clean up listener when sidebar unmounts
    return () => socket.off("receive-message", handleMessage);
  }, [socket]);

  // Auto-scroll to bottom whenever messages array grows
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed || !socket) return;

    const payload = {
      roomId: roomCode,
      message: trimmed,
      sender: user?.name || "Guest",
      timestamp: new Date().toISOString(),
    };

    socket.emit("send-message", payload);
    setInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // prevent newline on Enter
      sendMessage();
    }
    // Shift+Enter = newline (default textarea behavior, no need to handle)
  };

  // Format timestamp: 
  const formatTime = (iso) => {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box
      sx={{
        width: 320,
        height: "100%",
        display: hidden ? "none" : "flex", // hide but stay mounted — listener stays active
        flexDirection: "column",
        bgcolor: "background.paper",
        borderLeft: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          In-call messages
        </Typography>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Message list */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.length === 0 && (
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 4 }}
          >
            No messages yet. Say hi! 👋
          </Typography>
        )}

        {messages.map((msg) => {
          const isOwnMessage = msg.sender === (user?.name || "Guest");
          return (
            <Box
              key={msg.id}
              sx={{
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
                flexDirection: isOwnMessage ? "row-reverse" : "row",
              }}
            >
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  fontSize: "0.8rem",
                  bgcolor: isOwnMessage ? "primary.dark" : "grey.300",
                  flexShrink: 0,
                }}
              >
                {msg.sender?.charAt(0)?.toUpperCase()}
              </Avatar>
              <Box sx={{ maxWidth: "75%" }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "baseline",
                    mb: 0.5,
                    flexDirection: isOwnMessage ? "row-reverse" : "row",
                  }}
                >
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color={isOwnMessage ? "primary.light" : "text.primary"}
                  >
                    {isOwnMessage ? "You" : msg.sender}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(msg.timestamp)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    bgcolor: isOwnMessage ? "primary.dark" : (theme) => theme.palette.mode === "light" ? "grey.100" : "rgba(255,255,255,0.07)",
                    borderRadius: isOwnMessage
                      ? "12px 12px 4px 12px"
                      : "12px 12px 12px 4px",
                    px: 1.5,
                    py: 1,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ wordBreak: "break-word", lineHeight: 1.5 }}
                  >
                    {msg.message}
                  </Typography>
                </Box>
              </Box>
            </Box>
          );
        })}

        {/* Invisible anchor — we scroll here on new messages */}
        <div ref={bottomRef} />
      </Box>

      <Divider sx={{ borderColor: "divider" }} />

      {/* Input area */}
      <Box
        sx={{ px: 2, py: 1.5, display: "flex", gap: 1, alignItems: "flex-end" }}
      >
        <TextField
          multiline
          maxRows={4}
          fullWidth
          placeholder="Send a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              fontSize: "0.875rem",
            },
          }}
        />
        <IconButton
          onClick={sendMessage}
          disabled={!input.trim()}
          sx={{
            bgcolor: "primary.main",
            color: "#fff",
            width: 38,
            height: 38,
            borderRadius: 2.5,
            flexShrink: 0,
            "&:hover": { bgcolor: "primary.dark" },
            "&.Mui-disabled": {
              bgcolor: "rgba(255,255,255,0.06)",
              color: "text.secondary",
            },
          }}
        >
          <SendIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ChatSidebar;
