import { useEffect, useMemo, useState } from "react";
import API_URL from "../api";

import {
  Home,
  Search,
  Package,
  FileText,
  MessageCircle,
  UserRound,
  Settings,
  LogOut,
  Bell,
  Trophy,
  Heart,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  Plus,
  X,
  Phone,
  CalendarDays,
} from "lucide-react";

import schoolLogo from "../assets/logo-sekolah.png";
import debugGirlsLogo from "../assets/debug-girls-logo.png";

import "./Dashboard.css";


function Dashboard({
  currentUser,
  onReportLost,
  onReportFound,
  onMyReports,
  onMessages,
  onFeedback,
  onProfile,
  onLogout,
}) {

  /* =====================================================
     USER
  ===================================================== */

  const userName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Foundly Member";


  const userEmail =
    currentUser?.email
      ?.trim()
      .toLowerCase() || "";


  const profileImage =
    currentUser?.profileImage || "";


  /* =====================================================
     POINTS
  ===================================================== */

  const getUserPoints = () => {

    if (userEmail) {

      const personalPoints =
        localStorage.getItem(
          `foundlyPoints_${userEmail}`
        );


      if (personalPoints !== null) {

        return (
          Number(
            personalPoints
          ) || 0
        );

      }

    }


    if (
      currentUser?.points !== undefined
    ) {

      return (
        Number(
          currentUser.points
        ) || 0
      );

    }


    const oldPoints =
      localStorage.getItem(
        "foundlyPoints"
      );


    return oldPoints !== null
      ? Number(oldPoints) || 0
      : 0;

  };


  const [points, setPoints] =
    useState(
      getUserPoints()
    );


  /* =====================================================
     REPORTS
  ===================================================== */

  const [reports, setReports] =
    useState([]);


  /* =====================================================
     REGISTERED USERS FROM SUPABASE
  ===================================================== */

  const [registeredUsers, setRegisteredUsers] =
    useState([]);


  /* =====================================================
     COMMUNITY FEEDBACK
  ===================================================== */

  const [feedback, setFeedback] =
    useState([]);


  /* =====================================================
     SELECTED REPORT
  ===================================================== */

  const [
    selectedReport,
    setSelectedReport
  ] = useState(null);


  /* =====================================================
     CLAIM MESSAGE
  ===================================================== */

  const [
    claimMessage,
    setClaimMessage
  ] = useState("");


  /* =====================================================
     SEARCH
  ===================================================== */

  const [search, setSearch] =
    useState("");


  /* =====================================================
     NOTIFICATION
  ===================================================== */

  const [
    showNotifications,
    setShowNotifications
  ] = useState(false);


  /* =====================================================
     STUDENT NOTIFICATIONS - BACKEND
  ===================================================== */

  const [studentNotifications, setStudentNotifications] =
    useState([]);

  const [notificationLoading, setNotificationLoading] =
    useState(false);


  /* =====================================================
     SIDEBAR
  ===================================================== */

  const [activeMenu, setActiveMenu] =
    useState("dashboard");


  /* =====================================================
     LOAD DATA
  ===================================================== */

  const loadFeedback = async () => {

    try {

      const response = await fetch(
        `${API_URL}/api/feedback`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load feedback."
        );
      }

      const loadedFeedback =
        Array.isArray(data.feedback)
          ? data.feedback
          : Array.isArray(data.data)
          ? data.data
          : [];

      setFeedback(loadedFeedback);

    } catch (error) {

      console.error(
        "Unable to load feedback from server:",
        error
      );

      try {
        const savedFeedback = JSON.parse(
          localStorage.getItem(
            "foundlyFeedback"
          ) || "[]"
        );

        setFeedback(
          Array.isArray(savedFeedback)
            ? savedFeedback
            : []
        );
      } catch {
        setFeedback([]);
      }

    }
  };


  /* =====================================================
     LOAD STUDENT NOTIFICATIONS
  ===================================================== */

  const loadStudentNotifications = async () => {
    if (!currentUser?.id) {
      setStudentNotifications([]);
      return;
    }

    setNotificationLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/notifications?role=student&userId=${encodeURIComponent(
          currentUser.id
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load notifications."
        );
      }

      const loadedNotifications =
        Array.isArray(data.notifications)
          ? data.notifications
          : [];

      const mappedNotifications =
        loadedNotifications.map((item) => ({
          id: item.id,
          type: item.type || "report",
          title: item.title || "Notification",
          description: item.description || "",
          date:
            item.created_at ||
            item.createdAt ||
            null,
          menu: item.section || "reports",
          read: Boolean(item.read),
        }));

      setStudentNotifications(
        mappedNotifications.slice(0, 20)
      );
    } catch (error) {
      console.error(
        "Unable to load student notifications:",
        error
      );

      setStudentNotifications([]);
    } finally {
      setNotificationLoading(false);
    }
  };

  const loadDashboardData = async () => {

    /* -------------------------------
       REPORTS
    ------------------------------- */

    try {

      const response = await fetch(
        `${API_URL}/api/reports`,
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
          : Array.isArray(data.data)
          ? data.data
          : [];

      setReports(serverReports);

      try {
        localStorage.setItem(
          "foundlyReports",
          JSON.stringify(serverReports)
        );
      } catch (storageError) {
        console.warn(
          "Unable to update report cache:",
          storageError
        );
      }

    } catch (error) {

      console.error(
        "Unable to load reports from server:",
        error
      );

      /* Fallback only if backend is unavailable */
      try {
        const savedReports = JSON.parse(
          localStorage.getItem(
            "foundlyReports"
          ) || "[]"
        );

        setReports(
          Array.isArray(savedReports)
            ? savedReports
            : []
        );
      } catch {
        setReports([]);
      }
    }


    /* -------------------------------
       USERS FROM SUPABASE
       IMPORTANT: leaderboard images and points
       must come from the server, not localStorage.
    ------------------------------- */

    try {
      const response = await fetch(
        `${API_URL}/api/users`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load users."
        );
      }

      const loadedUsers =
        Array.isArray(data.users)
          ? data.users
          : Array.isArray(data.data)
          ? data.data
          : [];

      setRegisteredUsers(
        loadedUsers
      );
    } catch (error) {
      console.error(
        "Unable to load users from Supabase:",
        error
      );

      /* Fallback only if backend is unavailable */
      try {
        const savedUsers = JSON.parse(
          localStorage.getItem(
            "foundlyUsers"
          ) || "[]"
        );

        setRegisteredUsers(
          Array.isArray(savedUsers)
            ? savedUsers
            : []
        );
      } catch {
        setRegisteredUsers([]);
      }
    }

    /* -------------------------------
       POINTS
    ------------------------------- */

    setPoints(
      getUserPoints()
    );

  };


  useEffect(() => {

    loadDashboardData();
    loadFeedback();
    loadStudentNotifications();

  }, [userEmail, currentUser?.id]);

  /* =====================================================
   AUTO REFRESH NOTIFICATIONS
===================================================== */

