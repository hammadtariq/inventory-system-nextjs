import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { isEmpty } from "lodash";
import { Alert, Card, Empty, Radio } from "antd";
import { useLedger } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";

const Ledger = () => {
  const router = useRouter();
  const { query } = router;
  const [type, setType] = useState(!isEmpty(query.type) ? query.type : "company");
  const { transactions, totalBalance, error, isLoading } = useLedger(type);

  useEffect(() => {
    router.push(
      {
        pathname: "/ledger",
        query: { type },
      },
      undefined,
      { shallow: true }
    );
  }, [type]);

  const onChange = (e) => {
    setType(e.target.value);
  };

  if (error) return <Alert message={error} type="error" />;
  return (
    <div>
      <AppTitle level={2}>
        Ledger
        <AppCreateButton url="/ledger/create" />
      </AppTitle>
      <div className={styles.radioButtonStyle}>
        <Radio.Group onChange={onChange} defaultValue="company" value={type}>
          <Radio value="company">Company</Radio>
          <Radio value="customer">Customer</Radio>
        </Radio.Group>
      </div>
      {transactions && transactions.length > 0 ? (
        <div>
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
                      extra={<a href={`/ledger/${item.id}?type=${type}`}>Details</a>}
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
                      </div>
                    </Card>
                  );
                })
              : null}
          </div>
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default Ledger;
