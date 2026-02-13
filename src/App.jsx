import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Front from "./front";
import Scan from "./scan";
import Upload from "./upload";
import Type from "./type";

function App() {
  return (
    <Router>
      <Routes>
        {/* Ippo "/" click pannalum, "/front" click pannalum Front page varum */}
        <Route path="/" element={<Front />} />
        <Route path="/front" element={<Front />} /> 
        
        <Route path="/scan" element={<Scan />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/type" element={<Type />} />
      </Routes>
    </Router>
  );
}

export default App;