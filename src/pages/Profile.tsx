import { useParams } from "react-router-dom";
import { PageShell } from "@/components/PageShell";

// Placeholder: public profile (stats, mini galaxy, activity heatmap, share link).
const Profile = () => {
  const { username = "" } = useParams();
  return <PageShell title={username}>Coming soon.</PageShell>;
};

export default Profile;
