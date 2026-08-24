/** Medora style reminder — clean teal-blue clinical search interface built from the supplied logo. */
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import SmoothScroll from "./components/SmoothScroll";
import Home from "./pages/Home";
import { Toaster } from "sonner";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <SmoothScroll>
          <Toaster richColors position="top-right" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </SmoothScroll>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
