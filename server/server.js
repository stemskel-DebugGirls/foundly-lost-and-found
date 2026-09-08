const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================================================
   ENVIRONMENT
========================================================= */

if (!process.env.SUPABASE_URL) {
  console.error("❌ SUPABASE_URL is missing in .env");
  process.exit(1);
}

if (!process.env.SUPABASE_SECRET_KEY) {
  console.error("❌ SUPABASE_SECRET_KEY is missing in .env");
  process.exit(1);
}

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

/* =========================================================
   CORS
   Allow Vite localhost on ANY port
========================================================= */

app.use(
  cors({
    origin: /^http:\/\/localhost:\d+$/,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* =========================================================
   BODY PARSER
========================================================= */

app.use(express.json({ limit: "10mb" }));

/* =========================================================
   HELPER FUNCTIONS
========================================================= */

function mapUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    points: user.points ?? 0,

    profileImage: user.profile_image || "",
    profile_image: user.profile_image || "",

    createdAt: user.created_at || null,
    created_at: user.created_at || null,
  };
}

function mapReport(report) {
  if (!report) return null;

  return {
    id: report.id,
    type: report.type,

    itemName: report.item_name,
    description: report.description,

    location: report.location,

    date: report.date_lost,
    time: report.time_lost || "",

    phone: report.phone,

    image: report.image || null,

    status: report.status,

    reportedBy: report.reported_by,
    reporterName: report.reporter_name,

    claimedBy: report.claimed_by || "",
    claimedByName: report.claimed_by_name || "",

    resolvedAt: report.resolved_at || "",

    createdAt: report.created_at,

    userId: report.user_id,
  };
}

function mapFeedback(item) {
  if (!item) return null;

  return {
    id: item.id,

    userId: item.user_id || null,

    name: item.name,
    email: item.email,

    rating: item.rating,
    category: item.category,
    comment: item.comment,

    createdAt: item.created_at,
  };
}

function mapMessage(item) {
  if (!item) return null;

  return {
    id: item.id,

    reportId: item.report_id || null,

    senderId: item.sender_id,
    receiverId: item.receiver_id,

    senderEmail: item.sender_email,
    senderName: item.sender_name,

    receiverEmail: item.receiver_email,
    receiverName: item.receiver_name,

    message: item.message,

    createdAt: item.created_at,
  };
}

/* =========================================================
   BASIC ROUTES
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Foundly API is running! 💗",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    service: "Foundly Backend",
  });
});

/* =========================================================
   TEST SUPABASE
========================================================= */

app.get("/api/test-supabase", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, name, email, points")
      .limit(5);

    if (error) {
      console.error("❌ Supabase test error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to connect to Supabase.",
        error: error.message,
      });
    }

    return res.json({
      success: true,
      message: "Supabase connection successful! 💗",
      users: data || [],
    });
  } catch (error) {
    console.error("❌ Test Supabase error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
      error: error.message,
    });
  }
});

/* =========================================================
   SIGN UP
========================================================= */

app.post("/api/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
    } = req.body;

    const cleanName = String(name || "").trim();

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!cleanEmail.endsWith("@moe-dl.edu.my")) {
      return res.status(400).json({
        success: false,
        message:
          "Please use your Delima email ending with @moe-dl.edu.my.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
      });
    }

    const {
      data: existingUser,
      error: existingUserError,
    } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingUserError) {
      console.error(
        "❌ Existing user check error:",
        existingUserError
      );

      return res.status(500).json({
        success: false,
        message: "Unable to check existing account.",
      });
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "An account with this Delima email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(
      String(password),
      12
    );

    const {
      data: newUser,
      error: insertError,
    } = await supabase
      .from("users")
      .insert([
        {
          name: cleanName,
          email: cleanEmail,
          password: passwordHash,
          points: 0,
        },
      ])
      .select(
        "id, name, email, points, profile_image, created_at"
      )
      .single();

    if (insertError) {
      console.error(
        "❌ Create user error:",
        insertError
      );

      return res.status(500).json({
        success: false,
        message: "Unable to create account.",
        error: insertError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Account created successfully! 💗",
      user: mapUser(newUser),
    });
  } catch (error) {
    console.error(
      "❌ Signup server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong during signup.",
    });
  }
});

