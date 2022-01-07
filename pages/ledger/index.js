import { useEffect, useState } from "react";
import { Alert, Card } from "antd";
import { useLedger } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";

const Ledger = () => {
  const { transactionHistory, error, isLoading } = useLedger();
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    if (transactionHistory) {
      let balance = 0;
      transactionHistory.data.map((item) => {
        balance += item.total;
      });
      setTotalBalance(balance);
    }
  }, [transactionHistory]);

  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <div className={styles.rowDirectionContainer}>
        <div className={styles.headingStyle}>Total Balance (RS):</div>
        <div className={styles.contentStyle}>{totalBalance}</div>
      </div>
      <div className={styles.rowDirectionContainer}>
        {transactionHistory
          ? transactionHistory.data.map((item, index) => {
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
                    <div className={styles.rowDirectionContainer}>
                      <div className={styles.headingStyle}>Created At:</div>
                      <div className={styles.contentStyle}>{`${new Date(item.createdAt).toLocaleString()}`}</div>
                    </div>
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
