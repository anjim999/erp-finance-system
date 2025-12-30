import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { TeamsNotificationProvider } from "./context/TeamsNotificationContext";
import { CallProvider } from "./context/CallContext";
import CallModal from "./components/chat/modals/CallModal";
import { TeamsNotificationWrapper } from "./components/teams";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <TeamsNotificationProvider>
            <CallProvider>
              <App />
              <TeamsNotificationWrapper />
              <CallModal />
            </CallProvider>
          </TeamsNotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
