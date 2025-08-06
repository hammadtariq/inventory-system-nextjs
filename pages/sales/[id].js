import { Spin, Alert } from "antd";

import AddEditSale from "@/components/addEditSale";
import AppTitle from "@/components/title";
import { useSale } from "@/hooks/sales";
import { STATUS } from "@/utils/api.util";
import { useRouter } from "next/router";

function Update() {
  const router = useRouter();
  const { id, type } = router.query;
  const isView = type === "view";

  const { sale, error, isLoading } = useSale(id, type);
  if (error) return <Alert message={error} type="error" />;
  if (!isLoading && sale.status === STATUS.APPROVED && !isView)
    return <Alert message={"Operation not allowed"} type="error" />;
  return (
    <div>
      <AppTitle level={2}>{isView ? `Sale Order #${id}` : "Update Sale Order"}</AppTitle>
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
        <AddEditSale sale={sale} type={type} />
      )}
    </div>
  );
}

export default Update;
