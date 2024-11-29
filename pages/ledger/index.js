import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import _isEmpty from "lodash/isEmpty";
import { Alert, Card, Empty, Radio, Row, Col } from "antd";
import { useLedger } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";

const Ledger = () => {
  const router = useRouter();
  const { query } = router;
  const [type, setType] = useState(!_isEmpty(query.type) ? query.type : "company");
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

      <Row gutter={[15, 15]} align="space-between" style={{ marginBottom: 10 }}>
        <Col sm={12} xs={24}>
          {transactions && transactions.length > 0 ? (
            <div>
              <strong className={styles.headingStyle}>Total Balance (RS):</strong>
              <span className={styles.contentStyle}>{totalBalance}</span>
            </div>
          ) : null}
        </Col>

        <Col sm={12} xs={24} className={styles.companySelection}>
          <Radio.Group onChange={onChange} defaultValue="company" value={type}>
            <Radio value="company">Company</Radio>
            <Radio value="customer">Customer</Radio>
          </Radio.Group>
        </Col>
      </Row>
      {transactions && transactions.length > 0 ? (
        <Row gutter={[15, 15]}>
          {transactions
            ? transactions.map((item, index) => {
                return (
                  <Col xs={24} md={12} lg={5} key={`${index}`}>
                    <Card
                      title={item.name}
                      extra={<a href={`/ledger/${item.id}?type=${type}`}>Details</a>}
                      // style={{ width: 300 }}
                      loading={isLoading}
                      // className={styles.cardContainer}
                    >
                      <div>
                        <div className={styles.rowDirectionContainer}>
                          <div className={styles.headingStyle}>Total Balance:</div>
                          <div className={styles.contentStyle}>{`${comaSeparatedValues(item.total.toFixed(2))}`}</div>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })
            : null}
        </Row>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default Ledger;
