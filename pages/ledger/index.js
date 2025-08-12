import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import _isEmpty from "lodash/isEmpty";
import { Alert, Empty, Radio, Row, Col, Input } from "antd";
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

  // keep URL in sync (no full reload)
  useEffect(() => {
    router.push(
      { pathname: "/ledger", query: { type, ...(debouncedSearch ? { search: debouncedSearch } : {}) } },
      undefined,
      { shallow: true }
    );
  }, [type, debouncedSearch]);

  // hit the API with type + search
  const { transactions = [], totalBalance = 0, error, isLoading } = useLedger(type, debouncedSearch);

  const onChangeType = (e) => setType(e.target.value);

  if (error) return <Alert message={error} type="error" />;
  if (isLoading) return <Spinner />;

  return (
    <div>
      <AppTitle level={2}>
        Ledger
        <Col>
          <Input
            allowClear
            placeholder={`Search ${type === "company" ? "companies" : "customers"}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 220, marginRight: 12 }}
          />
          <AppCreateButton url="/ledger/create" />
        </Col>
      </AppTitle>

      <Row gutter={[15, 15]} align="space-between" style={{ marginBottom: 25 }}>
        <Col sm={12} xs={24}>
          {transactions.length > 0 && (
            <div>
              <strong className={styles.headingStyle}>Total Balance (RS):</strong>
              <span className={styles.contentStyle}>{comaSeparatedValues(totalBalance)}</span>
            </div>
          )}
        </Col>

        <Col sm={12} xs={24} className={styles.companySelection}>
          <Radio.Group onChange={onChangeType} value={type}>
            <Radio value="company">Company</Radio>
            <Radio value="customer">Customer</Radio>
          </Radio.Group>
        </Col>
      </Row>

      {transactions.length > 0 ? (
        <Row gutter={[15, 15]}>
          {transactions.map((item, index) => (
            <Col xs={24} md={12} lg={6} key={index}>
              <div
                onClick={() => (window.location.href = `/ledger/${item.id}?type=${type}`)}
                style={{
                  cursor: "pointer",
                  borderRadius: "20px",
                  background: "#fff",
                  padding: "24px",
                  minHeight: "160px",
                  boxShadow: "0 8px 24px rgba(173, 173, 173, 0.3)",
                  transition: "transform 0.2s ease, box-shadow 0.3s ease",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  textAlign: "center",
                  margin: "20px 0 20px 0",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 149, 255, 0.30)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(173, 173, 173, 0.3)";
                }}
              >
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "black",
                    padding: "12px",
                    borderRadius: "10px",
                    marginTop: "-50px",
                    boxShadow: "0 4px 12px rgba(173, 173, 173, 0.2), 0 -4px 8px rgba(173, 173, 173, 0.1)",
                    backgroundColor: "#fff",
                  }}
                >
                  {item.name}
                </div>

                <div style={{ height: "1px", backgroundColor: "#d4e2ffff", margin: "16px 0" }} />

                <div>
                  <div style={{ fontSize: "14px", color: "#818181ff", marginBottom: "4px" }}>Total Balance</div>
                  <div style={{ fontSize: "24px", fontWeight: "700", color: "#6395ff" }}>
                    {comaSeparatedValues(Number(item.total).toFixed(2))}
                  </div>
                </div>
              </div>
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
