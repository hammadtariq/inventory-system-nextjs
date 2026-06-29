import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import _isEmpty from "lodash/isEmpty";
import { Alert, Button, Empty, Radio, Row, Col, Input } from "antd";
import { useLedger } from "@/hooks/ledger";
import styles from "@/styles/Ledger.module.css";
import AppTitle from "@/components/title";
import AppCreateButton from "@/components/createButton";
import { comaSeparatedValues } from "@/utils/comaSeparatedValues";
import Spinner from "@/components/spinner";

function useDebouncedValue(value, delay = 1200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const Ledger = () => {
  const router = useRouter();
  const { query } = router;

  const initialType = !_isEmpty(query.type) && typeof query.type === "string" ? query.type : "company";
  const initialSearch = (typeof query.search === "string" ? query.search : "") ?? "";

  const [type, setType] = useState(initialType);
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebouncedValue(search, 1200);

  // hit the API with type + search
  const { transactions = [], totalBalance = 0, error, isLoading } = useLedger(type, debouncedSearch);

  const onChangeType = (e) => setType(e.target.value);

  if (error) return <Alert message={error} type="error" />;
  if (isLoading) return <Spinner />;

  return (
    <div>
      <AppTitle
        level={2}
        action={
          <div className={styles.headerActions}>
            <AppCreateButton url="/ledger/create" />
            <Button className={styles.refundButton} onClick={() => router.push("/ledger/refund")}>
              Refund to Customer
            </Button>
          </div>
        }
        toolbar={
          <div className={styles.headerToolbar}>
            <Input
              allowClear
              className={styles.headerSearch}
              placeholder={`Search ${type === "company" ? "companies" : "customers"}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Radio.Group onChange={onChangeType} value={type} className={styles.headerSegment}>
              <Radio value="company">Company</Radio>
              <Radio value="customer">Customer</Radio>
            </Radio.Group>
          </div>
        }
      >
        Ledger
      </AppTitle>

      <Row gutter={[15, 15]} align="space-between" className={styles.summaryRow}>
        <Col sm={12} xs={24}>
          {transactions.length > 0 && (
            <div>
              <strong className={styles.headingStyle}>Total Balance (RS):</strong>
              <span className={styles.contentStyle}>{comaSeparatedValues(totalBalance)}</span>
            </div>
          )}
        </Col>

        <Col sm={12} xs={24} />
      </Row>

      {transactions.length > 0 ? (
        <Row gutter={[15, 15]}>
          {transactions.map((item) => (
            <Col xs={24} md={12} lg={6} key={item.id}>
              <button
                type="button"
                onClick={() => router.push(`/ledger/${item.id}?type=${type}`)}
                className={styles.ledgerCard}
              >
                <div className={styles.ledgerCardTitle}>{item.name}</div>

                <div className={styles.ledgerCardDivider} />

                <div>
                  <div className={styles.ledgerCardLabel}>Total Balance</div>
                  <div className={styles.ledgerCardTotal}>{comaSeparatedValues(Number(item.total).toFixed(2))}</div>
                </div>
              </button>
            </Col>
          ))}
        </Row>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </div>
  );
};

export default Ledger;
