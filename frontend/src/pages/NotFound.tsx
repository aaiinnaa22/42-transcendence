import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  const {t} = useTranslation();
  return (
    <div className="w-full flex justify-center items-center py-8 min-h-[60vh]">
      <section className="w-[min(560px,95vw)] rounded-2xl border shadow-xl text-center px-8 py-8 text-transcendence-white font-transcendence-two border-transcendence-beige bg-[color-mix(in_oklab,var(--color-transcendence-black)_75%,var(--color-transcendence-beige))]">
        <h1 className="text-2xl mb-2 font-transcendence-three">404 — {t("404.notFound")}</h1>
        <p className="text-sm mb-5 text-[#9ca3af]">
          {t("404.description")}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate("/")}
            className="inline-block px-4 py-2 rounded-lg font-semibold bg-transcendence-beige text-transcendence-black"
          >
            {t("404.toHome")}
          </button>
        </div>
      </section>
    </div>
  );
}
