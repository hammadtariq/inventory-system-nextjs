import { Spin, Alert } from "antd";

import AddEditCompany from "@/components/addEditCompany";
import Title from "@/components/title";
import { useCompany } from "@/hooks/company";

function Update({ id }) {
  const { company, error, isLoading } = useCompany(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <Title level={2}>Update Company</Title>
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
