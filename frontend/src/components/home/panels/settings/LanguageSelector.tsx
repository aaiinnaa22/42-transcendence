import {useState} from "react"

type Language =
{
	code: string;
	name: string;
}

const Languages: Language[] =
[
	{code: "en", name: "English"},
	{code: "sv", name: "Svenska"},
	{code: "fi", name: "Suomi"},
];

export const LanguageSelector = () => {
	const [selected, setSelected] = useState<Language>(Languages[0]);
	const [tabOpen, setTabOpen] = useState(false);

	return (
		<div className="w-40">
			<button
				className="border-3 px-3 border-transcendence-black w-40 rounded-lg flex flex-row justify-between relative z-20 bg-transcendence-beige"
				onClick={() => setTabOpen(!tabOpen)}>
			<span className="text-md landscape:text-sm lg:landscape:text-md">{selected.name}</span>
			<span className={"material-symbols-outlined cursor-pointer transition-transform duration-300 " + (tabOpen ? "rotate-180" : "")}>arrow_drop_down</span>
			</button>
			{tabOpen && (
				<ul className="px-4 flex flex-col bg-transcendence-black text-transcendence-white text-sm landscape:text-xs lg:landscape:text-sm gap-1 rounded-b-lg -mt-2 py-3 absolute z-10 w-40">
					{Languages.filter((currentLanguage) => currentLanguage != selected).map((currentLanguage) => (
						<li
							onClick={() => {
								setSelected(currentLanguage);
								setTabOpen(false);
							}}
							className="cursor-pointer">
							{currentLanguage.name}
						</li>
					))}
				</ul>
			)}
		</div>
	)
}