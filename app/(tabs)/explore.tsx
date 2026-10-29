import { Redirect } from 'expo-router';

// The Expo starter page is not part of the shop; anyone who lands here goes to the catalogue.
export default function Explore() {
  return <Redirect href="/catalog" />;
}