/* =========================================================
   LOGIN
========================================================= */

app.post("/api/login", async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    const cleanEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!cleanEmail) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!cleanEmail.endsWith("@moe-dl.edu.my")) {
      return res.status(400).json({
        success: false,
        message:
          "Please use your official Delima email.",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
      });
    }

    const {
      data: user,
      error: userError,
    } = await supabase
      .from("users")
      .select(
        "id, name, email, password, points, profile_image, created_at"
      )
      .eq("email", cleanEmail)
      .maybeSingle();

    if (userError) {
      console.error(
        "❌ Login user lookup error:",
        userError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to access your account.",
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Email or password is incorrect. Please try again.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      String(password),
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message:
          "Email or password is incorrect. Please try again.",
      });
    }

    return res.json({
      success: true,
      message: "Login successful! 💗",

      user: {
        ...mapUser(user),
        reports: 0,
      },
    });
  } catch (error) {
    console.error(
      "❌ Login server error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong during login.",
    });
  }
});

/* =========================================================
   FORGOT PASSWORD
========================================================= */

app.post(
  "/api/forgot-password",
  async (req, res) => {
    try {
      const cleanEmail = String(
        req.body.email || ""
      )
        .trim()
        .toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter your Delima email.",
        });
      }

      if (!cleanEmail.endsWith("@moe-dl.edu.my")) {
        return res.status(400).json({
          success: false,
          message:
            "Please use your official Delima email ending with @moe-dl.edu.my.",
        });
      }

      /* Find user */
      const {
        data: user,
        error: userError,
      } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("email", cleanEmail)
        .maybeSingle();

      if (userError) {
        console.error(
          "❌ Forgot password user lookup error:",
          userError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to process your password reset request.",
          error:
            userError.message,
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message:
            "No Foundly account was found with this email.",
        });
      }

      /* Invalidate old unused reset requests */
      const {
        error: invalidateError,
      } = await supabase
        .from("password_resets")
        .update({
          used: true,
        })
        .eq("user_id", user.id)
        .eq("used", false);

      if (invalidateError) {
        console.error(
          "⚠️ Unable to invalidate previous reset requests:",
          invalidateError
        );
      }

      /* Generate token */
      const resetToken =
        crypto.randomBytes(32).toString("hex");

      /* 15 minutes */
      const expiresAt =
        new Date(
          Date.now() + 15 * 60 * 1000
        ).toISOString();

      /* Save into password_resets */
      const {
        error: insertError,
      } = await supabase
        .from("password_resets")
        .insert([
          {
            user_id: user.id,
            token: resetToken,
            expires_at: expiresAt,
            used: false,
          },
        ]);

      if (insertError) {
        console.error(
          "❌ Password reset insert error:",
          insertError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to create your password reset request.",
          error:
            insertError.message,
        });
      }

      /*
        DEVELOPMENT MODE

        Token is returned directly to the frontend
        because no email service has been connected yet.
      */

      return res.json({
        success: true,
        message:
          "Password reset request created successfully!",
        resetToken,
        expiresAt,
      });
    } catch (error) {
      console.error(
        "❌ Forgot password server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while processing your password reset request.",
      });
    }
  }
);

/* =========================================================
   RESET PASSWORD
========================================================= */

