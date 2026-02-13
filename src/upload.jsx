import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import ProfileImg from "./assets/profile.png";

function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  const [user] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  /* ================= UI STATES ================= */
  const [showMenu, setShowMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ingredientsText, setIngredientsText] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false); // For Loading State
  const [toast, setToast] = useState({ show: false, msg: "", type: "" });

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 2500);
  };

  /* ================= UPLOAD LOGIC ================= */
  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
      setIngredientsText(""); // Reset previous text
      setIsScanning(true); 
      showToast("Uploading & Scanning...", "success");
      
      // Simulating AI Extraction
      setTimeout(() => {
        const extracted = "Palm Oil, MSG (Monosodium Glutamate), Tartrazine";
        setIngredientsText(extracted);
        setIsScanning(false);
        showToast("Ingredients Extracted!", "success");
      }, 2000);
    }
  };

  /* ================= ANALYSIS LOGIC ================= */
  const handleAnalysis = () => {
    if (!ingredientsText) return;
    setAnalysisResult({
      name: "MSG & Tartrazine",
      causes: "May cause headaches, allergic reactions, and hyperactivity in children.",
      level: "Moderate", 
      prevention: "Look for MSG-free labels and avoid artificial food dyes.",
      affectedOrgans: ["Brain", "Skin", "Nervous System"]
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
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

      <h3 className="center-title">UPLOAD PRODUCT IMAGE</h3>

      <div className="upload-section">
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        
        <div className="upload-trigger-card" onClick={handleFileClick}>
          <div className="file-icon-circle">📁</div>
          <p>{selectedImage ? "Change Selected Image" : "Click to Upload from Gallery"}</p>
        </div>

        {selectedImage && (
          <div className="preview-container">
            <img src={selectedImage} alt="Preview" className="img-preview-box" />
            {isScanning && <div className="scan-bar"></div>}
          </div>
        )}

        <div className="ingredient-card">
          <h4>Extracted Ingredients</h4>
          <textarea 
            value={isScanning ? "Scanning in progress..." : ingredientsText} 
            readOnly // Condition 1: Manual typing blocked
            placeholder="Text will appear after upload..."
            className="locked-textarea"
          />
          <button 
            className="main-btn" 
            disabled={!ingredientsText.trim() || isScanning} // Condition 2: Text iruntha thaan work aagum
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
              <p><strong>Ingredients:</strong> {analysisResult.name}</p>
              <p><strong>Health Risks:</strong> {analysisResult.causes}</p>
              <p><strong>Prevention:</strong> {analysisResult.prevention}</p>
            </div>

            <hr className="divider" />
            
            <h4>Affected Organs</h4>
            

[Image of the nervous system and brain]


            <div className="organ-tags-container">
                {analysisResult.affectedOrgans.map(organ => (
                  <span key={organ} className="organ-tag orange">⚠️ {organ}</span>
                ))}
            </div>
            
            <button className="main-btn" style={{marginTop: '20px'}} onClick={() => setAnalysisResult(null)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Upload;