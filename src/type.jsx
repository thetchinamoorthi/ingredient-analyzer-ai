import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ProfileImg from "./assets/profile.png";
import { useLocation } from "react-router-dom";
import "./App.css";

function Type() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = location.state?.category || "Global"; // Default global

  console.log("Selected category:", category);
  // Syncing with 'currentUser'
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /* ================= UI STATES ================= */
  const [showMenu, setShowMenu] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 2500);
  };

  /* ================= SPEECH RECOGNITION LOGIC ================= */
  const handleVoiceInput = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast("Browser doesn't support Voice!", "error");
    return;
  }
   const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
     recognition.interimResults = false;
       recognition.maxAlternatives = 1; // ✅ safest alternative
        recognition.onstart = () => {
        setIsListening(true);
        showToast("Listening... Speak now", "success");
      };

      recognition.onresult = (event) => {
       if (event.results && event.results[0] && event.results[0][0]) {
        let transcript = event.results[0][0].transcript || "";

       // Replace "and" with comma
        transcript = transcript.replace(/\band\b/gi, ",");
      setIngredientsText(transcript.trim());
      showToast("Voice Captured!", "success");
    } else {
      showToast("No speech detected!", "error");
    }
    setIsListening(false);
  };
   
  recognition.onerror = (e) => {
    console.error("Speech Recognition Error:", e.error);
    setIsListening(false);
    showToast("Speech Error. Try again!", "error");
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  try {
    recognition.start();
  } catch (err) {
    console.error("Recognition start failed:", err);
    showToast("Voice recognition failed to start!", "error");
  }
};

  /* ================= VALIDATION LOGIC ================= */
  const handleInputChange = (e) => {
  let value = e.target.value;

  // Allow only letters, comma, space, %, brackets
  const allowedPattern = /^[a-zA-Z0-9,%()\- ]*$/;

  if (!allowedPattern.test(value)) {
    setError("❌ Only ingredient names allowed!");
  } else {
    setError("");
  }

  setIngredientsText(value);
};


  /* ================= ANALYSIS LOGIC ================= */
  
    const handleAnalysis = async () => {
  if (!ingredientsText.trim() || error) return;

  // Split by comma
  const ingredientArray = ingredientsText
    .split(",")
    .map(i => i.trim())
    .filter(i => i.length > 0);

  if (ingredientArray.length > 15) {
    showToast("❌ Maximum 15 ingredients only allowed!", "error");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientsText: ingredientArray.join(", "),
        username: user?.username,
        category: category 
      })
    });

    const data = await response.json();
    if (data.success) {
      setAnalysisResult(data.data);
      showToast("Analysis Complete!", "success");
    } else {
      showToast("Analysis Failed!", "error");
    }
  } catch (err) {
    showToast("Server Error!", "error");
  }
};

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    navigate("/");
    showToast("Successfully Logged Out!", "success");
  };

  return (
    <div className="analysis-container">
      {toast.show && <div className={`toast-message ${toast.type}`}>{toast.msg}</div>}

      {/* ===== TOP BAR ===== */}
      <div className="top-bar">
        <div className="menu" onClick={() => setShowMenu(true)}>☰</div>
        <h2>INGREDIENT ANALYSIS AI</h2>
        <div className="top-right">
          <div className="profile-icon-wrapper" title={user ? user.username : "Guest User"}>
            <img src={ProfileImg} alt="profile" className="profile-icon" />
          </div>
        </div>
      </div>

      {/* ===== MENU OVERLAY ===== */}
      {showMenu && (
        <div className="modal-overlay" onClick={() => setShowMenu(false)}>
          <div className="modal-content menu-content" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header">
               <h3>Menu</h3>
               <span className="close-x" onClick={() => setShowMenu(false)}>✖</span>
            </div>
            <div className="menu-options-list">
               <p className="menu-item" onClick={() => { navigate("/"); setShowMenu(false); }}>🏠 Home</p>
               <hr style={{margin: '10px 0', opacity: '0.3'}} />
               <p className="menu-item logout-text" onClick={handleLogout} style={{color: '#dc3545'}}>🚪 Logout</p>
            </div>
          </div>
        </div>
      )}

      <h3 className="center-title">MANUAL ENTRY</h3>
      <div className="type-section">
        <div className="ingredient-card">
          <div className="card-header-flex">
            <h4>Type Ingredients</h4>
            <button 
              className={`mic-btn ${isListening ? "listening" : ""}`} 
              onClick={handleVoiceInput}
              title="Speak Ingredients"
            >
              {isListening ? "🛑" : "🎤"}
            </button>
          </div>
          
          <textarea 
            value={ingredientsText} 
            onChange={handleInputChange}
            placeholder="e.g. Sodium Nitrate, Aspartame, MSG..."
            className={error ? "input-error" : ""}
          />
          {error && <p className="error-text-msg">{error}</p>}
          
          <button 
            className="main-btn" 
            disabled={!ingredientsText.trim() || error}
            onClick={handleAnalysis}
          >
            Start Analysis
          </button>
        </div>
      </div>

      {/* ===== ANALYSIS RESULT MODAL ===== */}
     {analysisResult && analysisResult.length > 0 && (
       <div className="modal-overlay">
       <div className="modal-content wide-box">
      <div className="modal-header">
        <h3>Analysis Report</h3>
        <span className="close-x" onClick={() => setAnalysisResult(null)}>✖</span>
      </div>

        {analysisResult.map((item, index) => (
        <div key={index} className="result-card">
        <div className={`level-badge ${item.riskLevel.toLowerCase()}`}>
        {item.riskLevel} Risk Level
          </div>

          <div className="result-details-box">
            <p><strong>Ingredient:</strong> {item.ingredientName}</p>
            <p><strong>Health Risk:</strong> {item.causes}</p>
            <p><strong>Prevention:</strong> {item.prevention}</p>
          </div>

          <hr className="divider" />

          <h4>Affected Organs</h4>

          <div className="organ-tags-container">
            {item.affectedOrgans && item.affectedOrgans.length > 0 ? (
              item.affectedOrgans.map((organ, i) => (
                <span key={i} className="organ-tag red">⚠️ {organ}</span>
              ))
            ) : (
              <span className="organ-tag">No Data</span>
            )}
          </div>

          <hr />
        </div>
      ))}

      <button
        className="main-btn"
        style={{ marginTop: "20px" }}
        onClick={() => setAnalysisResult(null)}
      >
        Done
      </button>
    </div>
  </div>
)}
 </div>
  );
}

export default Type;