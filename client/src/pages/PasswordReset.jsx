import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, ArrowBack } from "@mui/icons-material";
// import { useNavigate } from "react-router-dom";
import { useLocation } from "wouter";
import axios from "axios";

const ForgotPasswordPage = () => {
  const navigate = useLocation();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [userInfo, setUserInfo] = useState(null);

  const steps = ["Enter Phone Number", "Verify OTP", "Reset Password"];

  // API base URL - adjust this to your backend URL
  const API_BASE_URL = "http://localhost:5000/api";

  // Timer for resend OTP
  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Step 1: Verify phone number and send OTP
  const handleSendOTP = async () => {
    setError("");
    setSuccess("");

    if (!phoneNumber) {
      setError("Please enter your phone number");
      return;
    }

    // Format phone number with country code if not present
    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
    }

    setLoading(true);

    try {
      // First verify if phone number exists
      const verifyResponse = await axios.post(
        `${API_BASE_URL}/customers/forgot-password/verify-phone`,
        { phone: formattedPhone }
      );

      if (verifyResponse.data.success) {
        setUserInfo(verifyResponse.data.data);

        // Send OTP
        const otpResponse = await axios.post(`${API_BASE_URL}/sms/otp/send`, {
          phone: formattedPhone,
          purpose: "password reset",
        });

        if (otpResponse.data.success) {
          setOtpSent(true);
          setSuccess("OTP sent successfully to your phone number");
          setResendTimer(60);
          setActiveStep(1);
        }
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/sms/otp/resend`, {
        phone: formattedPhone,
        purpose: "password reset",
      });

      if (response.data.success) {
        setSuccess("OTP resent successfully");
        setResendTimer(60);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to resend OTP"
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async () => {
    setError("");
    setSuccess("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/sms/otp/verify`, {
        phone: formattedPhone,
        otp: otp,
        purpose: "password reset",
      });

      if (response.data.success) {
        setSuccess("OTP verified successfully");
        setActiveStep(2);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset password
  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    let formattedPhone = phoneNumber.trim();
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+91" + formattedPhone.replace(/^0+/, "");
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/customers/forgot-password/reset`,
        {
          phone: formattedPhone,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      if (response.data.success) {
        setSuccess("Password reset successfully! Redirecting to login page...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to reset password"
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle back button
  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      setError("");
      setSuccess("");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-200 to-blue-100">
      <Box className="w-full max-w-2xl p-10 bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <Box className="flex items-center mb-6">
          <IconButton onClick={handleBack} className="mr-2">
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" className="font-bold">
            Reset Password
          </Typography>
        </Box>

        {/* Stepper */}
        <Stepper activeStep={activeStep} className="mb-8">
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Alert Messages */}
        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert
            severity="success"
            className="mb-4"
            onClose={() => setSuccess("")}
          >
            {success}
          </Alert>
        )}

        {/* Step 1: Phone Number */}
        {activeStep === 0 && (
          <Box className="space-y-4">
            <Typography variant="body1" className="text-gray-600 mb-4">
              Enter your registered phone number to receive an OTP for password
              reset.
            </Typography>
            <TextField
              fullWidth
              label="Phone Number"
              variant="outlined"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+91 9876543210"
              helperText="Enter with country code (e.g., +91 for India)"
              InputProps={{
                className: "bg-gray-50",
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSendOTP}
              disabled={loading}
              className="py-3 text-lg font-semibold"
            >
              {loading ? <CircularProgress size={24} /> : "Send OTP"}
            </Button>
          </Box>
        )}

        {/* Step 2: OTP Verification */}
        {activeStep === 1 && (
          <Box className="space-y-4">
            <Typography variant="body1" className="text-gray-600 mb-4">
              Enter the 6-digit OTP sent to your phone number
              {userInfo && (
                <span className="block mt-2 font-semibold">
                  Account: {userInfo.email}
                </span>
              )}
            </Typography>
            <TextField
              fullWidth
              label="Enter OTP"
              variant="outlined"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                if (value.length <= 6) setOtp(value);
              }}
              inputProps={{
                maxLength: 6,
                style: {
                  textAlign: "center",
                  fontSize: "24px",
                  letterSpacing: "8px",
                },
              }}
              InputProps={{
                className: "bg-gray-50",
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="py-3 text-lg font-semibold"
            >
              {loading ? <CircularProgress size={24} /> : "Verify OTP"}
            </Button>
            <Box className="text-center">
              {resendTimer > 0 ? (
                <Typography variant="body2" className="text-gray-500">
                  Resend OTP in {resendTimer}s
                </Typography>
              ) : (
                <Button
                  variant="text"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-[#2a753a]"
                >
                  Resend OTP
                </Button>
              )}
            </Box>
          </Box>
        )}

        {/* Step 3: Reset Password */}
        {activeStep === 2 && (
          <Box className="space-y-4">
            <Typography variant="body1" className="text-gray-600 mb-4">
              Create a new password for your account
            </Typography>
            <TextField
              fullWidth
              label="New Password"
              variant="outlined"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                className: "bg-gray-50",
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Must be at least 6 characters long"
            />
            <TextField
              fullWidth
              label="Confirm Password"
              variant="outlined"
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                className: "bg-gray-50",
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                    >
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleResetPassword}
              disabled={loading}
              className="py-3 text-lg font-semibold"
            >
              {loading ? <CircularProgress size={24} /> : "Reset Password"}
            </Button>
          </Box>
        )}

        {/* Back to Login */}
        <Typography className="text-center text-gray-500 mt-6">
          Remember your password?{" "}
          <a href="/login" className="text-[#2a753a] font-bold hover:underline">
            Back to Login
          </a>
        </Typography>
      </Box>
    </div>
  );
};

export default ForgotPasswordPage;
