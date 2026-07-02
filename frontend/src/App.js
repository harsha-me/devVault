import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PreviousNotes from "./pages/PreviousNotes";
import ReceivedNotes from "./pages/ReceivedNotes";
import Compiler from "./pages/Compiler";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import Workspaces from "./pages/Workspaces";
import WorkspaceView from "./pages/WorkspaceView";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* BUG 3 FIX: Redirect root URL to /login instead of blank page */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/previous-notes" element={<PreviousNotes />} />
        <Route path="/received-notes" element={<ReceivedNotes />} />
        <Route path="/compiler" element={<Compiler />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/workspaces" element={<Workspaces />} />
        <Route path="/workspace/:id" element={<WorkspaceView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;