app.post(
  "/api/reset-password",
  async (req, res) => {
    try {
      const {
        token,
        newPassword,
        confirmPassword,
      } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message:
            "Reset request is invalid. Please start again.",
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a new password.",
        });
      }

      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must contain at least 6 characters.",
        });
      }

      if (
        newPassword !==
        confirmPassword
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Passwords do not match.",
        });
      }

      /* Find token */
      const {
        data: resetRequest,
        error: resetLookupError,
      } = await supabase
        .from("password_resets")
        .select(
          "id, user_id, token, expires_at, used"
        )
        .eq("token", token)
        .maybeSingle();

      if (resetLookupError) {
        console.error(
          "❌ Reset token lookup error:",
          resetLookupError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to verify your password reset request.",
          error:
            resetLookupError.message,
        });
      }

      if (!resetRequest) {
        return res.status(400).json({
          success: false,
          message:
            "This password reset request is invalid.",
        });
      }

      if (resetRequest.used) {
        return res.status(400).json({
          success: false,
          message:
            "This password reset request has already been used. Please start again.",
        });
      }

      /* Check expiry */
      const expiryTime = new Date(
        resetRequest.expires_at
      ).getTime();

      if (
        Number.isNaN(expiryTime) ||
        expiryTime < Date.now()
      ) {
        await supabase
          .from("password_resets")
          .update({
            used: true,
          })
          .eq(
            "id",
            resetRequest.id
          );

        return res.status(400).json({
          success: false,
          message:
            "This password reset request has expired. Please start again.",
        });
      }

      /* Hash new password */
      const passwordHash =
        await bcrypt.hash(
          String(newPassword),
          12
        );

      /* Update user password */
      const {
        data: updatedUser,
        error: updatePasswordError,
      } = await supabase
        .from("users")
        .update({
          password:
            passwordHash,
        })
        .eq(
          "id",
          resetRequest.user_id
        )
        .select(
          "id, name, email, points, profile_image, created_at"
        )
        .single();

      if (updatePasswordError) {
        console.error(
          "❌ Password update error:",
          updatePasswordError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to update your password.",
          error:
            updatePasswordError.message,
        });
      }

      /* Mark token as used */
      const {
        error: markUsedError,
      } = await supabase
        .from("password_resets")
        .update({
          used: true,
        })
        .eq(
          "id",
          resetRequest.id
        );

      if (markUsedError) {
        console.error(
          "⚠️ Password reset succeeded but token could not be marked as used:",
          markUsedError
        );
      }

      return res.json({
        success: true,
        message:
          "Your password has been reset successfully! You can now login with your new password. 💗",
        user:
          mapUser(updatedUser),
      });
    } catch (error) {
      console.error(
        "❌ Reset password server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while resetting your password.",
      });
    }
  }
);

/* =========================================================
   GET USERS
========================================================= */

app.get(
  "/api/users",
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("users")
        .select(
          "id, name, email, points, profile_image, created_at"
        )
        .order(
          "points",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "❌ Get users error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load users.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,
        users:
          (data || []).map(
            mapUser
          ),
      });
    } catch (error) {
      console.error(
        "❌ Users server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while loading users.",
      });
    }
  }
);

/* =========================================================
   UPDATE PROFILE
========================================================= */

app.patch(
  "/api/users/:id/profile",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const {
        name,
        profileImage,
      } = req.body;

      const cleanName =
        String(
          name || ""
        ).trim();

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            "Name is required.",
        });
      }

      if (
        typeof profileImage !==
        "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Profile image must be a valid string.",
        });
      }

      if (
        profileImage.length >
        7 * 1024 * 1024
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Profile image is too large.",
        });
      }

      const {
        data: updatedUser,
        error,
      } = await supabase
        .from("users")
        .update({
          name:
            cleanName,

          profile_image:
            profileImage ||
            null,
        })
        .eq(
          "id",
          id
        )
        .select(
          "id, name, email, points, profile_image, created_at"
        )
        .single();

      if (error) {
        console.error(
          "❌ Update profile error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to save your profile.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,
        message:
          "Profile saved successfully! 💗",
        user:
          mapUser(
            updatedUser
          ),
      });
    } catch (error) {
      console.error(
        "❌ Profile server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while saving your profile.",
      });
    }
  }
);

/* =========================================================
   GET REPORTS
========================================================= */

app.get(
  "/api/reports",
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("reports")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "❌ Get reports error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load reports.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,
        reports:
          (data || []).map(
            mapReport
          ),
      });
    } catch (error) {
      console.error(
        "❌ Reports server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while loading reports.",
      });
    }
  }
);

/* =========================================================
   CREATE LOST / FOUND REPORT
========================================================= */

