import { useRouter } from "next/router";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import styles from "@/styles/CreateButton.module.css";

export default function AppCreateButton({ url }) {
  const router = useRouter();
  return (
    <Button type="primary" className={styles.createButton} onClick={() => router.push(url)}>
      <PlusCircleOutlined /> Create
    </Button>
  );
}
