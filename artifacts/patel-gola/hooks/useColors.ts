import colors from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

export function useColors() {
  const { themeMode } = useTheme();
  const palette = themeMode === "dark" ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
