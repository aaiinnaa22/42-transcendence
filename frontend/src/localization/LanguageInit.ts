import i18n from "i18next";
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from "i18next-http-backend";

i18n
	.use(Backend)
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		fallbackLng: "en",
		debug: import.meta.env.DEV,

		backend: {
			loadPath: "/locales/{{lng}}/translation.json"
		},
		detection: {
			order: ["localStorage", "sessionStorage"],
			caches: ["localStorage", "sessionStorage"],
			lookupLocalStorage: "i18nextLng",
			lookupSessionStorage: "i18nextLng",
		},
		interpolation: { escapeValue: false },
		react: { useSuspense: true },
	});

export default i18n;
