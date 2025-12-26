import { useState } from "react"
import { useTranslation } from "react-i18next";

const LANGUAGES = ["en", "fi", "sv"];

export const LanguageSelector = () => {
	const [tabOpen, setTabOpen] = useState(false);
	const { t, i18n } = useTranslation();

	const changeLanguage = (lng: string) => { i18n.changeLanguage(lng) };

	return (
		<div className="w-40 relative">
			<button
				className="border-3 px-3 border-transcendence-white w-40 rounded-lg flex flex-row justify-between items-center relative z-20"
				onClick={() => setTabOpen(!tabOpen)}
			>
				<span className="text-md text-transcendence-white landscape:text-sm lg:landscape:text-md">
					{t(`languages.${i18n.language}`)}
				</span>
				<span className={"text-transcendence-white material-symbols-outlined cursor-pointer transition-transform duration-300 " + (tabOpen ? "rotate-180" : "")}>
					arrow_drop_down
				</span>
			</button>
			{tabOpen && (
				<ul className="px-4 flex flex-col border-3 border-t-0 border-transcendence-white bg-transcendence-black text-transcendence-white text-sm landscape:text-xs lg:landscape:text-sm gap-1 rounded-b-lg -mt-2 py-3 absolute z-10 w-40">
					{LANGUAGES.filter(lang => lang !== i18n.language).map((lang) => (
						<li
							key={lang}
							onClick={() => {
								changeLanguage(lang)
								setTabOpen(false);
							}}
							className="cursor-pointer hover:text-transcendence-beige">
							{t(`languages.${lang}`)}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
