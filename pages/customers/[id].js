import { Spin, Alert } from "antd";

import AddEditCustomer from "@/components/addEditCustomer";
import AppTitle from "@/components/title";
import { useCustomer } from "@/hooks/customers";
import { useRouter } from "next/router";

function Update() {
  const router = useRouter();
  const { id } = router.query;
  const { customer, error, isLoading } = useCustomer(id);
  if (error) return <Alert message={error.message} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Customer</AppTitle>
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
        <AddEditCustomer customer={customer.data} />
      )}
    </div>
  );
}

export default Update;
