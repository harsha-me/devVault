import { BrowserRouter, Routes, Route } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PreviousNotes from "./pages/PreviousNotes";

function App() {
  return (

    <BrowserRouter>

      <Routes>

        <Route path="/signup" element={<Signup />} />

        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/previous-notes" element={<PreviousNotes />} />

      </Routes>

    </BrowserRouter>

  );
}

export default App;