async function createReport(
  req,
  res,
  type
) {
  try {
    const {
      userId,
      userEmail,
      itemName,
      description,
      location,
      date,
      time,
      phone,
      image,
    } = req.body;

    const cleanUserId =
      String(
        userId || ""
      ).trim();

    const cleanItemName =
      String(
        itemName || ""
      ).trim();

    const cleanDescription =
      String(
        description || ""
      ).trim();

    const cleanLocation =
      String(
        location || ""
      ).trim();

    const cleanPhone =
      String(
        phone || ""
      ).trim();

    if (!cleanUserId) {
      return res.status(400).json({
        success: false,
        message:
          "User ID is required.",
      });
    }

    if (!cleanItemName) {
      return res.status(400).json({
        success: false,
        message:
          "Item name is required.",
      });
    }

    if (!cleanDescription) {
      return res.status(400).json({
        success: false,
        message:
          "Description is required.",
      });
    }

    if (!cleanLocation) {
      return res.status(400).json({
        success: false,
        message:
          "Location is required.",
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        message:
          "Date is required.",
      });
    }

    if (!cleanPhone) {
      return res.status(400).json({
        success: false,
        message:
          "Contact number is required.",
      });
    }

    /* =====================================================
       FIND USER
    ===================================================== */

    let user = null;
    let userError = null;

    const byId =
      await supabase
        .from("users")
        .select(
          "id, name, email, points, profile_image, created_at"
        )
        .eq(
          "id",
          cleanUserId
        )
        .maybeSingle();

    user =
      byId.data;

    userError =
      byId.error;

    /* =====================================================
       FALLBACK BY EMAIL
    ===================================================== */

    if (
      !user &&
      userEmail
    ) {
      const cleanEmail =
        String(
          userEmail
        )
          .trim()
          .toLowerCase();

      const byEmail =
        await supabase
          .from("users")
          .select(
            "id, name, email, points, profile_image, created_at"
          )
          .eq(
            "email",
            cleanEmail
          )
          .maybeSingle();

      if (
        !byEmail.error &&
        byEmail.data
      ) {
        user =
          byEmail.data;

        userError =
          null;
      }
    }

    if (userError) {
      console.error(
        "❌ Report user lookup error:",
        userError
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify your account.",
        error:
          userError.message,
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User account could not be found.",
      });
    }

    /* =====================================================
       INSERT REPORT
    ===================================================== */

    const {
      data: report,
      error: reportError,
    } = await supabase
      .from("reports")
      .insert([
        {
          user_id:
            user.id,

          type,

          item_name:
            cleanItemName,

          description:
            cleanDescription,

          location:
            cleanLocation,

          date_lost:
            date,

          time_lost:
            time || null,

          phone:
            cleanPhone,

          image:
            image || null,

          status:
            "active",

          reported_by:
            user.email,

          reporter_name:
            user.name,
        },
      ])
      .select("*")
      .single();

    if (reportError) {
      console.error(
        "❌ Create report error:",
        reportError
      );

      return res.status(500).json({
        success: false,
        message:
          `Unable to save your ${type} report.`,
        error:
          reportError.message,
      });
    }

    /* =====================================================
       +10 POINTS
    ===================================================== */

    const currentPoints =
      Number(
        user.points || 0
      );

    const newPoints =
      currentPoints + 10;

    const {
      data: updatedUser,
      error: pointsError,
    } = await supabase
      .from("users")
      .update({
        points:
          newPoints,
      })
      .eq(
        "id",
        user.id
      )
      .select(
        "id, name, email, points, profile_image, created_at"
      )
      .single();

    if (pointsError) {
      console.error(
        "❌ Points update error:",
        pointsError
      );

      return res.status(500).json({
        success: false,
        message:
          "Report was saved, but points could not be updated.",
        error:
          pointsError.message,
      });
    }

    return res.status(201).json({
      success: true,

      message:
        `${
          type === "lost"
            ? "Lost"
            : "Found"
        } report submitted successfully! +10 points 💗`,

      report: {
        ...mapReport(
          report
        ),

        points:
          newPoints,
      },

      user:
        mapUser(
          updatedUser
        ),
    });
  } catch (error) {
    console.error(
      `❌ ${type} report server error:`,
      error
    );

    return res.status(500).json({
      success: false,
      message:
        `Something went wrong while submitting your ${type} report.`,
      error:
        error.message,
    });
  }
}

app.post(
  "/api/reports/lost",
  (req, res) =>
    createReport(
      req,
      res,
      "lost"
    )
);

app.post(
  "/api/reports/found",
  (req, res) =>
    createReport(
      req,
      res,
      "found"
    )
);

/* =========================================================
   CLAIM / RESOLVE REPORT
========================================================= */

