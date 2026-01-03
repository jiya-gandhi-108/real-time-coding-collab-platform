import React, { useEffect, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";

import { AuthContext } from "./authContext";
import { socket } from "./socket";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import HomePage from "./pages/HomePage";
import Room from "./components/Room";

/* 🔹 Wrapper to correctly pass roomId from URL */
function RoomWrapper() {
  const { roomId } = useParams();
  return <Room roomId={roomId} />;
}

function App() {
  const auth = useContext(AuthContext);

  // ⛔ Defensive guard: app MUST be inside AuthProvider
  if (!auth) {
    throw new Error("App must be wrapped inside <AuthProvider>");
  }

  const { token } = auth;

  /* 🔹 Authenticate socket whenever token changes */
  useEffect(() => {
    if (token) {
      socket.auth = { token };
      socket.connect();
    } else {
      socket.disconnect();
    }
  }, [token]);

  return (
    <Router>
      <Routes>
        {/* AUTH */}
        <Route
          path="/login"
          element={!token ? <LoginPage /> : <Navigate to="/home" />}
        />
        <Route
          path="/signup"
          element={!token ? <SignupPage /> : <Navigate to="/home" />}
        />

        {/* HOME */}
        <Route
          path="/home"
          element={token ? <HomePage /> : <Navigate to="/login" />}
        />

        {/* ROOM (FIXED) */}
        <Route
          path="/room/:roomId"
          element={token ? <RoomWrapper /> : <Navigate to="/login" />}
        />

        {/* FALLBACK */}
        <Route
          path="*"
          element={<Navigate to={token ? "/home" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
