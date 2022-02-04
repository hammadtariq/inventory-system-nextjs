import { Spin, Alert } from "antd";
import { usePurchaseOrder } from "@/hooks/purchase";

import AddEditPurchase from "@/components/addEditPurchase";
import AppTitle from "@/components/title";

function Update({ id, type }) {
  const { purchase, error, isLoading } = usePurchaseOrder(id);
  if (error) return <Alert message={error} type="error" />;

  return (
    <div>
      <AppTitle level={2}>{type === "view" ? `Purchase Order` : "Update Purchase Order"}</AppTitle>
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
