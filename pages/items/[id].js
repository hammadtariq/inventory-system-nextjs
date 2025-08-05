import { Spin, Alert } from "antd";

import AddEditItem from "@/components/addEditItem";
import AppTitle from "@/components/title";
import { useItem } from "@/hooks/items";
import { useRouter } from "next/router";

function Update() {
  const router = useRouter();
  const { id } = router.query;
  const { item, error, isLoading } = useItem(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Item</AppTitle>
      {isLoading ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "80vh",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <AddEditItem item={item} />
      )}
    </div>
  );
}

export default Update;
