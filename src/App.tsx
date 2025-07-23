import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Pricing from "./pages/pricing-page";
import Header from "./components/header";
import AboutUs from "./pages/about";
import TermsAndConditions from "./pages/terms";
import PrivacyPolicy from "./pages/privacy";
import Footer from "./components/footer";
import SigninPage from "./pages/signin-page";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/signin" element={<SigninPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
