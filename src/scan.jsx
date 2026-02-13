import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import ProfileImg from "./assets/profile.png";

function Scan() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  // User details for profile hover
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /* ================= UI STATES ================= */
  const [showMenu, setShowMenu] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [ingredientsText, setIngredientsText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 2500);
  };

  /* ================= CAMERA LOGIC ================= */
  const startCamera = async () => {
    setIsCameraOpen(true);
    setIngredientsText(""); // Reset text on new scan
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      showToast("Camera access denied!", "warning");
      setIsCameraOpen(false);
    }
  };

  const captureAndExtract = () => {
    setIsExtracting(true);
    
    // Simulating AI Text Extraction (OCR)
    setTimeout(() => {
      const mockIngredients = "Sodium Nitrite, High Fructose Corn Syrup, Artificial Colors, MSG";
      setIngredientsText(mockIngredients);
      setIsExtracting(false);
      showToast("Ingredients Extracted!", "success");
      
      // Stop Camera Stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach(track => track.stop());
      }
      setIsCameraOpen(false);
    }, 2000); 
  };

  /* ================= ANALYSIS LOGIC ================= */
  const handleAnalysis = () => {
    if (!ingredientsText) return;
    setAnalysisResult({
      name: "Sodium Nitrite & MSG",
      causes: "Increased risk of type 2 diabetes and nervous system sensitivity.",
      level: "Risk", 
      prevention: "Avoid highly processed snacks and choose fresh alternatives.",
      affectedOrgans: ["Heart", "Stomach", "Brain"]
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  return (
    <div className="analysis-container">
      {toast.show && <div className={`toast-message ${toast.type}`}>{toast.msg}</div>}

      {/* ===== TOP BAR ===== */}
      <div className="top-bar">
        <div className="menu" onClick={() => setShowMenu(true)}>☰</div>
        <h2 className="top-title">INGREDIENT ANALYSIS AI</h2>
        <div className="top-right">
          <div className="profile-icon-wrapper" title={user ? user.username : "Guest"}>
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
                <p className="menu-item" onClick={() => navigate("/front")}>🏠 Home</p>
                <hr className="menu-hr" />
                <p className="menu-item logout-btn-text" onClick={handleLogout}>🚪 Logout</p>
             </div>
          </div>
        </div>
      )}

      <h3 className="center-title">SCAN PRODUCT LABEL</h3>

      <div className="scan-section">
        {!isCameraOpen ? (
          <div className="camera-trigger-card" onClick={startCamera}>
            <div className="camera-circle">📷</div>
            <p>Tap to Open Camera</p>
          </div>
        ) : (
          <div className="live-camera-container">
            <video ref={videoRef} autoPlay playsInline className="video-feed" />
            {isExtracting && <div className="scan-line"></div>}
            <div className="camera-controls">
                <button className="capture-btn" onClick={captureAndExtract} disabled={isExtracting}>
                  {isExtracting ? "Extracting..." : "Capture & Extract"}
                </button>
                <button className="cancel-btn" onClick={() => setIsCameraOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ===== INGREDIENT BOX (LOCKED) ===== */}
        <div className="ingredient-box-card">
          <h4>Detected Ingredients</h4>
          <textarea 
            value={ingredientsText} 
            readOnly // Manual typing block panniyachu
            placeholder="Ingredients will appear here after scanning..."
            className="locked-textarea"
          />
          <button 
            className="main-btn" 
            disabled={!ingredientsText.trim()} // Text illana click aagathu
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
              {analysisResult.level} Level
            </div>

            <div className="result-details">
              <p><strong>Detected:</strong> {analysisResult.name}</p>
              <p><strong>Health Risk:</strong> {analysisResult.causes}</p>
              <p><strong>Prevention:</strong> {analysisResult.prevention}</p>
            </div>

            <hr className="divider" />
            
            <h4>Affected Organs</h4>
            

[Image of the human digestive system]

            <div className="organ-tags-container">
                {analysisResult.affectedOrgans.map(organ => (
                  <span key={organ} className="organ-tag red">⚠️ {organ}</span>
                ))}
            </div>
            
            <button className="main-btn" style={{marginTop: '20px'}} onClick={() => setAnalysisResult(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Scan;