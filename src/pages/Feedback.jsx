import { useState } from "react";

import {
  ArrowLeft,
  Heart,
  Star,
  MessageCircle,
  Send,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import API_URL from "../api";
import "./Feedback.css";

function Feedback({ currentUser, onBack }) {
  const userName =
    currentUser?.name ||
    currentUser?.fullName ||
    currentUser?.username ||
    "Foundly Member";

  const userEmail =
    currentUser?.email?.trim().toLowerCase() || "";

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("");
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "App Experience",
    "Report Lost / Found",
    "Messages",
    "Points & Rewards",
    "Bug / Problem",
    "Other",
  ];

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (rating === 0) {
      setError("Please choose a rating.");
      return;
    }

    if (!category) {
      setError("Please choose a feedback category.");
      return;
    }

    if (!comment.trim()) {
      setError("Please tell us what you think.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_URL}/api/feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser?.id || null,
            name: userName,
            email: userEmail,
            rating,
            category,
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to submit feedback."
        );
      }

      // Beritahu Dashboard supaya refresh feedback
      window.dispatchEvent(
        new Event("foundly-feedback-updated")
      );

      setSubmitted(true);
    } catch (submitError) {
      console.error(
        "Submit feedback error:",
        submitError
      );

      setError(
        submitError.message ||
          "Unable to save your feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setSubmitted(false);
    setRating(0);
    setCategory("");
    setComment("");
    setError("");

    onBack?.();
  };

  return (
    <div className="feedback-page">
      {/* BACKGROUND */}
      <div className="feedback-glow feedback-glow-one" />
      <div className="feedback-glow feedback-glow-two" />

      <div className="feedback-floating feedback-float-one">
        ♥
      </div>

      <div className="feedback-floating feedback-float-two">
        ✦
      </div>

      <div className="feedback-floating feedback-float-three">
        ✨
      </div>

      {/* HEADER */}
      <header className="feedback-header">
        <button
          type="button"
          className="feedback-back-button"
          onClick={onBack}
        >
          <ArrowLeft size={19} />
          Back to Dashboard
        </button>

        <div className="feedback-header-title">
          <MessageCircle size={19} />
          FOUNDLY FEEDBACK
        </div>
      </header>

      {/* MAIN */}
      <main className="feedback-main">
        {!submitted ? (
          <section className="feedback-card">
            <div className="feedback-intro">
              <div className="feedback-icon">
                <Heart
                  size={31}
                  fill="currentColor"
                />
              </div>

              <span>HELP US IMPROVE</span>

              <h1>
                Your Feedback
                <strong> Matters ♥</strong>
              </h1>

              <p>
                Tell us how your Foundly experience
                can be even better.
              </p>
            </div>

            <form
              className="feedback-form"
              onSubmit={handleSubmit}
            >
              {/* RATING */}
              <div className="feedback-field">
                <label>
                  How would you rate Foundly?
                </label>

                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className={
                        star <= rating
                          ? "rating-star active"
                          : "rating-star"
                      }
                      onClick={() =>
                        setRating(star)
                      }
                      aria-label={`${star} stars`}
                    >
                      <Star
                        size={31}
                        fill={
                          star <= rating
                            ? "currentColor"
                            : "none"
                        }
                      />
                    </button>
                  ))}
                </div>

                <span className="rating-label">
                  {rating === 0 &&
                    "Choose a rating"}

                  {rating === 1 &&
                    "Needs improvement"}

                  {rating === 2 &&
                    "Could be better"}

                  {rating === 3 &&
                    "It's okay"}

                  {rating === 4 &&
                    "Great experience"}

                  {rating === 5 &&
                    "Amazing! 💗"}
                </span>
              </div>

              {/* CATEGORY */}
              <div className="feedback-field">
                <label>
                  Feedback Category
                </label>

                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(
                      e.target.value
                    )
                  }
                >
                  <option value="">
                    Select a category
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* COMMENT */}
              <div className="feedback-field">
                <label>
                  Your Feedback
                </label>

                <div className="feedback-textarea-wrapper">
                  <MessageCircle
                    size={19}
                  />

                  <textarea
                    placeholder="Tell us what you like, what could be improved, or any ideas you have..."
                    value={comment}
                    onChange={(e) =>
                      setComment(
                        e.target.value
                      )
                    }
                    rows={6}
                  />
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="feedback-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              {/* USER */}
              <div className="feedback-user">
                <div className="feedback-user-avatar">
                  {currentUser?.profileImage ? (
                    <img
                      src={
                        currentUser.profileImage
                      }
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
                    {userEmail}
                  </span>
                </div>

                <CheckCircle2 size={18} />
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                className="feedback-submit"
                disabled={isSubmitting}
              >
                <Send size={18} />

                {isSubmitting
                  ? "Submitting..."
                  : "Submit Feedback"}

                <Sparkles size={17} />
              </button>
            </form>
          </section>
        ) : (
          <section className="feedback-success-card">
            <div className="feedback-success-icon">
              <CheckCircle2 size={48} />
            </div>

            <span>
              THANK YOU ♥
            </span>

            <h1>
              Feedback Received!
            </h1>

            <p>
              Thank you for helping us improve
              the Foundly experience for everyone
              in our school community.
            </p>

            <div className="success-rating">
              {[1, 2, 3, 4, 5].map(
                (star) => (
                  <Star
                    key={star}
                    size={22}
                    fill={
                      star <= rating
                        ? "currentColor"
                        : "none"
                    }
                  />
                )
              )}
            </div>

            <button
              type="button"
              className="feedback-success-button"
              onClick={
                handleCloseSuccess
              }
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="feedback-footer">
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

export default Feedback;