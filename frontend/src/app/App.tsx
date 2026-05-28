import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { AIAssistant } from "./components/AIAssistant";
import { CustomCursor } from "./components/CustomCursor";

export default function App() {
  return (
    <>
      <CustomCursor />
      <RouterProvider router={router} />
      <Toaster position="top-center" />
      <AIAssistant />
    </>
  );
}