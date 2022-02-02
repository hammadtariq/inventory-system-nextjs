import { Spin, Alert, Button, Popconfirm } from "antd";
import { EditOutlined, CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

import { useRouter } from "next/router";

import ViewSale from "@/components/viewSale";
import AppTitle from "@/components/title";
import { useSale, approveSale, cancelSale } from "@/hooks/sales";
import permissionsUtil from "@/utils/permission.util";
import { EDITABLE_STATUS } from "@/utils/api.util";
import { STATUS_COLORS } from "@/utils/ui.util";

function Update({ id }) {
  const canApprove = permissionsUtil.checkAuth({
    category: "sales",
    action: "approve",
  });

  const canEdit = permissionsUtil.checkAuth({
    category: "sales",
    action: "edit",
  });

  const router = useRouter();

  const { sale, error, isLoading } = useSale(id);

  const renderActions = () => {
    if (sale.status === "PENDING" && canApprove) {
      return (
        <div style={{ float: "right" }}>
          <Popconfirm
            title="Are you sure you want to approve?"
            onConfirm={async () => {
              await approveSale(id);
              router.push("/sales");
            }}
            okText="Yes"
            cancelText="No"
          >
            <CheckCircleOutlined style={{ color: STATUS_COLORS.APPROVED }} className="cancelBtn" />
          </Popconfirm>
          <Popconfirm
            title="Are you sure you want to cancel?"
            onConfirm={async () => {
              await cancelSale(id);
              router.push("/sales");
            }}
            okText="Yes"
            cancelText="No"
          >
            <CloseCircleOutlined style={{ color: STATUS_COLORS.CANCEL }} className="approveBtn" />
          </Popconfirm>
        </div>
      );
    } else if (EDITABLE_STATUS.includes(sale.status) && canEdit) {
      return (
        <Button style={{ float: "right" }} icon={<EditOutlined />} onClick={() => router.push(`/sales/${id}`)}>
          Edit
        </Button>
      );
    }
    return null;
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      {isLoading ? (
        <Spin size="large" />
      ) : (
        <div>
          <AppTitle level={2}>
            {`Sale Order #${id}`}
            {renderActions()}
          </AppTitle>
          <ViewSale sale={sale} />
        </div>
      )}
    </div>
  );
}

export default Update;

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
