import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import ProfileImg from "./assets/profile.png";
import Tesseract from "tesseract.js";
import { useLocation } from "react-router-dom";

function Upload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const location = useLocation();
  const category = location.state?.category || "Global"; // Default global

    console.log("Selected category:", category);
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
  if (!file) return;

  setSelectedImage(URL.createObjectURL(file));
  setIngredientsText("");
  setIsScanning(true);
  showToast("Scanning image...", "success");
  Tesseract.recognize(file, "eng")
  .then(({ data: { text } }) => {

    let normalized = text
      .replace(/\r/g, " ")
      .replace(/\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    let ingText = "";

    //  Flexible detection (handles OCR mistakes)
    const match = normalized.match(/ingred[a-z]*\s*[:\-]?/i);

    if (match) {
      const index = normalized.toLowerCase().indexOf(match[0].toLowerCase());
      ingText = normalized.substring(index + match[0].length);
    } else {
      //  Fallback: assume whole text might be ingredients block
      ingText = normalized;
    }

    // Stop at unwanted sections
    const stopWords = [
      "manufactured",
      "marketed",
      "best before",
      "expiry",
      "fssai",
      "net weight",
      "mrp",
      "packed",
      "batch",
      "customer care"
    ];

    for (let word of stopWords) {
      const stopIndex = ingText.toLowerCase().indexOf(word);
      if (stopIndex !== -1) {
        ingText = ingText.substring(0, stopIndex);
        break;
      }
    }

    //  Clean but keep brackets and %
    ingText = ingText
      .replace(/[^a-zA-Z0-9,%()\- ]/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    //  Split ingredients
    let ingredientList = ingText
      .split(",")
      .map(i => i.trim())
      .filter(i => i.length > 1);

    //  If comma not detected properly → split by space pattern
    if (ingredientList.length <= 1) {
      ingredientList = ingText
        .split(/(?=[A-Z])/)
        .map(i => i.trim())
        .filter(i => i.length > 2);
    }

    //  Limit to 8
    ingredientList = ingredientList.slice(0, 15);

    const finalText = ingredientList.join(", ");

    if (!finalText) {
      showToast(" Unable to detect ingredients!", "error");
      setIsScanning(false);
      return;
    }

    setIngredientsText(finalText);
    setIsScanning(false);
    showToast("✅ Ingredients extracted!");
  })
  .catch(() => {
    setIsScanning(false);
    showToast(" OCR failed!", "error");
  });


};

  /* ================= ANALYSIS LOGIC ================= */
  
  const handleAnalysis = async () => {
  if (!ingredientsText) return showToast("❌ No ingredients detected!", "error");
  if (!user) return showToast("❌ Login first!", "error");

  try {
    setIsScanning(true);
    const response = await fetch("http://localhost:5000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ingredientsText, // ✅ fixed
        username: user?.username,
        category:category
      })
    });
    const result = await response.json();
    setIsScanning(false);

    if (!result.success || !result.data.length)
      return showToast("❌ No analysis found!", "error");

    setAnalysisResult(result.data);
    showToast("✅ Analysis Complete!");
  } catch (err) {
    setIsScanning(false);
    console.error("Server Error:", err);
    showToast("Server Error!", "error");
  }
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
            readOnly 
            placeholder="Text will appear after upload..."
            className="locked-textarea"
          />
          <button 
            className="main-btn" 
            disabled={!ingredientsText.trim() || isScanning} 
            onClick={handleAnalysis} // ← idha add pannanum
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
        <div key={index}>
          <div className={`level-badge ${item.riskLevel?.toLowerCase()}`}>
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
            {item.affectedOrgans?.length > 0 ? (
              item.affectedOrgans.map((organ, i) => (
                <span key={i} className="organ-tag red">
                  ⚠️ {organ}
                </span>
              ))
            ) : (
              <p>No organs affected</p>
            )}
          </div>

          <hr style={{marginTop: "20px"}} />
        </div>
      ))}

      <button 
        className="main-btn" 
        style={{marginTop: "20px"}} 
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

export default Upload;