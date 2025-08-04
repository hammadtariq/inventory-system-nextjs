import dayjs from "dayjs";
import NextLink from "next/link";
import AppTable from "@/components/table";
import styles from "@/styles/Ledger.module.css";
import { useLedgerDetails } from "@/hooks/ledger";
import { Alert } from "antd";
import { SPEND_TYPE } from "@/utils/api.util";
import { DATE_FORMAT } from "@/utils/ui.util";
import { useRouter } from "next/router";
import ExportButton from "@/components/exportButton";
import { EyeOutlined } from "@ant-design/icons";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";

const LedgerDetails = ({ id, type }) => {
  const router = useRouter();
  const { transactions, totalBalance, error, isLoading } = useLedgerDetails(id, type);

  if (error) return <Alert message={error} type="error" />;

  const renderActions = (_, record) => {
    return (
      <>
        {record.transactionId && type === "customer" ? (
          <>
            <EyeOutlined
              style={{ marginRight: "10px" }}
              onClick={() =>
                router.push(
                  `/${record.spendType === SPEND_TYPE.CREDIT ? "sales" : "purchase"}/${record.transactionId}?type=view`
                )
              }
            />
            <ExportButton filename="ledger" invoiceNumber={record.invoiceNumber} onlyIcon={true} />
          </>
        ) : null}
      </>
    );
  };

  const columns = [
    {
      title: "Serial No #",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Date",
      dataIndex: "paymentDate",
      key: "paymentDate",
      render: (text) => (text ? dayjs(text).format(DATE_FORMAT) : ""),
    },
    {
      title: "Paid By",
      dataIndex: ["customer"],
      key: "customerName",
      render: (text, _data) =>
        _data.customer ? (text ? `${text.firstName} ${text.lastName}` : "") : _data.otherName ? _data.otherName : "",
    },
    {
      title: "Paid To",
      dataIndex: ["company", "companyName"],
      key: "companyName",
      render: (text, _data) => (_data.company ? text : _data.otherName ? _data.otherName : ""),
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
    },
    {
      title: "Invoice Number",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (text, _data) =>
        _data.invoiceNumber && _data.transactionId ? (
          <NextLink
            href={`/${_data.spendType === SPEND_TYPE.CREDIT ? "sales" : "purchase"}/${_data.transactionId}?type=view`}
            passHref
          >
            {_data.invoiceNumber}
          </NextLink>
        ) : (
          ""
        ),
    },
    {
      title: "Debit Amount (Rs)",
      dataIndex: "amount",
      key: "amount",
      render: (text, _data) => {
        if (_data.paymentType && type === "customer") {
          return comaSeparatedValues(text.toFixed(2));
        } else if (!_data.paymentType) {
          return _data.spendType === SPEND_TYPE.DEBIT ? comaSeparatedValues(text.toFixed(2)) : "";
        }
        return "";
      },
    },
    {
      title: "Credit Amount (Rs)",
      dataIndex: "amount",
      key: "amount",
      render: (text, _data) => {
        if (_data.paymentType && type === "company") {
          return comaSeparatedValues(text.toFixed(2));
        } else if (!_data.paymentType) {
          return _data.spendType === SPEND_TYPE.CREDIT ? comaSeparatedValues(text.toFixed(2)) : "";
        }
      },
    },
    {
      title: "Balance",
      dataIndex: "totalBalance",
      key: "totalBalance",
      render: (text, _data) => {
        if (type === "company") {
          return _data.companyTotal ? comaSeparatedValues(_data.companyTotal.toFixed(2)) : comaSeparatedValues(text);
        } else {
          return _data.customerTotal ? comaSeparatedValues(_data.customerTotal.toFixed(2)) : comaSeparatedValues(text);
        }
      },
    },
  ];

  if (type !== "company") {
    columns.push({
      title: "Action",
      key: "action",
      render: renderActions,
    });
  }

  const renderTotalBalance = () => (
    <div className={styles.rowDirectionTableContainer}>
      <div className={styles.headingStyle}>Total Balance (RS):</div>
      <div className={styles.contentStyle}>{`${totalBalance ? comaSeparatedValues(totalBalance.toFixed(2)) : 0}`}</div>
    </div>
  );
  console.log("transactions", transactions);
  return (
    <div style={{ overflowX: "auto" }}>
      {renderTotalBalance()}
      <AppTable
        loading={isLoading}
        rowKey="id"
        className="components-table-demo-nested"
        columns={columns}
        dataSource={transactions ? transactions : []}
      />
    </div>
  );
};

export default LedgerDetails;

export async function getServerSideProps({ query }) {
  return {
    props: query,
  };
}
