/**
 * Runs before first paint so the page never flashes the wrong theme.
 * Stored preference: "light" | "dark" | "system" (default).
 */
const script = `(function(){try{var p=localStorage.getItem("theme");var d=p==="dark"||((!p||p==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