app.patch(
  "/api/reports/:id/claim",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      const {
        userId,
        userEmail,
        userName,
      } = req.body;

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Report ID is required.",
        });
      }

      if (
        !userId &&
        !userEmail
      ) {
        return res.status(400).json({
          success: false,
          message:
            "User information is required.",
        });
      }

      const {
        data: report,
        error: reportError,
      } = await supabase
        .from("reports")
        .select("*")
        .eq(
          "id",
          id
        )
        .maybeSingle();

      if (reportError) {
        console.error(
          "❌ Claim lookup error:",
          reportError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to find this report.",
        });
      }

      if (!report) {
        return res.status(404).json({
          success: false,
          message:
            "Report not found.",
        });
      }

      if (
        report.status ===
          "resolved" ||
        report.status ===
          "Resolved"
      ) {
        return res.status(409).json({
          success: false,
          message:
            "This report has already been resolved.",
        });
      }

      const reporterEmail =
        (
          report.reported_by ||
          ""
        )
          .trim()
          .toLowerCase();

      const claimerEmail =
        (
          userEmail || ""
        )
          .trim()
          .toLowerCase();

      if (
        reporterEmail &&
        claimerEmail &&
        reporterEmail ===
          claimerEmail
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot claim your own report.",
        });
      }

      const resolvedAt =
        new Date().toISOString();

      const {
        data: updatedReport,
        error: updateError,
      } = await supabase
        .from("reports")
        .update({
          status:
            "resolved",

          claimed_by:
            userEmail || "",

          claimed_by_name:
            userName ||
            "Foundly Member",

          resolved_at:
            resolvedAt,
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

      if (updateError) {
        console.error(
          "❌ Claim update error:",
          updateError
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to resolve this report.",
          error:
            updateError.message,
        });
      }

      return res.json({
        success: true,

        message:
          "Item successfully claimed! This report is now resolved. 💗",

        report:
          mapReport(
            updatedReport
          ),
      });
    } catch (error) {
      console.error(
        "❌ Claim server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while claiming this report.",
      });
    }
  }
);

/* =========================================================
   FEEDBACK - GET
========================================================= */

app.get(
  "/api/feedback",
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("feedback")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (error) {
        console.error(
          "❌ Get feedback error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load feedback.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,

        feedback:
          (data || []).map(
            mapFeedback
          ),
      });
    } catch (error) {
      console.error(
        "❌ Feedback server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while loading feedback.",
      });
    }
  }
);

/* =========================================================
   FEEDBACK - POST
========================================================= */

app.post(
  "/api/feedback",
  async (req, res) => {
    try {
      const {
        userId,
        name,
        email,
        rating,
        category,
        comment,
      } = req.body;

      const cleanName =
        String(
          name || ""
        ).trim();

      const cleanEmail =
        String(
          email || ""
        )
          .trim()
          .toLowerCase();

      const cleanCategory =
        String(
          category || ""
        ).trim();

      const cleanComment =
        String(
          comment || ""
        ).trim();

      const numericRating =
        Number(
          rating
        );

      if (!cleanName) {
        return res.status(400).json({
          success: false,
          message:
            "Name is required.",
        });
      }

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message:
            "Email is required.",
        });
      }

      if (
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Rating must be between 1 and 5.",
        });
      }

      if (!cleanCategory) {
        return res.status(400).json({
          success: false,
          message:
            "Feedback category is required.",
        });
      }

      if (!cleanComment) {
        return res.status(400).json({
          success: false,
          message:
            "Feedback comment is required.",
        });
      }

      const {
        data,
        error,
      } = await supabase
        .from("feedback")
        .insert([
          {
            user_id:
              userId || null,

            name:
              cleanName,

            email:
              cleanEmail,

            rating:
              numericRating,

            category:
              cleanCategory,

            comment:
              cleanComment,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error(
          "❌ Save feedback error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to save your feedback.",
          error:
            error.message,
        });
      }

      return res.status(201).json({
        success: true,

        message:
          "Thank you for your feedback! 💗",

        feedback:
          mapFeedback(
            data
          ),
      });
    } catch (error) {
      console.error(
        "❌ Feedback POST error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while submitting feedback.",
      });
    }
  }
);

/* =========================================================
   FEEDBACK - DELETE
========================================================= */

