import { useEffect, useState } from "react";
import API_URL from "../api";

import {
  ArrowLeft,
  MapPin,
  Clock,
  CalendarDays,
  CheckCircle2,
  Circle,
  FileText,
  X,
  Phone,
  Heart,
} from "lucide-react";

import "./MyReports.css";

function MyReports({ currentUser, onBack }) {
  /* =====================================================
     USER
  ===================================================== */

  const userEmail =
    currentUser?.email?.trim().toLowerCase() || "";

  const userId =
    currentUser?.id || "";

  const userName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Foundly Member";

  /* =====================================================
     REPORTS
  ===================================================== */

  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================================
     NORMALIZE REPORT
  ===================================================== */

  const normalizeReport = (report) => {
    if (!report) {
      return null;
    }

    return {
      id: report.id,

      userId:
        report.userId ||
        report.user_id ||
        "",

      type:
        report.type ||
        "lost",

      itemName:
        report.itemName ||
        report.item_name ||
        "Unnamed Item",

      description:
        report.description ||
        "",

      location:
        report.location ||
        "",

      date:
        report.date ||
        report.date_lost ||
        "",

      time:
        report.time ||
        report.time_lost ||
        "",

      phone:
        report.phone ||
        "",

      image:
        report.image ||
        null,

      status:
        report.status ||
        "active",

      reportedBy:
        report.reportedBy ||
        report.reported_by ||
        "",

      reporterName:
        report.reporterName ||
        report.reporter_name ||
        "",

      /* =================================================
         CLAIM INFORMATION
      ================================================= */

      claimedBy:
        report.claimedBy ||
        report.claimed_by ||
        "",

      claimedByName:
        report.claimedByName ||
        report.claimed_by_name ||
        "",

      claimedByEmail:
        report.claimedByEmail ||
        report.claimed_by_email ||
        "",

      /* =================================================
         RESOLVED
      ================================================= */

      resolvedAt:
        report.resolvedAt ||
        report.resolved_at ||
        "",

      createdAt:
        report.createdAt ||
        report.created_at ||
        null,
    };
  };

  /* =====================================================
     CHECK CURRENT USER
     
     Report dikira milik pengguna jika:
     1. Dia yang buat report
     2. Dia yang claim report
  ===================================================== */

  const belongsToCurrentUser = (report) => {
    const reportEmail =
      String(report.reportedBy || "")
        .trim()
        .toLowerCase();

    const reportUserId =
      String(report.userId || "")
        .trim();

    const claimedBy =
      String(report.claimedBy || "")
        .trim();

    const claimedByEmail =
      String(report.claimedByEmail || "")
        .trim()
        .toLowerCase();

    const claimedByName =
      String(report.claimedByName || "")
        .trim()
        .toLowerCase();

    const currentUserId =
      String(userId || "")
        .trim();

    const currentUserEmail =
      String(userEmail || "")
        .trim()
        .toLowerCase();

    const currentUserName =
      String(userName || "")
        .trim()
        .toLowerCase();

    /* =================================================
       1. USER YANG MEMBUAT REPORT
    ================================================= */

    if (
      currentUserId &&
      reportUserId &&
      reportUserId === currentUserId
    ) {
      return true;
    }

    if (
      currentUserEmail &&
      reportEmail &&
      reportEmail === currentUserEmail
    ) {
      return true;
    }

    /* =================================================
       2. USER YANG CLAIM REPORT

       Jika claimedBy = user ID
    ================================================= */

    if (
      currentUserId &&
      claimedBy &&
      claimedBy === currentUserId
    ) {
      return true;
    }

    /* =================================================
       Jika claimedBy = email
    ================================================= */

    if (
      currentUserEmail &&
      claimedBy.toLowerCase() === currentUserEmail
    ) {
      return true;
    }

    /* =================================================
       Jika backend ada claimedByEmail
    ================================================= */

    if (
      currentUserEmail &&
      claimedByEmail &&
      claimedByEmail === currentUserEmail
    ) {
      return true;
    }

    /* =================================================
       Jika backend simpan nama claimant
    ================================================= */

    if (
      currentUserName &&
      claimedByName &&
      claimedByName === currentUserName
    ) {
      return true;
    }

    return false;
  };

  /* =====================================================
     LOAD REPORTS FROM BACKEND / SUPABASE
  ===================================================== */

  const loadReports = async () => {
    setError("");

    try {
      /*
        BACKEND ADALAH SUMBER UTAMA
      */

      const response = await fetch(
        API_URL + "/api/reports",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load reports."
        );
      }

      const serverReports =
        Array.isArray(data.reports)
          ? data.reports
          : [];

      /* =================================================
         NORMALIZE
      ================================================= */

      const normalizedReports =
        serverReports
          .map(normalizeReport)
          .filter(Boolean);

      /* =================================================
         HANYA REPORT USER SEMASA

         Termasuk:
         - report yang dia buat
         - report yang dia claim
      ================================================= */

      const myReports =
        normalizedReports.filter(
          belongsToCurrentUser
        );

      /* =================================================
         REPORT TERBARU DI ATAS
      ================================================= */

      myReports.sort(
        (a, b) =>
          new Date(b.createdAt || 0) -
          new Date(a.createdAt || 0)
      );

      setReports(myReports);

      /* =================================================
         CACHE LOCAL STORAGE
      ================================================= */

      try {
        localStorage.setItem(
          "foundlyReports",
          JSON.stringify(normalizedReports)
        );
      } catch (storageError) {
        console.warn(
          "Unable to update local report cache:",
          storageError
        );
      }
    } catch (backendError) {
      console.error(
        "Unable to load reports from backend:",
        backendError
      );

      /* =================================================
         FALLBACK LOCAL STORAGE
      ================================================= */

      try {
        const saved =
          JSON.parse(
            localStorage.getItem(
              "foundlyReports"
            ) || "[]"
          );

        if (!Array.isArray(saved)) {
          setReports([]);
          return;
        }

        const normalizedSaved =
          saved
            .map(normalizeReport)
            .filter(Boolean);

        const mySavedReports =
          normalizedSaved.filter(
            belongsToCurrentUser
          );

        mySavedReports.sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );

        setReports(mySavedReports);

        setError(
          "Showing saved report data. Please make sure the Foundly server is running."
        );
      } catch (storageError) {
        console.error(
          "Unable to load saved reports:",
          storageError
        );

        setReports([]);

        setError(
          "Unable to load your reports."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadReports();
  }, [userEmail, userId]);

  /* =====================================================
     REFRESH
  ===================================================== */

  useEffect(() => {
    const handleFocus = () => {
      loadReports();
    };

    const handleStorage = () => {
      loadReports();
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    /*
      Refresh setiap 5 saat supaya status
      resolved / claimed sentiasa dikemaskini.
    */

    const interval =
      setInterval(
        loadReports,
        5000
      );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      clearInterval(
        interval
      );
    };
  }, [userEmail, userId]);

  /* =====================================================
     COUNTS
  ===================================================== */

  const activeReports =
    reports.filter(
      (report) =>
        report.status !== "resolved" &&
        report.status !== "Resolved"
    );

  const completedReports =
    reports.filter(
      (report) =>
        report.status === "resolved" ||
        report.status === "Resolved"
    );

  /* =====================================================
     OPEN DETAIL
  ===================================================== */

  const openReport = (report) => {
    setSelectedReport(report);
  };

  /* =====================================================
     CLOSE DETAIL
  ===================================================== */

  const closeReport = () => {
    setSelectedReport(null);
  };

  /* =====================================================
     REPORT TYPE
  ===================================================== */

  const getTypeLabel = (report) => {
    return report.type === "found"
      ? "FOUND"
      : "LOST";
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="my-reports-page">

        <div className="my-report-glow glow-one" />
        <div className="my-report-glow glow-two" />
        <div className="my-report-glow glow-three" />

        <main
          className="my-reports-main"
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
              color: "#ff65ab",
            }}
          >
            <div
              style={{
                fontSize: "42px",
                marginBottom: "12px",
              }}
            >
              💗
            </div>

            <strong
              style={{
                display: "block",
                color: "#fff",
                fontSize: "18px",
              }}
            >
              Loading your reports...
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "6px",
                color: "#8f8190",
                fontSize: "11px",
              }}
            >
              Connecting to Foundly
            </span>
          </div>
        </main>

      </div>
    );
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="my-reports-page">

      {/* DECORATION */}

      <div className="my-report-glow glow-one" />
      <div className="my-report-glow glow-two" />
      <div className="my-report-glow glow-three" />

      <div className="my-report-floating floating-a">
        ♥
      </div>

      <div className="my-report-floating floating-b">
        ✦
      </div>

      <div className="my-report-floating floating-c">
        ✧
      </div>

      {/* HEADER */}

      <header className="my-reports-header">

        <button
          type="button"
          className="my-reports-back"
          onClick={onBack}
        >
          <ArrowLeft size={19} />

          Back to Dashboard
        </button>

        <div className="my-reports-header-title">

          <FileText size={19} />

          <span>
            FOUNDLY REPORTS
          </span>

        </div>

        <div className="my-reports-user">

          <div className="my-reports-avatar">

            {userName
              .charAt(0)
              .toUpperCase()}

          </div>

          <div>

            <strong>
              {userName}
            </strong>

            <span>
              My Reports
            </span>

          </div>

        </div>

      </header>

      {/* MAIN */}

      <main className="my-reports-main">

        {/* INTRO */}

        <section className="my-reports-intro">

          <div className="my-reports-intro-icon">

            <FileText size={31} />

          </div>

          <div>

            <span>
              YOUR FOUNDLY ACTIVITY
            </span>

            <h1>

              My Reports

              <strong>
                {" "}♥
              </strong>

            </h1>

            <p>
              Keep track of everything you've
              reported in the Foundly community.
            </p>

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginBottom: "18px",
              padding: "11px 14px",
              border:
                "1px solid rgba(255,120,180,.25)",
              borderRadius: "11px",
              background:
                "rgba(255,35,130,.06)",
              color: "#ff9bc6",
              fontSize: "10px",
              lineHeight: 1.5,
            }}
          >
            {error}
          </div>
        )}

        {/* SUMMARY */}

        <section className="my-report-summary">

          <div className="summary-card total">

            <div className="summary-icon">
              <FileText size={23} />
            </div>

            <div>

              <strong>
                {reports.length}
              </strong>

              <span>
                TOTAL REPORTS
              </span>

            </div>

          </div>

          <div className="summary-card active">

            <div className="summary-icon">
              <Circle size={21} />
            </div>

            <div>

              <strong>
                {activeReports.length}
              </strong>

              <span>
                ACTIVE
              </span>

            </div>

          </div>

          <div className="summary-card completed">

            <div className="summary-icon">
              <CheckCircle2 size={23} />
            </div>

            <div>

              <strong>
                {completedReports.length}
              </strong>

              <span>
                COMPLETED
              </span>

            </div>

          </div>

        </section>

        {/* ACTIVE REPORTS */}

        <section className="my-report-section">

          <div className="my-report-section-heading">

            <div className="section-heading-left">

              <div className="heading-dot active-dot">
                <Circle size={12} />
              </div>

              <div>

                <h2>
                  Active Reports
                </h2>

                <p>
                  Reports that are still active
                </p>

              </div>

            </div>

            <div className="section-number active-number">

              {activeReports.length}

            </div>

          </div>

          {activeReports.length === 0 ? (

            <div className="my-report-empty">

              <div>
                ✨
              </div>

              <strong>
                No active reports
              </strong>

              <span>
                You don't have any active reports
                right now.
              </span>

            </div>

          ) : (

            <div className="my-reports-list">

              {activeReports.map(
                (report) => (

                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() =>
                      openReport(report)
                    }
                    completed={false}
                    getTypeLabel={
                      getTypeLabel
                    }
                  />

                )
              )}

            </div>

          )}

        </section>

        {/* COMPLETED REPORTS */}

        <section className="my-report-section completed-section">

          <div className="my-report-section-heading">

            <div className="section-heading-left">

              <div className="heading-dot completed-dot">

                <CheckCircle2 size={17} />

              </div>

              <div>

                <h2>
                  Completed Reports
                </h2>

                <p>
                  Items that have been successfully reunited
                </p>

              </div>

            </div>

            <div className="section-number completed-number">

              {completedReports.length}

            </div>

          </div>

          {completedReports.length === 0 ? (

            <div className="my-report-empty completed-empty">

              <div>
                💗
              </div>

              <strong>
                No completed reports yet
              </strong>

              <span>
                Resolved reports will appear here.
              </span>

            </div>

          ) : (

            <div className="my-reports-list">

              {completedReports.map(
                (report) => (

                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={() =>
                      openReport(report)
                    }
                    completed={true}
                    getTypeLabel={
                      getTypeLabel
                    }
                  />

                )
              )}

            </div>

          )}

        </section>

        {/* FOOTER */}

        <footer className="my-reports-footer">

          <div>

            <strong>

              Foundly<span>
                !
              </span>

            </strong>

            <small>
              Lost & Found App
            </small>

          </div>

          <p>
            Made with 💗 by Debug Girls · SK Limbang
          </p>

        </footer>

      </main>

      {/* DETAIL MODAL */}

      {selectedReport && (

        <div
          className="my-report-modal-overlay"
          onClick={closeReport}
        >

          <div
            className="my-report-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="my-report-modal-close"
              onClick={closeReport}
              aria-label="Close report details"
            >
              <X size={20} />
            </button>

            {/* IMAGE */}

            <div className="my-report-modal-image">

              {selectedReport.image ? (

                <img
                  src={selectedReport.image}
                  alt={
                    selectedReport.itemName ||
                    "Reported item"
                  }
                />

              ) : (

                <div className="modal-no-image">

                  {selectedReport.type ===
                  "found"
                    ? "📦"
                    : "🔎"}

                </div>

              )}

              <span
                className={
                  selectedReport.type ===
                  "found"
                    ? "modal-report-type found"
                    : "modal-report-type lost"
                }
              >

                {getTypeLabel(
                  selectedReport
                )}

              </span>

            </div>

            {/* DETAILS */}

            <div className="my-report-modal-content">

              <span className="modal-label">
                MY FOUNDLY REPORT
              </span>

              <h2>
                {selectedReport.itemName ||
                  "Unnamed Item"}
              </h2>

              <div
                className={
                  selectedReport.status ===
                    "resolved" ||
                  selectedReport.status ===
                    "Resolved"
                    ? "modal-report-status resolved"
                    : "modal-report-status"
                }
              >

                {selectedReport.status ===
                    "resolved" ||
                selectedReport.status ===
                    "Resolved" ? (

                  <>
                    <CheckCircle2 size={16} />

                    Item Reunited
                  </>

                ) : (

                  <>
                    <Circle size={13} />

                    Active Report
                  </>

                )}

              </div>

              <div className="modal-info-row">

                <FileText size={17} />

                <div>

                  <strong>
                    Description
                  </strong>

                  <p>
                    {selectedReport.description ||
                      "No description provided."}
                  </p>

                </div>

              </div>

              <div className="modal-info-row">

                <MapPin size={17} />

                <div>

                  <strong>
                    Location
                  </strong>

                  <p>
                    {selectedReport.location ||
                      "SK Limbang"}
                  </p>

                </div>

              </div>

              <div className="modal-info-row">

                <CalendarDays size={17} />

                <div>

                  <strong>
                    Date & Time
                  </strong>

                  <p>

                    {selectedReport.date ||
                      "Not provided"}

                    {selectedReport.time
                      ? " · " + selectedReport.time
                      : ""}

                  </p>

                </div>

              </div>

              <div className="modal-info-row">

                <Phone size={17} />

                <div>

                  <strong>
                    Contact Number
                  </strong>

                  <p>
                    {selectedReport.phone ||
                      "Not provided"}
                  </p>

                </div>

              </div>

              <div className="my-report-reporter">

                <div className="reporter-avatar">

                  {userName
                    .charAt(0)
                    .toUpperCase()}

                </div>

                <div>

                  <span>
                    Reported by
                  </span>

                  <strong>
                    {selectedReport.reporterName ||
                      userName}
                  </strong>

                </div>

              </div>

              {/* RESOLVED INFORMATION */}

              {(
                selectedReport.status ===
                  "resolved" ||
                selectedReport.status ===
                  "Resolved"
              ) && (

                <div className="my-report-resolved-box">

                  <Heart
                    size={19}
                    fill="currentColor"
                  />

                  <div>

                    <strong>
                      Item Reunited
                    </strong>

                    <span>
                      This report has been
                      successfully resolved. 💗
                    </span>

                  </div>

                </div>

              )}

              {/* CLAIM INFORMATION */}

              {selectedReport.claimedBy && (

                <div
                  className="my-report-resolved-box"
                  style={{
                    marginTop: "10px",
                  }}
                >

                  <div>

                    <strong>
                      Claimed by
                    </strong>

                    <span>

                      {selectedReport.claimedByName ||
                        selectedReport.claimedByEmail ||
                        selectedReport.claimedBy}

                    </span>

                  </div>

                </div>

              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

/* =========================================================
   REPORT CARD
========================================================= */

function ReportCard({
  report,
  onClick,
  completed,
  getTypeLabel,
}) {
  return (
    <button
      type="button"
      className={
        completed
          ? "my-report-card completed"
          : "my-report-card"
      }
      onClick={onClick}
    >

      {/* IMAGE */}

      <div className="my-report-card-image">

        {report.image ? (

          <img
            src={report.image}
            alt={
              report.itemName ||
              "Reported item"
            }
          />

        ) : (

          <div className="my-report-card-placeholder">

            {report.type ===
            "found"
              ? "📦"
              : "🔎"}

          </div>

        )}

        <span
          className={
            report.type ===
            "found"
              ? "my-report-type found"
              : "my-report-type lost"
          }
        >

          {getTypeLabel(
            report
          )}

        </span>

      </div>

      {/* INFO */}

      <div className="my-report-card-info">

        <strong>

          {report.itemName ||
            "Unnamed Item"}

        </strong>

        <span>

          <MapPin size={14} />

          {report.location ||
            "SK Limbang"}

        </span>

        <span>

          <CalendarDays size={14} />

          {report.date ||
            "Recently"}

        </span>

        {report.time && (

          <span>

            <Clock size={14} />

            {report.time}

          </span>

        )}

      </div>

      {/* STATUS */}

      <div className="my-report-card-status">

        {completed ? (

          <>

            <CheckCircle2 size={17} />

            <span>
              Resolved
            </span>

          </>

        ) : (

          <>

            <span className="active-status-dot" />

            <span>
              Active
            </span>

          </>

        )}

      </div>

      {/* ARROW */}

      <div className="my-report-card-arrow">

        <ArrowRightIcon />

      </div>

    </button>
  );
}

/* =========================================================
   ARROW
========================================================= */

function ArrowRightIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >

      <path d="M5 12h14" />

      <path d="m13 6 6 6-6 6" />

    </svg>
  );
}

export default MyReports;