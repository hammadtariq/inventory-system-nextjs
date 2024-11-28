import { Spin, Alert } from "antd";
import { usePurchaseOrder } from "@/hooks/purchase";

import AddEditPurchase from "@/components/addEditPurchase";
import AppTitle from "@/components/title";
import { STATUS } from "@/utils/api.util";

function Update({ id, type }) {
  const isView = type === "view";
  const { purchase, error, isLoading } = usePurchaseOrder(id);
  if (error) return <Alert message={error} type="error" />;
  if (!isLoading && purchase.status === !isView) return <Alert message={"Operation not allowed"} type="error" />;

  return (
    <div>
      <AppTitle level={2}>{isView ? `Purchase Order` : "Update Purchase Order"}</AppTitle>
      {isLoading ? <Spin size="large" /> : <AddEditPurchase purchase={purchase} type={type} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ query }) {
  return {
    props: query,
  };
}