app.delete(
  "/api/feedback/:id",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Feedback ID is required.",
        });
      }

      const {
        error,
      } = await supabase
        .from("feedback")
        .delete()
        .eq(
          "id",
          id
        );

      if (error) {
        console.error(
          "❌ Delete feedback error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to delete feedback.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,
        message:
          "Feedback deleted successfully.",
      });
    } catch (error) {
      console.error(
        "❌ Feedback DELETE error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while deleting feedback.",
      });
    }
  }
);

/* =========================================================
   MESSAGES - GET ALL
   Must come before /:userId
========================================================= */

app.get(
  "/api/messages",
  async (req, res) => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .select("*")
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "❌ Get all messages error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load messages.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,

        messages:
          (data || []).map(
            mapMessage
          ),
      });
    } catch (error) {
      console.error(
        "❌ Messages server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while loading messages.",
      });
    }
  }
);

/* =========================================================
   MESSAGES - GET USER MESSAGES
========================================================= */

app.get(
  "/api/messages/:userId",
  async (req, res) => {
    try {
      const {
        userId,
      } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message:
            "User ID is required.",
        });
      }

      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .select("*")
        .or(
          `sender_id.eq.${userId},receiver_id.eq.${userId}`
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          "❌ Get user messages error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load your messages.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,

        messages:
          (data || []).map(
            mapMessage
          ),
      });
    } catch (error) {
      console.error(
        "❌ User messages error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while loading your messages.",
      });
    }
  }
);

/* =========================================================
   MESSAGES - SEND
========================================================= */

app.post(
  "/api/messages",
  async (req, res) => {
    try {
      const {
        reportId,
        senderId,
        receiverId,
        senderEmail,
        senderName,
        receiverEmail,
        receiverName,
        message,
      } = req.body;

      const cleanMessage =
        String(
          message || ""
        ).trim();

      if (
        !senderId ||
        !receiverId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sender and receiver are required.",
        });
      }

      if (
        !senderEmail ||
        !receiverEmail
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Sender and receiver email are required.",
        });
      }

      if (!cleanMessage) {
        return res.status(400).json({
          success: false,
          message:
            "Message cannot be empty.",
        });
      }

      const {
        data,
        error,
      } = await supabase
        .from("messages")
        .insert([
          {
            report_id:
              reportId || null,

            sender_id:
              senderId,

            receiver_id:
              receiverId,

            sender_email:
              senderEmail,

            sender_name:
              senderName ||
              "Foundly Member",

            receiver_email:
              receiverEmail,

            receiver_name:
              receiverName ||
              "Foundly Member",

            message:
              cleanMessage,
          },
        ])
        .select("*")
        .single();

      if (error) {
        console.error(
          "❌ Send message error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to send message.",
          error:
            error.message,
        });
      }

      return res.status(201).json({
        success: true,

        message:
          "Message sent successfully.",

        data:
          mapMessage(
            data
          ),
      });
    } catch (error) {
      console.error(
        "❌ Message POST error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while sending message.",
      });
    }
  }
);

/* =========================================================
   NOTIFICATIONS - SYNC
========================================================= */

