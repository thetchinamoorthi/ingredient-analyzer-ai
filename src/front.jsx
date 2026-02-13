import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import ProfileImg from "./assets/profile.png";

function Front() {
  const navigate = useNavigate();
  
  // Refs for Smooth Navigation
  const homeRef = useRef(null);
  const ingredientTypeRef = useRef(null);
  const howToUseRef = useRef(null);

  // ===== USER STATE =====
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // ===== POPUP STATES =====
  const [showSignin, setShowSignin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showMenuPopup, setShowMenuPopup] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  
  // NEW: Forgot Password Popup States
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // NEW: Category Popup State
  const [showCategoryPopup, setShowCategoryPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");

  // PASSWORD SHOW/HIDE STATE
  const [showPassword, setShowPassword] = useState(false);
  
  // INPUT STATES
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  
  // FEEDBACK STATES
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackUsername, setFeedbackUsername] = useState("");
  const [feedbackText, setFeedbackText] = useState("");
  const [rating, setRating] = useState(0);

  // PROFILE DATA STATE
  const [profileData, setProfileData] = useState({
    name: "",
    age: "",
    gender: "Male"
  });

  // FORGOT PASSWORD INPUT STATES
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  const [toast, setToast] = useState({ show: false, msg: "", type: "" });
  
  // HISTORY DELETE STATES
  const [history, setHistory] = useState([]);
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Sync History & Profile when User Logs in
  useEffect(() => {
    if (user) {
      const allHistory = JSON.parse(localStorage.getItem("userHistories") || "{}");
      setHistory(allHistory[user.username] || []);
      setProfileData({
        name: user.name || user.username,
        age: user.age || "",
        gender: user.gender || "Male"
      });
    } else {
      setHistory([]);
    }
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: "", type: "" }), 3000);
  };

  const scrollToSection = (ref) => {
    if (ref.current) ref.current.scrollIntoView({ behavior: "smooth" });
    setShowMenuPopup(false);
  };

  // ===== CORE LOGIC: PROCESS ACTION (HISTORY + NAVIGATE) =====
  const processAction = (actionName, path) => {
    if (!user) {
      showToast("❌ Login required to perform this action!", "error");
      setShowSignin(true); // Open login modal automatically
      return;
    }

    const now = new Date();
    const newItem = {
      id: Date.now(),
      date: now.toLocaleDateString(),
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: actionName 
    };

    const allHistory = JSON.parse(localStorage.getItem("userHistories") || "{}");
    const userHistory = allHistory[user.username] || [];
    const updatedHistory = [newItem, ...userHistory];
    
    allHistory[user.username] = updatedHistory;
    localStorage.setItem("userHistories", JSON.stringify(allHistory));
    
    setHistory(updatedHistory);
    
    showToast(`✅ Redirecting to ${actionName}...`);
    setShowCategoryPopup(false);
    
    setTimeout(() => {
       navigate(path);
    }, 1000);
  };

  // ===== DELETE HISTORY LOGIC =====
  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const deleteHistory = () => {
    if (selectedIds.length === 0) {
      showToast("❌ Nothing selected to delete", "error");
      return;
    }
    const allHistory = JSON.parse(localStorage.getItem("userHistories") || "{}");
    const updatedUserHistory = history.filter(item => !selectedIds.includes(item.id));
    
    allHistory[user.username] = updatedUserHistory;
    localStorage.setItem("userHistories", JSON.stringify(allHistory));
    
    setHistory(updatedUserHistory);
    setSelectedIds([]);
    setIsDeleteMode(false);
    showToast("🗑️ Selected logs deleted!");
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setShowCategoryPopup(true);
  };

  // ===== AUTH LOGIC =====

  const handleSignup = () => {
    if (!username || !password || !recoveryEmail) {
      showToast("❌ All fields are required!", "error"); return;
    }
    if (!recoveryEmail.includes("@gmail.com")) {
      showToast("❌ Recovery email must be valid @gmail.com", "error"); return;
    }

    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    
    if (existingUsers.some(u => u.username === username)) {
      showToast("❌ Username taken! Try Login.", "error"); return;
    }

    const newUser = { username, password, recoveryEmail };
    existingUsers.push(newUser);
    
    localStorage.setItem("users", JSON.stringify(existingUsers));
    showToast("✅ Account Created! Please Login now.");
    setShowSignup(false);
    setShowSignin(true); 
  };

  const handleSignin = () => {
    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const foundUser = existingUsers.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      localStorage.setItem("currentUser", JSON.stringify(foundUser));
      setUser(foundUser);
      setShowSignin(false);
      showToast(`✅ Welcome back, ${foundUser.username}!`);
    } else {
      showToast("❌ Invalid Username or Password!", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setUser(null);
    setShowMenuPopup(false);
    setShowHistoryPopup(false);
    showToast("Logged out successfully");
    window.location.reload();
  };

  // ===== NEW: FORGOT PASSWORD LOGIC =====
  
  // Step 1: Verify Email & Username
  const handleVerifyRecovery = () => {
    if(!forgotUsername || !forgotEmail) {
        showToast("❌ Enter Username and Email", "error"); return;
    }

    const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const userToRecover = existingUsers.find(u => u.username === forgotUsername);

    if (userToRecover && userToRecover.recoveryEmail === forgotEmail) {
        showToast("✅ Verified! Set new password.");
        setShowForgot(false);
        setShowReset(true);
    } else {
        showToast("❌ Username or Email does not match!", "error");
    }
  };

  // Step 2: Update Password
  const handlePasswordReset = () => {
      if(!newPass || !confirmPass) {
          showToast("❌ Enter new password", "error"); return;
      }
      if(newPass !== confirmPass) {
          showToast("❌ Passwords do not match", "error"); return;
      }

      const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const userIndex = existingUsers.findIndex(u => u.username === forgotUsername);

      if(userIndex !== -1) {
          // Update Password
          existingUsers[userIndex].password = newPass;
          localStorage.setItem("users", JSON.stringify(existingUsers));
          
          showToast("✅ Password Changed Successfully! Login now.");
          
          // Clear states and close modals
          setShowReset(false);
          setShowSignin(true);
          setForgotUsername(""); setForgotEmail(""); setNewPass(""); setConfirmPass("");
      } else {
          showToast("❌ Error updating password", "error");
      }
  };

  // ======================================

  const handleFeedbackSubmit = () => {
    if (!feedbackName || !feedbackText || rating === 0) {
        showToast("❌ Fill all fields & give rating!", "error"); return;
    }
    if (feedbackUsername !== user?.username) {
      showToast("❌ Username mismatch!", "error"); return;
    }
    showToast("✅ Feedback Sent Successfully!");
    setShowFeedbackPopup(false);
    setFeedbackName(""); setFeedbackText(""); setRating(0);
  };

  const handleProfileUpdate = () => {
     if(!user) return;
     const updatedUser = { ...user, ...profileData };
     const users = JSON.parse(localStorage.getItem("users") || "[]");
     const userIndex = users.findIndex(u => u.username === user.username);
     if(userIndex !== -1) {
         users[userIndex] = updatedUser;
         localStorage.setItem("users", JSON.stringify(users));
     }
     localStorage.setItem("currentUser", JSON.stringify(updatedUser));
     setUser(updatedUser);
     showToast("✅ Profile Updated!");
     setShowProfilePopup(false);
  };

  return (
    <div className="front-container">
      {toast.show && <div className={`toast-message ${toast.type}`}>{toast.msg}</div>}

      <nav className="navbar">
        <div className="nav-left">
           {user ? `User: ${user.username}` : 'WELCOME'}
        </div>
        <div className="nav-right">
          <span onClick={() => scrollToSection(homeRef)}>Home</span>
          <span onClick={() => setShowMenuPopup(!showMenuPopup)}>Menu</span>
          <span onClick={() => scrollToSection(ingredientTypeRef)}>Ingredient Type</span>
          <span onClick={() => scrollToSection(howToUseRef)}>How to Use</span>
          
          {user ? (
            <div className="profile-icon-container" onClick={() => setShowMenuPopup(true)} title={user.username}>
              <img src={ProfileImg} alt="profile" className="profile-icon" />
            </div>
          ) : (
            <button className="signin-nav-btn" onClick={() => setShowSignin(true)}>Login</button>
          )}
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="hero-section" ref={homeRef}>
        <h1 className="main-title">INGREDIENT ANALYSIS AI</h1>
        <p className="caption">Scan. Detect. Stay Healthy.</p>
        <div className="hero-options">
          <div className="opt-box" onClick={() => processAction("Global Scan", "/scan")}>📷 Scan Image</div>
          <div className="opt-box" onClick={() => processAction("Global Upload", "/upload")}>📁 Upload Image</div>
          <div className="opt-box" onClick={() => processAction("Global Type", "/type")}>⌨️ Type Text</div>
        </div>
      </header>

      {/* INGREDIENTS TYPE SECTION */}
      <section className="category-section" ref={ingredientTypeRef}>
        <h2 className="section-title">Ingredients Type</h2>
        <div className="category-grid">
          <div className="cat-card" onClick={() => handleCategoryClick("Snacks")}>🍿 Snacks</div>
          <div className="cat-card" onClick={() => handleCategoryClick("Drinks")}>🥤 Drinks</div>
          <div className="cat-card" onClick={() => handleCategoryClick("Junk Foods")}>🍔 Junk Foods</div>
        </div>
      </section>

      {/* HOW TO USE SECTION */}
      <section className="how-to-use-section" ref={howToUseRef}>
        <h2 className="section-title">How to Use</h2>
        <div className="steps-container">
          <div className="step-card"><h3>01. Scan</h3><p>Take a photo of the food label.</p></div>
          <div className="step-card"><h3>02. Upload</h3><p>Upload image to the AI system.</p></div>
          <div className="step-card"><h3>03. Result</h3><p>Get detailed health analysis.</p></div>
        </div>
      </section>

{/* OVERVIEW SECTION */}
<section className="overview-section">
  <h2 className="section-title">App Overview</h2>
  <div className="overview-card">
    <div className="overview-header">
      <h3 className="project-highlight">Project: Ingredient Analysis AI</h3>
      <p>A smart healthcare solution designed to empower users with instant knowledge about what they consume. Our AI identifies hidden chemicals, preservatives, and health risks in seconds.</p>
    </div>

    <div className="overview-grid">
      <div className="overview-box">
        <h4>🛠️ Core Technologies</h4>
        <ul>
          <li><strong>React JS:</strong> For a fast & responsive UI.</li>
          <li><strong>OCR and fast API:</strong> To scan and extract text from images.</li>
          <li><strong>Node JS:</strong> For Backed interactive activity</li>
          <li><strong>Mongo DB:</strong> For secure user data & history.</li>
        </ul>
      </div>

      <div className="overview-box">
        <h4>🌟 Key Benefits</h4>
        <ul>
          <li><strong>Health Awareness:</strong> Know exactly what’s in your food.</li>
          <li><strong>Risk Detection:</strong> Identify allergens and harmful MSG levels.</li>
          <li><strong>History Tracking:</strong> Keep a log of your scanned products.</li>
          <li><strong>Voice Input:</strong> Easy manual entry for accessibility.</li>
        </ul>
      </div>
    </div>
  </div>
</section>

      {/* FOOTER */}
      <footer className="footer-section">
        <p>© 2026 Ingredient Analysis AI. All Rights Reserved.</p>
      </footer>

      {/* MODALS START HERE */}

      {/* CATEGORY POPUP */}
      {showCategoryPopup && (
        <div className="modal-overlay" onClick={() => setShowCategoryPopup(false)}>
           <div className="modal-content auth-box" onClick={(e) => e.stopPropagation()}>
             <h3>Analyze: {selectedCategory}</h3>
             <p style={{marginBottom: '15px'}}>Choose a method to check ingredients:</p>
             <div className="hero-options" style={{flexDirection: 'column', gap: '10px'}}>
                 <div className="opt-box" style={{width: '100%'}} onClick={() => processAction(`${selectedCategory} - Scan`, "/scan")}>📷 Scan Image</div>
                 <div className="opt-box" style={{width: '100%'}} onClick={() => processAction(`${selectedCategory} - Upload`, "/upload")}>📁 Upload Image</div>
                 <div className="opt-box" style={{width: '100%'}} onClick={() => processAction(`${selectedCategory} - Type`, "/type")}>⌨️ Type Text</div>
             </div>
             <button className="cancel-btn" style={{marginTop: '15px'}} onClick={() => setShowCategoryPopup(false)}>Close</button>
           </div>
        </div>
      )}

      {/* HISTORY MODAL */}
      {showHistoryPopup && (
        <div className="modal-overlay">
          <div className="modal-content history-box">
            <div className="menu-header">
              <h3>History Log</h3>
              <span className="close-x" onClick={() => {setShowHistoryPopup(false); setIsDeleteMode(false);}}>✖</span>
            </div>
            
            <div className="history-actions">
               {history.length > 0 && (
                 <button className="delete-mode-btn" onClick={() => setIsDeleteMode(!isDeleteMode)}>
                   {isDeleteMode ? "Cancel Select" : "Delete Option"}
                 </button>
               )}
               {isDeleteMode && (
                 <button className="delete-confirm-btn" onClick={deleteHistory}>Confirm Delete ({selectedIds.length})</button>
               )}
            </div>

            <div className="history-list">
              {history.length > 0 ? (
                history.map(item => (
                  <div key={item.id} className={`history-item ${isDeleteMode ? 'clickable' : ''}`} onClick={() => isDeleteMode && toggleSelect(item.id)}>
                    {isDeleteMode && (
                      <input type="checkbox" checked={selectedIds.includes(item.id)} readOnly />
                    )}
                    <div>
                      <p><strong>{item.date} | {item.time}</strong></p>
                      <p>{item.content}</p>
                    </div>
                  </div>
                ))
              ) : ( <p className="no-data">No history found.</p> )}
            </div>
          </div>
        </div>
      )}

      {/* MENU MODAL */}
      {showMenuPopup && (
        <div className="modal-overlay" onClick={() => setShowMenuPopup(false)}>
          <div className="modal-content menu-popup" onClick={(e) => e.stopPropagation()}>
            <div className="menu-header"><h3>Dashboard</h3><span className="close-x" onClick={() => setShowMenuPopup(false)}>✖</span></div>
            <div className="menu-options-list">
              <p className="menu-item" onClick={() => { if(user) {setShowProfilePopup(true); setShowMenuPopup(false)} else showToast("Login First!", "error")}}>👤 Profile</p>
              <p className="menu-item" onClick={() => { setShowHistoryPopup(true); setShowMenuPopup(false)}}>📜 History</p>
              <p className="menu-item" onClick={() => { if(user) {setShowFeedbackPopup(true); setShowMenuPopup(false); setFeedbackUsername(user.username)} else showToast("Login First!", "error")}}>💬 Feedback</p>
              
              {user && <button className="logout-btn" onClick={handleLogout}>Logout</button>}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE POPUP */}
      {showProfilePopup && (
        <div className="modal-overlay">
          <div className="modal-content profile-edit-box">
              <h3>Edit Profile</h3>
              <div className="profile-form">
                 <label>Name:</label>
                 <input value={profileData.name} onChange={(e) => setProfileData({...profileData, name: e.target.value})} />
                 <label>Age:</label>
                 <input type="number" value={profileData.age} onChange={(e) => setProfileData({...profileData, age: e.target.value})} />
                 <label>Gender:</label>
                 <select value={profileData.gender} onChange={(e) => setProfileData({...profileData, gender: e.target.value})}>
                     <option>Male</option><option>Female</option><option>Other</option>
                 </select>
                 <button className="main-btn" onClick={handleProfileUpdate}>Save Changes</button>
                 <button className="cancel-btn" onClick={() => setShowProfilePopup(false)}>Close</button>
              </div>
          </div>
        </div>
      )}

      {/* FEEDBACK POPUP */}
      {showFeedbackPopup && (
        <div className="modal-overlay">
          <div className="modal-content feedback-box">
              <h3>Send Feedback</h3>
              <input placeholder="Your Name" value={feedbackName} onChange={(e) => setFeedbackName(e.target.value)} />
              <input placeholder="Confirm Username" value={feedbackUsername} readOnly />
              <textarea placeholder="Write your feedback..." value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} />
              <div className="star-rating">
                  {[1,2,3,4,5].map(s => <span key={s} onClick={() => setRating(s)} style={{color: rating >= s ? "gold" : "gray", cursor:'pointer', fontSize:'25px'}}>★</span>)}
              </div>
              <button className="main-btn" onClick={handleFeedbackSubmit}>Submit</button>
              <button className="cancel-btn" onClick={() => setShowFeedbackPopup(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* SIGNIN MODAL */}
      {showSignin && (
        <div className="modal-overlay">
          <div className="modal-content auth-box">
            <h3>Login</h3>
            <div className="login-form">
              <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
              <div className="password-wrapper">
                <input type={showPassword ? "text" : "password"} placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "🙈"}</span>
              </div>
              <p style={{textAlign:'right', fontSize:'12px', color:'blue', cursor:'pointer', margin:'5px 0'}} onClick={() => {setShowSignin(false); setShowForgot(true)}}>Forgot Password?</p>
              <button className="main-btn" onClick={handleSignin}>Log In</button>
              <button className="cancel-btn" onClick={() => setShowSignin(false)}>Cancel</button>
              <p className="auth-footer">No account? <span onClick={() => {setShowSignin(false); setShowSignup(true)}}>Create New Account</span></p>
            </div>
          </div>
        </div>
      )}

      {/* SIGNUP MODAL */}
      {showSignup && (
        <div className="modal-overlay">
          <div className="modal-content auth-box">
            <h3>Create Account</h3>
            <div className="login-form">
              <input placeholder="Choose Username (Required)" onChange={(e) => setUsername(e.target.value)} />
              <div className="password-wrapper">
                  <input type={showPassword ? "text" : "password"} placeholder="Set Password (Required)" onChange={(e) => setPassword(e.target.value)} />
                  <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "👁️" : "🙈"}</span>
              </div>
              <input placeholder="Recovery Email (@gmail.com)" onChange={(e) => setRecoveryEmail(e.target.value)} />
              <button className="main-btn" onClick={handleSignup}>Create Account</button>
              <button className="cancel-btn" onClick={() => setShowSignup(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: FORGOT PASSWORD MODAL (Step 1) */}
      {showForgot && (
        <div className="modal-overlay">
          <div className="modal-content auth-box">
            <h3>Recover Account</h3>
            <div className="login-form">
               <p style={{fontSize:'12px', marginBottom:'10px'}}>Enter your Username and Recovery Email to verify.</p>
               <input placeholder="Your Username" onChange={(e) => setForgotUsername(e.target.value)} />
               <input placeholder="Recovery Email" onChange={(e) => setForgotEmail(e.target.value)} />
               <button className="main-btn" onClick={handleVerifyRecovery}>Verify</button>
               <button className="cancel-btn" onClick={() => setShowForgot(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: RESET PASSWORD MODAL (Step 2) */}
      {showReset && (
        <div className="modal-overlay">
          <div className="modal-content auth-box">
             <h3>Reset Password</h3>
             <div className="login-form">
                <input type="password" placeholder="New Password" onChange={(e) => setNewPass(e.target.value)} />
                <input type="password" placeholder="Confirm Password" onChange={(e) => setConfirmPass(e.target.value)} />
                <button className="main-btn" onClick={handlePasswordReset}>Change Password</button>
                <button className="cancel-btn" onClick={() => setShowReset(false)}>Cancel</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default Front;