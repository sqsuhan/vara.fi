import React, { useState } from "react";
import LandingPage from "./components/LandingPage";
import Dapp from "./Dapp";

function App() {
  const [showApp, setShowApp] = useState(false);

  if (showApp) {
    return <Dapp />;
  }

  return <LandingPage onLaunchApp={() => setShowApp(true)} />;
}

export default App;
