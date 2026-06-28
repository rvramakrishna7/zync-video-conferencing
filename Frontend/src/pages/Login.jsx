/**
 * pages/Login.jsx
 *
 * Handles two flows:
 *  1. Email + password login (local auth)
 *  2. "Continue with Google" button (Google OAuth)
 */

import { useState } from "react";
import { useNavigate, Link as RouterLink, useSearchParams } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Stack,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import { useGoogleLogin } from "@react-oauth/google";

import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        // Use the access token to fetch the user's profile from Google
        const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await profileRes.json();

        // Send profile to our backend — it finds or creates the user and returns JWT
        const { data } = await authAPI.googleAuth({
          googleId: profile.sub,   // Google's unique user ID
          email: profile.email,
          name: profile.name,
          avatar: profile.picture,
        });

        login(data.token, data.user);
        // Same redirect logic — go back to where they came from
        const redirect = searchParams.get("redirect");
        navigate(redirect ? decodeURIComponent(redirect) : "/");
      } catch (err) {
        setError("Google sign-in failed. Please try again.");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed.");
    },
  });

  // Single handler for all input changes — "computed property name" pattern
  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError(""); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // prevent browser's default form page-reload behavior
    setLoading(true);
    setError("");

    try {
      const { data } = await authAPI.login(form);
      login(data.token, data.user); // store token + update global auth state

      // redirect param contains the original URL they were trying to visit
      const redirect = searchParams.get("redirect");
      navigate(redirect ? decodeURIComponent(redirect) : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: (theme) =>
          theme.palette.mode === "light"
            ? "linear-gradient(135deg, #f0fdfa 0%, #fafafa 40%, #eff6ff 100%)"
            : "linear-gradient(135deg, #09090b 0%, #0c1a2e 100%)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        px: 2,
        pt: { xs: 6, sm: 12 },
        pb: 6,
        transition: "background 0.3s ease",
      }}
    >
      <Container maxWidth="sm">
        {/* Logo + heading */}
        <Stack sx={{ alignItems: "center" }} mb={4}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0D9488, #2DD4BF)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 2,
            }}
          >
            <Typography sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#fff" }}>Z</Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em">
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Sign in to your Zync account
          </Typography>
        </Stack>

        {/* Card */}
        <Box
          sx={{
            background: (theme) =>
              theme.palette.mode === "light"
                ? "rgba(255,255,255,0.65)"
                : "rgba(24,24,27,0.75)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid",
            borderColor: (theme) =>
              theme.palette.mode === "light"
                ? "rgba(13,148,136,0.2)"
                : "rgba(255,255,255,0.07)",
            borderRadius: 3,
            p: { xs: 3, sm: 4 },
            mt: 2,
            boxShadow: (theme) =>
              theme.palette.mode === "light"
                ? "0 8px 32px rgba(0,0,0,0.08)"
                : "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Google OAuth button */}
          <Button
            fullWidth
            variant="outlined"
            startIcon={googleLoading ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading}
            sx={{
              mb: 3,
              borderColor: "divider",
              color: "text.primary",
              py: 1.4,
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "rgba(13,148,136,0.04)",
              },
            }}
          >
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <Divider sx={{ mb: 3, "&::before, &::after": { borderColor: "divider" } }}>
            <Typography variant="caption" color="text.secondary">
              or with email
            </Typography>
          </Divider>

          {/* Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="email"
                autoFocus
              />

              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                autoComplete="current-password"
                InputProps={{
                  // InputProps lets you add elements inside the input field
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                        sx={{ color: "text.secondary" }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !form.email || !form.password}
                sx={{ py: 1.6, mt: 1, mb :1 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
              </Button>
            </Stack>
          </Box>
          {/* Footer link */}
        <Typography
          align="center"
          variant="body2"
          color="text.secondary"
          sx={{ wordBreak: "keep-all", whiteSpace: "normal", mt: 3, mb: 3 }}
        >
          Don't have an account?{" "}
          <RouterLink
            to="/register"
            style={{ color: "#0D9488", textDecoration: "none", fontWeight: 600 }}
          >
            Create one free
          </RouterLink>
        </Typography>
        </Box>

        
        
      </Container>
    </Box>
  );
};

export default Login;
