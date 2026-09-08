import { useState } from "react";

import API_URL from "../api";

import {
  ArrowLeft,
  ArrowRight,
  Search,
  Upload,
  MapPin,
  CalendarDays,
  Clock,
  Phone,
  FileText,
  Heart,
  Sparkles,
  X,
} from "lucide-react";

import "./ReportLost.css";

function ReportLost({ onBack, onSuccess }) {
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* =====================================================
     IMAGE
  ===================================================== */

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        "Image is too large. Please choose an image below 5MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setImage(reader.result);
      setError("");
    };

    reader.onerror = () => {
      setError(
        "Unable to read this image. Please try another photo."
      );
    };

    reader.readAsDataURL(file);
  };

  /* =====================================================
     REMOVE IMAGE
  ===================================================== */

  const removeImage = () => {
    setImage(null);
  };

  /* =====================================================
     GET CURRENT USER
  ===================================================== */

  const getCurrentUser = () => {
    try {
      const storedUser = JSON.parse(
        localStorage.getItem("foundlyCurrentUser") || "null"
      );

      return storedUser;
    } catch (error) {
      console.error(
        "Unable to read current user:",
        error
      );

      return null;
    }
  };

  /* =====================================================
     UPDATE LOCAL USER CACHE
  ===================================================== */

  const updateLocalUserCache = (updatedCurrentUser) => {
    try {
      let savedUsers = JSON.parse(
        localStorage.getItem("foundlyUsers") || "[]"
      );

      if (!Array.isArray(savedUsers)) {
        savedUsers = [];
      }

      const userEmail = (
        updatedCurrentUser.email || ""
      )
        .trim()
        .toLowerCase();

      let userFound = false;

      const updatedUsers = savedUsers.map((user) => {
        if (
          user?.email?.trim().toLowerCase() ===
          userEmail
        ) {
          userFound = true;

          return {
            ...user,
            ...updatedCurrentUser,
          };
        }

        return user;
      });

      if (!userFound && userEmail) {
        updatedUsers.push(updatedCurrentUser);
      }

      localStorage.setItem(
        "foundlyUsers",
        JSON.stringify(updatedUsers)
      );
    } catch (error) {
      console.error(
        "Unable to update local user cache:",
        error
      );
    }
  };

  /* =====================================================
     SAVE LOCAL REPORT CACHE
  ===================================================== */

  const saveLocalReport = (newReport) => {
    try {
      let existingReports = JSON.parse(
        localStorage.getItem("foundlyReports") || "[]"
      );

      if (!Array.isArray(existingReports)) {
        existingReports = [];
      }

      const reportId = String(newReport.id || "");

      const filteredReports = existingReports.filter(
        (report) => {
          if (!reportId) return true;

          return String(report?.id || "") !== reportId;
        }
      );

      localStorage.setItem(
        "foundlyReports",
        JSON.stringify([
          ...filteredReports,
          newReport,
        ])
      );
    } catch (error) {
      console.error(
        "Unable to save local report:",
        error
      );
    }
  };

  /* =====================================================
     SUBMIT
  ===================================================== */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (submitting) {
      return;
    }

    /* ================================================
       VALIDATION
    ================================================= */

    if (!itemName.trim()) {
      setError(
        "Please enter the name of the lost item."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Please describe the lost item."
      );
      return;
    }

    if (!location.trim()) {
      setError(
        "Please enter where the item was lost."
      );
      return;
    }

    if (!date) {
      setError(
        "Please select the date the item was lost."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        "Please enter your contact number."
      );
      return;
    }

    /* ================================================
       CURRENT USER
    ================================================= */

    const currentUser = getCurrentUser();

    if (!currentUser?.id) {
      setError(
        "Your login session has expired. Please login again."
      );
      return;
    }

    setSubmitting(true);

    try {
      /* ==============================================
         SEND TO BACKEND
      ============================================== */

      const response = await fetch(
        `${API_URL}/api/reports/lost`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            userId: currentUser.id,

            userEmail:
              currentUser.email || "",

            itemName:
              itemName.trim(),

            description:
              description.trim(),

            location:
              location.trim(),

            date,

            time:
              time || "",

            phone:
              phone.trim(),

            image:
              image || null,
          }),
        }
      );

      /* ==============================================
         READ RESPONSE
      ============================================== */

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      /* ==============================================
         BACKEND ERROR
      ============================================== */

      if (!response.ok) {
        setError(
          data.message ||
            "Unable to submit your report. Please try again."
        );

        setSubmitting(false);
        return;
      }

      /* ==============================================
         USER FROM SERVER
      ============================================== */

      const serverUser = data.user || {};

      const serverPoints =
        serverUser.points !== undefined &&
        serverUser.points !== null
          ? Number(serverUser.points)
          : Number(currentUser.points || 0) + 10;

      const serverReports =
        serverUser.reports !== undefined &&
        serverUser.reports !== null
          ? Number(serverUser.reports)
          : Number(currentUser.reports || 0) + 1;

      const updatedCurrentUser = {
        ...currentUser,

        id:
          serverUser.id ??
          currentUser.id,

        name:
          serverUser.name ??
          serverUser.fullName ??
          currentUser.name ??
          "Foundly Member",

        email:
          serverUser.email ??
          currentUser.email,

        points:
          serverPoints,

        profile_image:
          serverUser.profile_image ??
          serverUser.profileImage ??
          currentUser.profile_image ??
          currentUser.profileImage ??
          null,

        profileImage:
          serverUser.profileImage ??
          serverUser.profile_image ??
          currentUser.profileImage ??
          currentUser.profile_image ??
          null,

        created_at:
          serverUser.created_at ??
          currentUser.created_at ??
          null,

        reports:
          serverReports,

        createdAt:
          serverUser.createdAt ??
          serverUser.created_at ??
          currentUser.createdAt ??
          currentUser.created_at ??
          null,
      };

      /* ==============================================
         UPDATE CURRENT USER
      ============================================== */

      localStorage.setItem(
        "foundlyCurrentUser",
        JSON.stringify(updatedCurrentUser)
      );

      /* ==============================================
         UPDATE POINTS CACHE
      ============================================== */

      const userEmail = (
        updatedCurrentUser.email || ""
      )
        .trim()
        .toLowerCase();

      if (userEmail) {
        localStorage.setItem(
          `foundlyPoints_${userEmail}`,
          String(updatedCurrentUser.points)
        );
      }

      localStorage.setItem(
        "foundlyPoints",
        String(updatedCurrentUser.points)
      );

      /* ==============================================
         REPORT FROM SERVER
      ============================================== */

      const savedReport =
        data.report || {};

      const newReport = {
        id:
          savedReport.id ||
          savedReport.reportId ||
          `lost-${Date.now()}`,

        type:
          savedReport.type ||
          "lost",

        itemName:
          savedReport.itemName ||
          savedReport.item_name ||
          itemName.trim(),

        description:
          savedReport.description ||
          description.trim(),

        location:
          savedReport.location ||
          location.trim(),

        date:
          savedReport.date ||
          date,

        time:
          savedReport.time ||
          time ||
          "",

        phone:
          savedReport.phone ||
          phone.trim(),

        image:
          savedReport.image ||
          savedReport.image_url ||
          image ||
          null,

        status:
          savedReport.status ||
          "active",

        reportedBy:
          savedReport.reportedBy ||
          savedReport.userEmail ||
          userEmail,

        reporterName:
          savedReport.reporterName ||
          savedReport.userName ||
          updatedCurrentUser.name ||
          "Foundly Member",

        userId:
          savedReport.userId ||
          savedReport.user_id ||
          updatedCurrentUser.id,

        createdAt:
          savedReport.createdAt ||
          savedReport.created_at ||
          new Date().toISOString(),
      };

      /* ==============================================
         SAVE LOCAL REPORT CACHE
      ============================================== */

      saveLocalReport(newReport);

      /* ==============================================
         UPDATE LOCAL USER CACHE
      ============================================== */

      updateLocalUserCache(
        updatedCurrentUser
      );

      /* ==============================================
         SUCCESS
      ============================================== */

      setSubmitting(false);

      if (onSuccess) {
        onSuccess({
          ...newReport,

          points:
            updatedCurrentUser.points,

          currentUser:
            updatedCurrentUser,
        });
      }
    } catch (err) {
      console.error(
        "Report Lost error:",
        err
      );

      setError(
        "Unable to connect to Foundly server. Please make sure the backend is running."
      );

      setSubmitting(false);
    }
  };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="report-lost-page">

      {/* BACKGROUND */}

      <div className="report-glow report-glow-one" />
      <div className="report-glow report-glow-two" />
      <div className="report-glow report-glow-three" />

      {/* FLOATING */}

      <div className="report-floating floating-one">
        ♥
      </div>

      <div className="report-floating floating-two">
        ✦
      </div>

      <div className="report-floating floating-three">
        ✧
      </div>

      <div className="report-floating floating-four">
        ♡
      </div>

      <div className="report-floating floating-five">
        ✨
      </div>

      {/* HEADER */}

      <header className="report-header">

        <button
          type="button"
          className="report-back-button"
          onClick={onBack}
          disabled={submitting}
        >
          <ArrowLeft size={19} />

          Back to Dashboard
        </button>

        <div className="report-header-title">

          <Search size={20} />

          <span>
            FOUNDLY REPORT
          </span>

        </div>

      </header>

      {/* MAIN */}

      <main className="report-main">

        {/* INTRO */}

        <section className="report-intro">

          <div className="report-intro-icon">

            <Search size={32} />

          </div>

          <div>

            <span className="report-label">
              I LOST SOMETHING
            </span>

            <h1>
              Help Me Find It!

              <span>
                ♥
              </span>
            </h1>

            <p>
              Tell our school community about
              the item you've lost.
            </p>

          </div>

        </section>

        {/* FORM */}

        <form
          className="report-card"
          onSubmit={handleSubmit}
        >

          {/* SECTION 01 */}

          <div className="report-section-heading">

            <div className="section-number">
              01
            </div>

            <div>

              <h2>
                Item Information
              </h2>

              <p>
                Tell us about the item you lost.
              </p>

            </div>

          </div>

          {/* ITEM NAME */}

          <div className="report-field">

            <label>
              Item Name
              <span>*</span>
            </label>

            <div className="report-input-wrapper">

              <Search
                size={19}
                className="report-input-icon"
              />

              <input
                type="text"
                placeholder="e.g. Black Water Bottle"
                value={itemName}
                onChange={(e) =>
                  setItemName(e.target.value)
                }
                disabled={submitting}
              />

            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="report-field">

            <label>
              Description
              <span>*</span>
            </label>

            <div className="report-input-wrapper">

              <FileText
                size={19}
                className="report-input-icon textarea-icon"
              />

              <textarea
                placeholder="Describe the colour, brand, size, special marks or anything that can help identify it..."
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                disabled={submitting}
              />

            </div>

          </div>

          {/* IMAGE */}

          <div className="report-field">

            <label>
              Item Photo
            </label>

            {!image ? (

              <label className="image-upload">

                <Upload size={27} />

                <strong>
                  Upload a photo
                </strong>

                <span>
                  PNG, JPG or JPEG · Max 5MB
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleImageChange}
                  disabled={submitting}
                />

              </label>

            ) : (

              <div className="uploaded-image">

                <img
                  src={image}
                  alt="Lost item preview"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="remove-image"
                  aria-label="Remove image"
                  disabled={submitting}
                >
                  <X size={17} />
                </button>

              </div>

            )}

          </div>

          {/* SECTION 02 */}

          <div className="report-section-heading second">

            <div className="section-number">
              02
            </div>

            <div>

              <h2>
                When & Where?
              </h2>

              <p>
                Help us narrow down where it was lost.
              </p>

            </div>

          </div>

          {/* LOCATION */}

          <div className="report-field">

            <label>
              Last Seen Location
              <span>*</span>
            </label>

            <div className="report-input-wrapper">

              <MapPin
                size={19}
                className="report-input-icon"
              />

              <input
                type="text"
                placeholder="e.g. Library, Canteen, Class 5A"
                value={location}
                onChange={(e) =>
                  setLocation(e.target.value)
                }
                disabled={submitting}
              />

            </div>

          </div>

          {/* DATE + TIME */}

          <div className="report-two-columns">

            <div className="report-field">

              <label>
                Date Lost
                <span>*</span>
              </label>

              <div className="report-input-wrapper">

                <CalendarDays
                  size={18}
                  className="report-input-icon"
                />

                <input
                  type="date"
                  value={date}
                  onChange={(e) =>
                    setDate(e.target.value)
                  }
                  className="report-date-input"
                  disabled={submitting}
                />

              </div>

            </div>

            <div className="report-field">

              <label>
                Approximate Time
              </label>

              <div className="report-input-wrapper">

                <Clock
                  size={18}
                  className="report-input-icon"
                />

                <input
                  type="time"
                  value={time}
                  onChange={(e) =>
                    setTime(e.target.value)
                  }
                  className="report-time-input"
                  disabled={submitting}
                />

              </div>

            </div>

          </div>

          {/* SECTION 03 */}

          <div className="report-section-heading second">

            <div className="section-number">
              03
            </div>

            <div>

              <h2>
                Contact Information
              </h2>

              <p>
                So the finder can contact you safely.
              </p>

            </div>

          </div>

          {/* PHONE */}

          <div className="report-field">

            <label>
              Contact Number
              <span>*</span>
            </label>

            <div className="report-input-wrapper">

              <Phone
                size={19}
                className="report-input-icon"
              />

              <input
                type="tel"
                placeholder="e.g. 01X-XXXXXXX"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                disabled={submitting}
              />

            </div>

          </div>

          {/* ERROR */}

          {error && (

            <div className="report-error">

              <span>
                !
              </span>

              {error}

            </div>

          )}

          {/* POINTS */}

          <div className="report-points">

            <div className="report-points-icon">

              <Heart
                size={20}
                fill="currentColor"
              />

            </div>

            <div>

              <strong>
                Earn +10 Points
              </strong>

              <span>
                Successfully submitting this report
                earns you 10 Foundly points.
              </span>

            </div>

            <Sparkles size={22} />

          </div>

          {/* ACTIONS */}

          <div className="report-actions">

            <button
              type="button"
              className="report-cancel"
              onClick={onBack}
              disabled={submitting}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="report-submit"
              disabled={submitting}
            >

              {submitting ? (

                <>
                  <span className="login-spinner" />

                  Submitting...
                </>

              ) : (

                <>
                  Submit Lost Report

                  <ArrowRight size={20} />

                </>

              )}

            </button>

          </div>

        </form>

      </main>

      {/* FOOTER */}

      <footer className="report-footer">

        <strong>
          Foundly<span>!</span>
        </strong>

        <span>
          Find it. Report it. Return it.
        </span>

        <span>
          Made with ♥ by Debug Girls · SK Limbang
        </span>

      </footer>

    </div>
  );
}

export default ReportLost;