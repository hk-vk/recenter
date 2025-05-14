import { useState } from "react";
import "./App.css";
import Configure from "./pages/Configure";
import Home from "./pages/Home";
import Sessions from "./pages/Sessions";
import { Route, Routes } from "react-router-dom";
import Profile from "./pages/Profile";

function App() {
  const [isFocused, setIsFocused] = useState<boolean>(true);

  function handleHelpClick() {
    chrome.tabs.create({ url: "https://recenter.netlify.app/docs" });
  }

  return (
    <div className="app" id={isFocused ? "good" : "bad"}>
      <div className="app__top_bar" id={isFocused ? "good" : "bad"}></div>
      <Routes>
        <Route
          path="/"
          element={
            <Home isFocused={isFocused} setIsFocused={setIsFocused}></Home>
          }
        ></Route>
        <Route
          path="/sessions"
          element={<Sessions></Sessions>}
        ></Route>
        <Route
          path="/home"
          element={
            <Home isFocused={isFocused} setIsFocused={setIsFocused}></Home>
          }
        ></Route>
        <Route
          path="/configure"
          element={<Configure isFocused={isFocused}></Configure>}
        ></Route>
        <Route
          path="/profile"
          element={<Profile isFocused={isFocused}></Profile>}
        ></Route>
      </Routes>
      <div className="app__help_button" onClick={handleHelpClick}>?</div>
    </div>
  );
}

export default App;
