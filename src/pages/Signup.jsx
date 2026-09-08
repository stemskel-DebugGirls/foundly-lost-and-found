import { useState } from "react";

import API_URL from "../api";

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Heart,
  Sparkles,
  Star,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import schoolLogo from "../assets/logo-sekolah.png";
import debugGirlsLogo from "../assets/debug-girls-logo.png";

import "./Signup.css";

function Signup({
  onSignup,
  onGoLogin,
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /* =====================================================
     CREATE ACCOUNT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your Delima email.");
      return;
    }

    if (
      !cleanEmail.endsWith("@moe-dl.edu.my")
    ) {
      setError(
        "Please use your official Delima email ending with @moe-dl.edu.my."
      );
      return;
    }

    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your password.");
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Passwords do not match. Please try again."
      );
      return;
    }

    setLoading(true);

    try {
      /* =====================================================
         SEND DATA TO FOUNDLY BACKEND
      ===================================================== */

      const response = await fetch(
        `${API_URL}/api/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: password,
            confirmPassword: confirmPassword,
          }),
        }
      );

      /* =====================================================
         READ SERVER RESPONSE
      ===================================================== */

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      /* =====================================================
         BACKEND ERROR
      ===================================================== */

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to create your account. Please try again."
        );

        setLoading(false);
        return;
      }

      /* =====================================================
         ACCOUNT CREATED SUCCESSFULLY
      ===================================================== */

      const profileImage =
        data.user?.profileImage ||
        data.user?.profile_image ||
        "";

      const newUser = {
        id:
          data.user?.id || "",

        name:
          data.user?.name ||
          data.user?.fullName ||
          cleanName,

        email:
          data.user?.email ||
          cleanEmail,

        points:
          Number(
            data.user?.points ?? 0
          ),

        profile_image:
          profileImage,

        profileImage:
          profileImage,

        created_at:
          data.user?.created_at ||
          data.user?.createdAt ||
          new Date().toISOString(),

        createdAt:
          data.user?.createdAt ||
          data.user?.created_at ||
          new Date().toISOString(),

        reports:
          Number(
            data.user?.reports ?? 0
          ),
      };

      /* =====================================================
         LIGHTWEIGHT CURRENT USER

         Compatibility dengan frontend lama.
         Jangan simpan gambar Base64 besar dalam localStorage.
      ===================================================== */

      const localUser = {
        id: newUser.id,

        name: newUser.name,

        email: newUser.email,

        points: newUser.points,

        created_at:
          newUser.created_at,

        createdAt:
          newUser.createdAt,

        reports:
          newUser.reports,
      };

      /* =====================================================
         SAVE CURRENT USER
      ===================================================== */

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

      /* =====================================================
         POINTS

         NEW USER ALWAYS STARTS WITH 0
      ===================================================== */

      try {
        localStorage.setItem(
          `foundlyPoints_${cleanEmail}`,
          String(newUser.points ?? 0)
        );

        localStorage.setItem(
          "foundlyPoints",
          String(newUser.points ?? 0)
        );
      } catch (storageError) {
        console.warn(
          "Unable to save points:",
          storageError
        );
      }

      /* =====================================================
         LOCAL USER CACHE

         Compatibility dengan existing Foundly frontend.
      ===================================================== */

      try {
        let users = [];

        try {
          users = JSON.parse(
            localStorage.getItem(
              "foundlyUsers"
            ) || "[]"
          );

          if (!Array.isArray(users)) {
            users = [];
          }
        } catch {
          users = [];
        }

        /* REMOVE OLD VERSION OF SAME USER */

        const safeUsers =
          users.map((user) => ({
            id: user?.id || "",

            name:
              user?.name || "",

            email:
              user?.email || "",

            points:
              Number(
                user?.points ?? 0
              ),

            created_at:
              user?.created_at ||
              null,

            createdAt:
              user?.createdAt ||
              user?.created_at ||
              null,

            reports:
              Number(
                user?.reports ?? 0
              ),
          }));

        const filteredUsers =
          safeUsers.filter(
            (user) =>
              user?.email?.toLowerCase() !==
              cleanEmail
          );

        localStorage.setItem(
          "foundlyUsers",
          JSON.stringify([
            ...filteredUsers,
            localUser,
          ])
        );
      } catch (storageError) {
        console.warn(
          "Unable to update users cache:",
          storageError
        );
      }

      /* =====================================================
         SUCCESS
      ===================================================== */

      setLoading(false);

      /*
        Hantar COMPLETE user ke App.jsx.

        Profile image masih available
        untuk session semasa.
      */

      onSignup(newUser);

    } catch (err) {
      console.error(
        "Signup error:",
        err
      );

      setError(
        "Unable to connect to Foundly server. Please make sure the backend is running."
      );

      setLoading(false);
    }
  };

  return (
    <main className="signup-page">

      {/* =================================================
          BACKGROUND GLOW
      ================================================= */}

      <div className="signup-glow signup-glow-one" />

      <div className="signup-glow signup-glow-two" />

      <div className="signup-glow signup-glow-three" />

      {/* =================================================
          FLOATING DECORATIONS
      ================================================= */}

      <div className="signup-float signup-heart-one">
        ♥
      </div>

      <div className="signup-float signup-heart-two">
        ♡
      </div>

      <div className="signup-float signup-star-one">
        ✦
      </div>

      <div className="signup-float signup-star-two">
        ★
      </div>

      <div className="signup-float signup-sparkle-one">
        ✧
      </div>

      <div className="signup-float signup-sparkle-two">
        ✨
      </div>

      {/* =================================================
          TOP HEADER
      ================================================= */}

      <header className="signup-topbar">

        <div className="signup-school-brand">

          <div className="signup-school-logo">

            <img
              src={schoolLogo}
              alt="SK Limbang"
            />

          </div>

          <div className="signup-school-text">

            <strong>
              SK LIMBANG
            </strong>

            <span>
              Lost & Found Community
            </span>

          </div>

        </div>

        <button
          type="button"
          className="signup-back-button"
          onClick={onGoLogin}
          disabled={loading}
        >

          <ArrowLeft size={18} />

          Back to Login

        </button>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="signup-main">

        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <section className="signup-introduction">

          <div className="signup-big-logo">

            <img
              src={debugGirlsLogo}
              alt="Debug Girls"
            />

          </div>

          <div className="signup-intro-label">

            <Sparkles size={18} />

            <span>
              JOIN OUR SCHOOL COMMUNITY
            </span>

            <Sparkles size={18} />

          </div>

          <h1>

            Create.

            <span>
              Connect.
            </span>

            <strong>
              Make a Difference.
            </strong>

          </h1>

          <p className="signup-description">

            Create your Foundly account and
            help lost items find their way home.

          </p>

          <div className="signup-heart-message">

            <Heart
              size={25}
              fill="currentColor"
            />

            <span>
              Find it. Report it. Return it.
            </span>

          </div>

          {/* BENEFITS */}

          <div className="signup-benefits">

            <div className="signup-benefit">

              <div className="signup-benefit-icon pink">

                <Heart
                  size={21}
                  fill="currentColor"
                />

              </div>

              <div>

                <strong>
                  Help Your School
                </strong>

                <span>
                  Help reunite lost items with
                  their rightful owners.
                </span>

              </div>

            </div>

            <div className="signup-benefit">

              <div className="signup-benefit-icon purple">

                <Star
                  size={21}
                  fill="currentColor"
                />

              </div>

              <div>

                <strong>
                  Start With 0 Points
                </strong>

                <span>
                  Earn +10 points for every
                  successful report.
                </span>

              </div>

            </div>

            <div className="signup-benefit">

              <div className="signup-benefit-icon blue">

                <CheckCircle2
                  size={21}
                />

              </div>

              <div>

                <strong>
                  School Community
                </strong>

                <span>
                  Built for students, teachers
                  and parents of SK Limbang.
                </span>

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            SIGNUP CARD
        ================================================= */}

        <section className="signup-card">

          {/* CARD TOP BRAND */}

          <div className="signup-card-brand">

            <div className="signup-foundly-title">

              Foundly<span>!</span>

            </div>

            <div className="signup-foundly-subtitle">

              The Lost & Found App

            </div>

          </div>

          {/* HEADING */}

          <div className="signup-card-heading">

            <span className="signup-welcome-label">

              ✦ CREATE YOUR ACCOUNT ✦

            </span>

            <h2>

              Join{" "}

              <strong>
                Foundly!
              </strong>

            </h2>

            <p>

              Create your school account
              and start helping your community.

            </p>

          </div>

          {/* FORM */}

          <form
            className="signup-form"
            onSubmit={handleSubmit}
          >

            {/* NAME */}

            <div className="signup-form-group">

              <label htmlFor="signup-name">

                Full Name

              </label>

              <div className="signup-input-wrapper">

                <User
                  size={20}
                  className="signup-input-icon"
                />

                <input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="Enter your full name"
                  autoComplete="name"
                  disabled={loading}
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="signup-form-group">

              <label htmlFor="signup-email">

                Delima Email

              </label>

              <div className="signup-input-wrapper">

                <Mail
                  size={20}
                  className="signup-input-icon"
                />

                <input
                  id="signup-email"
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

            {/* PASSWORD */}

            <div className="signup-form-group">

              <label htmlFor="signup-password">

                Password

              </label>

              <div className="signup-input-wrapper">

                <Lock
                  size={20}
                  className="signup-input-icon"
                />

                <input
                  id="signup-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Create a password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >

                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}

                </button>

              </div>

            </div>

            {/* CONFIRM PASSWORD */}

            <div className="signup-form-group">

              <label htmlFor="signup-confirm">

                Confirm Password

              </label>

              <div className="signup-input-wrapper">

                <Lock
                  size={20}
                  className="signup-input-icon"
                />

                <input
                  id="signup-confirm"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  disabled={loading}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >

                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}

                </button>

              </div>

            </div>

            {/* ERROR */}

            {error && (

              <div className="signup-error">

                <span>
                  !
                </span>

                <p>
                  {error}
                </p>

              </div>

            )}

            {/* STARTING POINTS */}

            <div className="signup-starting-points">

              <div className="starting-points-icon">

                <Star
                  size={20}
                  fill="currentColor"
                />

              </div>

              <div className="starting-points-text">

                <strong>
                  Starting Points
                </strong>

                <span>
                  New accounts start with
                  <b> 0 points</b>.
                </span>

              </div>

              <div className="zero-points">
                0
              </div>

            </div>

            {/* CREATE BUTTON */}

            <button
              type="submit"
              className="create-account-button"
              disabled={loading}
            >

              {loading ? (

                <>

                  <span className="signup-spinner" />

                  Creating Account...

                </>

              ) : (

                <>

                  Create My Account

                  <ArrowRight size={21} />

                </>

              )}

            </button>

          </form>

          {/* LOGIN */}

          <div className="already-account">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              onClick={onGoLogin}
              disabled={loading}
            >

              Back to Login

              <ArrowLeft size={16} />

            </button>

          </div>

          {/* CARD FOOTER */}

          <div className="signup-card-footer">

            <Heart
              size={16}
              fill="currentColor"
            />

            <span>
              Welcome to the Foundly community
            </span>

            <Sparkles size={16} />

          </div>

        </section>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="signup-footer">

        <div>

          <strong>
            Foundly<span>!</span>
          </strong>

          <small>
            The Lost & Found App
          </small>

        </div>

        <p>
          Made with ♥ by Debug Girls · SK Limbang
        </p>

      </footer>

    </main>
  );
}

export default Signup;