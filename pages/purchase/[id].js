import { Spin, Alert } from "antd";

import AddEditPurchase from "@/components/addEditPurchase";
import AppTitle from "@/components/title";
import { usePurchaseOrder } from "@/hooks/purchase";

function Update({ id }) {
  const { purchase, error, isLoading } = usePurchaseOrder(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Purchase Order</AppTitle>
      {isLoading ? <Spin size="large" /> : <AddEditPurchase purchase={purchase} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
