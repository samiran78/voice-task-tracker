// ============================================================
// VoiceInput.js — Microphone Recorder + Gemini AI Parser
//
// SELF-NOTE: This is THE signature feature of this app.
// It uses the browser's built-in Web Speech API — no extra
// npm package, no cost, works in Chrome/Edge.
//
// COMPONENT FLOW:
//   1. User clicks the mic button
//   2. Browser asks for microphone permission
//   3. SpeechRecognition starts listening
//   4. As user speaks, onresult fires with a live transcript
//   5. User clicks stop (or speech naturally ends → onstop fires)
//   6. We send the final transcript to our backend /api/voice/parse
//   7. Gemini AI parses it → returns { title, priority, dueDate, status }
//   8. We call onParsed(result) → parent (App.js) uses this to
//      pre-fill the TaskForm
//
// PROPS:
//   onParsed(parsedTask) — callback. Parent receives parsed AI data.
// ============================================================

import React, { useState, useRef, useCallback } from "react";
import api from "../services/api";
import "./VoiceInput.css";

// ============================================================
// BROWSER COMPATIBILITY CHECK
//
// SELF-NOTE: Web Speech API is NOT universally supported.
// Chrome and Edge support it. Firefox does NOT.
// We check at module level (not inside the component) so
// we only evaluate once, not on every render.
// ============================================================
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

const isSpeechSupported = Boolean(SpeechRecognition);
// ^^^ If this is false, we show a friendly "not supported" message.

