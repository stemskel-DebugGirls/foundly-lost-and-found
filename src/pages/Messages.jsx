import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeft,
  Search,
  Send,
  MessageCircle,
  Package,
  UserRound,
  Smile,
  X,
} from "lucide-react";

import API_URL from "../api";
import "./Messages.css";

function Messages({
  currentUser,
  onBack,
}) {
  /* =====================================================
     CURRENT USER
  ===================================================== */

  const userName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Foundly Member";

  const userEmail =
    currentUser?.email?.trim().toLowerCase() || "";

  const profileImage =
    currentUser?.profileImage || "";

  /* =====================================================
     STATE
  ===================================================== */

  const [currentUserId, setCurrentUserId] = useState(
    currentUser?.id || ""
  );

  const [allUsers, setAllUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [messages, setMessages] = useState([]);

  const [selectedChat, setSelectedChat] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* =====================================================
     FIND USER BY EMAIL
  ===================================================== */

  const findUserByEmail = (email) => {
    const cleanEmail = email?.trim().toLowerCase();

    if (!cleanEmail) {
      return null;
    }

    return (
      allUsers.find(
        (user) =>
          user.email?.trim().toLowerCase() === cleanEmail
      ) || null
    );
  };

  /* =====================================================
     LOAD USERS
  ===================================================== */

  const loadUsers = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/users`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load users.");
      }

      const data = await response.json();

      const users = Array.isArray(data.users)
        ? data.users
        : Array.isArray(data.data)
        ? data.data
        : [];

      setAllUsers(users);

      const matchedUser = users.find(
        (user) =>
          user.email?.trim().toLowerCase() === userEmail
      );

      if (matchedUser?.id) {
        setCurrentUserId(matchedUser.id);
      }
    } catch (error) {
      console.error("Unable to load users:", error);
    }
  };

  /* =====================================================
     LOAD REPORTS
  ===================================================== */

  const loadReports = async () => {
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

      if (!response.ok) {
        throw new Error("Unable to load reports.");
      }

      const data = await response.json();

      const reportData = Array.isArray(data.reports)
        ? data.reports
        : Array.isArray(data.data)
        ? data.data
        : [];

      setReports(reportData);
    } catch (error) {
      console.error("Unable to load reports:", error);
      setReports([]);
    }
  };

  /* =====================================================
     LOAD MESSAGES
  ===================================================== */

  const loadMessages = async (
    userIdOverride = null
  ) => {
    const userId =
      userIdOverride ||
      currentUserId ||
      currentUser?.id ||
      "";

    if (!userId) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Unable to load messages.");
      }

      const data = await response.json();

      if (
        data.success &&
        Array.isArray(data.messages)
      ) {
        setMessages(data.messages);
      } else if (
        data.success &&
        Array.isArray(data.data)
      ) {
        setMessages(data.data);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error(
        "Unable to load messages:",
        error
      );
    }
  };

  /* =====================================================
     LOAD EVERYTHING
  ===================================================== */

  const loadAllData = async () => {
    setErrorMessage("");

    try {
      setLoading(true);

      await loadUsers();
      await loadReports();

      let resolvedUserId =
        currentUserId ||
        currentUser?.id ||
        "";

      /*
        If current user id isn't available,
        find it again from users.
      */

      if (!resolvedUserId) {
        try {
          const response = await fetch(
            `${API_URL}/api/users`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();

            const users = Array.isArray(data.users)
              ? data.users
              : Array.isArray(data.data)
              ? data.data
              : [];

            const matched = users.find(
              (user) =>
                user.email?.trim().toLowerCase() ===
                userEmail
            );

            if (matched?.id) {
              resolvedUserId = matched.id;
              setCurrentUserId(matched.id);
              setAllUsers(users);
            }
          }
        } catch (error) {
          console.error(
            "Unable to resolve current user:",
            error
          );
        }
      }

      if (resolvedUserId) {
        await loadMessages(resolvedUserId);
      }
    } catch (error) {
      console.error(
        "Unable to load Messages:",
        error
      );

      setErrorMessage(
        "Unable to load messages. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadAllData();
  }, []);

  /* =====================================================
     OPEN CHAT FROM MESSAGE REPORTER BUTTON
  ===================================================== */

  useEffect(() => {
    try {
      const pendingChat =
        localStorage.getItem(
          "foundlyPendingChat"
        );

      if (!pendingChat) {
        return;
      }

      const chat = JSON.parse(pendingChat);

      if (
        chat &&
        chat.otherUser &&
        chat.otherUser.email
      ) {
        /*
          IMPORTANT:
          We ignore reportId for the chat identity.

          The chat belongs to ONE PERSON only.
        */

        const otherUserEmail =
          chat.otherUser.email
            ?.trim()
            .toLowerCase();

        const actualUser =
          allUsers.find(
            (user) =>
              user.email
                ?.trim()
                .toLowerCase() ===
              otherUserEmail
          );

        setSelectedChat({
          id: `user-${otherUserEmail}`,

          reportId: null,

          itemName:
            chat.itemName ||
            "Lost & Found Item",

          reportType:
            chat.reportType ||
            "lost",

          reportStatus:
            chat.reportStatus ||
            "active",

          otherUser: {
            email: otherUserEmail,

            name:
              actualUser?.name ||
              chat.otherUser.name ||
              "Foundly Member",

            profileImage:
              actualUser?.profileImage ||
              actualUser?.profile_image ||
              "",
          },
        });
      }

      localStorage.removeItem(
        "foundlyPendingChat"
      );
    } catch (error) {
      console.error(
        "Unable to open pending chat:",
        error
      );

      localStorage.removeItem(
        "foundlyPendingChat"
      );
    }
  }, [allUsers]);

  /* =====================================================
     REFRESH EVERY 5 SECONDS
  ===================================================== */

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const interval = setInterval(() => {
      loadReports();
      loadMessages(currentUserId);
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, [currentUserId]);

  /* =====================================================
     REFRESH ON WINDOW FOCUS
  ===================================================== */

  useEffect(() => {
    const handleFocus = () => {
      loadReports();

      if (currentUserId) {
        loadMessages(currentUserId);
      }
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
    };
  }, [currentUserId]);

  /* =====================================================
     BUILD ONE CHAT PER PERSON
     
     VERY IMPORTANT:
     Different reports between the same users
     are grouped into ONE conversation.
  ===================================================== */

  const chatList = useMemo(() => {
    const grouped = new Map();

    /* =================================================
       A. CREATE PEOPLE FROM REPORTS
    ================================================= */

    reports.forEach((report) => {
      const reporterEmail =
        report.reportedBy
          ?.trim()
          .toLowerCase() || "";

      const reporterName =
        report.reporterName ||
        "Foundly Member";

      const claimantEmail =
        report.claimedBy
          ?.trim()
          .toLowerCase() || "";

      const claimantName =
        report.claimedByName ||
        "Foundly Member";

      let otherEmail = "";
      let otherName = "";

      /*
        CURRENT USER IS REPORTER
      */

      if (reporterEmail === userEmail) {
        if (
          claimantEmail &&
          claimantEmail !== userEmail
        ) {
          otherEmail = claimantEmail;
          otherName = claimantName;
        }
      }

      /*
        CURRENT USER IS CLAIMANT
      */

      else if (
        claimantEmail === userEmail &&
        reporterEmail &&
        reporterEmail !== userEmail
      ) {
        otherEmail = reporterEmail;
        otherName = reporterName;
      }

      /*
        CURRENT USER IS NEITHER
        BUT CAN MESSAGE REPORTER
      */

      else if (
        reporterEmail &&
        reporterEmail !== userEmail
      ) {
        otherEmail = reporterEmail;
        otherName = reporterName;
      }

      if (
        !otherEmail ||
        otherEmail === userEmail
      ) {
        return;
      }

      const actualUser =
        findUserByEmail(otherEmail);

      const existing =
        grouped.get(otherEmail);

      /*
        Keep one chat only.

        But remember the latest report
        so we can display the most relevant
        Lost & Found item.
      */

      if (!existing) {
        grouped.set(otherEmail, {
          id: `user-${otherEmail}`,

          reportId: null,

          itemName:
            report.itemName ||
            "Lost & Found Item",

          reportType:
            report.type ||
            "lost",

          reportStatus:
            report.status ||
            "active",

          latestReportDate:
            report.createdAt ||
            "",

          otherUser: {
            email: otherEmail,

            name:
              actualUser?.name ||
              otherName ||
              "Foundly Member",

            profileImage:
              actualUser?.profileImage ||
              actualUser?.profile_image ||
              "",
          },
        });
      } else {
        /*
          If this report is newer,
          use it as the displayed item.
        */

        const oldDate = new Date(
          existing.latestReportDate || 0
        );

        const newDate = new Date(
          report.createdAt || 0
        );

        if (newDate > oldDate) {
          existing.itemName =
            report.itemName ||
            "Lost & Found Item";

          existing.reportType =
            report.type ||
            "lost";

          existing.reportStatus =
            report.status ||
            "active";

          existing.latestReportDate =
            report.createdAt ||
            "";
        }
      }
    });

    /* =================================================
       B. IMPORTANT:
          CREATE ONE CHAT FROM MESSAGES

       This catches:
       - direct messages
       - Lost & Found messages
       - reports without claimant
    ================================================= */

    messages.forEach((message) => {
      const senderEmail =
        message.senderEmail
          ?.trim()
          .toLowerCase() || "";

      const receiverEmail =
        message.receiverEmail
          ?.trim()
          .toLowerCase() || "";

      let otherEmail = "";
      let otherName = "";

      if (senderEmail === userEmail) {
        otherEmail = receiverEmail;

        otherName =
          message.receiverName ||
          "Foundly Member";
      } else if (
        receiverEmail === userEmail
      ) {
        otherEmail = senderEmail;

        otherName =
          message.senderName ||
          "Foundly Member";
      }

      if (
        !otherEmail ||
        otherEmail === userEmail
      ) {
        return;
      }

      const actualUser =
        findUserByEmail(otherEmail);

      const report = message.reportId
        ? reports.find(
            (item) =>
              String(item.id) ===
              String(message.reportId)
          )
        : null;

      const existing =
        grouped.get(otherEmail);

      if (!existing) {
        grouped.set(otherEmail, {
          id: `user-${otherEmail}`,

          reportId: null,

          itemName:
            report?.itemName ||
            (message.reportId
              ? "Lost & Found Item"
              : "General Conversation"),

          reportType:
            report?.type ||
            (message.reportId
              ? "lost"
              : "general"),

          reportStatus:
            report?.status ||
            "active",

          latestReportDate:
            message.createdAt ||
            "",

          otherUser: {
            email: otherEmail,

            name:
              actualUser?.name ||
              otherName ||
              "Foundly Member",

            profileImage:
              actualUser?.profileImage ||
              actualUser?.profile_image ||
              "",
          },
        });
      }
    });

    /*
      Convert Map to array
    */

    return Array.from(
      grouped.values()
    ).sort(
      (a, b) =>
        new Date(
          b.latestReportDate || 0
        ) -
        new Date(
          a.latestReportDate || 0
        )
    );
  }, [
    reports,
    messages,
    userEmail,
    allUsers,
  ]);

  /* =====================================================
     FILTER CHAT
  ===================================================== */

  const filteredChats = chatList.filter(
    (chat) => {
      const keyword =
        search.toLowerCase().trim();

      if (!keyword) {
        return true;
      }

      return (
        chat.otherUser?.name
          ?.toLowerCase()
          .includes(keyword) ||
        chat.otherUser?.email
          ?.toLowerCase()
          .includes(keyword) ||
        chat.itemName
          ?.toLowerCase()
          .includes(keyword)
      );
    }
  );

  /* =====================================================
     SELECTED CHAT MESSAGES

     IMPORTANT:
     DO NOT FILTER BY REPORT ID.

     All messages between the same two users
     belong to ONE chat.
  ===================================================== */

  const selectedMessages = selectedChat
    ? messages.filter((message) => {
        const otherEmail =
          selectedChat.otherUser?.email
            ?.trim()
            .toLowerCase() || "";

        const senderEmail =
          message.senderEmail
            ?.trim()
            .toLowerCase() || "";

        const receiverEmail =
          message.receiverEmail
            ?.trim()
            .toLowerCase() || "";

        const sameUsers =
          (senderEmail === userEmail &&
            receiverEmail === otherEmail) ||
          (senderEmail === otherEmail &&
            receiverEmail === userEmail);

        return sameUsers;
      })
    : [];

  /* =====================================================
     SORT MESSAGES
  ===================================================== */

  const sortedMessages = [
    ...selectedMessages,
  ].sort(
    (a, b) =>
      new Date(a.createdAt || 0) -
      new Date(b.createdAt || 0)
  );

  /* =====================================================
     GET LATEST MESSAGE
  ===================================================== */

  const getLatestMessage = (chat) => {
    const otherEmail =
      chat.otherUser?.email
        ?.trim()
        .toLowerCase() || "";

    return (
      messages
        .filter((message) => {
          const senderEmail =
            message.senderEmail
              ?.trim()
              .toLowerCase() || "";

          const receiverEmail =
            message.receiverEmail
              ?.trim()
              .toLowerCase() || "";

          return (
            (senderEmail === userEmail &&
              receiverEmail ===
                otherEmail) ||
            (senderEmail === otherEmail &&
              receiverEmail === userEmail)
          );
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        )[0] || null
    );
  };

  /* =====================================================
     OPEN CHAT
  ===================================================== */

  const openChat = (chat) => {
    const actualUser =
      findUserByEmail(
        chat.otherUser?.email
      );

    setSelectedChat({
      ...chat,

      /*
        One profile = one chat,
        therefore reportId is ALWAYS null
        for chat identity.
      */

      reportId: null,

      otherUser: {
        ...chat.otherUser,

        profileImage:
          actualUser?.profileImage ||
          actualUser?.profile_image ||
          chat.otherUser?.profileImage ||
          "",
      },
    });

    setMessageText("");
    setErrorMessage("");
  };

  /* =====================================================
     CLOSE CHAT
  ===================================================== */

  const closeChat = () => {
    setSelectedChat(null);
    setMessageText("");
    setErrorMessage("");
  };

  /* =====================================================
     SEND MESSAGE
  ===================================================== */

  const handleSendMessage = async () => {
    const cleanMessage =
      messageText.trim();

    if (
      !cleanMessage ||
      !selectedChat ||
      !selectedChat.otherUser?.email
    ) {
      return;
    }

    const receiver =
      findUserByEmail(
        selectedChat.otherUser.email
      );

    if (!currentUserId) {
      alert(
        "Your account ID could not be found. Please log out and log in again."
      );

      return;
    }

    if (!receiver?.id) {
      alert(
        "The recipient account could not be found."
      );

      return;
    }

    try {
      setSending(true);
      setErrorMessage("");

      /*
        IMPORTANT:
        When replying inside a chat that
        came from a report, we should attach
        the message to the most relevant report
        if possible.

        However, chat identity remains user-based.
      */

      let reportId = null;

      const receiverEmail =
        receiver.email
          ?.trim()
          .toLowerCase();

      const recentReport =
        reports
          .filter((report) => {
            const reporter =
              report.reportedBy
                ?.trim()
                .toLowerCase() || "";

            const claimant =
              report.claimedBy
                ?.trim()
                .toLowerCase() || "";

            return (
              (reporter === userEmail &&
                claimant ===
                  receiverEmail) ||
              (reporter === receiverEmail &&
                claimant === userEmail) ||
              reporter === receiverEmail
            );
          })
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0) -
              new Date(a.createdAt || 0)
          )[0];

      if (recentReport?.id) {
        reportId =
          recentReport.id;
      }

      const response = await fetch(
        `${API_URL}/api/messages`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            reportId,

            senderId:
              currentUserId,

            receiverId:
              receiver.id,

            senderEmail:
              userEmail,

            senderName:
              userName,

            receiverEmail:
              receiver.email,

            receiverName:
              receiver.name ||
              selectedChat.otherUser?.name ||
              "Foundly Member",

            message:
              cleanMessage,
          }),
        }
      );

      const data =
        await response.json();

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.message ||
            "Unable to send message."
        );
      }

      setMessageText("");

      await loadMessages(
        currentUserId
      );
    } catch (error) {
      console.error(
        "Unable to send message:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to send message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  /* =====================================================
     ENTER TO SEND
  ===================================================== */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleSendMessage();
    }
  };

  /* =====================================================
     FORMAT TIME
  ===================================================== */

  const formatTime = (date) => {
    if (!date) {
      return "";
    }

    try {
      return new Date(
        date
      ).toLocaleTimeString(
        "en-MY",
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );
    } catch {
      return "";
    }
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (
    loading &&
    messages.length === 0 &&
    reports.length === 0
  ) {
    return (
      <div className="messages-page">
        <div className="messages-glow messages-glow-one" />
        <div className="messages-glow messages-glow-two" />

        <div
          style={{
            minHeight:
              "100vh",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            flexDirection:
              "column",
            gap: "14px",
          }}
        >
          <MessageCircle
            size={42}
          />

          <strong>
            Loading Foundly Messages...
          </strong>

          <span>
            Please wait a moment 💗
          </span>
        </div>
      </div>
    );
  }

  /* =====================================================
     RETURN
  ===================================================== */

  return (
    <div className="messages-page">
      {/* BACKGROUND */}

      <div className="messages-glow messages-glow-one" />
      <div className="messages-glow messages-glow-two" />

      <div className="messages-floating messages-float-one">
        ♥
      </div>

      <div className="messages-floating messages-float-two">
        ✦
      </div>

      <div className="messages-floating messages-float-three">
        ✧
      </div>

      {/* HEADER */}

      <header className="messages-header">
        <button
          type="button"
          className="messages-back"
          onClick={onBack}
        >
          <ArrowLeft size={19} />

          Back to Dashboard
        </button>

        <div className="messages-header-title">
          <MessageCircle size={20} />

          <span>
            FOUNDLY MESSAGES
          </span>
        </div>

        <div className="messages-header-user">
          <div className="messages-user-avatar">
            {profileImage ? (
              <img
                src={profileImage}
                alt={userName}
              />
            ) : (
              userName
                .charAt(0)
                .toUpperCase()
            )}
          </div>

          <div>
            <strong>
              {userName}
            </strong>

            <span>
              Online
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}

      <main className="messages-main">
        {/* INTRO */}

        <section className="messages-intro">
          <span>
            ✦ STAY CONNECTED
          </span>

          <h1>
            Messages
            <strong>
              {" "}♥
            </strong>
          </h1>

          <p>
            Connect with students and the school
            community about lost and found items.
          </p>
        </section>

        {/* CONTAINER */}

        <section className="messages-container">
          {/* CHAT LIST */}

          <aside className="chat-list-panel">
            <div className="chat-list-heading">
              <div>
                <strong>
                  Conversations
                </strong>

                <span>
                  {filteredChats.length}{" "}
                  conversation
                  {filteredChats.length !==
                  1
                    ? "s"
                    : ""}
                </span>
              </div>

              <MessageCircle
                size={21}
              />
            </div>

            {/* SEARCH */}

            <div className="chat-search">
              <Search size={16} />

              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
              />
            </div>

            {/* ERROR */}

            {errorMessage && (
              <div
                style={{
                  padding:
                    "10px 14px",
                  margin:
                    "8px 12px",
                  borderRadius:
                    "12px",
                  background:
                    "#fff1f5",
                  fontSize:
                    "13px",
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* CHAT LIST */}

            <div className="chat-list">
              {filteredChats.length ===
              0 ? (
                <div className="messages-empty-list">
                  <div>
                    💬
                  </div>

                  <strong>
                    No conversations yet
                  </strong>

                  <span>
                    Open a report and tap
                    "Message Reporter"
                    to start a conversation.
                  </span>
                </div>
              ) : (
                filteredChats.map(
                  (chat) => {
                    const latest =
                      getLatestMessage(
                        chat
                      );

                    const actualUser =
                      findUserByEmail(
                        chat.otherUser?.email
                      );

                    const displayImage =
                      actualUser?.profileImage ||
                      actualUser?.profile_image ||
                      chat.otherUser?.profileImage ||
                      "";

                    return (
                      <button
                        type="button"
                        key={chat.id}
                        className={
                          selectedChat?.id ===
                          chat.id
                            ? "chat-item active"
                            : "chat-item"
                        }
                        onClick={() =>
                          openChat(
                            chat
                          )
                        }
                      >
                        {/* AVATAR */}

                        <div className="chat-avatar">
                          {displayImage ? (
                            <img
                              src={
                                displayImage
                              }
                              alt=""
                            />
                          ) : (
                            <UserRound
                              size={20}
                            />
                          )}
                        </div>

                        {/* USER */}

                        <div className="chat-item-content">
                          <strong>
                            {chat
                              .otherUser
                              ?.name ||
                              "Foundly Member"}
                          </strong>

                          <span>
                            {latest?.message ||
                              chat.itemName ||
                              "Start a conversation"}
                          </span>
                        </div>

                        {/* RIGHT */}

                        <div className="chat-item-right">
                          {latest && (
                            <small>
                              {formatTime(
                                latest.createdAt
                              )}
                            </small>
                          )}

                          {latest?.reportId && (
                            <Package
                              size={14}
                            />
                          )}
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>

          {/* CHAT PANEL */}

          <section className="chat-panel">
            {!selectedChat ? (
              <div className="chat-welcome">
                <div className="chat-welcome-icon">
                  <MessageCircle
                    size={42}
                  />
                </div>

                <h2>
                  Your Foundly Messages
                </h2>

                <p>
                  Select a conversation to start
                  chatting with another member.
                </p>

                <div className="chat-welcome-hearts">
                  ♥ ✦ ♥
                </div>
              </div>
            ) : (
              <>
                {/* CHAT HEADER */}

                <div className="chat-panel-header">
                  <div className="chat-panel-user">
                    <div className="chat-panel-avatar">
                      {selectedChat
                        .otherUser
                        ?.profileImage ? (
                        <img
                          src={
                            selectedChat
                              .otherUser
                              .profileImage
                          }
                          alt=""
                        />
                      ) : (
                        <UserRound
                          size={20}
                        />
                      )}
                    </div>

                    <div>
                      <strong>
                        {selectedChat
                          .otherUser
                          ?.name ||
                          "Foundly Member"}
                      </strong>

                      <span>
                        <MessageCircle
                          size={12}
                        />

                        One conversation
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="close-chat-button"
                    onClick={
                      closeChat
                    }
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* RELATED REPORTS INFO */}

                <div className="chat-report-info">
                  <div className="chat-report-icon">
                    <Package
                      size={18}
                    />
                  </div>

                  <div>
                    <strong>
                      Lost & Found Conversation
                    </strong>

                    <span>
                      All messages with this user
                      are kept in one chat.
                    </span>
                  </div>
                </div>

                {/* MESSAGE AREA */}

                <div className="chat-messages">
                  {sortedMessages.length ===
                  0 ? (
                    <div className="chat-no-messages">
                      <div>
                        💗
                      </div>

                      <strong>
                        Start the conversation
                      </strong>

                      <span>
                        Say hello and discuss the
                        reported item.
                      </span>
                    </div>
                  ) : (
                    sortedMessages.map(
                      (message) => {
                        const isMine =
                          message.senderEmail
                            ?.trim()
                            .toLowerCase() ===
                          userEmail;

                        const senderUser =
                          findUserByEmail(
                            message.senderEmail
                          );

                        const relatedReport =
                          message.reportId
                            ? reports.find(
                                (report) =>
                                  String(
                                    report.id
                                  ) ===
                                  String(
                                    message.reportId
                                  )
                              )
                            : null;

                        return (
                          <div
                            key={
                              message.id
                            }
                            className={
                              isMine
                                ? "message-row mine"
                                : "message-row"
                            }
                          >
                            {!isMine && (
                              <div className="message-avatar">
                                {(
                                  message.senderImage ||
                                  senderUser?.profileImage ||
                                  senderUser?.profile_image
                                ) ? (
                                  <img
                                    src={
                                      message.senderImage ||
                                      senderUser?.profileImage ||
                                      senderUser?.profile_image
                                    }
                                    alt={
                                      message.senderName ||
                                      "User"
                                    }
                                  />
                                ) : (
                                  <UserRound
                                    size={16}
                                  />
                                )}
                              </div>
                            )}

                            <div className="message-bubble">
                              {relatedReport && (
                                <small
                                  style={{
                                    display:
                                      "block",
                                    marginBottom:
                                      "5px",
                                    opacity:
                                      0.75,
                                    fontSize:
                                      "10px",
                                  }}
                                >
                                  📦{" "}
                                  {
                                    relatedReport.itemName
                                  }
                                </small>
                              )}

                              <span>
                                {
                                  message.message
                                }
                              </span>

                              <small>
                                {formatTime(
                                  message.createdAt
                                )}
                              </small>
                            </div>

                            {isMine && (
                              <div className="message-avatar mine-avatar">
                                {profileImage ? (
                                  <img
                                    src={
                                      profileImage
                                    }
                                    alt={
                                      userName
                                    }
                                  />
                                ) : (
                                  userName
                                    .charAt(0)
                                    .toUpperCase()
                                )}
                              </div>
                            )}
                          </div>
                        );
                      }
                    )
                  )}
                </div>

                {/* ERROR */}

                {errorMessage && (
                  <div
                    style={{
                      padding:
                        "8px 16px",
                      fontSize:
                        "13px",
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {/* INPUT */}

                <div className="chat-input-area">
                  <div className="chat-input-wrapper">
                    <Smile
                      size={19}
                    />

                    <input
                      type="text"
                      placeholder="Type your message..."
                      value={
                        messageText
                      }
                      onChange={(event) =>
                        setMessageText(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      disabled={
                        sending
                      }
                    />
                  </div>

                  <button
                    type="button"
                    className="send-message-button"
                    onClick={
                      handleSendMessage
                    }
                    disabled={
                      sending ||
                      !messageText.trim()
                    }
                  >
                    {sending ? (
                      <span>
                        ...
                      </span>
                    ) : (
                      <Send size={19} />
                    )}
                  </button>
                </div>
              </>
            )}
          </section>
        </section>

        {/* FOOTER */}

        <footer className="messages-footer">
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
      </main>
    </div>
  );
}

export default Messages;