import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import ProfileImg from "./assets/profile.png";

function Type() {
  const navigate = useNavigate();

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

    recognition.onstart = () => {
      setIsListening(true);
      showToast("Listening... Speak now", "success");
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setIngredientsText(transcript);
      setIsListening(false);
      showToast("Voice Captured!", "success");
    };

    recognition.onerror = () => {
      setIsListening(false);
      showToast("Speech Error. Try again!", "error");
    };

    recognition.onend = () => {
        setIsListening(false);
    };

    recognition.start();
  };

  /* ================= VALIDATION LOGIC ================= */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setIngredientsText(value);

    const forbiddenPattern = /(hello|good|bad|weather|price|buy|shop)/i;
    if (forbiddenPattern.test(value)) {
      setError("❌ Please type ingredient names only!");
    } else {
      setError("");
    }
  };

  /* ================= ANALYSIS LOGIC ================= */
  const handleAnalysis = () => {
    if (!ingredientsText.trim() || error) return;

    setAnalysisResult({
      name: ingredientsText,
      causes: "High intake leads to hypertension, kidney strain, and bloating.",
      level: "Risk", 
      prevention: "Switch to Himalayan pink salt and reduce processed food intake.",
      affectedOrgans: ["Kidneys", "Heart", "Blood Vessels"]
    });
    showToast("Analysis Complete!", "success");
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
      {analysisResult && (
        <div className="modal-overlay">
          <div className="modal-content wide-box">
            <div className="modal-header">
                <h3>Analysis Report</h3>
                <span className="close-x" onClick={() => setAnalysisResult(null)}>✖</span>
            </div>
            
            <div className={`level-badge ${analysisResult.level.toLowerCase()}`}>
              {analysisResult.level} Risk Level
            </div>

            <div className="result-details-box">
              <p><strong>Input:</strong> {analysisResult.name}</p>
              <p><strong>Health Risk:</strong> {analysisResult.causes}</p>
              <p><strong>Prevention:</strong> {analysisResult.prevention}</p>
            </div>

            <hr className="divider" />
            
            <h4>Affected Organs Visualization</h4>
            
            
            <div className="organ-tags-container">
              {analysisResult.affectedOrgans.map(organ => (
                <span key={organ} className="organ-tag red">⚠️ {organ}</span>
              ))}
            </div>
            
            <button className="main-btn" style={{marginTop: "20px"}} onClick={() => setAnalysisResult(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Type;