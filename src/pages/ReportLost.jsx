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
     IMAGE COMPRESSION
     ===================================================== */

  const compressImage = (
    file,
    maxWidth = 1280,
    maxHeight = 1280,
    maxBytes = 500 * 1024
  ) => {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        try {
          let width = img.naturalWidth;
          let height = img.naturalHeight;

          const initialScale = Math.min(
            1,
            maxWidth / width,
            maxHeight / height
          );

          width = Math.max(1, Math.round(width * initialScale));
          height = Math.max(1, Math.round(height * initialScale));

          let result = "";
          let quality = 0.78;

          /*
            Keep reducing quality first.
            Then reduce dimensions until the estimated binary
            JPEG size is safely at or below 500 KB.
          */
          for (let attempt = 0; attempt < 30; attempt += 1) {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
              URL.revokeObjectURL(objectUrl);
              reject(new Error("Unable to process this image."));
              return;
            }

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);

            ctx.drawImage(img, 0, 0, width, height);

            result = canvas.toDataURL("image/jpeg", quality);

            const estimatedBytes = Math.floor(result.length * 0.75);

            if (estimatedBytes <= maxBytes) {
              URL.revokeObjectURL(objectUrl);
              resolve(result);
              return;
            }

            /*
              Lower quality first.
            */
            if (quality > 0.38) {
              quality -= 0.06;
              continue;
            }

            /*
              Quality is already low enough.
              Shrink dimensions and restart with a reasonable quality.
            */
            width = Math.max(320, Math.round(width * 0.82));
            height = Math.max(240, Math.round(height * 0.82));
            quality = 0.68;
          }

          /*
            Final safety loop.
            Keep shrinking until the hard target is reached.
          */
          while (true) {
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
              URL.revokeObjectURL(objectUrl);
              reject(new Error("Unable to process this image."));
              return;
            }

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);

            result = canvas.toDataURL("image/jpeg", 0.5);

            const estimatedBytes = Math.floor(result.length * 0.75);

            if (estimatedBytes <= maxBytes) {
              URL.revokeObjectURL(objectUrl);
              resolve(result);
              return;
            }

            const nextWidth = Math.max(240, Math.floor(width * 0.82));
            const nextHeight = Math.max(180, Math.floor(height * 0.82));

            if (
              nextWidth === width &&
              nextHeight === height
            ) {
              URL.revokeObjectURL(objectUrl);
              reject(
                new Error(
                  "Unable to compress this image below 500 KB. Please choose another photo."
                )
              );
              return;
            }

            width = nextWidth;
            height = nextHeight;
          }
        } catch (compressionError) {
          URL.revokeObjectURL(objectUrl);
          reject(compressionError);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(
          new Error(
            "Unable to read this image. Please try another photo."
          )
        );
      };

      img.src = objectUrl;
    });
  };

  /* =====================================================
     IMAGE
     ===================================================== */

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    /*
      Allow larger phone/iPad photos.
      The image will be compressed automatically before upload.
    */
    if (file.size > 15 * 1024 * 1024) {
      setError(
        "Image is too large. Please choose an image below 15MB."
      );
      return;
    }

    setError("");

    try {
      const compressedImage = await compressImage(file);

      setImage(compressedImage);
      setError("");
    } catch (compressionError) {
      console.error(
        "Image compression error:",
        compressionError
      );

      setImage(null);

      setError(
        compressionError?.message ||
          "Unable to process this image. Please try another photo."
      );
    }
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
                  PNG, JPG or JPEG · Max 15MB
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
