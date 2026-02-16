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

  const captureAndExtract = async () => {
  if (!videoRef.current) return;

  setIsExtracting(true);

  const canvas = document.createElement("canvas");
  canvas.width = videoRef.current.videoWidth;
  canvas.height = videoRef.current.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoRef.current, 0, 0);

  const imageData = canvas.toDataURL("image/png");

  try {
    const { data: { text } } = await Tesseract.recognize(imageData, "eng");

    let normalized = text
      .replace(/\r/g, " ")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    // Flexible Ingredients detection
    const match = normalized.match(/ingred[a-z]*\s*[:\-]?/i);

    let ingText = match
      ? normalized.substring(
          normalized.toLowerCase().indexOf(match[0].toLowerCase()) + match[0].length
        )
      : normalized;

    // Stop at unwanted sections
    const stopWords = [
      "manufactured",
      "marketed",
      "expiry",
      "fssai",
      "net weight",
      "mrp",
      "batch"
    ];

    for (let word of stopWords) {
      const stopIndex = ingText.toLowerCase().indexOf(word);
      if (stopIndex !== -1) {
        ingText = ingText.substring(0, stopIndex);
        break;
      }
    }

    // Clean but keep brackets
    ingText = ingText
      .replace(/[^a-zA-Z0-9,%()\- ]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    let ingredientList = ingText
      .split(",")
      .map(i => i.trim())
      .filter(i => i.length > 1)
      .slice(0, 8); // limit 8

    const finalText = ingredientList.join(", ");

    setIngredientsText(finalText);

    showToast("✅ Ingredients Extracted!");

    // Stop camera
    const stream = videoRef.current.srcObject;
    stream.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);

  } catch (err) {
    showToast("❌ OCR failed!", "error");
  }

  setIsExtracting(false);
};


  /* ================= ANALYSIS LOGIC ================= */
  const handleAnalysis = async () => {
  if (!ingredientsText) return showToast("No ingredients detected!");
  if (!user) return showToast("Login required!");

  try {
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientsText,
        username: user.username
      })
    });

    const result = await response.json();
    if (!result.success)
      return showToast("No data found!", "error");
      setAnalysisResult(result.data);
} catch {
    showToast("Server error!", "error");
  }
};

const handleLogout = () => {
  localStorage.removeItem("currentUser");
  navigate("/"); // Login or start page
  showToast("Successfully Logged Out!", "success");
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
                <p 
            className="menu-item" 
            onClick={() => { 
              navigate("/front"); 
              setShowMenu(false); // Overlay close
            }}
          >
            🏠 Home
          </p>
                <hr className="menu-hr" />
               <p 
            className="menu-item logout-btn-text" 
            onClick={() => {
              handleLogout();
              setShowMenu(false); // Overlay close
            }}
          >
            🚪 Logout
          </p>
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

      {analysisResult.map((item, index) => (
        <div key={index} className="result-details-box">

          <div className={`level-badge ${item.riskLevel?.toLowerCase()}`}>
            {item.riskLevel} Risk
          </div>

          <p><strong>Ingredient:</strong> {item.ingredientName}</p>
          <p><strong>Health Risk:</strong> {item.causes}</p>
          <p><strong>Prevention:</strong> {item.prevention}</p>

          <h4>Affected Organs</h4>
          <div className="organ-tags-container">
            {item.affectedOrgans?.map((organ, i) => (
              <span key={i} className="organ-tag red">
                ⚠️ {organ}
              </span>
            ))}
          </div>
         <hr className="divider" />
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
export default Scan;