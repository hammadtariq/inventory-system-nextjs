import { Spin, Alert } from "antd";

import AddEditCompany from "@/components/addEditCompany";
import { useCompany } from "@/hooks/company";

function Update({ id }) {
  const { company, error, isLoading } = useCompany(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <h1>Update User </h1>
      {isLoading ? <Spin size="large" /> : <AddEditCompany company={company} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
