import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Camera,
  UserRound,
  Mail,
  Trophy,
  FileText,
  Search,
  Package,
  Heart,
  Sparkles,
  Save,
  CheckCircle2,
} from "lucide-react";

import "./Profile.css";
import API_URL from "../api";

/* =========================================================
   HELPERS
========================================================= */

function withCacheBust(url) {
  if (!url) return "";

  if (typeof url !== "string") {
    return url;
  }

  const separator = url.includes("?")
    ? "&"
    : "?";

  return `${url}${separator}v=${Date.now()}`;
}

/*
  Only keep lightweight HTTP image URLs in localStorage.

  NEVER store Base64 image data in localStorage.
*/
function getSafeImageUrl(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return "";
  }

  const cleanValue =
    value.trim();

  if (
    cleanValue.startsWith("http://") ||
    cleanValue.startsWith("https://")
  ) {
    return cleanValue;
  }

  return "";
}

/* =========================================================
   PROFILE
========================================================= */

function Profile({
  currentUser,
  onProfileUpdated,
  onBack,
}) {
  /* =====================================================
     USER DATA
  ===================================================== */

  const [name, setName] = useState(
    currentUser?.name ||
      currentUser?.fullName ||
      currentUser?.username ||
      ""
  );

  const email =
    currentUser?.email || "";

  const userEmail =
    email
      .trim()
      .toLowerCase();

  /* =====================================================
     PROFILE IMAGE
  ===================================================== */

  const [profileImage, setProfileImage] =
    useState(
      currentUser?.profileImage ||
        currentUser?.profile_image ||
        ""
    );

  /* =====================================================
     POINTS
  ===================================================== */

  const [points, setPoints] =
    useState(
      Number(
        currentUser?.points || 0
      )
    );

  /* =====================================================
     REPORTS
  ===================================================== */

  const [reports, setReports] =
    useState([]);

  /* =====================================================
     SAVE MESSAGE
  ===================================================== */

  const [saved, setSaved] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  /* =====================================================
     LOAD PROFILE DATA
  ===================================================== */

  useEffect(() => {
    let cancelled = false;

    const loadProfileData = async () => {
      /* -------------------------------------------------
         LOAD USER
      ------------------------------------------------- */

      try {
        const response = await fetch(
          `${API_URL}/api/users`
        );

        const data =
          await response.json();

        if (
          response.ok &&
          Array.isArray(data.users)
        ) {
          const serverUser =
            data.users.find(
              (user) =>
                user.email
                  ?.trim()
                  .toLowerCase() ===
                userEmail
            );

          if (
            serverUser &&
            !cancelled
          ) {
            const serverName =
              serverUser.name ||
              currentUser?.name ||
              "";

            const serverProfileImage =
              serverUser.profileImage ||
              serverUser.profile_image ||
              "";

            const freshProfileImage =
              serverProfileImage
                ? withCacheBust(
                    serverProfileImage
                  )
                : "";

            const serverPoints =
              Number(
                serverUser.points || 0
              );

            setName(
              serverName
            );

            setProfileImage(
              freshProfileImage
            );

            setPoints(
              serverPoints
            );

            /*
              Keep localStorage lightweight.

              Store URL only if it is an HTTP URL.
              Never store Base64.
            */
            saveSafeUserLocally({
              ...(currentUser || {}),
              id:
                serverUser.id ||
                currentUser?.id ||
                null,

              name:
                serverName,

              email:
                serverUser.email ||
                currentUser?.email ||
                "",

              points:
                serverPoints,

              profileImage:
                serverProfileImage,

              profile_image:
                serverProfileImage,

              reports:
                reports.length,

              created_at:
                serverUser.created_at ||
                currentUser?.created_at ||
                null,

              createdAt:
                serverUser.createdAt ||
                serverUser.created_at ||
                currentUser?.createdAt ||
                null,
            });
          }
        }
      } catch (error) {
        console.error(
          "Unable to load profile from Supabase:",
          error
        );

        if (!cancelled) {
          const storedPoints =
            userEmail
              ? localStorage.getItem(
                  `foundlyPoints_${userEmail}`
                )
              : null;

          setPoints(
            storedPoints !== null
              ? Number(
                  storedPoints
                ) || 0
              : Number(
                  currentUser?.points
                ) || 0
          );

          const fallbackImage =
            currentUser?.profileImage ||
            currentUser?.profile_image ||
            "";

          setProfileImage(
            fallbackImage
          );
        }
      }

      /* -------------------------------------------------
         LOAD REPORTS
      ------------------------------------------------- */

      try {
        const response = await fetch(
          `${API_URL}/api/reports`
        );

        const data =
          await response.json();

        if (
          response.ok &&
          Array.isArray(
            data.reports
          ) &&
          !cancelled
        ) {
          const userReports =
            data.reports.filter(
              (report) =>
                (
                  report.reportedBy ||
                  report.reported_by ||
                  ""
                )
                  .trim()
                  .toLowerCase() ===
                userEmail
            );

          setReports(
            userReports
          );
        }
      } catch (error) {
        console.error(
          "Unable to load reports from Supabase:",
          error
        );

        try {
          const savedReports =
            JSON.parse(
              localStorage.getItem(
                "foundlyReports"
              ) || "[]"
            );

          if (!cancelled) {
            setReports(
              Array.isArray(
                savedReports
              )
                ? savedReports.filter(
                    (report) =>
                      (
                        report.reportedBy ||
                        ""
                      )
                        .trim()
                        .toLowerCase() ===
                      userEmail
                  )
                : []
            );
          }
        } catch {
          if (!cancelled) {
            setReports([]);
          }
        }
      }
    };

    loadProfileData();

    return () => {
      cancelled = true;
    };
  }, [
    userEmail,
    currentUser,
  ]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalReports =
    reports.length;

  const lostReports =
    reports.filter(
      (report) =>
        report.type ===
        "lost"
    ).length;

  const foundReports =
    reports.filter(
      (report) =>
        report.type ===
        "found"
    ).length;

  const reunitedReports =
    reports.filter(
      (report) =>
        report.status ===
          "resolved" ||
        report.status ===
          "Resolved"
    ).length;

  /* =====================================================
     IMAGE COMPRESSION
  ===================================================== */

  const compressImage = (
    file,
    maxWidth = 1280,
    maxHeight = 1280,
    maxBytes = 500 * 1024
  ) => {
    return new Promise(
      (resolve, reject) => {
        const objectUrl =
          URL.createObjectURL(
            file
          );

        const img =
          new Image();

        img.onload = () => {
          try {
            let width =
              img.naturalWidth;

            let height =
              img.naturalHeight;

            const initialScale =
              Math.min(
                1,
                maxWidth /
                  width,
                maxHeight /
                  height
              );

            width =
              Math.max(
                1,
                Math.round(
                  width *
                    initialScale
                )
              );

            height =
              Math.max(
                1,
                Math.round(
                  height *
                    initialScale
                )
              );

            let result =
              "";

            let quality =
              0.78;

            /*
              First stage:
              reduce JPEG quality.
            */
            for (
              let attempt = 0;
              attempt < 30;
              attempt += 1
            ) {
              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const ctx =
                canvas.getContext(
                  "2d"
                );

              if (!ctx) {
                URL.revokeObjectURL(
                  objectUrl
                );

                reject(
                  new Error(
                    "Unable to process this image."
                  )
                );

                return;
              }

              /*
                White background ensures
                transparent images render correctly.
              */
              ctx.fillStyle =
                "#ffffff";

              ctx.fillRect(
                0,
                0,
                width,
                height
              );

              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );

              result =
                canvas.toDataURL(
                  "image/jpeg",
                  quality
                );

              /*
                Base64 length is approximately
                4/3 of the underlying binary size.
              */
              const estimatedBytes =
                Math.floor(
                  result.length *
                    0.75
                );

              if (
                estimatedBytes <=
                maxBytes
              ) {
                URL.revokeObjectURL(
                  objectUrl
                );

                resolve(
                  result
                );

                return;
              }

              if (
                quality >
                0.38
              ) {
                quality -=
                  0.06;

                continue;
              }

              width =
                Math.max(
                  320,
                  Math.round(
                    width *
                      0.82
                  )
                );

              height =
                Math.max(
                  240,
                  Math.round(
                    height *
                      0.82
                  )
                );

              quality =
                0.68;
            }

            /*
              Second stage:
              continue reducing dimensions
              until below 500 KB.
            */
            while (true) {
              const canvas =
                document.createElement(
                  "canvas"
                );

              canvas.width =
                width;

              canvas.height =
                height;

              const ctx =
                canvas.getContext(
                  "2d"
                );

              if (!ctx) {
                URL.revokeObjectURL(
                  objectUrl
                );

                reject(
                  new Error(
                    "Unable to process this image."
                  )
                );

                return;
              }

              ctx.fillStyle =
                "#ffffff";

              ctx.fillRect(
                0,
                0,
                width,
                height
              );

              ctx.drawImage(
                img,
                0,
                0,
                width,
                height
              );

              result =
                canvas.toDataURL(
                  "image/jpeg",
                  0.5
                );

              const estimatedBytes =
                Math.floor(
                  result.length *
                    0.75
                );

              if (
                estimatedBytes <=
                maxBytes
              ) {
                URL.revokeObjectURL(
                  objectUrl
                );

                resolve(
                  result
                );

                return;
              }

              const nextWidth =
                Math.max(
                  240,
                  Math.floor(
                    width *
                      0.82
                  )
                );

              const nextHeight =
                Math.max(
                  180,
                  Math.floor(
                    height *
                      0.82
                  )
                );

              if (
                nextWidth ===
                  width &&
                nextHeight ===
                  height
              ) {
                URL.revokeObjectURL(
                  objectUrl
                );

                reject(
                  new Error(
                    "Unable to compress this image below 500 KB. Please choose another photo."
                  )
                );

                return;
              }

              width =
                nextWidth;

              height =
                nextHeight;
            }
          } catch (
            compressionError
          ) {
            URL.revokeObjectURL(
              objectUrl
            );

            reject(
              compressionError
            );
          }
        };

        img.onerror = () => {
          URL.revokeObjectURL(
            objectUrl
          );

          reject(
            new Error(
              "Unable to read this image. Please try another photo."
            )
          );
        };

        img.src =
          objectUrl;
      }
    );
  };

  /* =====================================================
     SAVE LIGHTWEIGHT USER LOCALLY

     IMPORTANT:
     - No Base64 image
     - HTTP image URL is allowed
  ===================================================== */

  const saveSafeUserLocally = (
    user
  ) => {
    if (!user) return;

    const safeImage =
      getSafeImageUrl(
        user.profileImage ||
          user.profile_image ||
          ""
      );

    const safeUser = {
      id:
        user.id ||
        null,

      name:
        user.name ||
        user.fullName ||
        user.username ||
        "",

      email:
        user.email ||
        "",

      points:
        Number(
          user.points || 0
        ),

      created_at:
        user.created_at ||
        null,

      createdAt:
        user.createdAt ||
        user.created_at ||
        null,

      reports:
        Number(
          user.reports || 0
        ),

      /*
        Only save a URL.
        Base64 is explicitly rejected.
      */
      ...(safeImage
        ? {
            profileImage:
              safeImage,
            profile_image:
              safeImage,
          }
        : {}),
    };

    const cleanEmail =
      safeUser.email
        .trim()
        .toLowerCase();

    /* -------------------------------------------------
       CURRENT USER
    ------------------------------------------------- */

    try {
      localStorage.setItem(
        "foundlyCurrentUser",
        JSON.stringify(
          safeUser
        )
      );
    } catch (error) {
      console.warn(
        "Unable to save current user locally:",
        error
      );

      try {
        localStorage.removeItem(
          "foundlyCurrentUser"
        );
      } catch {
        // Ignore
      }
    }

    /* -------------------------------------------------
       POINTS
    ------------------------------------------------- */

    try {
      if (cleanEmail) {
        localStorage.setItem(
          `foundlyPoints_${cleanEmail}`,
          String(
            safeUser.points
          )
        );
      }

      localStorage.setItem(
        "foundlyPoints",
        String(
          safeUser.points
        )
      );
    } catch (error) {
      console.warn(
        "Unable to save points locally:",
        error
      );
    }

    /* -------------------------------------------------
       USERS CACHE
    ------------------------------------------------- */

    try {
      let users = [];

      try {
        users =
          JSON.parse(
            localStorage.getItem(
              "foundlyUsers"
            ) || "[]"
          );
      } catch {
        users = [];
      }

      if (
        !Array.isArray(
          users
        )
      ) {
        users = [];
      }

      const lightweightUsers =
        users
          .filter(Boolean)
          .map((item) => {
            const itemImage =
              getSafeImageUrl(
                item.profileImage ||
                  item.profile_image ||
                  ""
              );

            return {
              id:
                item.id ||
                null,

              name:
                item.name ||
                item.fullName ||
                item.username ||
                "",

              email:
                item.email ||
                "",

              points:
                Number(
                  item.points || 0
                ),

              created_at:
                item.created_at ||
                null,

              createdAt:
                item.createdAt ||
                item.created_at ||
                null,

              reports:
                Number(
                  item.reports || 0
                ),

              ...(itemImage
                ? {
                    profileImage:
                      itemImage,
                    profile_image:
                      itemImage,
                  }
                : {}),
            };
          })
          .filter(
            (item) =>
              item.email
                .trim()
                .toLowerCase() !==
              cleanEmail
          );

      if (cleanEmail) {
        lightweightUsers.push(
          safeUser
        );
      }

      localStorage.setItem(
        "foundlyUsers",
        JSON.stringify(
          lightweightUsers
        )
      );
    } catch (error) {
      console.warn(
        "Unable to save users locally:",
        error
      );

      try {
        localStorage.removeItem(
          "foundlyUsers"
        );
      } catch {
        // Ignore
      }
    }
  };

  /* =====================================================
     INITIAL LOCAL CLEANUP

     Keeps old Base64 data out of localStorage.
  ===================================================== */

  useEffect(() => {
    saveSafeUserLocally(
      currentUser
    );

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =====================================================
     IMAGE UPLOAD
  ===================================================== */

  const handleImageChange =
    async (event) => {
      const file =
        event.target.files?.[0];

      if (!file) {
        return;
      }

      if (
        !file.type.startsWith(
          "image/"
        )
      ) {
        alert(
          "Please select an image file."
        );

        event.target.value =
          "";

        return;
      }

      /*
        Allow large phone photos temporarily.
        They will be compressed before upload.
      */
      if (
        file.size >
        15 * 1024 * 1024
      ) {
        alert(
          "Please choose an image smaller than 15MB."
        );

        event.target.value =
          "";

        return;
      }

      setSaved(false);

      try {
        const compressedImage =
          await compressImage(
            file
          );

        /*
          Extra client-side safety.
        */
        const estimatedBytes =
          Math.floor(
            compressedImage.length *
              0.75
          );

        if (
          estimatedBytes >
          500 * 1024
        ) {
          throw new Error(
            "Unable to compress this image below 500 KB. Please choose another photo."
          );
        }

        /*
          Display compressed image immediately.
        */
        setProfileImage(
          compressedImage
        );
      } catch (error) {
        console.error(
          "Profile image compression error:",
          error
        );

        setProfileImage("");

        alert(
          error?.message ||
            "Unable to process this image. Please try another photo."
        );
      } finally {
        event.target.value =
          "";
      }
    };

  /* =====================================================
     REMOVE IMAGE
  ===================================================== */

  const removeImage = () => {
    setProfileImage("");

    setSaved(false);
  };

  /* =====================================================
     SAVE PROFILE
  ===================================================== */

  const handleSaveProfile =
    async () => {
      const trimmedName =
        name.trim();

      if (!trimmedName) {
        alert(
          "Please enter your name."
        );

        return;
      }

      if (!currentUser?.id) {
        alert(
          "Your login session has expired. Please login again."
        );

        return;
      }

      /*
        If profileImage is Base64,
        it is allowed here because it is
        being sent to the backend.

        It is NEVER stored directly in localStorage.
      */
      const imageToSave =
        profileImage || "";

      setSaving(true);
      setSaved(false);

      try {
        const response =
          await fetch(
            `${API_URL}/api/users/${currentUser.id}/profile`,
            {
              method:
                "PATCH",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  name:
                    trimmedName,

                  profileImage:
                    imageToSave,
                }),
            }
          );

        let data = {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (
          !response.ok
        ) {
          throw new Error(
            data.message ||
              "Unable to save your profile."
          );
        }

        const serverUser =
          data.user || {};

        /*
          Backend now returns the
          lightweight profile image URL.
        */
        const savedProfileImage =
          serverUser.profileImage ||
          serverUser.profile_image ||
          "";

        const cleanImageUrl =
          getSafeImageUrl(
            savedProfileImage
          );

        const displayProfileImage =
          cleanImageUrl
            ? withCacheBust(
                cleanImageUrl
              )
            : "";

        const updatedCurrentUser =
          {
            ...(currentUser || {}),

            id:
              serverUser.id ||
              currentUser.id,

            name:
              serverUser.name ||
              trimmedName,

            email:
              serverUser.email ||
              userEmail,

            points:
              Number(
                serverUser.points ??
                  points
              ),

            profileImage:
              displayProfileImage,

            profile_image:
              displayProfileImage,

            reports:
              totalReports,
          };

        /*
          Save only lightweight information.
          Base64 is NOT saved here.
        */
        saveSafeUserLocally(
          updatedCurrentUser
        );

        /*
          IMPORTANT:
          Tell App.jsx immediately that
          the user data changed.

          App.jsx already has
          handleProfileUpdated().
        */
        if (
          typeof onProfileUpdated ===
          "function"
        ) {
          onProfileUpdated(
            updatedCurrentUser
          );
        }

        setName(
          trimmedName
        );

        setProfileImage(
          displayProfileImage
        );

        setPoints(
          Number(
            updatedCurrentUser.points ||
              0
          )
        );

        setSaved(true);

        /*
          Also notify other components/tabs.
        */
        window.dispatchEvent(
          new CustomEvent(
            "foundly-profile-updated",
            {
              detail:
                updatedCurrentUser,
            }
          )
        );

        setTimeout(() => {
          setSaved(false);
        }, 3000);
      } catch (error) {
        console.error(
          "Save profile error:",
          error
        );

        alert(
          error?.message ||
            "Unable to save your profile. Please try again."
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     INITIAL
  ===================================================== */

  const initial =
    name
      ?.charAt(0)
      ?.toUpperCase() ||
    "F";

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="profile-page">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="profile-glow profile-glow-one" />

      <div className="profile-glow profile-glow-two" />

      <div className="profile-floating profile-heart">
        ♥
      </div>

      <div className="profile-floating profile-star">
        ✦
      </div>

      <div className="profile-floating profile-sparkle">
        ✨
      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="profile-header">

        <button
          type="button"
          className="profile-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={19} />

          Back to Dashboard
        </button>

        <div className="profile-header-title">
          <UserRound size={19} />

          MY PROFILE
        </div>

      </header>

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="profile-main">

        {/* =================================================
            INTRO
        ================================================= */}

        <section className="profile-intro">

          <span>
            ✦ YOUR FOUNDLY SPACE
          </span>

          <h1>
            My Profile
            <strong> ♥</strong>
          </h1>

          <p>
            Manage your profile and see your
            Foundly contribution.
          </p>

        </section>

        {/* =================================================
            PROFILE CARD
        ================================================= */}

        <section className="profile-card">

          {/* =================================================
              PROFILE PHOTO
          ================================================= */}

          <div className="profile-photo-section">

            <div className="profile-photo-wrapper">

              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-default">
                  {initial}
                </div>
              )}

              <label
                htmlFor="profile-photo-upload"
                className="profile-camera-button"
                title="Upload profile picture"
              >
                <Camera size={18} />
              </label>

              <input
                id="profile-photo-upload"
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={
                  handleImageChange
                }
                disabled={saving}
                hidden
              />

            </div>

            <div className="profile-photo-text">

              <strong>
                Profile Picture
              </strong>

              <span>
                Upload a photo so your classmates
                can recognise you on the leaderboard.
                Large photos are automatically compressed
                to about 500 KB.
              </span>

              {profileImage && (
                <button
                  type="button"
                  className="remove-photo-button"
                  onClick={
                    removeImage
                  }
                  disabled={saving}
                >
                  Remove photo
                </button>
              )}

            </div>

          </div>

          {/* =================================================
              PERSONAL INFORMATION
          ================================================= */}

          <div className="profile-section">

            <div className="profile-section-heading">

              <div className="profile-section-icon">
                <UserRound size={20} />
              </div>

              <div>

                <strong>
                  Personal Information
                </strong>

                <span>
                  Keep your Foundly profile up to date.
                </span>

              </div>

            </div>

            {/* NAME */}

            <div className="profile-field">

              <label>
                Name
              </label>

              <div className="profile-input-wrapper">

                <UserRound size={18} />

                <input
                  type="text"
                  value={name}
                  disabled={saving}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Enter your name"
                />

              </div>

            </div>

            {/* EMAIL */}

            <div className="profile-field">

              <label>
                Delima Email
              </label>

              <div className="profile-input-wrapper disabled">

                <Mail size={18} />

                <input
                  type="email"
                  value={email}
                  disabled
                  readOnly
                />

                <span className="verified-badge">

                  <CheckCircle2
                    size={14}
                  />

                  Verified

                </span>

              </div>

              <small>
                Your Delima email is used to identify
                your Foundly account.
              </small>

            </div>

          </div>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <div className="profile-section">

            <div className="profile-section-heading">

              <div className="profile-section-icon">

                <Trophy size={20} />

              </div>

              <div>

                <strong>
                  My Foundly Statistics
                </strong>

                <span>
                  Your contribution to the school community.
                </span>

              </div>

            </div>

            <div className="profile-stats">

              {/* POINTS */}

              <div className="profile-stat pink-stat">

                <div className="profile-stat-icon">

                  <Trophy size={22} />

                </div>

                <strong>
                  {points}
                </strong>

                <span>
                  TOTAL POINTS
                </span>

              </div>

              {/* REPORTS */}

              <div className="profile-stat purple-stat">

                <div className="profile-stat-icon">

                  <FileText size={22} />

                </div>

                <strong>
                  {totalReports}
                </strong>

                <span>
                  TOTAL REPORTS
                </span>

              </div>

              {/* LOST */}

              <div className="profile-stat pink-stat">

                <div className="profile-stat-icon">

                  <Search size={22} />

                </div>

                <strong>
                  {lostReports}
                </strong>

                <span>
                  LOST REPORTS
                </span>

              </div>

              {/* FOUND */}

              <div className="profile-stat purple-stat">

                <div className="profile-stat-icon">

                  <Package size={22} />

                </div>

                <strong>
                  {foundReports}
                </strong>

                <span>
                  FOUND REPORTS
                </span>

              </div>

              {/* REUNITED */}

              <div className="profile-stat reunited-stat">

                <div className="profile-stat-icon">

                  <Heart
                    size={22}
                    fill="currentColor"
                  />

                </div>

                <strong>
                  {reunitedReports}
                </strong>

                <span>
                  ITEMS REUNITED
                </span>

              </div>

            </div>

          </div>

          {/* =================================================
              LEADERBOARD INFO
          ================================================= */}

          <div className="profile-leaderboard-note">

            <div className="profile-note-icon">
              ✨
            </div>

            <div>

              <strong>
                Your profile picture appears on the leaderboard
              </strong>

              <span>
                Upload your photo and save your profile.
                Your picture will be used automatically
                throughout Foundly.
              </span>

            </div>

            <Trophy size={24} />

          </div>

          {/* =================================================
              SAVE
          ================================================= */}

          <div className="profile-actions">

            {saved && (

              <div className="profile-saved">

                <CheckCircle2 size={17} />

                Profile saved successfully!

              </div>

            )}

            <button
              type="button"
              className="profile-save-button"
              onClick={
                handleSaveProfile
              }
              disabled={saving}
            >

              <Save size={18} />

              {saving
                ? "Saving..."
                : "Save Profile"}

              <Sparkles size={17} />

            </button>

          </div>

        </section>

      </main>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="profile-footer">

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

export default Profile;