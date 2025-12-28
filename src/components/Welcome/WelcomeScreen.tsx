import React from "react";
import { WelcomeScreen as BaseWelcomeScreen } from "../WelcomeScreen";

/**
 * Wrapper component for the main WelcomeScreen implementation.
 *
 * This file exists to preserve the legacy import path
 * (`src/components/Welcome/WelcomeScreen`) while delegating
 * all behavior to the actual component in `../WelcomeScreen`.
 */
export const WelcomeScreen: React.FC<
  React.ComponentProps<typeof BaseWelcomeScreen>
> = (props) => {
  return <BaseWelcomeScreen {...props} />;
};
