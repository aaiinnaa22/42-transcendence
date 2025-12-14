import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="w-full flex justify-center items-center py-8 min-h-[60vh]">
      <section className="w-[min(560px,95vw)] rounded-2xl border shadow-xl text-center px-8 py-8 text-transcendence-white font-transcendence-two border-transcendence-beige bg-[color-mix(in_oklab,var(--color-transcendence-black)_75%,var(--color-transcendence-beige))]">
        <h1 className="text-2xl mb-2 font-transcendence-three">404 — Page Not Found</h1>
        <p className="text-sm mb-5 text-[#9ca3af]">
          The page you’re looking for doesn’t exist or moved.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/play")}
            className="inline-block px-4 py-2 rounded-lg font-semibold bg-transcendence-beige text-transcendence-black"
          >
            Back to Play
          </button>
        </div>
      </section>
    </div>
  );
}
