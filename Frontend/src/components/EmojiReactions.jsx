/**
 * components/EmojiReactions.jsx — Floating emoji animations on screen.
 */

import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";

const EmojiReactions = ({ socket }) => {
  const [reactions, setReactions] = useState([]);

  useEffect(() => {
    if (!socket) return;

    const handleReaction = ({ emoji, name }) => {
      const id = Date.now() + Math.random(); // unique id for this reaction
      const xPos = 10 + Math.random() * 80;  // random horizontal position (10%–90%)

      setReactions((prev) => [...prev, { id, emoji, name, xPos }]);

      // Remove after animation completes (3s)
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== id));
      }, 3000);
    };

    socket.on("receive-reaction", handleReaction);
    return () => socket.off("receive-reaction", handleReaction);
  }, [socket]);

  return (
    // Pointer-events none — reactions float over the video but don't block clicks
    <Box sx={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 100 }}>
      {reactions.map(({ id, emoji, name, xPos }) => (
        <Box
          key={id}
          sx={{
            position: "absolute",
            bottom: "120px",
            left: `${xPos}%`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            // CSS keyframe animation: float up + fade out
            animation: "floatUp 3s ease-out forwards",
            "@keyframes floatUp": {
              "0%":   { transform: "translateY(0)", opacity: 1 },
              "80%":  { opacity: 1 },
              "100%": { transform: "translateY(-200px)", opacity: 0 },
            },
          }}
        >
          <Typography sx={{ fontSize: "2.5rem", lineHeight: 1 }}>{emoji}</Typography>
          <Typography
            variant="caption"
            sx={{
              color: "#fff",
              bgcolor: "rgba(0,0,0,0.5)",
              borderRadius: 1,
              px: 0.75,
              py: 0.25,
              fontSize: "0.7rem",
              fontWeight: 600,
              backdropFilter: "blur(4px)",
            }}
          >
            {name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default EmojiReactions;
