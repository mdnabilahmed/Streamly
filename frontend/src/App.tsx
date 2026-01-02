import { Routes, Route, Navigate } from "react-router-dom";
import LoginAndRegister from "./pages/login/login-and-register";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginAndRegister />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default App;
