import { useRouter } from "next/router";
import { PlusCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";

export default function AppCreateButton({ url }) {
  const router = useRouter();
  return (
    <Button type="primary" style={{ float: "right" }} onClick={() => router.push(url)}>
      <PlusCircleOutlined /> Create
    </Button>
  );
}