async function syncNotifications() {
  try {
    const [
      reportsResult,
      usersResult,
      feedbackResult,
      messagesResult,
    ] = await Promise.all([
      supabase
        .from("reports")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from("users")
        .select(
          "id, name, email, created_at"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from("feedback")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),

      supabase
        .from("messages")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        ),
    ]);

    if (reportsResult.error) {
      console.error(
        "❌ Notification reports error:",
        reportsResult.error
      );
    }

    if (usersResult.error) {
      console.error(
        "❌ Notification users error:",
        usersResult.error
      );
    }

    if (feedbackResult.error) {
      console.error(
        "❌ Notification feedback error:",
        feedbackResult.error
      );
    }

    if (messagesResult.error) {
      console.error(
        "❌ Notification messages error:",
        messagesResult.error
      );
    }

    const reports =
      reportsResult.data || [];

    const users =
      usersResult.data || [];

    const feedback =
      feedbackResult.data || [];

    const messages =
      messagesResult.data || [];

    const notifications = [];

    /* =====================================================
       ADMIN - NEW REPORT
    ===================================================== */

    reports.forEach(
      (report) => {
        notifications.push({
          notification_key:
            `admin-report-${report.id}`,

          recipient_role:
            "admin",

          recipient_id:
            null,

          type:
            "report",

          title:
            report.type ===
            "found"
              ? "New Found Report"
              : "New Lost Report",

          description:
            report.item_name ||
            "A new report was submitted.",

          source_id:
            report.id,

          section:
            "reports",

          read:
            false,

          created_at:
            report.created_at,
        });
      }
    );

    /* =====================================================
       ADMIN - RESOLVED
    ===================================================== */

    reports
      .filter(
        (report) =>
          report.status ===
            "resolved" ||
          report.status ===
            "Resolved"
      )
      .forEach(
        (report) => {
          notifications.push({
            notification_key:
              `admin-resolved-${report.id}`,

            recipient_role:
              "admin",

            recipient_id:
              null,

            type:
              "resolved",

            title:
              "Item Reunited",

            description:
              report.item_name ||
              "An item has been successfully claimed.",

            source_id:
              report.id,

            section:
              "reports",

            read:
              false,

            created_at:
              report.resolved_at ||
              report.created_at,
          });
        }
      );

    /* =====================================================
       ADMIN - NEW USER
    ===================================================== */

    users.forEach(
      (user) => {
        notifications.push({
          notification_key:
            `admin-user-${user.id}`,

          recipient_role:
            "admin",

          recipient_id:
            null,

          type:
            "user",

          title:
            "New User",

          description:
            `${user.name || "A new user"} joined Foundly.`,

          source_id:
            user.id,

          section:
            "users",

          read:
            false,

          created_at:
            user.created_at,
        });
      }
    );

    /* =====================================================
       ADMIN - NEW FEEDBACK
    ===================================================== */

    feedback.forEach(
      (item) => {
        notifications.push({
          notification_key:
            `admin-feedback-${item.id}`,

          recipient_role:
            "admin",

          recipient_id:
            null,

          type:
            "feedback",

          title:
            "New Feedback",

          description:
            `${item.rating || 0}/5 rating submitted.`,

          source_id:
            item.id,

          section:
            "feedback",

          read:
            false,

          created_at:
            item.created_at,
        });
      }
    );

    /* =====================================================
       ADMIN - NEW MESSAGE
    ===================================================== */

    messages.forEach(
      (item) => {
        notifications.push({
          notification_key:
            `admin-message-${item.id}`,

          recipient_role:
            "admin",

          recipient_id:
            null,

          type:
            "message",

          title:
            "New Message",

          description:
            `${item.sender_name || "A user"} sent a message.`,

          source_id:
            item.id,

          section:
            "messages",

          read:
            false,

          created_at:
            item.created_at,
        });
      }
    );

    /* =====================================================
       STUDENT - REPORT SUBMITTED
    ===================================================== */

    reports.forEach(
      (report) => {
        if (!report.user_id) return;

        notifications.push({
          notification_key:
            `student-report-${report.id}`,

          recipient_role:
            "student",

          recipient_id:
            report.user_id,

          type:
            "report",

          title:
            report.type ===
            "found"
              ? "Found Report Submitted"
              : "Lost Report Submitted",

          description:
            `${report.item_name || "Your item"} was successfully reported.`,

          source_id:
            report.id,

          section:
            "reports",

          read:
            false,

          created_at:
            report.created_at,
        });
      }
    );

    /* =====================================================
       STUDENT - REPORT RESOLVED
    ===================================================== */

    reports
      .filter(
        (report) =>
          report.status ===
            "resolved" ||
          report.status ===
            "Resolved"
      )
      .forEach(
        (report) => {
          if (!report.user_id) return;

          notifications.push({
            notification_key:
              `student-resolved-${report.id}`,

            recipient_role:
              "student",

            recipient_id:
              report.user_id,

            type:
              "resolved",

            title:
              "Item Reunited",

            description:
              `${report.item_name || "Your item"} has been successfully claimed.`,

            source_id:
              report.id,

            section:
              "reports",

            read:
              false,

            created_at:
              report.resolved_at ||
              report.created_at,
          });
        }
      );

    /* =====================================================
       STUDENT - MESSAGE RECEIVED
    ===================================================== */

    messages.forEach(
      (item) => {
        if (!item.receiver_id) return;

        notifications.push({
          notification_key:
            `student-message-${item.id}`,

          recipient_role:
            "student",

          recipient_id:
            item.receiver_id,

          type:
            "message",

          title:
            "New Message",

          description:
            `${item.sender_name || "A Foundly Member"} sent you a message.`,

          source_id:
            item.id,

          section:
            "messages",

          read:
            false,

          created_at:
            item.created_at,
        });
      }
    );

    if (
      notifications.length ===
      0
    ) {
      return;
    }

    const {
      error,
    } = await supabase
      .from("notifications")
      .upsert(
        notifications,
        {
          onConflict:
            "notification_key",

          ignoreDuplicates:
            true,
        }
      );

    if (error) {
      console.error(
        "❌ Notification sync error:",
        error
      );
    }
  } catch (error) {
    console.error(
      "❌ Notification sync failed:",
      error
    );
  }
}

