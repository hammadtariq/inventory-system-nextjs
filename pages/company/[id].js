import { Spin, Alert } from "antd";

import ComapnyAddEdit from "@/components/comapnyAddEdit";
import { useCompany } from "@/hooks/company";

function Update({ id }) {
  const { company, error, isLoading } = useCompany(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <h1>Update User </h1>
      {isLoading ? <Spin size="large" /> : <ComapnyAddEdit company={company} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
