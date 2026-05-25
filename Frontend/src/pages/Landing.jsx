/**
 * pages/Landing.jsx — The home page.
 *
 * What happens here:
 *  1. User sees the Zync brand + tagline
 *  2. They can either: Create a new room OR enter a room code to join
 *  3. If they're already logged in, "Create Room" hits the API directly
 *  4. If not logged in, we redirect them to login first
 *
 * MUI components used:
 *  Box       → generic div with sx prop styling
 *  Container → centers content with max-width
 *  Typography → all text (replaces h1, p, span)
 *  Button    → styled buttons
 *  TextField → the room code input
 *  Stack     → flexbox layout helper (replaces most flex divs)
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Stack,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupsIcon from "@mui/icons-material/Groups";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import LogoutIcon from "@mui/icons-material/Logout";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";

import { useAuth } from "../context/AuthContext";
import { useThemeToggle } from "../context/ThemeToggleContext";
import { roomAPI } from "../services/api";

// Defined outside component so it's never recreated on re-render
// If it's inside, React creates a new array reference every render
// which breaks the useEffect dependency tracking → loop stops
const PHRASES = [
  "actually sync.",
  "just flow.",
  "feel instant.",
  "get things done.",
  "bring people closer.",
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const { mode, toggleMode } = useThemeToggle();

  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // ── Typewriter effect ──────────────────────────────────────────────────────

  // Phrases that cycle through the highlighted part of the heading
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState(""); // what's currently visible
  const [isDeleting, setIsDeleting] = useState(false); // typing forward or erasing

  useEffect(() => {
    const current = PHRASES[phraseIndex];

    // When the full phrase is typed and we're not yet deleting,
    // we pause 1.8s BEFORE starting to delete.
    // We handle this by using a longer timeout delay instead of
    // a nested setTimeout — so cleanup always works correctly.
    const isFullyTyped = !isDeleting && displayed === current;
    const isFullyDeleted = isDeleting && displayed === "";

    // Determine delay: pause longer when phrase is complete
    const delay = isFullyTyped ? 1800 : isDeleting ? 40 : 70;

    const timeout = setTimeout(() => {
      if (isFullyDeleted) {
        // Move to next phrase and start typing it
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
      } else if (isFullyTyped) {
        // Pause is over — start deleting
        setIsDeleting(true);
      } else if (isDeleting) {
        // Remove one character
        setDisplayed((prev) => prev.slice(0, prev.length - 1));
      } else {
        // Add one character
        setDisplayed((prev) => current.slice(0, prev.length + 1));
      }
    }, delay);

    // This cleanup now covers ALL cases — no nested setTimeout anywhere
    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, phraseIndex]);

  // ── Create a new room ──────────────────────────────────────────────────────

  const handleCreateRoom = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=create");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const { data } = await roomAPI.create({
        title: `${user.name}'s Meeting`,
      });
      // Navigate to the room — React Router handles the URL change
      navigate(`/room/${data.room.roomCode}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create room. Try again.",
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Join an existing room ──────────────────────────────────────────────────

  const handleJoinRoom = () => {
    const code = roomCode.trim();
    if (!code) {
      setError("Please enter a room code");
      return;
    }
    navigate(`/room/${code}`);
  };

  // Allow pressing Enter in the room code input to join
  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoinRoom();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        // Subtle gradient — gives glass card something to blur against
        background: (theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(135deg, #f0fdfa 0%, #fafafa 40%, #eff6ff 100%)"
            : "linear-gradient(135deg, #09090b 0%, #0c1a2e 100%)",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s ease",
      }}
    >
      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          px: { xs: 3, md: 6 },
          py: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Logo */}
        <Stack direction="row" sx={{ alignItems: "center" }} spacing={1}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "10px",
              background: "linear-gradient(135deg, #0D9488, #2DD4BF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              sx={{ fontWeight: 800, fontSize: "1.1rem", color: "#fff" }}
            >
              Z
            </Typography>
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 800, letterSpacing: "-0.02em" }}
          >
            Zync
          </Typography>
        </Stack>

        {/* Nav actions */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          {/* Theme toggle — sun for light mode, moon for dark mode */}
          <IconButton
            onClick={toggleMode}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": { color: "text.primary" },
            }}
          >
            {mode === "light" ? (
              <DarkModeIcon fontSize="small" />
            ) : (
              <LightModeIcon fontSize="small" />
            )}
          </IconButton>
          {isAuthenticated ? (
            <>
              <Typography variant="body2" color="text.secondary"
                sx={{ display: { xs: "none", sm: "block" } }}>
                Hey, {user?.name?.split(" ")[0]} 👋
              </Typography>
              <Button
                variant="contained"
                size="small"
                onClick={handleCreateRoom}
              >
                New Meeting
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={logout}
                sx={{
                  borderColor: "divider",
                  color: "text.secondary",
                  "&:hover": {
                    borderColor: "error.main",
                    color: "error.main",
                    bgcolor: "rgba(239,68,68,0.06)",
                  },
                }}
              >
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="text"
                color="inherit"
                onClick={() => navigate("/login")}
                sx={{ color: "text.secondary" }}
              >
                Sign in
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => navigate("/register")}
              >
                Get started
              </Button>
            </>
          )}
        </Stack>
      </Box>

      {/* ── Hero Section ──────────────────────────────────────────────── */}
      <Container
        maxWidth="md"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 8,
        }}
      >
        {/* Badge */}
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Chip
            icon={<BoltIcon sx={{ fontSize: 16 }} />}
            label="AI-powered meeting summaries"
            size="small"
            sx={{
              background: "rgba(13,148,136,0.1)",
              border: "1px solid rgba(13,148,136,0.3)",
              color: "primary.main",
              fontWeight: 600,
              px: 1,
            }}
          />
        </Box>

        {/* Main heading */}
        <Typography
          variant="h1"
          align="center"
          sx={{
            fontSize: { xs: "1.8rem", md: "2.8rem" },
            fontWeight: 800,
            lineHeight: 1.1,
            mb: 3,
            letterSpacing: "-0.03em",
            minHeight: { xs: "4.5rem", md: "3.5rem" }, // reserves space so layout never shifts
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexWrap: { xs: "wrap", sm: "nowrap" }, // forces everything onto one line
            whiteSpace: { xs: "normal", sm: "nowrap" }, // prevents the typed text from wrapping
          }}
        >
          Video calls that
          <Box
            component="span"
            sx={{
              background: "linear-gradient(135deg, #0D9488, #2DD4BF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
              ml: "0.28em", // exactly one space width — no double gap
            }}
          >
            {displayed}
            {/* Blinking cursor — a simple pipe character that fades in/out */}
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: "3px",
                height: "0.85em",
                bgcolor: "primary.main",
                ml: "2px",
                mb: "-2px",
                verticalAlign: "middle",
                borderRadius: "1px",
                animation: "blink 1s step-end infinite",
                "@keyframes blink": {
                  "0%, 100%": { opacity: 1 },
                  "50%": { opacity: 0 },
                },
              }}
            />
          </Box>
        </Typography>

        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{
            fontWeight: 400,
            mb: 6,
            maxWidth: 520,
            mx: "auto",
            lineHeight: 1.7,
          }}
        >
          Create a room, share the link, vibe in. AI writes your meeting notes
          so you don't have to.
        </Typography>

        {/* ── Action Card ───────────────────────────────────────────────── */}
        <Box
          sx={{
            // Glass morphism — semi-transparent blur over the gradient background
            background: (theme) =>
              theme.palette.mode === "light"
                ? "rgba(255,255,255,0.45)"
                : "rgba(24,24,27,0.6)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)", // Safari support
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "light"
                ? "rgba(13,148,136,0.2)"
                : "rgba(255,255,255,0.07)",
            borderRadius: 3,
            p: { xs: 3, md: 4 },
            boxShadow: (theme) =>
              theme.palette.mode === "light"
                ? "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)"
                : "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{ mb: 3, borderRadius: 2 }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          )}
          {/* Single row — Start meeting | or | code input + Join */}
          {/* Desktop: single row. Mobile: stacked */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            {/* Start a meeting button */}
            <Button
              variant="contained"
              startIcon={
                creating ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <VideoCallIcon sx={{ fontSize: 18 }} />
                )
              }
              onClick={handleCreateRoom}
              disabled={creating}
              sx={{
                height: 44,
                px: 2.5,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {creating ? "Creating..." : "Start a meeting"}
            </Button>

            {/* OR separator */}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                flexShrink: 0,
                px: 0.5,
                textAlign: { xs: "center", sm: "left" },
              }}
            >
              or
            </Typography>

            {/* Room code input — takes all remaining space */}
            <TextField
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              onKeyDown={handleKeyDown}
              fullWidth
              size="small"
              inputProps={{
                style: { letterSpacing: "0.06em", fontWeight: 500 },
              }}
              sx={{ "& .MuiOutlinedInput-root": { height: 44 } }}
            />

            {/* Join button */}
            <Button
              variant="outlined"
              onClick={handleJoinRoom}
              sx={{
                height: 44,
                px: 2.5,
                whiteSpace: "nowrap",
                flexShrink: 0,
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: "rgba(13,148,136,0.06)",
                },
              }}
            >
              Join
            </Button>
          </Stack>
        </Box>

        {/* ── Feature Pills ──────────────────────────────────────────────── */}
        {/* On mobile: vertical stack. On desktop: horizontal row with dividers */}
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 5 }}
        >
          {[
            { icon: <GroupsIcon sx={{ fontSize: 18, color: "primary.main" }} />, label: "Up to 50 participants" },
            { icon: <AutoAwesomeIcon sx={{ fontSize: 18, color: "primary.main" }} />, label: "AI meeting summary" },
            { icon: <BoltIcon sx={{ fontSize: 18, color: "primary.main" }} />, label: "Instant join via link" },
          ].map(({ icon, label }, index, arr) => (
            <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ px: { xs: 1, md: 4 }, py: { xs: 0.75, md: 1 } }}
              >
                {icon}
                <Typography
                  variant="body2"
                  sx={{ color: "text.secondary", fontWeight: 500 }}
                >
                  {label}
                </Typography>
              </Stack>

              {/* Vertical divider — only between items on desktop */}
              {index < arr.length - 1 && (
                <Box
                  sx={{
                    width: "1px",
                    height: 20,
                    bgcolor: "divider",
                    display: { xs: "none", md: "block" },
                  }}
                />
              )}
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
};

export default Landing;
