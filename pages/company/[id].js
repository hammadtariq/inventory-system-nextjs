import { Spin, Alert } from "antd";

import AddEditCompany from "@/components/addEditCompany";
import AppTitle from "@/components/title";
import { useCompany } from "@/hooks/company";

function Update({ id }) {
  const { company, error, isLoading } = useCompany(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Company</AppTitle>
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
