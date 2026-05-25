/**
 * components/VideoTile.jsx — Renders one participant's video.
 *
 * Key concept: srcObject
 * HTML <video src="..."> plays from a URL.
 * For WebRTC we have a live MediaStream object — no URL exists.
 * We must set video.srcObject via a ref. Can't do this in JSX.
 */

import { useEffect, useRef } from "react";
import { Box, Typography, Avatar } from "@mui/material";
import MicOffIcon from "@mui/icons-material/MicOff";

const VideoTile = ({ stream, name, isMuted = false, isLocal = false, isCamOff = false }) => {
  const videoRef = useRef(null);

  useEffect(() => {
  if (videoRef.current && stream) {
    videoRef.current.srcObject = stream;

    // Browsers block autoPlay without an explicit .play() call.
    // .catch() silences the "interrupted by new load" warning that
    // fires harmlessly when the component unmounts mid-play.
    videoRef.current.play().catch((err) => {
      console.warn("Video autoplay blocked:", err);
    });
  }
}, [stream]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        paddingBottom: "56.25%", // 16:9 ratio: padding-bottom % is relative to WIDTH
        borderRadius: 3,
        overflow: "hidden",
        background: "#0D0D14",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline  // required on iOS to stay inline instead of going fullscreen
        muted={isLocal} // always mute your own video to prevent echo feedback
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: isLocal ? "scaleX(-1)" : "none", // mirror local — feels natural
          display: isCamOff ? "none" : "block",
        }}
      />

      {/* Camera off state — show avatar initial */}
      {(isCamOff || !stream) && (
        <Box
          sx={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "linear-gradient(135deg, #13131A 0%, #1a1a2e 100%)",
          }}
        >
          <Avatar sx={{ width: 64, height: 64, fontSize: "1.8rem", fontWeight: 700, background: "linear-gradient(135deg, #7C3AED, #06B6D4)" }}>
            {name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
        </Box>
      )}

      {/* Name label + mute badge */}
      <Box
        sx={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          px: 1.5, py: 1,
          background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600, fontSize: "0.8rem" }}>
          {name} {isLocal && "(You)"}
        </Typography>
        {isMuted && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "error.main", borderRadius: "50%", width: 22, height: 22 }}>
            <MicOffIcon sx={{ fontSize: 13, color: "#fff" }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default VideoTile;
