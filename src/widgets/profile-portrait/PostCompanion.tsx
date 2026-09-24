import ProfilePortrait from "./ProfilePortrait";
import styles from "./PostCompanion.module.css";

export default function PostCompanion() {
  return <aside aria-label="블로그 캐릭터" className={styles.companion}>
    <ProfilePortrait />
  </aside>;
}
