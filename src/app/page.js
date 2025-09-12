
import "./globals.css";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const goToApi = () => {
    router.push("/api/resources"); // przekierowanie do route.js
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Start</h1>
      <button
        onClick={goToApi}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Pokaż dane z API
      </button>
    </div>
  );}
  

