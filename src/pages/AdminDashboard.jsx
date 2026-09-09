import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  Users,
  FileText,
  MessageCircle,
  LogOut,
  Package,
  Search,
  CheckCircle2,
  Clock,
  Star,
  TrendingUp,
  AlertCircle,
  MapPin,
  CalendarDays,
  Phone,
  X,
  Sparkles,
  ShieldCheck,
  Trash2,
  Filter,
  Eye,
  UserRound,
  Heart,
  Mail,
  Bell,
} from "lucide-react";

import schoolLogo from "../assets/logo-sekolah.png";
import debugGirlsLogo from "../assets/debug-girls-logo.png";
import API_URL from "../api";

import "./AdminDashboard.css";


function AdminDashboard({
  currentAdmin,
  onLogout,
}) {

  /* =====================================================
     STATE
  ===================================================== */

  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [messages, setMessages] = useState([]);

  const [activeSection, setActiveSection] =
    useState("overview");

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [showNotifications, setShowNotifications] =
    useState(false);

  const [readNotifications, setReadNotifications] =
    useState(() => {

      try {

        return JSON.parse(
          localStorage.getItem(
            "foundlyAdminReadNotifications"
          ) || "[]"
        );

      } catch {

        return [];

      }

    });

  const [notificationsInitialized, setNotificationsInitialized] =
    useState(() =>
      localStorage.getItem(
        "foundlyAdminNotificationsInitialized"
      ) === "true"
    );

  const [searchReports, setSearchReports] =
    useState("");

  const [searchUsers, setSearchUsers] =
    useState("");

  const [searchFeedback, setSearchFeedback] =
    useState("");

  const [reportFilter, setReportFilter] =
    useState("all");


  /* =====================================================
     LOAD ADMIN DATA
  ===================================================== */

  const loadAdminData = async () => {
    /*
      SUPABASE DATA
      -----------------------------------------------------
      Reports  → GET /api/reports
      Users    → GET /api/users
      Messages → GET /api/messages

      Feedback is kept on localStorage for now.
      We will migrate Feedback in the next stage.
    */

    /* ---------------- REPORTS ---------------- */

    try {
      const response = await fetch(
        `${API_URL}/api/reports`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load reports."
        );
      }

      const loadedReports =
        Array.isArray(data.reports)
          ? data.reports
          : Array.isArray(data.data)
          ? data.data
          : [];

      setReports(
        loadedReports
      );
    } catch (error) {
      console.error(
        "Unable to load reports from Supabase:",
        error
      );

      setReports([]);
    }


    /* ---------------- USERS ---------------- */

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

      setUsers(
        loadedUsers
      );
    } catch (error) {
      console.error(
        "Unable to load users from Supabase:",
        error
      );

      setUsers([]);
    }


    /* ---------------- FEEDBACK ---------------- */

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

      setFeedback(
        loadedFeedback
      );
    } catch (error) {
      console.error(
        "Unable to load feedback from Supabase:",
        error
      );

      setFeedback([]);
    }


    /* ---------------- MESSAGES ---------------- */

    try {
      const response = await fetch(
        `${API_URL}/api/messages`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load messages."
        );
      }

      const loadedMessages =
        Array.isArray(
          data.messages
        )
          ? data.messages
          : Array.isArray(
              data.data
            )
          ? data.data
          : [];

      setMessages(
        loadedMessages
      );
    } catch (error) {
      console.error(
        "Unable to load messages from Supabase:",
        error
      );

      setMessages([]);
    }
  };


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    loadAdminData();

  }, []);


  /* =====================================================
     AUTO REFRESH
  ===================================================== */

  useEffect(() => {

    const handleFocus = () => {

      loadAdminData();

    };


    const handleStorage = () => {

      loadAdminData();

    };


    window.addEventListener(
      "focus",
      handleFocus
    );


    window.addEventListener(
      "storage",
      handleStorage
    );


    const interval =
      setInterval(
        loadAdminData,
        2000
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

  }, []);


  /* =====================================================
     SCHOOL USERS

     The admin account stays in Supabase for authentication,
     but must not be counted or displayed as a school user.
  ===================================================== */

  const schoolUsers =
    users.filter((user) => {
      const email =
        user.email
          ?.trim()
          .toLowerCase();

      return email !== "admin@foundly.edu.my";
    });

  /* =====================================================
     REPORT STATISTICS
  ===================================================== */

  const activeReports =
    reports.filter(
      (report) =>
        report.status !== "resolved" &&
        report.status !== "Resolved"
    );


  const resolvedReports =
    reports.filter(
      (report) =>
        report.status === "resolved" ||
        report.status === "Resolved"
    );


  const lostReports =
    reports.filter(
      (report) =>
        report.type === "lost"
    );


  const foundReports =
    reports.filter(
      (report) =>
        report.type === "found"
    );


  /* =====================================================
     TOTAL POINTS
     Read directly from Supabase/API user points.
     Do not use admin-browser localStorage overrides.
  ===================================================== */

  const totalPoints = schoolUsers.reduce(
    (total, user) =>
      total + Number(user.points || 0),
    0
  );


  /* =====================================================
     AVERAGE RATING
  ===================================================== */

  const averageRating =
    feedback.length > 0
      ? (
          feedback.reduce(
            (sum, item) =>
              sum +
              Number(
                item.rating || 0
              ),
            0
          ) /
          feedback.length
        ).toFixed(1)
      : "0.0";


  /* =====================================================
     FILTER REPORTS
  ===================================================== */

  const filteredReports =
    reports.filter((report) => {

      const keyword =
        searchReports
          .toLowerCase()
          .trim();


      const matchesSearch =
        !keyword ||
        report.itemName
          ?.toLowerCase()
          .includes(keyword) ||
        report.location
          ?.toLowerCase()
          .includes(keyword) ||
        report.reporterName
          ?.toLowerCase()
          .includes(keyword) ||
        report.reportedBy
          ?.toLowerCase()
          .includes(keyword);


      if (!matchesSearch) {

        return false;

      }


      if (
        reportFilter ===
        "active"
      ) {

        return (
          report.status !==
            "resolved" &&
          report.status !==
            "Resolved"
        );

      }


      if (
        reportFilter ===
        "resolved"
      ) {

        return (
          report.status ===
            "resolved" ||
          report.status ===
            "Resolved"
        );

      }


      if (
        reportFilter ===
        "lost"
      ) {

        return (
          report.type ===
          "lost"
        );

      }


      if (
        reportFilter ===
        "found"
      ) {

        return (
          report.type ===
          "found"
        );

      }


      return true;

    });


  /* =====================================================
     FILTER USERS
  ===================================================== */

  const filteredUsers =
    schoolUsers.filter((user) => {

      const keyword =
        searchUsers
          .toLowerCase()
          .trim();


      if (!keyword) {

        return true;

      }


      return (

        user.name
          ?.toLowerCase()
          .includes(keyword)

        ||

        user.email
          ?.toLowerCase()
          .includes(keyword)

      );

    });


  /* =====================================================
     FILTER FEEDBACK
  ===================================================== */

  const filteredFeedback =
    feedback.filter((item) => {

      const keyword =
        searchFeedback
          .toLowerCase()
          .trim();


      if (!keyword) {

        return true;

      }


      return (

        item.name
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.email
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.category
          ?.toLowerCase()
          .includes(keyword)

        ||

        item.comment
          ?.toLowerCase()
          .includes(keyword)

      );

    });


  /* =====================================================
     USER REPORTS
  ===================================================== */

  const getUserReports = (
    user
  ) => {

    const userEmail =
      user.email
        ?.trim()
        .toLowerCase();


    return reports.filter(
      (report) =>
        report.reportedBy
          ?.trim()
          .toLowerCase() ===
        userEmail
    );

  };


  /* =====================================================
     USER STATS
  ===================================================== */

  const getUserStats = (
    user
  ) => {

    const userReports =
      getUserReports(
        user
      );


    const lost =
      userReports.filter(
        (report) =>
          report.type ===
          "lost"
      ).length;


    const found =
      userReports.filter(
        (report) =>
          report.type ===
          "found"
      ).length;


    const reunited =
      userReports.filter(
        (report) =>
          report.status ===
            "resolved" ||
          report.status ===
            "Resolved"
      ).length;


    return {

      total:
        userReports.length,

      lost,

      found,

      reunited,

    };

  };


  /* =====================================================
     USER POINTS
  ===================================================== */

  const getUserPoints = (
    user
  ) => {
    /*
      Points are now read directly from Supabase.
      No localStorage override is used.
    */

    return (
      Number(
        user?.points || 0
      ) || 0
    );
  };


  /* =====================================================
     DATE
  ===================================================== */

  const formatDate = (
    date
  ) => {

    if (!date) {

      return "—";

    }


    try {

      return new Date(
        date
      ).toLocaleDateString(
        "en-MY",
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",
        }
      );

    } catch {

      return "—";

    }

  };


  /* =====================================================
     DATE TIME
  ===================================================== */

  const formatDateTime = (
    date
  ) => {

    if (!date) {

      return "—";

    }


    try {

      return new Date(
        date
      ).toLocaleString(
        "en-MY",
        {
          day:
            "2-digit",

          month:
            "short",

          year:
            "numeric",

          hour:
            "2-digit",

          minute:
            "2-digit",
        }
      );

    } catch {

      return "—";

    }

  };


  /* =====================================================
     REPORT TYPE
  ===================================================== */

  const reportType =
    (report) => {

      return report.type ===
        "found"
        ? "FOUND"
        : "LOST";

    };


  /* =====================================================
     RATING STARS
  ===================================================== */

  const renderStars = (
    rating
  ) => {

    return (

      <div className="admin-rating-stars">

        {[1, 2, 3, 4, 5].map(
          (star) => (

            <Star
              key={star}
              size={15}
              fill={
                star <=
                Number(
                  rating || 0
                )
                  ? "currentColor"
                  : "none"
              }
            />

          )
        )}

      </div>

    );

  };


  /* =====================================================
     ACTIVITY
  ===================================================== */

  const recentActivity =
    useMemo(() => {

      const activity = [];


      reports.forEach(
        (report) => {

          activity.push({

            id:
              `report-${report.id}`,

            type:
              "report",

            title:
              report.type ===
              "found"
                ? "New found report"
                : "New lost report",

            description:
              report.itemName ||
              "Unnamed item",

            date:
              report.createdAt,

          });


          if (
            report.status ===
              "resolved" ||
            report.status ===
              "Resolved"
          ) {

            activity.push({

              id:
                `resolved-${report.id}`,

              type:
                "resolved",

              title:
                "Item reunited",

              description:
                report.itemName ||
                "Unnamed item",

              date:
                report.resolvedAt ||
                report.createdAt,

            });

          }

        }
      );


      feedback.forEach(
        (item) => {

          activity.push({

            id:
              `feedback-${item.id}`,

            type:
              "feedback",

            title:
              "New feedback",

            description:
              `${item.rating || 0}/5 · ${
                item.category ||
                "General"
              }`,

            date:
              item.createdAt,

          });

        }
      );


      messages.forEach(
        (message) => {

          activity.push({

            id:
              `message-${message.id}`,

            type:
              "message",

            title:
              "New message",

            description:
              message.message ||
              "Message sent",

            date:
              message.createdAt,

          });

        }
      );


      schoolUsers.forEach(
        (user) => {

          activity.push({

            id:
              `user-${user.id || user.email}`,

            type:
              "user",

            title:
              "New user",

            description:
              `${
                user.name ||
                "A new user"
              } joined Foundly.`,

            date:
              user.createdAt,

          });

        }
      );


      return activity
        .sort(
          (a, b) =>
            new Date(
              b.date || 0
            ) -
            new Date(
              a.date || 0
            )
        )
        .slice(
          0,
          10
        );

    }, [
      reports,
      feedback,
      messages,
      schoolUsers,
    ]);


  /* =====================================================
     OPEN / CLOSE REPORT
  ===================================================== */

  const openReport = (
    report
  ) => {

    setSelectedReport(
      report
    );

  };


  const closeReport = () => {

    setSelectedReport(
      null
    );

  };


  /* =====================================================
     OPEN / CLOSE USER
  ===================================================== */

  const openUser = (
    user
  ) => {

    setSelectedUser(
      user
    );

    setShowNotifications(
      false
    );

  };


  const closeUser = () => {

    setSelectedUser(
      null
    );

  };


  /* =====================================================
     DELETE REPORT
  ===================================================== */

  const handleDeleteReport = (
    reportId
  ) => {

    const report =
      reports.find(
        (item) =>
          item.id ===
          reportId
      );


    if (!report) {

      return;

    }


    const confirmed =
      window.confirm(
        `Delete "${
          report.itemName ||
          "this report"
        }"?\n\nThis report will be removed from Foundly and cannot be undone.`
      );


    if (!confirmed) {

      return;

    }


    try {

      const savedReports =
        JSON.parse(
          localStorage.getItem(
            "foundlyReports"
          ) || "[]"
        );


      const updatedReports =
        savedReports.filter(
          (item) =>
            item.id !==
            reportId
        );


      localStorage.setItem(
        "foundlyReports",
        JSON.stringify(
          updatedReports
        )
      );


      setReports(
        updatedReports
      );


      if (
        selectedReport?.id ===
        reportId
      ) {

        setSelectedReport(
          null
        );

      }

    } catch (error) {

      console.error(
        "Unable to delete report:",
        error
      );


      alert(
        "Unable to delete this report. Please try again."
      );

    }

  };


  /* =====================================================
     DELETE USER
  ===================================================== */

  const handleDeleteUser = (
    user
  ) => {

    if (!user) {

      return;

    }


    const userName =
      user.name ||
      "this user";


    const userEmail =
      user.email
        ?.trim()
        .toLowerCase() || "";


    const confirmed =
      window.confirm(
        `Delete "${userName}" account?\n\nThe user's account and stored points will be removed.\nExisting reports will remain in the system.\n\nThis action cannot be undone.`
      );


    if (!confirmed) {

      return;

    }


    try {

      const savedUsers =
        JSON.parse(
          localStorage.getItem(
            "foundlyUsers"
          ) || "[]"
        );


      const updatedUsers =
        savedUsers.filter(
          (item) =>
            item.email
              ?.trim()
              .toLowerCase() !==
            userEmail
        );


      localStorage.setItem(
        "foundlyUsers",
        JSON.stringify(
          updatedUsers
        )
      );


      if (userEmail) {

        localStorage.removeItem(
          `foundlyPoints_${userEmail}`
        );

      }


      setUsers(
        updatedUsers
      );


      setSelectedUser(
        null
      );

    } catch (error) {

      console.error(
        "Unable to delete user:",
        error
      );


      alert(
        "Unable to delete this user. Please try again."
      );

    }

  };


  /* =====================================================
     DELETE FEEDBACK
  ===================================================== */

  const handleDeleteFeedback = async (
    feedbackId
  ) => {

    const item =
      feedback.find(
        (feedbackItem) =>
          feedbackItem.id ===
          feedbackId
      );


    if (!item) {

      return;

    }


    const confirmed =
      window.confirm(
        "Delete this feedback?\n\nThis feedback will be permanently removed from Foundly and cannot be undone."
      );


    if (!confirmed) {

      return;

    }


    try {

      const response = await fetch(
        `${API_URL}/api/feedback/${feedbackId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete feedback."
        );
      }

      setFeedback(
        (currentFeedback) =>
          currentFeedback.filter(
            (feedbackItem) =>
              feedbackItem.id !==
              feedbackId
          )
      );

      loadAdminData();

    } catch (error) {

      console.error(
        "Unable to delete feedback:",
        error
      );


      alert(
        error.message ||
          "Unable to delete this feedback. Please try again."
      );

    }

  };


  /* =====================================================
     ADMIN NOTIFICATIONS
  ===================================================== */

  const adminNotifications = [

    ...reports.map(
      (report) => ({

        id:
          `notification-report-${report.id}`,

        type:
          "report",

        title:
          report.type ===
          "found"
            ? "New Found Report"
            : "New Lost Report",

        description:
          report.itemName ||
          "A new report was submitted.",

        date:
          report.createdAt,

        section:
          "reports",

      })
    ),


    ...reports
      .filter(
        (report) =>
          report.status ===
            "resolved" ||
          report.status ===
            "Resolved"
      )
      .map(
        (report) => ({

          id:
            `notification-resolved-${report.id}`,

          type:
            "resolved",

          title:
            "Item Reunited",

          description:
            report.itemName ||
            "An item has been successfully claimed.",

          date:
            report.resolvedAt ||
            report.createdAt,

          section:
            "reports",

        })
      ),


    ...schoolUsers.map(
      (user) => ({

        id:
          `notification-user-${
            user.id ||
            user.email
          }`,

        type:
          "user",

        title:
          "New User",

        description:
          `${
            user.name ||
            "A new user"
          } joined Foundly.`,

        date:
          user.createdAt,

        section:
          "users",

      })
    ),


    ...feedback.map(
      (item) => ({

        id:
          `notification-feedback-${item.id}`,

        type:
          "feedback",

        title:
          "New Feedback",

        description:
          `${item.rating || 0}/5 rating submitted.`,

        date:
          item.createdAt,

        section:
          "feedback",

      })
    ),

  ]
    .sort(
      (a, b) =>
        new Date(
          b.date || 0
        ) -
        new Date(
          a.date || 0
        )
    );


  /* =====================================================
     INITIALIZE OLD NOTIFICATIONS AS READ
  ===================================================== */

  useEffect(() => {

    if (
      notificationsInitialized
    ) {

      return;

    }


    /*
      Bila sistem unread notification
      pertama kali digunakan, notification
      yang memang sudah wujud dianggap READ.
    */

    if (
      adminNotifications.length ===
      0
    ) {

      return;

    }


    const initialIds =
      adminNotifications.map(
        (notification) =>
          notification.id
      );


    localStorage.setItem(
      "foundlyAdminReadNotifications",
      JSON.stringify(
        initialIds
      )
    );


    localStorage.setItem(
      "foundlyAdminNotificationsInitialized",
      "true"
    );


    setReadNotifications(
      initialIds
    );


    setNotificationsInitialized(
      true
    );

  }, [
    adminNotifications.length,
    notificationsInitialized,
  ]);


  /* =====================================================
     UNREAD NOTIFICATIONS
  ===================================================== */

  const unreadNotifications =
    adminNotifications.filter(
      (notification) =>
        !readNotifications.includes(
          notification.id
        )
    );


  const notificationCount =
    unreadNotifications.length;


  /* =====================================================
     MARK ONE AS READ
  ===================================================== */

  const markNotificationAsRead = (
    notificationId
  ) => {

    if (
      readNotifications.includes(
        notificationId
      )
    ) {

      return;

    }


    const updatedReadNotifications = [

      ...readNotifications,

      notificationId,

    ];


    localStorage.setItem(
      "foundlyAdminReadNotifications",
      JSON.stringify(
        updatedReadNotifications
      )
    );


    setReadNotifications(
      updatedReadNotifications
    );

  };


  /* =====================================================
     MARK ALL AS READ
  ===================================================== */

  const markAllNotificationsAsRead = () => {

    const allIds =
      adminNotifications.map(
        (notification) =>
          notification.id
      );


    localStorage.setItem(
      "foundlyAdminReadNotifications",
      JSON.stringify(
        allIds
      )
    );


    setReadNotifications(
      allIds
    );

  };


  /* =====================================================
     NOTIFICATION CLICK
  ===================================================== */

  const handleNotificationClick = (
    notification
  ) => {

    markNotificationAsRead(
      notification.id
    );


    setShowNotifications(
      false
    );


    setActiveSection(
      notification.section
    );

  };


  /* =====================================================
     NAVIGATION
  ===================================================== */

  const renderNavButton = (
    section,
    icon,
    label,
    count
  ) => {

    return (

      <button
        type="button"

        className={
          activeSection ===
          section
            ? "admin-nav active"
            : "admin-nav"
        }

        onClick={() => {

          setActiveSection(
            section
          );

          setShowNotifications(
            false
          );

        }}
      >

        {icon}

        <span>
          {label}
        </span>


        {count !== undefined && (

          <b>
            {count}
          </b>

        )}

      </button>

    );

  };


  /* =====================================================
     RETURN
  ===================================================== */

  return (

    <div className="admin-dashboard-page">


      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside className="admin-sidebar">


        <div className="admin-sidebar-brand">

          <img
            src={debugGirlsLogo}
            alt="Debug Girls"
          />


          <div>

            <strong>
              Foundly!
            </strong>

            <span>
              Admin Panel
            </span>

          </div>

        </div>


        <div className="admin-school-box">

          <img
            src={schoolLogo}
            alt="SK Limbang"
          />


          <div>

            <strong>
              SK LIMBANG
            </strong>

            <span>
              Administration
            </span>

          </div>

        </div>


        <nav className="admin-navigation">


          {renderNavButton(
            "overview",
            <LayoutDashboard
              size={19}
            />,
            "Overview"
          )}


          {renderNavButton(
            "reports",
            <FileText
              size={19}
            />,
            "All Reports",
            reports.length
          )}


          {renderNavButton(
            "users",
            <Users
              size={19}
            />,
            "Users",
            schoolUsers.length
          )}


          {renderNavButton(
            "feedback",
            <MessageCircle
              size={19}
            />,
            "Feedback",
            feedback.length
          )}


          <button
            type="button"
            className="admin-logout"
            onClick={onLogout}
          >

            <LogOut
              size={18}
            />

            <span>
              Logout
            </span>

          </button>


        </nav>


        <div className="admin-sidebar-bottom">


          <div className="admin-account">

            <div className="admin-account-icon">

              <ShieldCheck
                size={19}
              />

            </div>


            <div>

              <strong>

                {currentAdmin?.name ||
                  "Foundly Admin"}

              </strong>

              <span>
                Administrator
              </span>

            </div>

          </div>


        </div>


      </aside>


      {/* =================================================
          MAIN
      ================================================= */}

      <main className="admin-main">


        {/* =================================================
            TOPBAR
        ================================================= */}

        <header className="admin-topbar">


          <div>

            <span>
              FOUNDLY ADMINISTRATION
            </span>


            <h1>

              {activeSection ===
                "overview" &&
                "Admin Overview"}


              {activeSection ===
                "reports" &&
                "All Reports"}


              {activeSection ===
                "users" &&
                "School Users"}


              {activeSection ===
                "feedback" &&
                "User Feedback"}

            </h1>

          </div>


          <div className="admin-topbar-right">


            {/* =================================================
                NOTIFICATION
            ================================================= */}

            <div
              className="admin-notification-wrapper"
              style={{
                position:
                  "relative",
              }}
            >


              <button
                type="button"
                className="admin-notification-button"
                onClick={() =>
                  setShowNotifications(
                    !showNotifications
                  )
                }
              >

                <Bell
                  size={24}
                />


                {notificationCount >
                  0 && (

                  <span className="admin-notification-badge">

                    {notificationCount}

                  </span>

                )}

              </button>


              {showNotifications && (

                <div className="admin-notification-panel">


                  {/* HEADER */}

                  <div className="admin-notification-heading">

                    <div>
                      <span>
                        FOUNDLY ACTIVITY
                      </span>

                      <strong>
                        Notifications
                      </strong>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {unreadNotifications.length > 0 && (
                        <button
                          type="button"
                          onClick={markAllNotificationsAsRead}
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#ff78b5",
                            fontSize: "9px",
                            fontWeight: 900,
                            cursor: "pointer",
                            padding: "4px",
                            fontFamily: "inherit",
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
                          width: "32px",
                          height: "32px",
                          minWidth: "32px",
                          minHeight: "32px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          margin: 0,
                          border: "1px solid rgba(255, 80, 160, 0.5)",
                          borderRadius: "50%",
                          background: "rgba(255, 45, 125, 0.12)",
                          color: "#ff78b5",
                          cursor: "pointer",
                          appearance: "none",
                          WebkitAppearance: "none",
                          flexShrink: 0,
                          zIndex: 9999,
                        }}
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    </div>

                  </div>

                  {/* LIST */}

                  {adminNotifications.length ===
                  0 ? (

                    <div className="admin-notification-empty">

                      <Sparkles
                        size={25}
                      />

                      <strong>
                        You're all caught up!
                      </strong>

                      <span>
                        New Foundly activity
                        will appear here.
                      </span>

                    </div>

                  ) : (

                    <div className="admin-notification-list">


                      {adminNotifications.map(
                        (notification) => {

                          const isUnread =
                            !readNotifications.includes(
                              notification.id
                            );


                          return (

                            <button
                              type="button"

                              className={
                                isUnread
                                  ? "admin-notification-item unread"
                                  : "admin-notification-item"
                              }

                              key={
                                notification.id
                              }

                              onClick={() =>
                                handleNotificationClick(
                                  notification
                                )
                              }
                            >


                              {/* ICON */}

                              <div
                                className={
                                  notification.type ===
                                  "resolved"
                                    ? "admin-notification-icon green"
                                    : notification.type ===
                                      "feedback"
                                    ? "admin-notification-icon purple"
                                    : notification.type ===
                                      "user"
                                    ? "admin-notification-icon blue"
                                    : "admin-notification-icon pink"
                                }
                              >

                                {notification.type ===
                                "resolved" ? (

                                  <CheckCircle2
                                    size={18}
                                  />

                                ) : notification.type ===
                                  "feedback" ? (

                                  <MessageCircle
                                    size={18}
                                  />

                                ) : notification.type ===
                                  "user" ? (

                                  <Users
                                    size={18}
                                  />

                                ) : (

                                  <FileText
                                    size={18}
                                  />

                                )}

                              </div>


                              {/* TEXT */}

                              <div className="admin-notification-text">


                                <strong>

                                  {notification.title}


                                  {isUnread && (

                                    <span className="notification-unread-dot">
                                      ●
                                    </span>

                                  )}

                                </strong>


                                <span>

                                  {
                                    notification.description
                                  }

                                </span>


                                <small>

                                  {
                                    formatDateTime(
                                      notification.date
                                    )
                                  }

                                </small>


                              </div>


                              <Eye
                                size={16}
                              />


                            </button>

                          );

                        }
                      )}


                    </div>

                  )}


                </div>

              )}

            </div>


            {/* LIVE */}

            <div className="admin-live-status">

              <span />

              Live Data

            </div>


            {/* ADMIN */}

            <div className="admin-topbar-avatar">

              <ShieldCheck
                size={20}
              />

            </div>


          </div>


        </header>


        {/* =================================================
            OVERVIEW
        ================================================= */}

        {activeSection ===
          "overview" && (

          <section className="admin-section">


            {/* WELCOME */}

            <div className="admin-welcome-card">


              <div>

                <span>
                  ✦ ADMIN CONTROL CENTRE
                </span>


                <h2>

                  Welcome,{" "}

                  {currentAdmin?.name ||
                    "Foundly Admin"}!

                </h2>


                <p>

                  Monitor reports, users,
                  points, feedback and
                  Foundly activity from
                  one place.

                </p>

              </div>


              <div className="admin-welcome-icon">

                <ShieldCheck
                  size={55}
                />

              </div>

            </div>


            {/* STATS */}

            <div className="admin-stat-grid">


              <div className="admin-stat-card pink">

                <div className="admin-stat-icon">

                  <Users
                    size={24}
                  />

                </div>

                <span>
                  TOTAL USERS
                </span>

                <strong>
                  {schoolUsers.length}
                </strong>

                <small>
                  Registered accounts
                </small>

              </div>


              <div className="admin-stat-card purple">

                <div className="admin-stat-icon">

                  <FileText
                    size={24}
                  />

                </div>

                <span>
                  TOTAL REPORTS
                </span>

                <strong>
                  {reports.length}
                </strong>

                <small>
                  Lost & found reports
                </small>

              </div>


              <div className="admin-stat-card red">

                <div className="admin-stat-icon">

                  <AlertCircle
                    size={24}
                  />

                </div>

                <span>
                  ACTIVE REPORTS
                </span>

                <strong>
                  {activeReports.length}
                </strong>

                <small>
                  Need attention
                </small>

              </div>


              <div className="admin-stat-card green">

                <div className="admin-stat-icon">

                  <CheckCircle2
                    size={24}
                  />

                </div>

                <span>
                  REUNITED
                </span>

                <strong>
                  {resolvedReports.length}
                </strong>

                <small>
                  Successfully resolved
                </small>

              </div>


              <div className="admin-stat-card gold">

                <div className="admin-stat-icon">

                  <Star
                    size={24}
                  />

                </div>

                <span>
                  TOTAL POINTS
                </span>

                <strong>
                  {totalPoints}
                </strong>

                <small>
                  Awarded to users
                </small>

              </div>


              <div className="admin-stat-card pink">

                <div className="admin-stat-icon">

                  <MessageCircle
                    size={24}
                  />

                </div>

                <span>
                  FEEDBACK
                </span>

                <strong>
                  {feedback.length}
                </strong>

                <small>
                  User responses
                </small>

              </div>


            </div>


            {/* REPORT OVERVIEW + FEEDBACK */}

            <div className="admin-two-column">


              <section className="admin-panel">


                <div className="admin-panel-heading">

                  <div>

                    <span>
                      REPORT OVERVIEW
                    </span>

                    <h3>
                      Lost vs Found
                    </h3>

                  </div>


                  <Package
                    size={21}
                  />

                </div>


                <div className="admin-report-bars">


                  <div className="admin-bar-row">

                    <div>

                      <span>
                        Lost Reports
                      </span>

                      <strong>
                        {lostReports.length}
                      </strong>

                    </div>


                    <div className="admin-bar-track">

                      <div
                        className="admin-bar-fill pink-fill"
                        style={{
                          width:
                            `${
                              reports.length
                                ? (
                                    lostReports.length /
                                    reports.length
                                  ) * 100
                                : 0
                            }%`,
                        }}
                      />

                    </div>

                  </div>


                  <div className="admin-bar-row">

                    <div>

                      <span>
                        Found Reports
                      </span>

                      <strong>
                        {foundReports.length}
                      </strong>

                    </div>


                    <div className="admin-bar-track">

                      <div
                        className="admin-bar-fill purple-fill"
                        style={{
                          width:
                            `${
                              reports.length
                                ? (
                                    foundReports.length /
                                    reports.length
                                  ) * 100
                                : 0
                            }%`,
                        }}
                      />

                    </div>

                  </div>


                  <div className="admin-bar-row">

                    <div>

                      <span>
                        Resolved
                      </span>

                      <strong>
                        {resolvedReports.length}
                      </strong>

                    </div>


                    <div className="admin-bar-track">

                      <div
                        className="admin-bar-fill green-fill"
                        style={{
                          width:
                            `${
                              reports.length
                                ? (
                                    resolvedReports.length /
                                    reports.length
                                  ) * 100
                                : 0
                            }%`,
                        }}
                      />

                    </div>

                  </div>


                </div>


              </section>


              <section className="admin-panel">


                <div className="admin-panel-heading">

                  <div>

                    <span>
                      USER EXPERIENCE
                    </span>

                    <h3>
                      Feedback Summary
                    </h3>

                  </div>


                  <Star
                    size={21}
                  />

                </div>


                <div className="feedback-summary">

                  <strong>
                    {averageRating}
                  </strong>


                  {renderStars(
                    Number(
                      averageRating
                    )
                  )}


                  <span>
                    Average rating
                  </span>


                  <b>

                    {feedback.length}
                    {" "}
                    submissions

                  </b>

                </div>


              </section>


            </div>


            {/* RECENT ACTIVITY */}

            <section className="admin-panel">


              <div className="admin-panel-heading">

                <div>

                  <span>
                    ACTIVITY
                  </span>

                  <h3>
                    Recent Activity
                  </h3>

                </div>


                <TrendingUp
                  size={21}
                />

              </div>


              <div className="admin-activity-list">


                {recentActivity.length ===
                0 ? (

                  <div className="admin-empty">

                    <Sparkles
                      size={27}
                    />

                    <strong>
                      No activity yet
                    </strong>

                    <span>
                      New reports, messages
                      and feedback will
                      appear here.
                    </span>

                  </div>

                ) : (

                  recentActivity.map(
                    (item) => (

                      <div
                        className="admin-activity-row"
                        key={
                          item.id
                        }
                      >

                        <div
                          className={
                            item.type ===
                            "resolved"
                              ? "activity-icon green"
                              : item.type ===
                                "feedback"
                              ? "activity-icon purple"
                              : item.type ===
                                "message"
                              ? "activity-icon blue"
                              : item.type ===
                                "user"
                              ? "activity-icon blue"
                              : "activity-icon pink"
                          }
                        >

                          {item.type ===
                          "resolved" ? (

                            <CheckCircle2
                              size={18}
                            />

                          ) : item.type ===
                            "feedback" ? (

                            <MessageCircle
                              size={18}
                            />

                          ) : item.type ===
                            "user" ? (

                            <Users
                              size={18}
                            />

                          ) : item.type ===
                            "message" ? (

                            <MessageCircle
                              size={18}
                            />

                          ) : (

                            <FileText
                              size={18}
                            />

                          )}

                        </div>


                        <div>

                          <strong>
                            {item.title}
                          </strong>

                          <span>
                            {item.description}
                          </span>

                        </div>


                        <small>

                          {formatDate(
                            item.date
                          )}

                        </small>

                      </div>

                    )
                  )

                )}


              </div>


            </section>


          </section>

        )}


        {/* =================================================
            REPORTS
        ================================================= */}

        {activeSection ===
          "reports" && (

          <section className="admin-section">


            <div className="admin-toolbar">


              <div>

                <span>
                  REPORT MANAGEMENT
                </span>


                <h2>

                  {filteredReports.length}
                  {" "}
                  reports

                </h2>

              </div>


              <div className="admin-search">

                <Search
                  size={16}
                />

                <input
                  type="text"
                  placeholder="Search item, reporter, location..."
                  value={
                    searchReports
                  }
                  onChange={(event) =>
                    setSearchReports(
                      event.target.value
                    )
                  }
                />

              </div>


            </div>


            <div className="admin-report-filters">


              <Filter
                size={15}
              />


              {[
                ["all", "All"],
                ["active", "Active"],
                ["resolved", "Resolved"],
                ["lost", "Lost"],
                ["found", "Found"],
              ].map(
                ([value, label]) => (

                  <button
                    type="button"
                    key={value}
                    className={
                      reportFilter ===
                      value
                        ? "report-filter active"
                        : "report-filter"
                    }
                    onClick={() =>
                      setReportFilter(
                        value
                      )
                    }
                  >

                    {label}

                  </button>

                )
              )}


            </div>


            <div className="admin-table-panel">


              <div className="admin-table-scroll">


                <table className="admin-table">


                  <thead>

                    <tr>

                      <th>
                        ITEM
                      </th>

                      <th>
                        TYPE
                      </th>

                      <th>
                        REPORTER
                      </th>

                      <th>
                        LOCATION
                      </th>

                      <th>
                        DATE
                      </th>

                      <th>
                        STATUS
                      </th>

                      <th>
                        ACTION
                      </th>

                    </tr>

                  </thead>


                  <tbody>


                    {filteredReports.length ===
                    0 ? (

                      <tr>

                        <td
                          colSpan="7"
                          className="admin-table-empty"
                        >

                          No reports found.

                        </td>

                      </tr>

                    ) : (

                      filteredReports
                        .slice()
                        .sort(
                          (a, b) =>
                            new Date(
                              b.createdAt ||
                              0
                            ) -
                            new Date(
                              a.createdAt ||
                              0
                            )
                        )
                        .map(
                          (report) => (

                            <tr
                              key={
                                report.id
                              }
                            >


                              <td>

                                <div className="admin-item-cell">


                                  <div className="admin-item-image">


                                    {report.image ? (

                                      <img
                                        src={
                                          report.image
                                        }
                                        alt={
                                          report.itemName ||
                                          "Item"
                                        }
                                      />

                                    ) : (

                                      report.type ===
                                      "found"
                                        ? "📦"
                                        : "🔎"

                                    )}


                                  </div>


                                  <strong>

                                    {report.itemName ||
                                      "Unnamed Item"}

                                  </strong>


                                </div>

                              </td>


                              <td>

                                <span
                                  className={
                                    report.type ===
                                    "found"
                                      ? "admin-type found"
                                      : "admin-type lost"
                                  }
                                >

                                  {reportType(
                                    report
                                  )}

                                </span>

                              </td>


                              <td>

                                <div className="admin-reporter-cell">

                                  <strong>

                                    {report.reporterName ||
                                      "Foundly Member"}

                                  </strong>


                                  <span>

                                    {report.reportedBy ||
                                      "—"}

                                  </span>

                                </div>

                              </td>


                              <td>

                                <span className="admin-location-cell">

                                  <MapPin
                                    size={13}
                                  />

                                  {report.location ||
                                    "—"}

                                </span>

                              </td>


                              <td>

                                {formatDate(
                                  report.createdAt
                                )}

                              </td>


                              <td>


                                {report.status ===
                                  "resolved" ||
                                report.status ===
                                  "Resolved" ? (

                                  <span className="admin-status resolved">

                                    <CheckCircle2
                                      size={13}
                                    />

                                    Resolved

                                  </span>

                                ) : (

                                  <span className="admin-status active">

                                    <span />

                                    Active

                                  </span>

                                )}


                              </td>


                              <td>


                                <div className="admin-report-actions">


                                  <button
                                    type="button"
                                    className="admin-view-button"
                                    onClick={() =>
                                      openReport(
                                        report
                                      )
                                    }
                                  >

                                    <Eye
                                      size={13}
                                    />

                                    View

                                  </button>


                                  <button
                                    type="button"
                                    className="admin-delete-small"
                                    onClick={() =>
                                      handleDeleteReport(
                                        report.id
                                      )
                                    }
                                  >

                                    <Trash2
                                      size={13}
                                    />

                                  </button>


                                </div>


                              </td>


                            </tr>

                          )
                        )

                    )}


                  </tbody>


                </table>


              </div>


            </div>


          </section>

        )}


        {/* =================================================
            USERS
        ================================================= */}

        {activeSection ===
          "users" && (

          <section className="admin-section">


            <div className="admin-toolbar">


              <div>

                <span>
                  ACCOUNT MANAGEMENT
                </span>


                <h2>

                  {schoolUsers.length}
                  {" "}
                  registered users

                </h2>

              </div>


              <div className="admin-search">

                <Search
                  size={16}
                />

                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={
                    searchUsers
                  }
                  onChange={(event) =>
                    setSearchUsers(
                      event.target.value
                    )
                  }
                />

              </div>


            </div>


            <div className="admin-user-grid">


              {filteredUsers.length ===
              0 ? (

                <div className="admin-empty-panel">

                  <Users
                    size={35}
                  />

                  <strong>
                    No users found
                  </strong>

                </div>

              ) : (

                filteredUsers.map(
                  (user) => {

                    const userStats =
                      getUserStats(
                        user
                      );


                    return (

                      <button
                        type="button"
                        className="admin-user-card"
                        key={
                          user.id ||
                          user.email
                        }
                        onClick={() =>
                          openUser(
                            user
                          )
                        }
                      >


                        <div className="admin-user-card-top">


                          <div className="admin-user-avatar">


                            {user.profileImage ? (

                              <img
                                src={
                                  user.profileImage
                                }
                                alt={
                                  user.name ||
                                  "User"
                                }
                              />

                            ) : (

                              user.name
                                ?.charAt(0)
                                .toUpperCase() ||
                              "F"

                            )}


                          </div>


                          <div>


                            <strong>

                              {user.name ||
                                "Foundly Member"}

                            </strong>


                            <span>

                              {user.email ||
                                "—"}

                            </span>


                          </div>


                        </div>


                        <div className="admin-user-stats">


                          <div>

                            <span>
                              Points
                            </span>


                            <strong>

                              {
                                getUserPoints(
                                  user
                                )
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Reports
                            </span>


                            <strong>

                              {
                                userStats.total
                              }

                            </strong>

                          </div>


                        </div>


                        <div className="admin-user-card-bottom">


                          <span>
                            Lost{" "}
                            {
                              userStats.lost
                            }
                          </span>


                          <span>
                            Found{" "}
                            {
                              userStats.found
                            }
                          </span>


                          <span>
                            Reunited{" "}
                            {
                              userStats.reunited
                            }
                          </span>


                        </div>


                        <div className="admin-user-date">


                          Joined{" "}


                          {formatDate(
                            user.createdAt
                          )}


                          <Eye
                            size={13}
                          />


                        </div>


                      </button>

                    );

                  }
                )

              )}


            </div>


          </section>

        )}


        {/* =================================================
            FEEDBACK
        ================================================= */}

        {activeSection ===
          "feedback" && (

          <section className="admin-section">


            <div className="admin-toolbar">


              <div>

                <span>
                  USER EXPERIENCE
                </span>


                <h2>

                  {feedback.length}
                  {" "}
                  feedback submissions

                </h2>

              </div>


              <div className="admin-search">

                <Search
                  size={16}
                />

                <input
                  type="text"
                  placeholder="Search feedback..."
                  value={
                    searchFeedback
                  }
                  onChange={(event) =>
                    setSearchFeedback(
                      event.target.value
                    )
                  }
                />

              </div>


            </div>


            <div className="admin-feedback-overview">


              <div className="admin-feedback-overview-card">

                <span>
                  AVERAGE RATING
                </span>


                <strong>
                  {averageRating}
                </strong>


                {renderStars(
                  Number(
                    averageRating
                  )
                )}


              </div>


              <div className="admin-feedback-overview-card">

                <span>
                  TOTAL FEEDBACK
                </span>


                <strong>
                  {feedback.length}
                </strong>


                <small>
                  User responses
                </small>

              </div>


            </div>


            <div className="admin-feedback-grid">


              {filteredFeedback.length ===
              0 ? (

                <div className="admin-empty-panel">

                  <MessageCircle
                    size={35}
                  />


                  <strong>
                    No feedback yet
                  </strong>


                  <span>
                    Feedback submitted by users
                    will appear here.
                  </span>


                </div>

              ) : (

                filteredFeedback
                  .slice()
                  .sort(
                    (a, b) =>
                      new Date(
                        b.createdAt || 0
                      ) -
                      new Date(
                        a.createdAt || 0
                      )
                  )
                  .map(
                    (item) => (

                      <article
                        className="admin-feedback-card"
                        key={
                          item.id
                        }
                      >


                        <div className="admin-feedback-top">


                          <div className="admin-feedback-user">


                            <div className="admin-feedback-avatar">

                              {item.name
                                ?.charAt(0)
                                .toUpperCase() ||
                                "F"}

                            </div>


                            <div>

                              <strong>

                                {item.name ||
                                  "Foundly Member"}

                              </strong>


                              <span>

                                {item.email ||
                                  "—"}

                              </span>


                            </div>


                          </div>


                          <span className="admin-feedback-date">

                            {formatDateTime(
                              item.createdAt
                            )}

                          </span>


                        </div>


                        <div className="admin-feedback-rating">


                          {renderStars(
                            item.rating
                          )}


                          <strong>

                            {item.rating ||
                              0}/5

                          </strong>


                        </div>


                        <span className="admin-feedback-category">

                          {item.category ||
                            "General"}

                        </span>


                        <p>

                          “{item.comment ||
                            "No comment provided."}”

                        </p>


                        <button
                          type="button"
                          className="admin-feedback-delete"
                          onClick={() =>
                            handleDeleteFeedback(
                              item.id
                            )
                          }
                        >

                          <Trash2
                            size={15}
                          />

                          Delete Feedback

                        </button>


                      </article>

                    )
                  )

              )}


            </div>


          </section>

        )}


        {/* =================================================
            FOOTER
        ================================================= */}

        <footer className="admin-footer">


          <div>

            <strong>
              Foundly<span>!</span>
            </strong>


            <span>
              Admin Control Centre
            </span>

          </div>


          <p>
            Made with ♥ by Debug Girls · SK Limbang
          </p>


        </footer>


      </main>


      {/* =====================================================
          REPORT DETAIL MODAL
      ===================================================== */}

      {selectedReport && (

        <div
          className="admin-report-overlay"
          onClick={
            closeReport
          }
        >


          <div
            className="admin-report-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            <button
              type="button"
              className="admin-modal-close"
              onClick={
                closeReport
              }
            >

              <X
                size={19}
              />

            </button>


            <div className="admin-modal-image">


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

                <div>

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
                    ? "admin-modal-type found"
                    : "admin-modal-type lost"
                }
              >

                {reportType(
                  selectedReport
                )}

              </span>


            </div>


            <div className="admin-modal-content">


              <span>
                FOUNDLY REPORT
              </span>


              <h2>

                {selectedReport.itemName ||
                  "Unnamed Item"}

              </h2>


              <div className="admin-modal-status">


                {selectedReport.status ===
                  "resolved" ||
                selectedReport.status ===
                  "Resolved" ? (

                  <>

                    <CheckCircle2
                      size={15}
                    />

                    Resolved

                  </>

                ) : (

                  <>

                    <Clock
                      size={15}
                    />

                    Active

                  </>

                )}


              </div>


              <div className="admin-detail-list">


                <div>

                  <Search
                    size={16}
                  />

                  <span>
                    Description
                  </span>

                  <p>

                    {selectedReport.description ||
                      "—"}

                  </p>

                </div>


                <div>

                  <MapPin
                    size={16}
                  />

                  <span>
                    Location
                  </span>

                  <p>

                    {selectedReport.location ||
                      "—"}

                  </p>

                </div>


                <div>

                  <CalendarDays
                    size={16}
                  />

                  <span>
                    Date & Time
                  </span>

                  <p>

                    {selectedReport.date ||
                      "—"}

                    {selectedReport.time
                      ? ` · ${selectedReport.time}`
                      : ""}

                  </p>

                </div>


                <div>

                  <Phone
                    size={16}
                  />

                  <span>
                    Contact
                  </span>

                  <p>

                    {selectedReport.phone ||
                      "—"}

                  </p>

                </div>


              </div>


              <div className="admin-modal-reporter">


                <div className="admin-modal-reporter-avatar">

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


                  <small>

                    {selectedReport.reportedBy ||
                      "—"}

                  </small>

                </div>


              </div>


              {(
                selectedReport.claimedBy ||
                selectedReport.claimedByName
              ) && (

                <div className="admin-modal-resolved">


                  <CheckCircle2
                    size={18}
                  />


                  <div>

                    <strong>
                      Item Reunited
                    </strong>


                    <span>

                      Claimed by{" "}

                      {selectedReport.claimedByName ||
                        selectedReport.claimedBy ||
                        "Foundly Member"}

                    </span>

                  </div>


                </div>

              )}


              <button
                type="button"
                className="admin-delete-report-button"
                onClick={() =>
                  handleDeleteReport(
                    selectedReport.id
                  )
                }
              >

                <Trash2
                  size={17}
                />

                Delete Report

              </button>


            </div>


          </div>

        </div>

      )}


      {/* =====================================================
          USER DETAIL MODAL
      ===================================================== */}

      {selectedUser && (

        <div
          style={{
            position:
              "fixed",

            inset:
              0,

            zIndex:
              999999,

            width:
              "100vw",

            height:
              "100vh",

            background:
              "rgba(0,0,0,0.82)",

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            padding:
              "20px",

            boxSizing:
              "border-box",
          }}

          onClick={
            closeUser
          }
        >


          <div
            style={{
              width:
                "100%",

              maxWidth:
                "560px",

              maxHeight:
                "90vh",

              overflowY:
                "auto",

              background:
                "linear-gradient(145deg,#241620,#120b12)",

              border:
                "1px solid rgba(255,100,170,.45)",

              borderRadius:
                "22px",

              padding:
                "28px",

              boxSizing:
                "border-box",

              color:
                "#ffffff",

              boxShadow:
                "0 0 60px rgba(255,40,145,.25)",
            }}

            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* CLOSE */}

            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                marginBottom:
                  "10px",
              }}
            >

              <button
                type="button"

                onClick={
                  closeUser
                }

                style={{
                  width:
                    "36px",

                  height:
                    "36px",

                  padding:
                    0,

                  border:
                    "1px solid rgba(255,255,255,.15)",

                  borderRadius:
                    "50%",

                  background:
                    "rgba(255,255,255,.05)",

                  color:
                    "#ffffff",

                  cursor:
                    "pointer",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  appearance:
                    "none",
                }}
              >

                <X
                  size={19}
                />

              </button>

            </div>


            {/* USER HEADER */}

            <div
              style={{
                display:
                  "flex",

                alignItems:
                  "center",

                gap:
                  "16px",

                marginBottom:
                  "22px",
              }}
            >


              <div
                style={{
                  width:
                    "82px",

                  height:
                    "82px",

                  flexShrink:
                    0,

                  overflow:
                    "hidden",

                  borderRadius:
                    "50%",

                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  background:
                    "linear-gradient(135deg,#ff1678,#9635ff)",

                  color:
                    "#ffffff",

                  fontSize:
                    "27px",

                  fontWeight:
                    950,

                  border:
                    "3px solid rgba(255,120,180,.30)",

                  boxShadow:
                    "0 0 25px rgba(255,45,145,.20)",
                }}
              >


                {selectedUser?.profileImage ? (

                  <img
                    src={
                      selectedUser.profileImage
                    }

                    alt={
                      selectedUser?.name ||
                      "User"
                    }

                    style={{
                      width:
                        "100%",

                      height:
                        "100%",

                      objectFit:
                        "cover",

                      display:
                        "block",
                    }}
                  />

                ) : (

                  selectedUser?.name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  "F"

                )}


              </div>


              <div
                style={{
                  minWidth:
                    0,

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    "6px",
                }}
              >

                <div
                  style={{
                    color:
                      "#ff67ab",

                    fontSize:
                      "9px",

                    fontWeight:
                      950,

                    letterSpacing:
                      "1.7px",
                  }}
                >

                  FOUNDLY USER PROFILE

                </div>


                <h2
                  style={{
                    margin:
                      0,

                    color:
                      "#ffffff",

                    fontSize:
                      "27px",

                    fontWeight:
                      950,

                    lineHeight:
                      1.15,
                  }}
                >

                  {selectedUser?.name ||
                    "Foundly Member"}

                </h2>


                <div
                  style={{
                    color:
                      "#c7b5c1",

                    fontSize:
                      "10px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "5px",

                    wordBreak:
                      "break-word",
                  }}
                >

                  <Mail
                    size={13}
                    color="#ff65aa"
                  />

                  {selectedUser?.email ||
                    "No email"}

                </div>

              </div>


            </div>


            {/* POINTS + REPORTS */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "1fr 1fr",

                gap:
                  "12px",

                marginBottom:
                  "12px",
              }}
            >


              <div
                style={{
                  padding:
                    "16px",

                  border:
                    "1px solid rgba(255,150,200,.18)",

                  borderRadius:
                    "13px",

                  background:
                    "rgba(255,170,205,.07)",
                }}
              >

                <div
                  style={{
                    color:
                      "#a894a2",

                    fontSize:
                      "9px",

                    fontWeight:
                      800,

                    marginBottom:
                      "6px",
                  }}
                >

                  TOTAL POINTS

                </div>


                <strong
                  style={{
                    color:
                      "#ffffff",

                    fontSize:
                      "25px",

                    fontWeight:
                      950,
                  }}
                >

                  {
                    getUserPoints(
                      selectedUser
                    )
                  }

                </strong>

              </div>


              <div
                style={{
                  padding:
                    "16px",

                  border:
                    "1px solid rgba(255,150,200,.18)",

                  borderRadius:
                    "13px",

                  background:
                    "rgba(255,170,205,.07)",
                }}
              >

                <div
                  style={{
                    color:
                      "#a894a2",

                    fontSize:
                      "9px",

                    fontWeight:
                      800,

                    marginBottom:
                      "6px",
                  }}
                >

                  TOTAL REPORTS

                </div>


                <strong
                  style={{
                    color:
                      "#ffffff",

                    fontSize:
                      "25px",

                    fontWeight:
                      950,
                  }}
                >

                  {
                    getUserStats(
                      selectedUser
                    ).total
                  }

                </strong>

              </div>


            </div>


            {/* BREAKDOWN */}

            <div
              style={{
                display:
                  "grid",

                gridTemplateColumns:
                  "repeat(3,1fr)",

                gap:
                  "10px",

                marginBottom:
                  "14px",
              }}
            >


              <div
                style={{
                  padding:
                    "14px",

                  border:
                    "1px solid rgba(255,100,170,.18)",

                  borderRadius:
                    "12px",

                  background:
                    "rgba(255,90,160,.06)",
                }}
              >

                <div
                  style={{
                    color:
                      "#ff69aa",

                    fontSize:
                      "9px",

                    fontWeight:
                      900,

                    marginBottom:
                      "6px",
                  }}
                >

                  LOST

                </div>


                <strong
                  style={{
                    color:
                      "#ffffff",

                    fontSize:
                      "22px",

                    fontWeight:
                      950,
                  }}
                >

                  {
                    getUserStats(
                      selectedUser
                    ).lost
                  }

                </strong>

              </div>


              <div
                style={{
                  padding:
                    "14px",

                  border:
                    "1px solid rgba(160,90,255,.18)",

                  borderRadius:
                    "12px",

                  background:
                    "rgba(145,55,255,.06)",
                }}
              >

                <div
                  style={{
                    color:
                      "#b76dff",

                    fontSize:
                      "9px",

                    fontWeight:
                      900,

                    marginBottom:
                      "6px",
                  }}
                >

                  FOUND

                </div>


                <strong
                  style={{
                    color:
                      "#ffffff",

                    fontSize:
                      "22px",

                    fontWeight:
                      950,
                  }}
                >

                  {
                    getUserStats(
                      selectedUser
                    ).found
                  }

                </strong>

              </div>


              <div
                style={{
                  padding:
                    "14px",

                  border:
                    "1px solid rgba(70,210,135,.18)",

                  borderRadius:
                    "12px",

                  background:
                    "rgba(70,210,135,.06)",
                }}
              >

                <div
                  style={{
                    color:
                      "#70dca0",

                    fontSize:
                      "9px",

                    fontWeight:
                      900,

                    marginBottom:
                      "6px",
                  }}
                >

                  REUNITED

                </div>


                <strong
                  style={{
                    color:
                      "#ffffff",

                    fontSize:
                      "22px",

                    fontWeight:
                      950,
                  }}
                >

                  {
                    getUserStats(
                      selectedUser
                    ).reunited
                  }

                </strong>

              </div>

            </div>


            {/* ACCOUNT DETAILS */}

            <div
              style={{
                padding:
                  "16px",

                border:
                  "1px solid rgba(255,150,200,.18)",

                borderRadius:
                  "14px",

                background:
                  "rgba(255,170,205,.055)",

                marginBottom:
                  "15px",
              }}
            >

              <div
                style={{
                  display:
                    "grid",

                  gridTemplateColumns:
                    "105px 1fr",

                  gap:
                    "10px",

                  fontSize:
                    "10px",

                  lineHeight:
                    1.4,
                }}
              >

                <span
                  style={{
                    color:
                      "#988593",
                  }}
                >

                  Account Name

                </span>


                <strong>

                  {selectedUser?.name ||
                    "Foundly Member"}

                </strong>


                <span
                  style={{
                    color:
                      "#988593",
                  }}
                >

                  Delima Email

                </span>


                <strong
                  style={{
                    wordBreak:
                      "break-word",
                  }}
                >

                  {selectedUser?.email ||
                    "—"}

                </strong>


                <span
                  style={{
                    color:
                      "#988593",
                  }}
                >

                  Joined

                </span>


                <strong>

                  {
                    formatDate(
                      selectedUser?.createdAt
                    )
                  }

                </strong>


              </div>


            </div>


            {/* DELETE USER */}

            <button
              type="button"

              onClick={() =>
                handleDeleteUser(
                  selectedUser
                )
              }

              style={{
                width:
                  "100%",

                minHeight:
                  "48px",

                border:
                  "1px solid rgba(255,75,115,.50)",

                borderRadius:
                  "12px",

                background:
                  "linear-gradient(135deg,rgba(255,45,105,.13),rgba(160,55,255,.08))",

                color:
                  "#ff91ad",

                fontFamily:
                  "inherit",

                fontSize:
                  "11px",

                fontWeight:
                  950,

                cursor:
                  "pointer",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "center",

                gap:
                  "8px",

                appearance:
                  "none",
              }}
            >

              <Trash2
                size={17}
              />

              Delete User Account

            </button>

          </div>

        </div>

      )}


    </div>

  );

}


export default AdminDashboard;