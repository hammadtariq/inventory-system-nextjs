import { Spin, Alert } from "antd";

import AddEdit from "../../components/company/addEdit";
import { useCompany } from "../../hooks/company";

function Update({ id }) {
  const { company, error, isLoading } = useCompany(id);
  if (error) return <Alert message={error.message} type="error" />;
  return (
    <div>
      <h1>Update User </h1>
      {isLoading ? <Spin size="large" /> : <AddEdit company={company} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
