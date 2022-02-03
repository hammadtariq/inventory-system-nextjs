import { Spin, Alert } from "antd";

import AddEditSale from "@/components/addEditSale";
import AppTitle from "@/components/title";
import { useSale } from "@/hooks/sales";
import permissionsUtil from "@/utils/permission.util";

function Update({ id, type }) {
  const canApprove = permissionsUtil.checkAuth({
    category: "sales",
    action: "approve",
  });

  const canEdit = permissionsUtil.checkAuth({
    category: "sales",
    action: "edit",
  });
  const { sale, error, isLoading } = useSale(id);
  if (error) return <Alert message={error} type="error" />;
  if (!canEdit && type !== "view") return <Alert message={"Not authorized to view this page"} type="error" />;
  return (
    <div>
      <AppTitle level={2}>{type === "view" ? `Sale Order #${id}` : "Update Sale Order"}</AppTitle>
      {isLoading ? <Spin size="large" /> : <AddEditSale sale={sale} type={type} />}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ query }) {
  return {
    props: query,
  };
}
