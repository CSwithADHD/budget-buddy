import { Colors } from "@/constants/colors";

/**
 * Returns the design tokens. The app uses a single dark theme,
 * so this always returns the dark fintech palette from Colors.
 */
export function useColors() {
  return Colors;
}
