/** Medora style reminder — clean teal-blue clinical search interface built from the supplied logo. */
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import { Toaster } from "sonner";

function App() {
  return (
    <ErrorBoundary>
      <Toaster richColors position="top-right" />
      <Home />
    </ErrorBoundary>
  );
}

export default App;