/* =========================================================
   GET NOTIFICATIONS
========================================================= */

app.get(
  "/api/notifications",
  async (req, res) => {
    try {
      const {
        role,
        userId,
      } = req.query;

      await syncNotifications();

      let query = supabase
        .from("notifications")
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (
        role ===
        "student"
      ) {
        if (!userId) {
          return res.status(400).json({
            success: false,
            message:
              "User ID is required for student notifications.",
          });
        }

        query =
          query
            .eq(
              "recipient_role",
              "student"
            )
            .eq(
              "recipient_id",
              userId
            );
      } else if (
        role ===
        "admin"
      ) {
        query =
          query.eq(
            "recipient_role",
            "admin"
          );
      }

      const {
        data,
        error,
      } = await query;

      if (error) {
        console.error(
          "❌ Get notifications error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to load notifications.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,
        notifications:
          data || [],
      });
    } catch (error) {
      console.error(
        "❌ Notifications server error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while loading notifications.",
      });
    }
  }
);

/* =========================================================
   MARK NOTIFICATION READ
========================================================= */

app.patch(
  "/api/notifications/:id/read",
  async (req, res) => {
    try {
      const {
        id,
      } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          message:
            "Notification ID is required.",
        });
      }

      const {
        data,
        error,
      } = await supabase
        .from("notifications")
        .update({
          read:
            true,
        })
        .eq(
          "id",
          id
        )
        .select("*")
        .single();

      if (error) {
        console.error(
          "❌ Mark notification read error:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Unable to update notification.",
          error:
            error.message,
        });
      }

      return res.json({
        success: true,
        notification:
          data,
      });
    } catch (error) {
      console.error(
        "❌ Notification read error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while updating notification.",
      });
    }
  }
);

/* =========================================================
   MARK ALL NOTIFICATIONS READ
========================================================= */

app.patch(
  "/api/notifications/read-all",
  async (req, res) => {
    try {
      const {
        role,
        userId,
      } = req.body;

      if (
        role ===
        "student"
      ) {
        if (!userId) {
          return res.status(400).json({
            success: false,
            message:
              "User ID is required.",
          });
        }

        const {
          error,
        } = await supabase
          .from("notifications")
          .update({
            read:
              true,
          })
          .eq(
            "recipient_role",
            "student"
          )
          .eq(
            "recipient_id",
            userId
          );

        if (error) {
          console.error(
            "❌ Student read-all error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to mark notifications as read.",
            error:
              error.message,
          });
        }
      } else if (
        role ===
        "admin"
      ) {
        const {
          error,
        } = await supabase
          .from("notifications")
          .update({
            read:
              true,
          })
          .eq(
            "recipient_role",
            "admin"
          );

        if (error) {
          console.error(
            "❌ Admin read-all error:",
            error
          );

          return res.status(500).json({
            success: false,
            message:
              "Unable to mark notifications as read.",
            error:
              error.message,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message:
            "Notification role is required.",
        });
      }

      return res.json({
        success: true,
        message:
          "All notifications marked as read.",
      });
    } catch (error) {
      console.error(
        "❌ Read-all notification error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Something went wrong while updating notifications.",
      });
    }
  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `💗 Foundly API running on http://localhost:${PORT}`
    );

    console.log(
      "🌸 Allowed frontend: localhost on any port"
    );

    console.log(
      "☁️ Supabase connected"
    );
  }
);