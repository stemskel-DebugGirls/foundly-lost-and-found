import { useState } from "react";

import "./App.css";

/* =====================================================
   USER PAGES
===================================================== */

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

import ReportLost from "./pages/ReportLost";
import ReportFound from "./pages/ReportFound";

import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Feedback from "./pages/Feedback";
import MyReports from "./pages/MyReports";

/* =====================================================
   ADMIN PAGES
===================================================== */

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

/* =====================================================
   APP
===================================================== */

function App() {
  /* =====================================================
     CURRENT USER
  ===================================================== */

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser =
        localStorage.getItem(
          "foundlyCurrentUser"
        );

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch (error) {
      console.error(
        "Unable to load current user:",
        error
      );

      return null;
    }
  });

  /* =====================================================
     CURRENT ADMIN
  ===================================================== */

  const [currentAdmin, setCurrentAdmin] = useState(() => {
    try {
      const savedAdmin =
        localStorage.getItem(
          "foundlyAdmin"
        );

      return savedAdmin
        ? JSON.parse(savedAdmin)
        : null;
    } catch (error) {
      console.error(
        "Unable to load current admin:",
        error
      );

      return null;
    }
  });

  /* =====================================================
     INITIAL PAGE
  ===================================================== */

  const getInitialPage = () => {
    try {
      /* ADMIN URL */

      if (
        window.location.hash ===
        "#admin"
      ) {
        const savedAdmin =
          localStorage.getItem(
            "foundlyAdmin"
          );

        if (savedAdmin) {
          return "adminDashboard";
        }

        return "adminLogin";
      }

      /* ADMIN SESSION */

      if (
        localStorage.getItem(
          "foundlyAdmin"
        )
      ) {
        return "adminDashboard";
      }

      /* USER SESSION */

      if (
        localStorage.getItem(
          "foundlyCurrentUser"
        )
      ) {
        return "dashboard";
      }

      return "login";
    } catch (error) {
      console.error(
        "Unable to determine initial page:",
        error
      );

      return "login";
    }
  };

  /* =====================================================
     CURRENT PAGE
  ===================================================== */

  const [page, setPage] =
    useState(getInitialPage);

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const goToPage = (nextPage) => {
    setPage(nextPage);
  };

  /* =====================================================
     SAFE USER FOR LOCAL STORAGE
     
     IMPORTANT:
     DO NOT store profileImage/profile_image here.
     
     The image stays in React state / Supabase.
  ===================================================== */

  const createSafeLocalUser = (
    user
  ) => {
    if (!user) return null;

    return {
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
        user.reports ||
        0,
    };
  };

  /* =====================================================
     SAVE CURRENT USER SAFELY
  ===================================================== */

  const saveCurrentUserSafely = (
    user
  ) => {
    const safeUser =
      createSafeLocalUser(
        user
      );

    if (!safeUser) return;

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
    }

    /* =================================================
       SAVE POINTS
    ================================================= */

    try {
      const cleanEmail =
        safeUser.email
          ?.trim()
          .toLowerCase();

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
  };

  /* =====================================================
     UPDATE USERS CACHE SAFELY
     
     IMPORTANT:
     Existing Base64 images inside foundlyUsers
     are removed from the local cache.
  ===================================================== */

  const updateUsersCacheSafely = (
    updatedUser
  ) => {
    if (!updatedUser) return;

    const safeUpdatedUser =
      createSafeLocalUser(
        updatedUser
      );

    if (!safeUpdatedUser) return;

    const updatedEmail =
      safeUpdatedUser.email
        ?.trim()
        .toLowerCase();

    try {
      let savedUsers = [];

      try {
        savedUsers =
          JSON.parse(
            localStorage.getItem(
              "foundlyUsers"
            ) || "[]"
          );

        if (
          !Array.isArray(
            savedUsers
          )
        ) {
          savedUsers = [];
        }
      } catch {
        savedUsers = [];
      }

      /*
        Convert every old cached user into
        the lightweight format.

        This intentionally removes:
        profileImage
        profile_image
      */

      const safeUsers =
        savedUsers.map(
          (user) =>
            createSafeLocalUser(
              user
            )
        );

      const filteredUsers =
        safeUsers.filter(
          (user) =>
            user?.email
              ?.trim()
              .toLowerCase() !==
            updatedEmail
        );

      localStorage.setItem(
        "foundlyUsers",
        JSON.stringify([
          ...filteredUsers,
          safeUpdatedUser,
        ])
      );
    } catch (error) {
      console.warn(
        "Unable to update users cache:",
        error
      );

      /*
        Only remove local compatibility data.
        Nothing in Supabase is deleted.
      */

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
     UPDATE CURRENT USER
     IMPORTANT FOR PROFILE UPDATE
  ===================================================== */

  const handleProfileUpdated = (
    updatedUser
  ) => {
    if (!updatedUser) return;

    console.log(
      "Profile updated:",
      updatedUser
    );

    /*
      IMPORTANT:
      React receives COMPLETE user data,
      including profileImage.

      This means image can continue to show
      immediately in the application.
    */

    setCurrentUser(
      updatedUser
    );

    /*
      IMPORTANT:
      localStorage receives only safe/lightweight
      user data WITHOUT profile image.
    */

    saveCurrentUserSafely(
      updatedUser
    );

    /*
      Update local compatibility cache
      without Base64 image.
    */

    updateUsersCacheSafely(
      updatedUser
    );

    /* =================================================
       NOTIFY OTHER COMPONENTS
    ================================================= */

    window.dispatchEvent(
      new Event(
        "foundly-profile-updated"
      )
    );
  };

  /* =====================================================
     USER LOGIN
  ===================================================== */

  const handleLogin = (
    user
  ) => {
    if (!user) return;

    /*
      Keep COMPLETE user in React state.
      This includes the profile image returned
      from the server.
    */

    setCurrentUser(
      user
    );

    /*
      Save only lightweight data locally.
    */

    saveCurrentUserSafely(
      user
    );

    /*
      Update local compatibility cache.
    */

    updateUsersCacheSafely(
      user
    );

    /* =================================================
       REMOVE ADMIN SESSION
    ================================================= */

    setCurrentAdmin(
      null
    );

    localStorage.removeItem(
      "foundlyAdmin"
    );

    /* =================================================
       REMOVE #ADMIN
    ================================================= */

    if (
      window.location.hash ===
      "#admin"
    ) {
      window.history.replaceState(
        null,
        "",
        window.location.pathname +
          window.location.search
      );
    }

    goToPage(
      "dashboard"
    );
  };

  /* =====================================================
     USER SIGNUP
  ===================================================== */

  const handleSignup = (
    user
  ) => {
    if (!user) return;

    /*
      Keep complete user in React.
    */

    setCurrentUser(
      user
    );

    /*
      Save lightweight version only.
    */

    saveCurrentUserSafely(
      user
    );

    /*
      Update compatibility cache.
    */

    updateUsersCacheSafely(
      user
    );

    /* =================================================
       REMOVE ADMIN SESSION
    ================================================= */

    setCurrentAdmin(
      null
    );

    localStorage.removeItem(
      "foundlyAdmin"
    );

    goToPage(
      "dashboard"
    );
  };

  /* =====================================================
     USER LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem(
      "foundlyCurrentUser"
    );

    setCurrentUser(
      null
    );

    goToPage(
      "login"
    );
  };

  /* =====================================================
     ADMIN LOGIN
  ===================================================== */

  const handleAdminLogin = (
    adminUser
  ) => {
    setCurrentAdmin(
      adminUser
    );

    localStorage.setItem(
      "foundlyAdmin",
      JSON.stringify(
        adminUser
      )
    );

    /* =================================================
       REMOVE USER SESSION
    ================================================= */

    setCurrentUser(
      null
    );

    localStorage.removeItem(
      "foundlyCurrentUser"
    );

    /* =================================================
       REMOVE HASH
    ================================================= */

    window.history.replaceState(
      null,
      "",
      window.location.pathname +
        window.location.search
    );

    goToPage(
      "adminDashboard"
    );
  };

  /* =====================================================
     ADMIN LOGOUT
  ===================================================== */

  const handleAdminLogout = () => {
    localStorage.removeItem(
      "foundlyAdmin"
    );

    setCurrentAdmin(
      null
    );

    goToPage(
      "login"
    );
  };

  /* =====================================================
     ADMIN LOGIN PAGE
  ===================================================== */

  if (
    page ===
    "adminLogin"
  ) {
    return (
      <AdminLogin
        onAdminLogin={
          handleAdminLogin
        }
        onBack={() => {
          if (currentUser) {
            goToPage(
              "dashboard"
            );
          } else {
            goToPage(
              "login"
            );
          }
        }}
      />
    );
  }

  /* =====================================================
     ADMIN DASHBOARD
  ===================================================== */

  if (
    page ===
    "adminDashboard"
  ) {
    if (!currentAdmin) {
      return (
        <AdminLogin
          onAdminLogin={
            handleAdminLogin
          }
          onBack={() =>
            goToPage(
              "login"
            )
          }
        />
      );
    }

    return (
      <AdminDashboard
        currentAdmin={
          currentAdmin
        }
        onLogout={
          handleAdminLogout
        }
      />
    );
  }

  /* =====================================================
     SIGNUP PAGE
  ===================================================== */

  if (
    page ===
    "signup"
  ) {
    return (
      <Signup
        onSignup={
          handleSignup
        }
        onGoLogin={() =>
          goToPage(
            "login"
          )
        }
      />
    );
  }

  /* =====================================================
     LOGIN PAGE
  ===================================================== */

  if (!currentUser) {
    return (
      <Login
        onLogin={
          handleLogin
        }
        onGoSignup={() =>
          goToPage(
            "signup"
          )
        }
      />
    );
  }

  /* =====================================================
     REPORT LOST
  ===================================================== */

  if (
    page ===
    "reportLost"
  ) {
    return (
      <ReportLost
        currentUser={
          currentUser
        }
        onBack={() =>
          goToPage(
            "dashboard"
          )
        }
        onSuccess={() =>
          goToPage(
            "dashboard"
          )
        }
      />
    );
  }

  /* =====================================================
     REPORT FOUND
  ===================================================== */

  if (
    page ===
    "reportFound"
  ) {
    return (
      <ReportFound
        currentUser={
          currentUser
        }
        onBack={() =>
          goToPage(
            "dashboard"
          )
        }
        onSuccess={() =>
          goToPage(
            "dashboard"
          )
        }
      />
    );
  }

  /* =====================================================
     MY REPORTS
  ===================================================== */

  if (
    page ===
    "myReports"
  ) {
    return (
      <MyReports
        currentUser={
          currentUser
        }
        onBack={() =>
          goToPage(
            "dashboard"
          )
        }
      />
    );
  }

  /* =====================================================
     MESSAGES
  ===================================================== */

  if (
    page ===
    "messages"
  ) {
    return (
      <Messages
        currentUser={
          currentUser
        }
        onBack={() =>
          goToPage(
            "dashboard"
          )
        }
      />
    );
  }

  /* =====================================================
     FEEDBACK
  ===================================================== */

  if (
    page ===
    "feedback"
  ) {
    return (
      <Feedback
        currentUser={
          currentUser
        }
        onBack={() =>
          goToPage(
            "dashboard"
          )
        }
      />
    );
  }

  /* =====================================================
     PROFILE
  ===================================================== */

  if (
    page ===
    "profile"
  ) {
    return (
      <Profile
        currentUser={
          currentUser
        }
        onProfileUpdated={
          handleProfileUpdated
        }
        onBack={() =>
          goToPage(
            "dashboard"
          )
        }
      />
    );
  }

  /* =====================================================
     STUDENT DASHBOARD
  ===================================================== */

  return (
    <Dashboard
      currentUser={
        currentUser
      }

      onReportLost={() =>
        goToPage(
          "reportLost"
        )
      }

      onReportFound={() =>
        goToPage(
          "reportFound"
        )
      }

      onMyReports={() =>
        goToPage(
          "myReports"
        )
      }

      onMessages={() =>
        goToPage(
          "messages"
        )
      }

      onFeedback={() =>
        goToPage(
          "feedback"
        )
      }

      onProfile={() =>
        goToPage(
          "profile"
        )
      }

      onLogout={
        handleLogout
      }
    />
  );
}

export default App;