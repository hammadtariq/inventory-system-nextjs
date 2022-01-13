import { Spin, Alert } from "antd";

import AddEditCustomer from "@/components/addEditCustomer";
import AppTitle from "@/components/title";
import { useCustomer } from "@/hooks/customers";

function Update({ id }) {
  const { customer, error, isLoading } = useCustomer(id);
  if (error) return <Alert message={error.message} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Customer</AppTitle>
      {isLoading ? <Spin size="large" /> : <AddEditCustomer customer={customer.data} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
