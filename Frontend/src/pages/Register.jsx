/**
 * pages/Register.jsx — New user sign up.
 *
 * Same pattern as Login — controlled form, API call, store token.
 * Extra field: name. Extra validation: password confirmation.
 */

import { useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
  InputAdornment,
  IconButton,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import GoogleIcon from "@mui/icons-material/Google";
import { useGoogleLogin } from "@react-oauth/google";

import { useAuth } from "../context/AuthContext";
import { authAPI } from "../services/api";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        const profileRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          },
        );
        const profile = await profileRes.json();

        const { data } = await authAPI.googleAuth({
          googleId: profile.sub,
          email: profile.email,
          name: profile.name,
          avatar: profile.picture,
        });

        login(data.token, data.user);
        navigate("/");
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

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data } = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
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
        pt: 4,
        pb: 6,
        transition: "background 0.3s ease",
      }}
    >
      <Container maxWidth="sm">
        <Stack sx={{ alignItems: "center" }} mb={1}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              background: "linear-gradient(135deg, #0D9488, #2DD4BF)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <Typography
              sx={{ fontWeight: 800, fontSize: "1.5rem", color: "#fff" }}
            >
              Z
            </Typography>
          </Box>
          <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em">
            Create your account
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Start syncing in seconds
          </Typography>
        </Stack>

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
            p: { xs: 2, sm: 3 },
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

          <Button
            fullWidth
            variant="outlined"
            startIcon={
              googleLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <GoogleIcon />
              )
            }
            onClick={() => handleGoogleLogin()}
            disabled={googleLoading}
            sx={{
              mb: 2,
              borderColor: "divider",
              color: "text.primary",
              py: 1,
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "rgba(13,148,136,0.04)",
              },
            }}
          >
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </Button>

          <Divider
            sx={{ mb: 2, "&::before, &::after": { borderColor: "divider" } }}
          >
            <Typography variant="caption" color="text.secondary">
              or with email
            </Typography>
          </Divider>

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={1.5}>
              <TextField
                label="Full name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                fullWidth
                autoFocus
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                required
                fullWidth
                helperText="At least 6 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword((p) => !p)}
                        edge="end"
                        size="small"
                        sx={{ color: "text.secondary" }}
                      >
                        {showPassword ? (
                          <VisibilityOffIcon />
                        ) : (
                          <VisibilityIcon />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                label="Confirm password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={form.confirmPassword}
                onChange={handleChange}
                required
                fullWidth
                error={
                  form.confirmPassword.length > 0 &&
                  form.password !== form.confirmPassword
                }
                helperText={
                  form.confirmPassword.length > 0 &&
                  form.password !== form.confirmPassword
                    ? "Passwords don't match"
                    : ""
                }
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={
                  loading || !form.name || !form.email || !form.password
                }
                sx={{ py: 1.6, mt: 0.5, mb: 0.5 }}
              >
                {loading ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  "Create account"
                )}
              </Button>
            </Stack>
          </Box>

          <Typography
            align="center"
            variant="body2"
            color="text.secondary"
            sx={{ wordBreak: "keep-all", whiteSpace: "normal", mt: 3, mb: 3 }}
          >
            Already have an account?{" "}
            <RouterLink
              to="/login"
              style={{
                color: "#0D9488",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign in
            </RouterLink>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
