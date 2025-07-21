import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Pricing from "./pages/pricing-page";
import Header from "./components/header";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
      </Routes>
    </>
  );
}

export default App;
