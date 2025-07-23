import { Spin, Alert } from "antd";

import AddEditCompany from "@/components/addEditCompany";
import AppTitle from "@/components/title";
import { useCompany } from "@/hooks/company";
import { useRouter } from "next/router";

function Update() {
  const router = useRouter();
  const { id } = router.query;
  const { company, error, isLoading } = useCompany(id);
  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>Update Company</AppTitle>
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
        <AddEditCompany company={company} />
      )}
    </div>
  );
}

export default Update;
