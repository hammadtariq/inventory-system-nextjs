import { Alert, Popconfirm, Button } from "antd";
import AppTitle from "@/components/title";
import AppTable from "@/components/table";
import { useCheques, updateCheques } from "@/hooks/cheques";
import permissionsUtil from "@/utils/permission.util";
import styles from "@/styles/Cheques.module.css";
import { CHEQUE_STATUS_COLORS } from "@/utils/ui.util";

const canApprove = permissionsUtil.checkAuth({
  category: "cheques",
  action: "approve",
});

const Cheques = () => {
  const { cheques, isLoading, error, mutate } = useCheques();

  const updateStatus = async (id, status) => {
    await updateCheques({
      id,
      status,
    });
    mutate(null);
  };

  const renderActions = (text) => (
    <div className={styles.container}>
      <Button className={styles.passBtn} disabled={!canApprove} onClick={() => updateStatus(text.id, "PASS")}>
        Pass
      </Button>
      <Button
        className={styles.returnBtn}
        danger
        disabled={!canApprove}
        onClick={() => updateStatus(text.id, "RETURN")}
      >
        Return
      </Button>
      <Button onClick={() => updateStatus(text.id, "CANCEL")} className={styles.editBtn} disabled={!canApprove}>
        Cancel
      </Button>
    </div>
  );

  const columns = [
    {
      title: "Cheque ID",
      dataIndex: "chequeId",
      key: "chequeId",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (text) => new Date(text).toDateString(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render(text) {
        return {
          props: {
            style: { color: CHEQUE_STATUS_COLORS[text] },
          },
          children: <div>{text}</div>,
        };
      },
    },
    {
      title: "Action",
      key: "action",
      width: "20%",
      render: renderActions,
    },
  ];

  return (
    <>
      <AppTitle level={2}>Cheques List</AppTitle>
      <AppTable columns={columns} rowKey="id" isLoading={isLoading} dataSource={cheques ? cheques : []} />
    </>
  );
};

export default Cheques;