// ============================================================
// COMPONENT: VoiceInput
// ============================================================
const VoiceInput = ({ onParsed }) => {

  // -----------------------------------------------------------
  // STATE
  //
  // SELF-NOTE: useState returns [currentValue, setterFunction].
  // React re-renders the component every time a state value changes.
  // We need separate pieces of state for each independent piece of UI.
  // -----------------------------------------------------------

  // Is the microphone currently active?
  const [isListening, setIsListening] = useState(false);

  // The live transcript text shown while user is speaking
  const [transcript, setTranscript] = useState("");

  // Are we waiting for the Gemini API response?
  const [isParsing, setIsParsing] = useState(false);

  // Any error message to show the user (null = no error)
  const [error, setError] = useState(null);

  // Success message after parsing (e.g. "✅ Task detected!")
  const [successMsg, setSuccessMsg] = useState(null);

  // Timer for manual silence detection
  const silenceTimerRef = useRef(null);

  // -----------------------------------------------------------
  // REF: recognitionRef
  //
  // SELF-NOTE: useRef stores a value that PERSISTS across renders
  // but does NOT cause a re-render when it changes.
  // Perfect for storing the SpeechRecognition instance:
  //   - We need it to persist (so we can call .stop() later)
  //   - We DON'T need the UI to re-render when we get/set it
  //
  // Think of refs as a "box" outside the render cycle.
  // -----------------------------------------------------------
  const recognitionRef = useRef(null);

  // -----------------------------------------------------------
  // startListening — Initialize and start SpeechRecognition
  //
  // SELF-NOTE: useCallback memoizes this function so it's not
  // recreated on every render. The empty [] dependency array means
  // "never recreate this — it has no dependencies on state/props".
  // -----------------------------------------------------------
  // -----------------------------------------------------------
  // sendToGemini — wrapped in useCallback so it can be a stable
  // dependency reference for startListening below.
  // SELF-NOTE: Without useCallback, sendToGemini would be a new
  // function reference on every render, causing the ESLint
  // react-hooks/exhaustive-deps rule to warn (and causing
  // startListening to also recreate on every render).
  // -----------------------------------------------------------
  const sendToGemini = useCallback(async (text) => {
    setIsParsing(true);
    setError(null);

    try {
      const response = await api.parseVoiceTranscript(text);

      if (response.success) {
        const parsed = response.data.parsedResponse;

        setSuccessMsg(
          `✅ Detected: "${parsed.title}" | Priority: ${parsed.priority}${
            parsed.dueDate ? ` | Due: ${parsed.dueDate}` : ""
          }`
        );

        // Lift parsed data up to parent (App.js) to pre-fill the TaskForm
        onParsed(parsed);
      }
    } catch (err) {
      const message =
        err.response?.data?.error ||
        "Failed to process voice. Please try again.";
      setError(message);
    } finally {
      setIsParsing(false);
    }
  }, [onParsed]); // onParsed is a prop — must be in deps

  const startListening = useCallback(() => {
    // Reset all feedback states before a new recording session
    setError(null);
    setSuccessMsg(null);
    setTranscript("");

    // Create a new SpeechRecognition instance
    const recognition = new SpeechRecognition();

    // SELF-NOTE: interimResults = true means we get partial results
    // as the user speaks (live transcript effect), not just at the end
    recognition.interimResults = true;

    // English language. Could make this dynamic later.
    recognition.lang = "en-US";

    // continuous = true means it keeps listening even if there's a pause.
    // false means it stops after the first pause in speech.
    recognition.continuous = false;

    // -----------------------------------------------------------
    // EVENT: onresult
    // Fires every time new speech is detected.
    // 'event.results' is an array of SpeechRecognitionResult objects.
    // Each result has an array of alternatives (we always take [0]).
    // We join all results into one string for the live preview.
    // -----------------------------------------------------------
    recognition.onresult = (event) => {
      // Clear the silence timer whenever we hear something new
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }

      // Start a new 3-second timer
      silenceTimerRef.current = setTimeout(() => {
        console.log("🤫 Silence detected, stopping automatically...");
        stopListening();
      }, 3000);

      const currentTranscript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join(" ");

      setTranscript(currentTranscript);
    };

    // -----------------------------------------------------------
    // EVENT: onend
    // Fires when the microphone stops (user stopped or silence timeout).
    // This is when we take the transcript and send it to Gemini.
    // -----------------------------------------------------------
    recognition.onend = () => {
      setIsListening(false);

      // Read the final transcript from the ref we stored
      // (state updates are async, so we use the ref to get the actual final value)
      const finalTranscript = recognitionRef.current?.finalTranscript;

      if (finalTranscript && finalTranscript.trim().length >= 5) {
        sendToGemini(finalTranscript.trim());
      } else {
        // The user probably just stopped without saying anything useful
        setError("No speech detected. Please try again.");
      }
    };

    // -----------------------------------------------------------
    // EVENT: onerror
    // Handles mic permission denied, network errors, etc.
    // We map each error code to a human-readable message.
    // -----------------------------------------------------------
    recognition.onerror = (event) => {
      setIsListening(false);
      const errorMessages = {
        "not-allowed":
          "Microphone permission denied. Please allow mic access in your browser.",
        "no-speech": "No speech was detected. Please try again.",
        network: "Network error. Check your internet connection.",
        aborted: "Recording was aborted.",
      };
      setError(
        errorMessages[event.error] || `Speech error: ${event.error}`
      );
    };

    // Save the instance to the ref so we can .stop() it later
    recognitionRef.current = recognition;

    // Also add a property to track the final transcript
    recognition.finalTranscript = "";
    recognition.onresult = (event) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        // isFinal = true means SpeechRecognition is confident this chunk is done
        if (event.results[i].isFinal) {
          final += text + " ";
        } else {
          interim += text;
        }
      }

      recognition.finalTranscript += final;
      // Show the full transcript (final + what's being said right now)
      setTranscript(recognition.finalTranscript + interim);
    };

    // Actually start the microphone!
    recognition.start();
    setIsListening(true);
  }, [sendToGemini]); // sendToGemini is now stable via useCallback

  // -----------------------------------------------------------
  // stopListening — Manually stop the microphone
  // -----------------------------------------------------------
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    if (recognitionRef.current) {
      // .stop() triggers the onend event which calls sendToGemini
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []); // No deps — only touches refs and setters which are stable

  // sendToGemini is now defined above as a useCallback, before startListening.

  // -----------------------------------------------------------
  // RENDER: If browser doesn't support Speech API
  // -----------------------------------------------------------
  if (!isSpeechSupported) {
    return (
      <div className="voice-input-unsupported">
        <p>
          🚫 Your browser doesn't support voice input. Please use{" "}
          <strong>Chrome</strong> or <strong>Edge</strong>.
        </p>
      </div>
    );
  }

  // -----------------------------------------------------------
  // RENDER: Main voice input UI
  // -----------------------------------------------------------
  return (
    <div className="voice-input-container">
      {/* Section title */}
      <h3 className="voice-input-title">🎤 Voice Input</h3>
      <p className="voice-input-subtitle">
        Speak your task — AI will extract the title, priority, and due date.
      </p>

      {/* SELF-NOTE: Conditional class — we add 'listening' class
          when isListening is true. This triggers the CSS pulse animation. */}
      <div className={`mic-area ${isListening ? "listening" : ""}`}>

        {/* Mic Button — toggles between start and stop */}
        <button
          className={`mic-btn ${isListening ? "active" : ""} ${
            isParsing ? "parsing" : ""
          }`}
          onClick={isListening ? stopListening : startListening}
          disabled={isParsing}
          aria-label={isListening ? "Stop Recording" : "Start Recording"}
        >
          {/* Dynamic icon based on state */}
          {isParsing ? "⏳" : isListening ? "⏹" : "🎤"}
        </button>

        {/* Status label below the mic button */}
        <p className="mic-status">
          {isParsing
            ? "Sending to AI..."
            : isListening
            ? "Recording... Click to stop"
            : "Click to start speaking"}
        </p>
      </div>

      {/* Live transcript preview — only shown while/after recording */}
      {transcript && (
        <div className="transcript-box">
          <p className="transcript-label">You said:</p>
          {/* SELF-NOTE: The 'live' class triggers a subtle blinking animation
              while isListening=true to show it's still updating */}
          <p className={`transcript-text ${isListening ? "live" : ""}`}>
            "{transcript}"
          </p>
        </div>
      )}

      {/* Error message — only shown when error state is set */}
      {error && (
        <div className="voice-error">
          <span>⚠️ {error}</span>
          {/* Allow user to dismiss the error */}
          <button onClick={() => setError(null)} className="dismiss-btn">
            ✕
          </button>
        </div>
      )}

      {/* Success message — shown after Gemini successfully parses */}
      {successMsg && (
        <div className="voice-success">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="dismiss-btn">
            ✕
          </button>
        </div>
      )}

      {/* Helper tip */}
      <p className="voice-tip">
        💡 Try: "Add a high priority task to review the report by tomorrow"
      </p>
    </div>
  );
};

export default VoiceInput;
