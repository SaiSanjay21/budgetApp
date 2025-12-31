import "../global.css";
import { Slot } from "expo-router";

export default function Layout() {
    // Always render Slot immediately - no navigation logic here
    return <Slot />;
}
