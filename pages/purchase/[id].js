import { Spin, Alert } from "antd";

import AppTitle from "@/components/title";
import { usePurchaseOrder } from "@/hooks/purchase";

function Update({ id }) {
  const { purchase, error, isLoading } = usePurchaseOrder(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Purchase Order</AppTitle>
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
