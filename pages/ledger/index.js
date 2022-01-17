import { Alert, Card } from "antd";
import { useLedger } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";

const Ledger = () => {
  const { transactions, totalBalance, error, isLoading } = useLedger();

  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>
        Ledger
        <AppCreateButton url="/ledger/create" />
      </AppTitle>
      <div className={styles.rowDirectionContainer}>
        <div className={styles.headingStyle}>Total Balance (RS):</div>
        <div className={styles.contentStyle}>{totalBalance}</div>
      </div>
      <div className={styles.rowDirectionContainer}>
        {transactions
          ? transactions.map((item, index) => {
              return (
                <Card
                  title={item.name}
                  extra={<a href={`/ledger/${item.companyId}`}>Details</a>}
                  style={{ width: 300 }}
                  loading={isLoading}
                  className={styles.cardContainer}
                  key={`${index}`}
                >
                  <div>
                    <div className={styles.rowDirectionContainer}>
                      <div className={styles.headingStyle}>Total Balance:</div>
                      <div className={styles.contentStyle}>{`${item.total.toFixed(2)}`}</div>
                    </div>
                    {/* <div className={styles.rowDirectionContainer}>
                      <div className={styles.headingStyle}>Created At:</div>
                      <div className={styles.contentStyle}>{`${new Date(item.createdAt).toLocaleString()}`}</div>
                    </div> */}
                  </div>
                </Card>
              );
            })
          : null}
      </div>
    </div>
  );
};

export default Ledger;
