import { useRouter } from "next/router";
import { Button } from "antd";

export default function AppBackButton() {
  const router = useRouter();
  return (
    <Button type="default" style={{ marginRight: "8px" }} onClick={() => router.back()}>
      Back
    </Button>
  );
}
