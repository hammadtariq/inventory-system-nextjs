import { Alert, Table } from "antd";
import { useLedgerDetails } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";

const LedgerDetails = ({ id }) => {
  const { transactions, totalBalance, error, isLoading } = useLedgerDetails(id);

  const columns = [
    { title: "Company Name", dataIndex: ["company", "companyName"], key: "companyName" },
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
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text) => new Date(text).toLocaleString(),
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

export async function getServerSideProps({ params }) {
  return {
    props: { id: params.id },
  };
}
