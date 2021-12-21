import { Spin, Alert } from "antd";

import AddEditCustomer from "../../components/addEditCustomer";
import { useCustomer } from "../../hooks/customers";

function Update({ id }) {
  const { customer, error, isLoading } = useCustomer(id);
  if (error) return <Alert message={error.message} type="error" />;
  return (
    <div>
      <h1>Update Customer</h1>
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
