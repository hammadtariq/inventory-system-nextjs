import { Alert, Table } from "antd";
import { useRouter } from "next/router";
import { useLedgerDetails } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";

const LedgerDetails = () => {
  const router = useRouter();
  const { id, type } = router.query;
  const { transactions, totalBalance, error, isLoading } = useLedgerDetails(id, type);

  const columns = [
    {
      title: "Paid To",
      dataIndex: ["company", "companyName"],
      key: "companyName",
      render: (text, _data) => (_data.company ? text : _data.otherName ? _data.otherName : ""),
    },
    {
      title: "Paid By",
      dataIndex: ["customer"],
      key: "customerName",
      render: (text, _data) =>
        _data.customer ? (text ? `${text.firstName} ${text.lastName}` : "") : _data.otherName ? _data.otherName : "",
    },

    {
      title: "Debit Amount (Rs)",
      dataIndex: "amount",
      key: "amount",
      render: (text, _data) => (_data.spendType === "DEBIT" ? text.toFixed(2) : ""),
    },
    {
      title: "Credit Amount (Rs)",
      dataIndex: "amount",
      key: "amount",
      render: (text, _data) => (_data.spendType === "CREDIT" ? text.toFixed(2) : ""),
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
    },
    {
      title: "Paid At",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (text) => (text ? new Date(text).toDateString() : ""),
    },
  ];

  if (error) return <Alert message={error} type="error" />;

  const renderTotalBalance = () => (
    <div className={styles.rowDirectionTableContainer}>
      <div className={styles.headingStyle}>Total Balance (RS):</div>
      <div className={styles.contentStyle}>{`${totalBalance ? totalBalance.toFixed(2) : 0}`}</div>
    </div>
  );

  return (
    <div>
      {renderTotalBalance()}
      <Table
        loading={isLoading}
        rowKey={"id"}
        className="components-table-demo-nested"
        columns={columns}
        dataSource={transactions ? transactions : []}
      />
    </div>
  );
};

export default LedgerDetails;

// export async function getServerSideProps({ params }) {
//   return {
//     props: { id: params.id, type: params.type },
//   };
// }