useEffect(() => {
  if (!currentUser?.id) return;

  const notificationInterval = setInterval(() => {
    loadStudentNotifications();
  }, 5000);

  return () => {
    clearInterval(notificationInterval);
  };
}, [currentUser?.id]);

  /* =====================================================
     REFRESH
  ===================================================== */

  useEffect(() => {

    const handleStorageChange = () => {

      loadDashboardData();
      loadFeedback();
      loadStudentNotifications();

    };


    const handleFocus = () => {

      loadDashboardData();
      loadFeedback();
      loadStudentNotifications();

    };


    window.addEventListener(
      "storage",
      handleStorageChange
    );


    window.addEventListener(
      "focus",
      handleFocus
    );


    const handleFeedbackUpdated = () => {
      loadFeedback();
    };

    window.addEventListener(
      "foundly-feedback-updated",
      handleFeedbackUpdated
    );


    return () => {

      window.removeEventListener(
        "storage",
        handleStorageChange
      );


      window.removeEventListener(
        "focus",
        handleFocus
      );

      window.removeEventListener(
        "foundly-feedback-updated",
        handleFeedbackUpdated
      );

    };

  }, [userEmail]);


  /* =====================================================
     ACTIVE REPORTS
  ===================================================== */

  const activeReports =
    reports.filter(
      (report) =>
        report.status !== "resolved" &&
        report.status !== "Resolved"
    );


  /* =====================================================
     COMPLETED REPORTS
  ===================================================== */

  const resolvedReports =
    reports.filter(
      (report) =>
        report.status === "resolved" ||
        report.status === "Resolved"
    );


  /* =====================================================
     SEARCH REPORTS
  ===================================================== */

  const filteredReports =
    reports.filter((report) => {

      const keyword =
        search
          .toLowerCase()
          .trim();


      if (!keyword) {

        return true;

      }


      return (

        report.itemName
          ?.toLowerCase()
          .includes(keyword)

        ||

        report.description
          ?.toLowerCase()
          .includes(keyword)

        ||

        report.location
          ?.toLowerCase()
          .includes(keyword)

      );

    });


  const filteredActiveReports =
    filteredReports.filter(
      (report) =>
        report.status !== "resolved" &&
        report.status !== "Resolved"
    );


  const filteredResolvedReports =
    filteredReports.filter(
      (report) =>
        report.status === "resolved" ||
        report.status === "Resolved"
    );


  /* =====================================================
     REGISTERED USERS

     Loaded from Supabase in loadDashboardData().
     Keeping this as React state ensures that profile
     pictures of OTHER users are available to the
     leaderboard even though localStorage intentionally
     does not store Base64 profile images anymore.
  ===================================================== */

  /* =====================================================
     REAL STUDENTS
  ===================================================== */

  const realStudents =
    registeredUsers
      .filter((user) => {
        const email =
          user.email
            ?.trim()
            .toLowerCase();

        return (
          email !== userEmail &&
          email !== "admin@foundly.edu.my"
        );
      })
      .map((user) => {
        const image =
          user.profileImage ||
          user.profile_image ||
          "";

        return {
          id:
            user.id ||
            user.email ||
            user.name,

          name:
            user.name ||
            user.fullName ||
            user.username ||
            "Foundly Member",

          /* Points come directly from Supabase */
          points:
            Number(
              user.points || 0
            ),

          avatar:
            "🌸",

          profileImage:
            image,
        };
      });


  /* =====================================================
     COMBINE STUDENTS
  ===================================================== */

  const combinedStudents = [

    ...realStudents,

  ];


  /* =====================================================
     LEADERBOARD
  ===================================================== */

  const leaderboardData =
    useMemo(() => {

      const otherStudents =
        combinedStudents.filter(
          (student) =>
            student.name
              ?.toLowerCase() !==
            userName.toLowerCase()
        );


      const uniqueStudents = [];


      otherStudents.forEach(
        (student) => {

          const exists =
            uniqueStudents.some(
              (item) =>
                item.name
                  ?.toLowerCase() ===
                student.name
                  ?.toLowerCase()
            );


          if (!exists) {

            uniqueStudents.push(
              student
            );

          }

        }
      );


      return [

        ...uniqueStudents,

        {

          name:
            userName,

          points:
            points,

          avatar:
            "🌸",

          profileImage:
            profileImage,

          currentUser:
            true,

        },

      ].sort(
        (a, b) =>
          b.points - a.points
      );


    }, [
      points,
      userName,
      userEmail,
      profileImage,
      registeredUsers,
    ]);


  /* =====================================================
     RANK
  ===================================================== */

  const yourRank =
    leaderboardData.findIndex(
      (student) =>
        student.currentUser
    ) + 1;


  const first =
    leaderboardData[0] || {

      name: "-",
      points: 0,
      avatar: "🌸",
      profileImage: "",

    };


  const second =
    leaderboardData[1] || {

      name: "-",
      points: 0,
      avatar: "🌸",
      profileImage: "",

    };


  const third =
    leaderboardData[2] || {

      name: "-",
      points: 0,
      avatar: "🌸",
      profileImage: "",

    };


  const otherRankings =
    leaderboardData.slice(3, 7);


  /* =====================================================
     STUDENT NOTIFICATIONS
  ===================================================== */

  const unreadStudentNotifications =
    studentNotifications.filter(
      (notification) => !notification.read
    );

  const markStudentNotificationRead = async (id) => {
    try {
      const response = await fetch(
        `${API_URL}/api/notifications/${id}/read`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to mark notification as read."
        );
      }

      setStudentNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true,
              }
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Mark notification read error:",
        error
      );
    }
  };

  const markAllStudentNotificationsRead = async () => {
    if (!currentUser?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/api/notifications/read-all`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role: "student",
            userId: currentUser.id,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to mark notifications as read."
        );
      }

      setStudentNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Mark all notifications read error:",
        error
      );
    }
  };

  /* =====================================================
     INITIAL
  ===================================================== */

  const initial =
    userName
      .charAt(0)
      .toUpperCase();


  /* =====================================================
     REPORT TYPE
  ===================================================== */

  const getReportType =
    (report) => {

      return report.type === "found"
        ? "FOUND"
        : "LOST";

    };


  /* =====================================================
     OPEN REPORT
  ===================================================== */

  const openReport = (report) => {

    setSelectedReport(
      report
    );

    setClaimMessage("");

  };


  /* =====================================================
     CLOSE REPORT
  ===================================================== */

  const closeReport = () => {

    setSelectedReport(null);

    setClaimMessage("");

  };


  /* =====================================================
     CLAIM REPORT
  ===================================================== */

  const handleClaimReport = async () => {
    if (!selectedReport) {
      return;
    }

    setClaimMessage("");

    if (
      selectedReport.reportedBy &&
      selectedReport.reportedBy.trim().toLowerCase() === userEmail
    ) {
      setClaimMessage("You cannot claim your own report.");
      return;
    }

    if (!currentUser?.id) {
      setClaimMessage(
        "Your login session has expired. Please login again."
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/reports/${selectedReport.id}/claim`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser.id,
            userEmail: currentUser.email || userEmail,
            userName: currentUser.name || userName || "Foundly Member",
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
        setClaimMessage(
          data.message ||
            "Unable to claim this item. Please try again."
        );
        return;
      }

      const updatedReport = data.report || {
        ...selectedReport,
        status: "resolved",
        claimedBy: currentUser.email || userEmail,
        claimedByName: currentUser.name || userName || "Foundly Member",
        resolvedAt: new Date().toISOString(),
      };

      setReports((previousReports) =>
        previousReports.map((report) =>
          report.id === updatedReport.id
            ? { ...report, ...updatedReport }
            : report
        )
      );

      let savedReports = [];

      try {
        savedReports = JSON.parse(
          localStorage.getItem("foundlyReports") || "[]"
        );

        if (!Array.isArray(savedReports)) {
          savedReports = [];
        }
      } catch {
        savedReports = [];
      }

      const updatedReports = savedReports.map((report) =>
        report.id === updatedReport.id
          ? { ...report, ...updatedReport }
          : report
      );

      localStorage.setItem(
        "foundlyReports",
        JSON.stringify(updatedReports)
      );

      setSelectedReport({
        ...selectedReport,
        ...updatedReport,
      });

      setClaimMessage(
        data.message ||
          "Item successfully claimed! This report is now resolved. 💗"
      );
    } catch (error) {
      console.error("Claim report error:", error);

      setClaimMessage(
        "Unable to connect to Foundly server. Please make sure the backend is running."
      );
    }
  };

  /* =====================================================
     FEEDBACK DISPLAY
  ===================================================== */

  const communityFeedback = feedback
    .slice()
    .sort(
      (a, b) =>
        new Date(
          b.createdAt ||
            b.created_at ||
            0
        ) -
        new Date(
          a.createdAt ||
            a.created_at ||
            0
        )
    )
    .slice(0, 6);


  const averageFeedbackRating =
    feedback.length > 0
      ? (
          feedback.reduce(
            (sum, item) =>
              sum + Number(item.rating || 0),
            0
          ) / feedback.length
        ).toFixed(1)
      : "0.0";


  const renderFeedbackStars = (rating) => {

    const value = Number(rating) || 0;

    return (
      <span className="student-feedback-stars">
        {Array.from({ length: 5 }, (_, index) =>
          index + 1 <= Math.round(value)
            ? "★"
            : "☆"
        ).join("")}
      </span>
    );
  };


  const formatFeedbackDate = (value) => {

    if (!value) return "Recently";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    return new Intl.DateTimeFormat(
      "en-MY",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(date);
  };


  /* =====================================================
     NAVIGATION HELPERS
  ===================================================== */

  const handleMessages = () => {

    setActiveMenu(
      "messages"
    );


    if (onMessages) {

      onMessages();

    }

  };


  const handleFeedback = () => {

    setActiveMenu(
      "feedback"
    );


    if (onFeedback) {

      onFeedback();

    }

  };


  const handleProfile = () => {

    setActiveMenu(
      "profile"
    );


    if (onProfile) {

      onProfile();

    }

  };


  /* =====================================================
     RETURN
  ===================================================== */

  return (

    <div className="foundly-dashboard">


      {/* =================================================
          FLOATING FEEDBACK
      ================================================= */}

      <button
        type="button"
        className="feedback-floating-button"
        onClick={
          handleFeedback
        }
      >

        <MessageCircle
          size={18}
        />

        <span>
          Feedback
        </span>

      </button>


      {/* =================================================
          FLOATING DECORATIONS
      ================================================= */}

      <div className="neon-floating neon-heart">

        <Heart
          size={24}
          fill="currentColor"
        />

      </div>


      <div className="neon-floating neon-sparkle">

        <Sparkles size={26} />

      </div>


      <div className="neon-floating neon-star">
        ✦
      </div>


      <div className="neon-floating neon-heart-two">
        ♡
      </div>


      <div className="neon-floating neon-sparkle-two">
        ✧
      </div>


      <div className="neon-floating neon-box">
        📦
      </div>


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="foundly-sidebar">


        {/* BRAND */}

        <div className="sidebar-brand">

          <img
            src={debugGirlsLogo}
            alt="Debug Girls"
            className="foundly-main-logo"
          />


          <div className="sidebar-brand-title">

            <span>
              Foundly!
            </span>

            <small>
              Lost & Found
            </small>

          </div>

        </div>


        {/* SCHOOL */}

        <div className="sidebar-school">

          <img
            src={schoolLogo}
            alt="SK Limbang"
          />


          <div>

            <strong>
              SK LIMBANG
            </strong>

            <span>
              Lost & Found System
            </span>

          </div>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="sidebar-navigation">


          {/* DASHBOARD */}

          <button
            className={
              activeMenu ===
              "dashboard"
                ? "sidebar-link active"
                : "sidebar-link"
            }

            onClick={() =>
              setActiveMenu(
                "dashboard"
              )
            }
          >

            <Home size={21} />

            <span>
              Dashboard
            </span>

          </button>


          {/* LOST */}

          <button
            className="sidebar-link"

            onClick={() => {

              setActiveMenu(
                "lost"
              );

              onReportLost();

            }}
          >

            <Search size={21} />

            <span>
              I Lost Something
            </span>

          </button>


          {/* FOUND */}

          <button
            className="sidebar-link"

            onClick={() => {

              setActiveMenu(
                "found"
              );

              onReportFound();

            }}
          >

            <Package size={21} />

            <span>
              I Found Something
            </span>

          </button>


          {/* MY REPORTS */}

          <button
            type="button"
            className="sidebar-link"

            onClick={() => {
              setActiveMenu("dashboard");
              setShowNotifications(false);
              onMyReports?.();
            }}
          >

            <FileText size={21} />

            <span>
              My Reports
            </span>


            <span className="nav-count">

              {
                reports.filter(
                  (report) =>
                    report.reportedBy
                      ?.toLowerCase() ===
                    userEmail
                ).length
              }

            </span>


          </button>


          {/* MESSAGES */}

          <button
            className={
              activeMenu ===
              "messages"
                ? "sidebar-link active"
                : "sidebar-link"
            }

            onClick={
              handleMessages
            }
          >

            <MessageCircle
              size={21}
            />

            <span>
              Messages
            </span>

          </button>


          {/* PROFILE */}

          <button
            className={
              activeMenu ===
              "profile"
                ? "sidebar-link active"
                : "sidebar-link"
            }

            onClick={
              handleProfile
            }
          >

            <UserRound size={21} />

            <span>
              My Profile
            </span>

          </button>


          {/* SETTINGS */}

          <button
            className={
              activeMenu ===
              "settings"
                ? "sidebar-link active"
                : "sidebar-link"
            }

            onClick={() =>
              setActiveMenu(
                "settings"
              )
            }
          >

            <Settings size={21} />

            <span>
              Settings
            </span>

          </button>


        </nav>


        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div className="sidebar-bottom">


          <div className="debug-credit">


            <div className="debug-credit-text">

              <span>
                Designed by
              </span>


              <strong>

                DEBUG
                <br />
                GIRLS

              </strong>

            </div>


            <div className="debug-sparkles">

              ✦ ✧

            </div>


          </div>


          <button
            className="sidebar-logout"
            onClick={onLogout}
          >

            <LogOut
              size={18}
            />

            <span>
              Logout
            </span>

          </button>


        </div>


      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="foundly-main">


        {/* =================================================
            TOPBAR
        ================================================= */}

        <div className="dashboard-topbar">


          <div className="topbar-mobile-logo">

            <img
              src={schoolLogo}
              alt="SK Limbang"
            />

          </div>


          <div className="topbar-welcome">

            ✦ YOUR FOUNDLY SPACE ✦

          </div>


          <div className="topbar-actions">


            {/* NOTIFICATION */}

            <div className="student-notification-wrapper">

            <button
              type="button"
              className="topbar-notification"

              onClick={() =>
                setShowNotifications(
                  !showNotifications
                )
              }
            >

              <Bell size={19} />

              {unreadStudentNotifications.length > 0 && (
                <span>
                  {unreadStudentNotifications.length}
                </span>
              )}

            </button>


            {/* NOTIFICATION PANEL */}

            {showNotifications && (

              <div
                className="dashboard-notification"
                style={{
                  width: "360px",
                  maxWidth: "calc(100vw - 30px)",
                  maxHeight: "390px",
                  overflow: "hidden",
                  padding: 0,
                }}
              >

                <div
                  className="notification-heading"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "15px 17px",
                    background: "#2f1b2d",
                    borderBottom: "1px solid #58314e",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Bell size={19} />
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <strong style={{ fontSize: "14px" }}>Notifications</strong>
                      <small style={{ color: "#bfa9b7", fontSize: "9px" }}>
                        {unreadStudentNotifications.length} unread
                      </small>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                    {unreadStudentNotifications.length > 0 && (
                      <button
                        type="button"
                        onClick={markAllStudentNotificationsRead}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#ff72b0",
                          fontFamily: "inherit",
                          fontSize: "9px",
                          fontWeight: 900,
                          cursor: "pointer",
                        }}
                      >
                        Mark all as read
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      aria-label="Close notifications"
                      title="Close notifications"
                      style={{
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        border: "1px solid #663653",
                        borderRadius: "8px",
                        background: "#241724",
                        color: "#ff83bd",
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div style={{ maxHeight: "320px", overflowY: "auto", padding: "8px" }}>
                  {notificationLoading ? (
                    <div style={{ padding: "30px 18px", textAlign: "center", color: "#b79eae", fontSize: "10px" }}>
                      Loading notifications...
                    </div>
                  ) : studentNotifications.length === 0 ? (
                    <div style={{ padding: "30px 18px", textAlign: "center", color: "#b79eae" }}>
                      <Sparkles size={25} style={{ marginBottom: "8px" }} />
                      <div style={{ color: "#fff", fontWeight: 900, fontSize: "12px" }}>
                        No notifications yet
                      </div>
                      <div style={{ marginTop: "5px", fontSize: "9px" }}>
                        Updates about your reports will appear here.
                      </div>
                    </div>
                  ) : (
                    studentNotifications.map((notification) => {
                      const unread = !notification.read;

                      return (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={async () => {
                            await markStudentNotificationRead(notification.id);
                            setShowNotifications(false);

                            const menu = String(notification.menu || "")
                              .toLowerCase()
                              .replace(/[\s_-]/g, "");

                            const title = String(notification.title || "")
                              .toLowerCase();

                            const type = String(notification.type || "")
                              .toLowerCase();

                            if (
                              menu === "messages" ||
                              menu === "message" ||
                              type === "message" ||
                              title.includes("message")
                            ) {
                              if (onMessages) {
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });

                                onMessages();
                              }

                              return;
                            }

                            if (
                              menu === "myreports" ||
                              menu === "reports" ||
                              menu === "report" ||
                              type === "report" ||
                              type === "resolved" ||
                              title.includes("report") ||
                              title.includes("resolved")
                            ) {
                              if (onMyReports) {
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });

                                onMyReports();
                              }

                              return;
                            }

                            if (menu === "profile") {
                              if (onProfile) {
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });

                                onProfile();
                              }

                              return;
                            }
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "11px 10px",
                            marginBottom: "6px",
                            borderRadius: "10px",
                            border: unread ? "1px solid #9d3f6d" : "1px solid #473041",
                            background: unread ? "#382039" : "#241724",
                            color: "#fff",
                            textAlign: "left",
                            fontFamily: "inherit",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              width: "34px",
                              height: "34px",
                              minWidth: "34px",
                              borderRadius: "9px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: notification.type === "resolved" ? "#20392d" : "#4a203b",
                              color: notification.type === "resolved" ? "#70dca0" : "#ff73b3",
                            }}
                          >
                            {notification.type === "resolved" ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                          </div>

                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "3px" }}>
                            <strong style={{ fontSize: "10px" }}>
                              {notification.title}
                              {unread && <span style={{ color: "#ff3f91", marginLeft: "5px" }}>●</span>}
                            </strong>
                            <span style={{ color: "#e0d0db", fontSize: "9px", lineHeight: 1.35 }}>
                              {notification.description}
                            </span>
                            <small style={{ color: "#9c8795", fontSize: "8px" }}>
                              {notification.date
                                ? new Date(notification.date).toLocaleString("en-MY", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Recently"}
                            </small>
                          </div>

                          <ArrowRight size={14} color="#b59dac" />
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            </div>


            {/* PROFILE */}

            <button
              className="topbar-profile"
              onClick={
                handleProfile
              }
            >


              <div className="topbar-avatar">


                {profileImage ? (

                  <img
                    src={
                      profileImage
                    }
                    alt={
                      userName
                    }
                    className="topbar-profile-image"
                  />

                ) : (

                  initial

                )}


              </div>


              <div>

                <strong>
                  {userName}
                </strong>


                <small>
                  Foundly Member
                </small>

              </div>


            </button>


          </div>


        </div>


        {/* =================================================
            MY REPORTS
        ================================================= */}

        {activeMenu === "reports" && (
          <div className="my-reports-page">
            <div className="my-reports-content">

              <div className="my-reports-header">
                <div>
                  <span className="my-reports-kicker">
                    ✦ YOUR FOUNDLY SPACE
                  </span>
                  <h2>My Reports</h2>
                  <p>Keep track of everything you have reported.</p>
                </div>

                <button
                  type="button"
                  className="my-reports-back"
                  onClick={() => setActiveMenu("dashboard")}
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="my-reports-stats">
                {[
                  [
                    "Total Reports",
                    "#ff70b1",
                    reports.filter(
                      (r) => r.reportedBy?.trim().toLowerCase() === userEmail
                    ).length,
                  ],
                  [
                    "Lost",
                    "#ff70b1",
                    reports.filter(
                      (r) =>
                        r.reportedBy?.trim().toLowerCase() === userEmail &&
                        r.type === "lost"
                    ).length,
                  ],
                  [
                    "Found",
                    "#b978ff",
                    reports.filter(
                      (r) =>
                        r.reportedBy?.trim().toLowerCase() === userEmail &&
                        r.type === "found"
                    ).length,
                  ],
                  [
                    "Reunited",
                    "#70dca0",
                    reports.filter(
                      (r) =>
                        r.reportedBy?.trim().toLowerCase() === userEmail &&
                        (r.status === "resolved" || r.status === "Resolved")
                    ).length,
                  ],
                ].map(([label, accent, value]) => (
                  <div key={label} className="my-reports-stat-card">
                    <span style={{ color: accent }}>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              {reports.filter(
                (report) => report.reportedBy?.trim().toLowerCase() === userEmail
              ).length === 0 ? (
                <div className="my-reports-empty">
                  <Package size={42} />
                  <h3>No reports yet</h3>
                  <p>Your lost and found reports will appear here.</p>

                  <div className="my-reports-empty-actions">
                    <button type="button" onClick={onReportLost}>
                      I Lost Something
                    </button>
                    <button type="button" onClick={onReportFound}>
                      I Found Something
                    </button>
                  </div>
                </div>
              ) : (
                <div className="my-reports-grid">
                  {reports
                    .filter(
                      (report) =>
                        report.reportedBy?.trim().toLowerCase() === userEmail
                    )
                    .slice()
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt || 0) -
                        new Date(a.createdAt || 0)
                    )
                    .map((report) => {
                      const resolved =
                        report.status === "resolved" ||
                        report.status === "Resolved";

                      return (
                        <button
                          type="button"
                          key={report.id}
                          className="my-report-card"
                          onClick={() => openReport(report)}
                        >
                          <div className="my-report-image">
                            {report.image ? (
                              <img
                                src={report.image}
                                alt={report.itemName || "Reported item"}
                              />
                            ) : (
                              <div className="my-report-placeholder">
                                {report.type === "found" ? "📦" : "🔎"}
                              </div>
                            )}

                            <span
                              className={
                                report.type === "found"
                                  ? "my-report-type found"
                                  : "my-report-type lost"
                              }
                            >
                              {report.type === "found" ? "FOUND" : "LOST"}
                            </span>
                          </div>

                          <div className="my-report-body">
                            <div className="my-report-title-row">
                              <strong>{report.itemName || "Unnamed Item"}</strong>
                              <span
                                className={
                                  resolved
                                    ? "my-report-status resolved"
                                    : "my-report-status active"
                                }
                              >
                                {resolved ? "Resolved" : "Active"}
                              </span>
                            </div>

                            <p className="my-report-description">
                              {report.description || "No description provided."}
                            </p>

                            <div className="my-report-details">
                              <span>
                                <MapPin size={14} />
                                {report.location || "SK Limbang"}
                              </span>

                              <span>
                                <CalendarDays size={14} />
                                {report.date || "Recently"}
                                {report.time ? ` · ${report.time}` : ""}
                              </span>
                            </div>

                            {resolved && (
                              <div className="my-report-resolved">
                                <CheckCircle2 size={15} />
                                Item Reunited
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="neon-welcome">


          <div className="welcome-copy">


            <span className="welcome-label">

              ✦ WELCOME BACK

            </span>


            <h1>

              Hello,{" "}

              <strong>
                {userName}!
              </strong>


              <span className="big-heart">
                ♥
              </span>

            </h1>


            <p>

              Ready to help something find
              its way home?

              <span>
                ✨
              </span>

            </p>


          </div>


          {/* POINTS */}

          <div className="neon-points-card">


            <div className="points-star">
              ☆
            </div>


            <div className="points-content">


              <strong>
                {points}
              </strong>


              <span>
                TOTAL POINTS
              </span>


            </div>


            <div className="points-heart">
              ♥
            </div>


          </div>


        </section>


        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="dashboard-content-layout">


          {/* =================================================
              LEADERBOARD
          ================================================= */}

          <section className="neon-leaderboard">


            <div className="leaderboard-heading">


              <div className="leaderboard-title">


                <div className="trophy-neon">

                  <Trophy size={31} />

                </div>


                <div className="leaderboard-title-text">

                  <span>
                    OUR SCHOOL HEROES
                  </span>


                  <h2>
                    LEADERBOARD
                  </h2>


                  <p>

                    Top Foundly contributors

                    <span>
                      {" "}♥ ♥
                    </span>

                  </p>


                </div>


              </div>


              <Sparkles
                className="leaderboard-sparkle"
                size={26}
              />


            </div>


            {/* TOP THREE */}

            <div className="top-three-leaders">


              {/* SECOND */}

              <div className="leader-card second-place">


                <div className="leader-crown">
                  ♡
                </div>


                <div className="leader-avatar purple">


                  {second.profileImage ? (

                    <img
                      src={
                        second.profileImage
                      }
                      alt={
                        second.name
                      }
                      className="leader-profile-image"
                    />

                  ) : (

                    second.avatar ||
                    "🌸"

                  )}


                </div>


                <div className="rank-number purple-text">
                  #2
                </div>


                <strong>
                  {second.name}
                </strong>


                <span>
                  {second.points} pts
                </span>


              </div>


              {/* FIRST */}

              <div className="leader-card first-place">


                <div className="leader-crown">
                  👑
                </div>


                <div className="leader-avatar pink">


                  {first.profileImage ? (

                    <img
                      src={
                        first.profileImage
                      }
                      alt={
                        first.name
                      }
                      className="leader-profile-image"
                    />

                  ) : (

                    first.avatar ||
                    "🌸"

                  )}


                </div>


                <div className="rank-number gold-text">


                  <span>
                    ★
                  </span>


                  #1


                  <span>
                    ★
                  </span>


                </div>


                <strong>
                  {first.name}
                </strong>


                <span>
                  {first.points} pts
                </span>


                <small>
                  TOP CONTRIBUTOR
                </small>


              </div>


              {/* THIRD */}

              <div className="leader-card third-place">


                <div className="leader-crown">
                  ♡
                </div>


                <div className="leader-avatar pink-purple">


                  {third.profileImage ? (

                    <img
                      src={
                        third.profileImage
                      }
                      alt={
                        third.name
                      }
                      className="leader-profile-image"
                    />

                  ) : (

                    third.avatar ||
                    "🌸"

                  )}


                </div>


                <div className="rank-number pink-text">
                  #3
                </div>


                <strong>
                  {third.name}
                </strong>


                <span>
                  {third.points} pts
                </span>


              </div>


            </div>


            {/* OTHER RANKINGS */}

            <div className="other-rankings">


              {otherRankings.map(
                (student, index) => {

                  const actualRank =
                    index + 4;


                  return (

                    <div
                      className={
                        student.currentUser
                          ? "ranking-row current"
                          : "ranking-row"
                      }
                      key={
                        `${student.name}-${actualRank}`
                      }
                    >


                      <div className="small-rank">
                        {actualRank}
                      </div>


                      <div className="small-student-avatar">


                        {student.profileImage ? (

                          <img
                            src={
                              student.profileImage
                            }
                            alt={
                              student.name
                            }
                            className="small-profile-image"
                          />

                        ) : (

                          student.avatar ||
                          "🌸"

                        )}


                      </div>


                      <strong>
                        {student.name}
                      </strong>


                      <span>
                        {student.points} pts
                      </span>


                    </div>

                  );

                }
              )}


            </div>


            {/* YOUR RANK */}

            <div className="your-ranking-card">


              <div className="your-ranking-number">
                #{yourRank}
              </div>


              <div className="your-ranking-avatar">


                {profileImage ? (

                  <img
                    src={
                      profileImage
                    }
                    alt={
                      userName
                    }
                    className="your-profile-image"
                  />

                ) : (

                  "🌸"

                )}


              </div>


              <div className="your-ranking-info">


                <strong>
                  {userName}
                </strong>


                <span>
                  Your current ranking
                </span>


              </div>


              <div className="your-ranking-points">


                <strong>
                  {points}
                </strong>


                <span>
                  POINTS
                </span>


              </div>


            </div>


            {/* PROGRESS */}

            <div className="rank-progress">


              <div className="rank-progress-top">


                <span>
                  ✨ Keep contributing!
                </span>


                <span>
                  {points} points
                </span>


              </div>


              <div className="rank-progress-track">


                <div
                  className="rank-progress-fill"
                  style={{
                    width:
                      `${Math.min(
                        (points / 100) * 100,
                        100
                      )}%`,
                  }}
                />


              </div>


            </div>


          </section>


          {/* =================================================
              RIGHT COLUMN
          ================================================= */}

          <aside className="dashboard-right-column">


            <div className="report-heading">

              <span>
                WHAT WOULD YOU LIKE TO REPORT?
              </span>


              <Sparkles size={18} />

            </div>


            {/* LOST */}

            <button
              className="neon-report-button lost"
              onClick={
                onReportLost
              }
            >


              <div className="report-button-icon">

                <Search size={31} />

              </div>


              <div className="report-button-text">


                <strong>
                  I Lost Something
                </strong>


                <span>
                  Tell us what you're looking for
                </span>


              </div>


              <ArrowRight size={25} />


            </button>


            {/* FOUND */}

            <button
              className="neon-report-button found"
              onClick={
                onReportFound
              }
            >


              <div className="report-button-icon">

                <Package size={31} />

              </div>


              <div className="report-button-text">


                <strong>
                  I Found Something
                </strong>


                <span>
                  Help return it to its owner
                </span>


              </div>


              <ArrowRight size={25} />


            </button>


            {/* POINTS */}

            <div className="points-info-card">


              <div className="points-info-heart">
                ♡
              </div>


              <div>

                <span>
                  Every successful report earns
                </span>


                <strong>
                  +10 Points
                </strong>

              </div>


              <div className="wand">
                ✨
              </div>


            </div>


            {/* QUICK STATS */}

            <div className="quick-stats">


              <div className="quick-stat active">


                <div className="quick-stat-icon">

                  <Package size={25} />

                </div>


                <strong>
                  {activeReports.length}
                </strong>


                <span>
                  Active Reports
                </span>


                <div className="stat-wave">
                  〰〰
                </div>


              </div>


              <div className="quick-stat reunited">


                <div className="quick-stat-icon">

                  <Heart
                    size={25}
                    fill="currentColor"
                  />

                </div>


                <strong>
                  {resolvedReports.length}
                </strong>


                <span>
                  Items Reunited
                </span>


                <div className="stat-wave">
                  〰〰
                </div>


              </div>


            </div>


          </aside>


        </div>


        {/* =================================================
            RECENT LOST & FOUND
        ================================================= */}

        <section className="recent-reports-section">


          <div className="recent-heading">


            <div>

              <span>
                COMMUNITY
              </span>


              <h2>
                Recent Lost & Found
              </h2>


            </div>


            <div className="recent-search">


              <Search size={16} />


              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />


            </div>


          </div>


          {/* =================================================
              ACTIVE REPORTS
          ================================================= */}

          <div className="recent-category-heading active-heading">


            <div className="recent-category-title">


              <div className="category-dot active-dot">
              </div>


              <div>


                <strong>
                  ACTIVE REPORTS
                </strong>


                <span>
                  Items that are still looking for their owners
                </span>


              </div>


            </div>


            <div className="category-count active-count">

              {filteredActiveReports.length}

            </div>


          </div>


          <div className="recent-reports-grid">


            {filteredActiveReports.length === 0 ? (

              <div className="empty-report-card">


                <div className="empty-box-icon">
                  ✨
                </div>


                <strong>
                  No active reports
                </strong>


                <p>
                  There are currently no active reports.
                </p>


                <button
                  type="button"
                  onClick={
                    onReportLost
                  }
                >

                  <Plus size={15} />

                  Create Report

                </button>


              </div>

            ) : (

              filteredActiveReports
                .slice(0, 4)
                .map(
                  (report, index) => (

                    <button
                      type="button"
                      className="recent-report-card"
                      key={
                        report.id ||
                        index
                      }
                      onClick={() =>
                        openReport(
                          report
                        )
                      }
                    >


                      <div className="recent-report-image">


                        {report.image ? (

                          <img
                            src={
                              report.image
                            }
                            alt={
                              report.itemName ||
                              "Reported item"
                            }
                          />

                        ) : (

                          <div className="recent-report-image-placeholder">

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
                              ? "recent-type-badge found-badge"
                              : "recent-type-badge lost-badge"
                          }
                        >

                          {getReportType(
                            report
                          )}

                        </span>


                      </div>


                      <div className="recent-report-info">


                        <strong>
                          {report.itemName ||
                            "Unnamed Item"}
                        </strong>


                        <span>

                          <MapPin size={11} />

                          {report.location ||
                            "SK Limbang"}

                        </span>


                        <span>

                          <Clock size={11} />

                          {report.date
                            ? `${report.date}${
                                report.time
                                  ? ` · ${report.time}`
                                  : ""
                              }`
                            : "Recently"}

                        </span>


                      </div>


                      <div className="report-status">


                        <span />


                        Active


                      </div>


                      <ArrowRight
                        size={18}
                        className="recent-card-arrow"
                      />


                    </button>

                  )
                )

            )}


          </div>


          {/* =================================================
              COMPLETED REPORTS
          ================================================= */}

          <div className="recent-category-heading completed-heading">


            <div className="recent-category-title">


              <div className="category-dot completed-dot">

                ✓

              </div>


              <div>


                <strong>
                  COMPLETED REPORTS
                </strong>


                <span>
                  Items that have been successfully reunited
                </span>


              </div>


            </div>


            <div className="category-count completed-count">

              {filteredResolvedReports.length}

            </div>


          </div>


          <div className="recent-reports-grid completed-grid">


            {filteredResolvedReports.length === 0 ? (

              <div className="empty-report-card completed-empty">


                <div className="empty-box-icon">
                  💗
                </div>


                <strong>
                  No completed reports yet
                </strong>


                <p>
                  Resolved items will appear here.
                </p>


              </div>

            ) : (

              filteredResolvedReports
                .slice(0, 4)
                .map(
                  (report, index) => (

                    <button
                      type="button"
                      className="recent-report-card completed-report-card"
                      key={
                        report.id ||
                        index
                      }
                      onClick={() =>
                        openReport(
                          report
                        )
                      }
                    >


                      <div className="recent-report-image">


                        {report.image ? (

                          <img
                            src={
                              report.image
                            }
                            alt={
                              report.itemName ||
                              "Reported item"
                            }
                          />

                        ) : (

                          <div className="recent-report-image-placeholder">


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
                              ? "recent-type-badge found-badge"
                              : "recent-type-badge lost-badge"
                          }
                        >

                          {getReportType(
                            report
                          )}

                        </span>


                      </div>


                      <div className="recent-report-info">


                        <strong>
                          {report.itemName ||
                            "Unnamed Item"}
                        </strong>


                        <span>

                          <MapPin size={11} />

                          {report.location ||
                            "SK Limbang"}

                        </span>


                        <span>

                          <Clock size={11} />

                          {report.date
                            ? `${report.date}${
                                report.time
                                  ? ` · ${report.time}`
                                  : ""
                              }`
                            : "Recently"}

                        </span>


                      </div>


                      <div className="report-status resolved">


                        <CheckCircle2
                          size={13}
                        />


                        Resolved


                      </div>


                      <ArrowRight
                        size={18}
                        className="recent-card-arrow"
                      />


                    </button>

                  )
                )

            )}


          </div>


        </section>


        {/* =================================================
            COMMUNITY FEEDBACK
        ================================================= */}

        <section className="student-community-feedback">

          <div className="student-feedback-heading">

            <div>
              <span>
                OUR COMMUNITY
              </span>

              <h2>
                What Students Say
              </h2>

              <p>
                Real feedback from the Foundly community.
              </p>
            </div>


            <div className="student-feedback-rating-summary">

              <strong>
                {averageFeedbackRating}
              </strong>

              {renderFeedbackStars(
                Number(averageFeedbackRating)
              )}

              <span>
                {feedback.length} feedback
                {feedback.length === 1 ? "" : "s"}
              </span>

            </div>

          </div>


          {communityFeedback.length === 0 ? (

            <div className="student-feedback-empty">

              <div className="student-feedback-empty-icon">
                💗
              </div>

              <strong>
                Be the first to share your experience!
              </strong>

              <span>
                Your feedback can help improve Foundly for everyone in our school community.
              </span>

              <button
                type="button"
                onClick={handleFeedback}
              >
                <MessageCircle size={16} />
                Give Feedback
              </button>

            </div>

          ) : (

            <div className="student-feedback-grid">

              {communityFeedback.map((item) => (

                <article
                  className="student-feedback-card"
                  key={
                    item.id ||
                    `${item.email || item.name}-${item.createdAt || item.created_at}`
                  }
                >

                  <div className="student-feedback-card-top">

                    <div className="student-feedback-user">

                      <div className="student-feedback-avatar">
                        {(item.name || "F")
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>

                        <strong>
                          {item.name ||
                            "Foundly Member"}
                        </strong>

                        <span>
                          {item.category ||
                            "Foundly Experience"}
                        </span>

                      </div>

                    </div>


                    <span className="student-feedback-date">
                      {formatFeedbackDate(
                        item.createdAt ||
                          item.created_at
                      )}
                    </span>

                  </div>


                  <div className="student-feedback-rating-row">

                    {renderFeedbackStars(
                      item.rating
                    )}

                    <strong>
                      {item.rating || 0}/5
                    </strong>

                  </div>


                  <p className="student-feedback-comment">
                    “{item.comment ||
                      "No comment provided."}”
                  </p>

                </article>

              ))}

            </div>

          )}

        </section>


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="dashboard-footer">


          <div>


            <strong>
              Foundly<span>!</span>
            </strong>


            <small>
              The Lost & Found App
            </small>


          </div>


          <p>
            Made with 💗 by Debug Girls · SK Limbang
          </p>


        </footer>


      </main>


      {/* =====================================================
          REPORT DETAIL MODAL
      ===================================================== */}

      {selectedReport && (

        <div
          className="report-modal-overlay"
          onClick={
            closeReport
          }
        >


          <div
            className="report-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >


            {/* CLOSE */}

            <button
              type="button"
              className="report-modal-close"
              onClick={
                closeReport
              }
            >

              <X size={20} />

            </button>


            {/* IMAGE */}

            <div className="report-modal-image">


              {selectedReport.image ? (

                <img
                  src={
                    selectedReport.image
                  }
                  alt={
                    selectedReport.itemName ||
                    "Reported item"
                  }
                />

              ) : (

                <div className="report-modal-placeholder">

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
                    ? "modal-type found"
                    : "modal-type lost"
                }
              >

                {selectedReport.type ===
                "found"
                  ? "FOUND ITEM"
                  : "LOST ITEM"}

              </span>


            </div>


            {/* CONTENT */}

            <div className="report-modal-content">


              <span className="modal-small-label">

                FOUNDLY REPORT

              </span>


              <h2>

                {selectedReport.itemName ||
                  "Unnamed Item"}

              </h2>


              {/* STATUS */}

              <div className="modal-status">


                {selectedReport.status ===
                  "resolved" ||
                selectedReport.status ===
                  "Resolved" ? (

                  <>

                    <CheckCircle2 size={15} />

                    Resolved

                  </>

                ) : (

                  <>

                    <span />

                    Active Report

                  </>

                )}


              </div>


              {/* DESCRIPTION */}

              <div className="modal-detail">


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


              {/* LOCATION */}

              <div className="modal-detail">


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


              {/* DATE */}

              <div className="modal-detail">


                <CalendarDays size={17} />


                <div>


                  <strong>
                    Date & Time
                  </strong>


                  <p>


                    {selectedReport.date ||
                      "Not provided"}


                    {selectedReport.time
                      ? ` · ${selectedReport.time}`
                      : ""}


                  </p>


                </div>


              </div>


              {/* CONTACT */}

              <div className="modal-detail">


                <Phone size={17} />


                <div>


                  <strong>
                    Contact
                  </strong>


                  <p>

                    {selectedReport.phone ||
                      "Contact through Foundly."}

                  </p>


                </div>


              </div>


              {/* REPORTER */}

              <div className="modal-reporter">


                <div className="modal-reporter-avatar">

                  {selectedReport.reporterName
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "F"}

                </div>


                <div>


                  <span>
                    Reported by
                  </span>


                  <strong>
                    {selectedReport.reporterName ||
                      "Foundly Member"}
                  </strong>


                </div>


              </div>


              {/* MESSAGE REPORTER */}

              {selectedReport.reportedBy &&
                selectedReport.reportedBy
                  .toLowerCase() !==
                  userEmail && (

                  <button
                    type="button"
                    className="message-reporter-button"
                    onClick={() => {

                      const chatData = {

                        reportId:
                          selectedReport.id,

                        itemName:
                          selectedReport.itemName ||
                          "Reported Item",

                        reportType:
                          selectedReport.type ||
                          "lost",

                        reportStatus:
                          selectedReport.status ||
                          "active",

                        otherUser: {

                          email:
                            selectedReport.reportedBy,

                          name:
                            selectedReport.reporterName ||
                            "Foundly Member",

                        },

                      };


                      localStorage.setItem(
                        "foundlyPendingChat",
                        JSON.stringify(
                          chatData
                        )
                      );


                      setSelectedReport(
                        null
                      );


                      if (onMessages) {

                        onMessages();

                      }

                    }}
                  >

                    <MessageCircle
                      size={18}
                    />

                    Message Reporter

                    <ArrowRight
                      size={18}
                    />

                  </button>

                )}


              {/* CLAIM MESSAGE */}

              {claimMessage && (

                <div className="claim-success">


                  <CheckCircle2
                    size={18}
                  />


                  <span>
                    {claimMessage}
                  </span>


                </div>

              )}


              {/* CLAIM */}

              {(
                selectedReport.status !==
                  "resolved" &&
                selectedReport.status !==
                  "Resolved"
              ) && (

                selectedReport.reportedBy
                  ?.toLowerCase() !==
                  userEmail ? (

                  <button
                    type="button"
                    className="claim-report-button"
                    onClick={
                      handleClaimReport
                    }
                  >


                    {selectedReport.type ===
                    "found" ? (

                      <>

                        <Heart
                          size={19}
                          fill="currentColor"
                        />

                        This Is My Item — Claim It

                      </>

                    ) : (

                      <>

                        <Search size={19} />

                        I Found This Item

                      </>

                    )}


                    <ArrowRight
                      size={19}
                    />


                  </button>

                ) : (

                  <div className="own-report-note">


                    <Heart size={16} />


                    This is your own report.


                  </div>

                )

              )}


              {/* RESOLVED */}

              {(
                selectedReport.status ===
                  "resolved" ||
                selectedReport.status ===
                  "Resolved"
              ) && (

                <div className="resolved-message">


                  <CheckCircle2
                    size={19}
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


            </div>


          </div>


        </div>

      )}


    </div>

  );

}


export default Dashboard;