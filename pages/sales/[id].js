import { Spin, Alert } from "antd";

import AddEditSale from "@/components/addEditSale";
import AppTitle from "@/components/title";
import { useSale } from "@/hooks/sales";

function Update({ id }) {
  const { sale, error, isLoading } = useSale(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Sale Order</AppTitle>
      {isLoading ? <Spin size="large" /> : <AddEditSale sale={sale} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
