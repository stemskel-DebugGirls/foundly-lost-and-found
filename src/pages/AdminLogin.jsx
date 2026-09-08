import { useState } from "react";

import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Heart,
} from "lucide-react";

import "./AdminLogin.css";


function AdminLogin({
  onAdminLogin,
  onBack,
}) {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  /* =====================================================
     ADMIN CREDENTIALS
  ===================================================== */

  const ADMIN_EMAIL =
    "admin@foundly.edu.my";

  const ADMIN_PASSWORD =
    "foundlyadmin";


  /* =====================================================
     LOGIN
  ===================================================== */

  const handleSubmit = (event) => {

    event.preventDefault();

    setError("");

    const cleanEmail =
      email.trim().toLowerCase();


    if (!cleanEmail) {

      setError(
        "Please enter the admin email."
      );

      return;

    }


    if (!password) {

      setError(
        "Please enter the admin password."
      );

      return;

    }


    setLoading(true);


    setTimeout(() => {

      if (
        cleanEmail !== ADMIN_EMAIL ||
        password !== ADMIN_PASSWORD
      ) {

        setError(
          "Incorrect admin email or password."
        );

        setLoading(false);

        return;

      }


      const adminUser = {

        id:
          "admin-001",

        name:
          "Foundly Admin",

        email:
          ADMIN_EMAIL,

        role:
          "admin",

        loggedInAt:
          new Date().toISOString(),

      };


      localStorage.setItem(
        "foundlyAdmin",
        JSON.stringify(
          adminUser
        )
      );


      setLoading(false);


      if (onAdminLogin) {

        onAdminLogin(
          adminUser
        );

      }

    }, 500);

  };


  return (

    <div className="admin-login-page">


      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="admin-login-glow admin-glow-one" />

      <div className="admin-login-glow admin-glow-two" />


      <div className="admin-floating admin-float-one">
        ✦
      </div>

      <div className="admin-floating admin-float-two">
        ♥
      </div>

      <div className="admin-floating admin-float-three">
        ✧
      </div>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="admin-login-main">


        <section className="admin-login-card">


          {/* =================================================
              ICON
          ================================================= */}

          <div className="admin-login-icon">

            <ShieldCheck
              size={42}
            />

          </div>


          {/* =================================================
              HEADING
          ================================================= */}

          <div className="admin-login-heading">


            <span>
              ✦ FOUNDLY ADMIN ✦
            </span>


            <h1>
              Admin Login
            </h1>


            <p>
              Manage the Foundly school community
              from one secure dashboard.
            </p>


          </div>


          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="admin-login-form"
            onSubmit={
              handleSubmit
            }
          >


            {/* EMAIL */}

            <div className="admin-login-field">


              <label>
                Admin Email
              </label>


              <div className="admin-input-wrapper">


                <Mail
                  size={19}
                  className="admin-input-icon"
                />


                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="admin@foundly.edu.my"
                  autoComplete="username"
                />


              </div>


            </div>


            {/* PASSWORD */}

            <div className="admin-login-field">


              <label>
                Password
              </label>


              <div className="admin-input-wrapper">


                <Lock
                  size={19}
                  className="admin-input-icon"
                />


                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                />


                <button
                  type="button"
                  className="admin-password-toggle"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                >

                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}

                </button>


              </div>


            </div>


            {/* ERROR */}

            {error && (

              <div className="admin-login-error">

                <span>
                  !
                </span>

                <p>
                  {error}
                </p>

              </div>

            )}


            {/* SUBMIT */}

            <button
              type="submit"
              className="admin-login-submit"
              disabled={loading}
            >


              {loading ? (

                <>
                  <span className="admin-spinner" />
                  Signing in...
                </>

              ) : (

                <>
                  Sign in to Admin

                  <ArrowRight
                    size={20}
                  />

                </>

              )}


            </button>


          </form>


          {/* =================================================
              SECURITY NOTE
          ================================================= */}

          <div className="admin-security-note">


            <ShieldCheck
              size={18}
            />


            <div>

              <strong>
                Admin Access
              </strong>

              <span>
                This area is only for authorised
                Foundly administrators.
              </span>

            </div>


          </div>


          {/* =================================================
              BACK
          ================================================= */}

          <button
            type="button"
            className="admin-back-button"
            onClick={onBack}
          >

            <ArrowRight
              size={16}
              className="admin-back-arrow"
            />

            Back to Foundly Login

          </button>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="admin-login-footer">

            <strong>
              Foundly<span>!</span>
            </strong>

            <span>
              Made with
              {" "}
              <Heart
                size={12}
                fill="currentColor"
              />
              {" "}
              by Debug Girls
            </span>


            <Sparkles
              size={15}
            />

          </div>


        </section>


      </main>


    </div>

  );

}


export default AdminLogin;
