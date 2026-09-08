import { useState } from "react";

import API_URL from "../api";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Sparkles,
  Heart,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from "lucide-react";

import schoolLogo from "../assets/logo-sekolah.png";
import debugGirlsLogo from "../assets/debug-girls-logo.png";

import "./Login.css";

function Login({ onLogin, onGoSignup }) {
  /* =====================================================
     LOGIN STATE
  ===================================================== */

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================================================
     FORGOT PASSWORD STATE
  ===================================================== */

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [forgotEmail, setForgotEmail] =
    useState("");

  const [forgotLoading, setForgotLoading] =
    useState(false);

  const [forgotMessage, setForgotMessage] =
    useState("");

  const [forgotError, setForgotError] =
    useState("");

  /* =====================================================
     RESET PASSWORD STATE
  ===================================================== */

  const [showResetPassword, setShowResetPassword] =
    useState(false);

  const [resetToken, setResetToken] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmNewPassword, setConfirmNewPassword] =
    useState("");

  const [showNewPassword, setShowNewPassword] =
    useState(false);

  const [
    showConfirmNewPassword,
    setShowConfirmNewPassword,
  ] = useState(false);

  const [resetLoading, setResetLoading] =
    useState(false);

  const [resetMessage, setResetMessage] =
    useState("");

  const [resetError, setResetError] =
    useState("");

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    const cleanEmail =
      email.trim().toLowerCase();

    /* EMAIL VALIDATION */

    if (!cleanEmail) {
      setError(
        "Please enter your Delima email."
      );

      setLoading(false);
      return;
    }

    if (
      !cleanEmail.endsWith("@moe-dl.edu.my")
    ) {
      setError(
        "Please use your official Delima email ending with @moe-dl.edu.my."
      );

      setLoading(false);
      return;
    }

    /* PASSWORD VALIDATION */

    if (!password.trim()) {
      setError(
        "Please enter your password."
      );

      setLoading(false);
      return;
    }

    try {
      /* =================================================
         CALL BACKEND API
      ================================================= */

      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: cleanEmail,
            password,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      /* =================================================
         LOGIN FAILED
      ================================================= */

      if (!response.ok) {
        setError(
          data.message ||
            "Email or password is incorrect. Please try again."
        );

        setLoading(false);
        return;
      }

      /* =================================================
         USER DATA
      ================================================= */

      const profileImage =
        data.user?.profileImage ||
        data.user?.profile_image ||
        "";

      const user = {
        id:
          data.user?.id ||
          "",

        name:
          data.user?.name ||
          data.user?.fullName ||
          "Foundly Member",

        email:
          data.user?.email ||
          cleanEmail,

        points:
          Number(data.user?.points ?? 0),

        profile_image:
          profileImage,

        profileImage,

        created_at:
          data.user?.created_at ||
          null,

        createdAt:
          data.user?.createdAt ||
          data.user?.created_at ||
          null,

        reports:
          Number(data.user?.reports ?? 0),
      };

      /* =================================================
         SAVE LIGHT USER SESSION

         Jangan simpan gambar Base64 besar.
      ================================================= */

      const localUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        points: user.points,

        created_at:
          user.created_at,

        createdAt:
          user.createdAt,

        reports:
          user.reports,
      };

      try {
        localStorage.setItem(
          "foundlyCurrentUser",
          JSON.stringify(localUser)
        );
      } catch (storageError) {
        console.warn(
          "Unable to save current user:",
          storageError
        );
      }

      /* =================================================
         SAVE POINTS CACHE
      ================================================= */

      try {
        localStorage.setItem(
          `foundlyPoints_${cleanEmail}`,
          String(user.points)
        );

        localStorage.setItem(
          "foundlyPoints",
          String(user.points)
        );
      } catch (storageError) {
        console.warn(
          "Unable to save points:",
          storageError
        );
      }

      /* =================================================
         LOCAL USER CACHE

         Compatibility dengan code lama.
      ================================================= */

      try {
        let savedUsers = [];

        try {
          savedUsers = JSON.parse(
            localStorage.getItem(
              "foundlyUsers"
            ) || "[]"
          );

          if (!Array.isArray(savedUsers)) {
            savedUsers = [];
          }
        } catch {
          savedUsers = [];
        }

        const safeUsers =
          savedUsers.map((item) => ({
            id: item?.id || "",
            name: item?.name || "",
            email: item?.email || "",
            points: Number(
              item?.points ?? 0
            ),

            created_at:
              item?.created_at || null,

            createdAt:
              item?.createdAt || null,

            reports:
              Number(
                item?.reports ?? 0
              ),
          }));

        const updatedUsers =
          safeUsers.filter(
            (item) =>
              item?.email
                ?.toLowerCase() !==
              cleanEmail
          );

        localStorage.setItem(
          "foundlyUsers",
          JSON.stringify([
            ...updatedUsers,
            localUser,
          ])
        );
      } catch (storageError) {
        console.warn(
          "Unable to update users cache:",
          storageError
        );
      }

      /* =================================================
         LOGIN SUCCESS
      ================================================= */

      setLoading(false);

      onLogin(user);
    } catch (err) {
      console.error(
        "Login error:",
        err
      );

      setError(
        "Unable to connect to Foundly server. Please try again."
      );

      setLoading(false);
    }
  };

  /* =====================================================
     OPEN FORGOT PASSWORD
  ===================================================== */

  const openForgotPassword = () => {
    setError("");

    setForgotEmail(
      email.trim().toLowerCase()
    );

    setForgotMessage("");
    setForgotError("");

    setShowResetPassword(false);
    setShowForgotPassword(true);
  };

  /* =====================================================
     BACK TO LOGIN
  ===================================================== */

  const backToLogin = () => {
    if (
      forgotLoading ||
      resetLoading
    ) {
      return;
    }

    setShowForgotPassword(false);
    setShowResetPassword(false);

    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");

    setResetToken("");

    setNewPassword("");
    setConfirmNewPassword("");

    setResetMessage("");
    setResetError("");
  };

  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setForgotMessage("");
    setForgotError("");

    const cleanForgotEmail =
      forgotEmail
        .trim()
        .toLowerCase();

    if (!cleanForgotEmail) {
      setForgotError(
        "Please enter your Delima email."
      );

      return;
    }

    if (
      !cleanForgotEmail.endsWith(
        "@moe-dl.edu.my"
      )
    ) {
      setForgotError(
        "Please enter your official Delima email ending with @moe-dl.edu.my."
      );

      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/forgot-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email: cleanForgotEmail,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setForgotError(
          data.message ||
            "Unable to process your password reset request."
        );

        setForgotLoading(false);
        return;
      }

      /* DEVELOPMENT MODE TOKEN */

      if (data.resetToken) {
        setResetToken(
          data.resetToken
        );

        setForgotMessage(
          "Password reset request created successfully!"
        );

        setForgotLoading(false);

        setShowResetPassword(true);

        return;
      }

      setForgotMessage(
        data.message ||
          "Password reset request created successfully!"
      );

      setForgotLoading(false);
    } catch (err) {
      console.error(
        "Forgot password error:",
        err
      );

      setForgotError(
        "Unable to connect to Foundly server. Please try again."
      );

      setForgotLoading(false);
    }
  };

  /* =====================================================
     RESET PASSWORD
  ===================================================== */

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetMessage("");
    setResetError("");

    if (!resetToken) {
      setResetError(
        "Reset request is invalid. Please start again."
      );

      return;
    }

    if (!newPassword) {
      setResetError(
        "Please enter a new password."
      );

      return;
    }

    if (newPassword.length < 6) {
      setResetError(
        "Password must contain at least 6 characters."
      );

      return;
    }

    if (
      newPassword !==
      confirmNewPassword
    ) {
      setResetError(
        "Passwords do not match."
      );

      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/reset-password`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            token: resetToken,

            newPassword,

            confirmPassword:
              confirmNewPassword,
          }),
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        setResetError(
          data.message ||
            "Unable to reset your password."
        );

        setResetLoading(false);
        return;
      }

      setResetMessage(
        "Your password has been reset successfully! You can now login with your new password. 💗"
      );

      setResetToken("");

      setNewPassword("");
      setConfirmNewPassword("");

      setResetLoading(false);
    } catch (err) {
      console.error(
        "Reset password error:",
        err
      );

      setResetError(
        "Unable to connect to Foundly server. Please try again."
      );

      setResetLoading(false);
    }
  };

  /* =====================================================
     FINISH RESET
  ===================================================== */

  const finishResetAndLogin = () => {
    setShowResetPassword(false);
    setShowForgotPassword(false);

    setForgotEmail("");
    setForgotMessage("");
    setForgotError("");

    setResetToken("");

    setNewPassword("");
    setConfirmNewPassword("");

    setResetMessage("");
    setResetError("");

    setPassword("");
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="login-page">

      {/* BACKGROUND */}

      <div className="login-glow glow-one" />
      <div className="login-glow glow-two" />
      <div className="login-glow glow-three" />

      {/* FLOATING DECORATIONS */}

      <div className="login-floating float-heart">
        ♥
      </div>

      <div className="login-floating float-star">
        ✦
      </div>

      <div className="login-floating float-sparkle">
        ✧
      </div>

      <div className="login-floating float-heart-two">
        ♡
      </div>

      <div className="login-floating float-sparkle-two">
        ✨
      </div>

      <div className="login-floating float-star-two">
        ★
      </div>

      {/* HEADER */}

      <header className="login-header">

        <div className="login-brand">

          <div className="login-school-logo">

            <img
              src={schoolLogo}
              alt="SK Limbang"
            />

          </div>

          <div className="login-school-name">

            <strong>
              SK LIMBANG
            </strong>

            <span>
              Lost & Found Community
            </span>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="login-main">

        {/* LEFT */}

        <section className="login-introduction">

          <div className="login-intro-logo">

            <img
              src={debugGirlsLogo}
              alt="Debug Girls"
            />

          </div>

          <div className="login-intro-label">

            <Sparkles size={21} />

            <span>
              YOUR SCHOOL'S
            </span>

            <Sparkles size={21} />

          </div>

          <h1>

            Lost &

            <span>
              Found
            </span>

            <strong>
              Made Easy.
            </strong>

          </h1>

          <p className="login-description">

            Helping our school community
            find what matters most.

          </p>

          <div className="login-heart-line">

            <Heart
              size={28}
              fill="currentColor"
            />

            <span>
              Find it. Report it. Return it.
            </span>

          </div>

          <div className="login-features">

            <div className="login-feature">

              <div className="feature-icon pink">
                🔎
              </div>

              <div>

                <strong>
                  Report Lost Items
                </strong>

                <span>
                  Let your school community
                  know what you're looking for.
                </span>

              </div>

            </div>

            <div className="login-feature">

              <div className="feature-icon purple">
                📦
              </div>

              <div>

                <strong>
                  Report Found Items
                </strong>

                <span>
                  Help return someone's
                  belongings safely.
                </span>

              </div>

            </div>

            <div className="login-feature">

              <div className="feature-icon gold">
                ✨
              </div>

              <div>

                <strong>
                  Earn Points
                </strong>

                <span>
                  Every successful report
                  earns +10 points.
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* RIGHT CARD */}

        <section className="login-card">

          {/* =================================================
             RESET PASSWORD
          ================================================= */}

          {showResetPassword ? (

            <>

              <div className="login-card-brand">

                <div className="foundly-logo-wrap">

                  <div className="foundly-orbit orbit-one" />
                  <div className="foundly-orbit orbit-two" />

                  <div className="foundly-logo-text">
                    Foundly<span>!</span>
                  </div>

                </div>

                <div className="foundly-subtitle">
                  The Lost & Found App
                </div>

              </div>

              <div className="login-card-heading">

                <span>
                  ✦ CREATE NEW PASSWORD ✦
                </span>

                <h2>
                  Reset Password
                </h2>

                <p>
                  Create a new password for
                  your Foundly account.
                </p>

              </div>

              <form
                className="login-form"
                onSubmit={handleResetPassword}
              >

                <div className="login-field">

                  <label>
                    New Password
                  </label>

                  <div className="login-input-wrapper">

                    <Lock
                      size={22}
                      className="input-icon"
                    />

                    <input
                      type={
                        showNewPassword
                          ? "text"
                          : "password"
                      }
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      placeholder="Create a new password"
                      autoComplete="new-password"
                      disabled={
                        resetLoading ||
                        !!resetMessage
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowNewPassword(
                          !showNewPassword
                        )
                      }
                      disabled={
                        resetLoading ||
                        !!resetMessage
                      }
                    >

                      {showNewPassword ? (
                        <EyeOff size={21} />
                      ) : (
                        <Eye size={21} />
                      )}

                    </button>

                  </div>

                </div>

                <div className="login-field">

                  <label>
                    Confirm New Password
                  </label>

                  <div className="login-input-wrapper">

                    <Lock
                      size={22}
                      className="input-icon"
                    />

                    <input
                      type={
                        showConfirmNewPassword
                          ? "text"
                          : "password"
                      }
                      value={confirmNewPassword}
                      onChange={(e) =>
                        setConfirmNewPassword(
                          e.target.value
                        )
                      }
                      placeholder="Repeat your new password"
                      autoComplete="new-password"
                      disabled={
                        resetLoading ||
                        !!resetMessage
                      }
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmNewPassword(
                          !showConfirmNewPassword
                        )
                      }
                      disabled={
                        resetLoading ||
                        !!resetMessage
                      }
                    >

                      {showConfirmNewPassword ? (
                        <EyeOff size={21} />
                      ) : (
                        <Eye size={21} />
                      )}

                    </button>

                  </div>

                </div>

                {resetError && (

                  <div className="login-error">

                    <span>!</span>

                    <p>
                      {resetError}
                    </p>

                  </div>

                )}

                {resetMessage && (

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "13px 15px",
                      borderRadius: "14px",
                      background: "#ecfdf5",
                      border:
                        "1px solid #a7f3d0",
                      color: "#047857",
                      marginBottom: "14px",
                    }}
                  >

                    <CheckCircle2 size={19} />

                    <p
                      style={{
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {resetMessage}
                    </p>

                  </div>

                )}

                {!resetMessage ? (

                  <button
                    type="submit"
                    className="login-submit"
                    disabled={resetLoading}
                  >

                    {resetLoading ? (

                      <>
                        <span className="login-spinner" />
                        Updating Password...
                      </>

                    ) : (

                      <>
                        Reset My Password
                        <ArrowRight size={24} />
                      </>

                    )}

                  </button>

                ) : (

                  <button
                    type="button"
                    className="login-submit"
                    onClick={finishResetAndLogin}
                  >

                    Back to Login

                    <ArrowRight size={24} />

                  </button>

                )}

              </form>

              <div className="login-trust">

                <KeyRound size={19} />

                <span>
                  Your password reset request
                  is protected by Foundly.
                </span>

              </div>

            </>

          ) : showForgotPassword ? (

            /* =================================================
               FORGOT PASSWORD
            ================================================= */

            <>

              <div className="login-card-brand">

                <div className="foundly-logo-wrap">

                  <div className="foundly-orbit orbit-one" />
                  <div className="foundly-orbit orbit-two" />

                  <div className="foundly-logo-text">
                    Foundly<span>!</span>
                  </div>

                </div>

                <div className="foundly-subtitle">
                  The Lost & Found App
                </div>

              </div>

              <div className="login-card-heading">

                <span>
                  ✦ ACCOUNT RECOVERY ✦
                </span>

                <h2>
                  Forgot Password?
                </h2>

                <p>
                  Enter your Delima email and
                  we'll help you reset your password.
                </p>

              </div>

              <form
                className="login-form"
                onSubmit={handleForgotPassword}
              >

                <div className="login-field">

                  <label>
                    Delima Email
                  </label>

                  <div className="login-input-wrapper">

                    <Mail
                      size={22}
                      className="input-icon"
                    />

                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) =>
                        setForgotEmail(e.target.value)
                      }
                      placeholder="nama@moe-dl.edu.my"
                      autoComplete="email"
                      disabled={forgotLoading}
                    />

                  </div>

                  <small>
                    Use your official school
                    Delima email.
                  </small>

                </div>

                {forgotError && (

                  <div className="login-error">

                    <span>!</span>

                    <p>
                      {forgotError}
                    </p>

                  </div>

                )}

                {forgotMessage && (

                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "13px 15px",
                      borderRadius: "14px",
                      background: "#ecfdf5",
                      border:
                        "1px solid #a7f3d0",
                      color: "#047857",
                      marginBottom: "14px",
                    }}
                  >

                    <CheckCircle2 size={19} />

                    <p
                      style={{
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {forgotMessage}
                    </p>

                  </div>

                )}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={forgotLoading}
                >

                  {forgotLoading ? (

                    <>
                      <span className="login-spinner" />
                      Sending Request...
                    </>

                  ) : (

                    <>
                      Continue
                      <ArrowRight size={24} />
                    </>

                  )}

                </button>

              </form>

              <div className="login-signup">

                <span>
                  REMEMBERED YOUR PASSWORD?
                </span>

                <button
                  type="button"
                  onClick={backToLogin}
                  disabled={forgotLoading}
                >

                  <ArrowLeft size={17} />

                  Back to Login

                </button>

              </div>

              <div className="login-trust">

                <KeyRound size={19} />

                <span>
                  Your password reset request
                  is protected by Foundly.
                </span>

              </div>

            </>

          ) : (

            /* =================================================
               NORMAL LOGIN
            ================================================= */

            <>

              <div className="login-card-brand">

                <div className="foundly-logo-wrap">

                  <div className="foundly-orbit orbit-one" />
                  <div className="foundly-orbit orbit-two" />

                  <div className="foundly-logo-text">
                    Foundly<span>!</span>
                  </div>

                </div>

                <div className="foundly-subtitle">
                  The Lost & Found App
                </div>

              </div>

              <div className="login-card-heading">

                <span>
                  ✦ WELCOME BACK ✦
                </span>

                <h2>
                  Sign in to Foundly!
                </h2>

                <p>
                  Reconnect lost items with
                  their owners.
                </p>

              </div>

              <form
                className="login-form"
                onSubmit={handleSubmit}
              >

                <div className="login-field">

                  <label>
                    Delima Email
                  </label>

                  <div className="login-input-wrapper">

                    <Mail
                      size={22}
                      className="input-icon"
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(e) =>
                        setEmail(e.target.value)
                      }
                      placeholder="nama@moe-dl.edu.my"
                      autoComplete="email"
                      disabled={loading}
                    />

                  </div>

                  <small>
                    Use your official school
                    Delima email.
                  </small>

                </div>

                <div className="login-field">

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: "10px",
                      marginBottom: "7px",
                    }}
                  >

                    <label
                      style={{
                        marginBottom: 0,
                      }}
                    >
                      Password
                    </label>

                    <button
                      type="button"
                      onClick={openForgotPassword}
                      disabled={loading}
                      style={{
                        border: "none",
                        background:
                          "transparent",
                        padding: 0,
                        color: "#b044bc",
                        fontSize: "13px",
                        fontWeight: "700",
                        cursor: loading
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      Forgot Password?
                    </button>

                  </div>

                  <div className="login-input-wrapper">

                    <Lock
                      size={22}
                      className="input-icon"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={loading}
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      disabled={loading}
                    >

                      {showPassword ? (
                        <EyeOff size={21} />
                      ) : (
                        <Eye size={21} />
                      )}

                    </button>

                  </div>

                </div>

                {error && (

                  <div className="login-error">

                    <span>
                      !
                    </span>

                    <p>
                      {error}
                    </p>

                  </div>

                )}

                <button
                  type="submit"
                  className="login-submit"
                  disabled={loading}
                >

                  {loading ? (

                    <>
                      <span className="login-spinner" />
                      Signing in...
                    </>

                  ) : (

                    <>
                      Login to Foundly!
                      <ArrowRight size={24} />
                    </>

                  )}

                </button>

              </form>

              <div className="login-signup">

                <span>
                  NEW TO FOUNDLY?
                </span>

                <button
                  type="button"
                  onClick={onGoSignup}
                  disabled={loading}
                >

                  Create New Account

                  <ArrowRight size={18} />

                </button>

              </div>

              <div className="login-trust">

                <ShieldCheck size={19} />

                <span>
                  For students, teachers & parents
                  of SK Limbang
                </span>

              </div>

            </>

          )}

        </section>

      </main>

      {/* FOOTER */}

      <footer className="login-footer">

        <div>

          <strong>
            Foundly!
          </strong>

          <span>
            by Debug Girls · SK Limbang
          </span>

        </div>

        <div className="footer-sparkles">
          ✦ ✧ ♥
        </div>

      </footer>

    </div>
  );
}

export default Login;