import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigateAndReset(screenName, params) {
  if (navigationRef.isReady()) {
    navigationRef.reset({ index: 0, routes: [{ name: screenName, params }] });
  }
}
