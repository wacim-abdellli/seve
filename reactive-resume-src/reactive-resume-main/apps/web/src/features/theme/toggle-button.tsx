import { t } from "@lingui/core/macro";
import { MoonIcon, SunIcon } from "@phosphor-icons/react";
import { startTransition, useCallback } from "react";
import { Button } from "@reactive-resume/ui/components/button";
import { useTheme } from "./provider";

export function ThemeToggleButton(props: React.ComponentProps<typeof Button>) {
	const { theme, toggleTheme } = useTheme();

	const onToggleTheme = useCallback(() => {
		startTransition(() => {
			toggleTheme();
		});
	}, [toggleTheme]);

	const ariaLabel = theme === "dark" ? t`Switch to light theme` : t`Switch to dark theme`;

	return (
		<Button size="icon" variant="ghost" onClick={onToggleTheme} aria-label={ariaLabel} {...props}>
			{theme === "dark" ? <MoonIcon aria-hidden="true" /> : <SunIcon aria-hidden="true" />}
		</Button>
	);
}
