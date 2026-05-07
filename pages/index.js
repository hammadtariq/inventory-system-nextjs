import { Alert, Card, Col, Row, List, Skeleton, Spin } from "antd";
import { ShoppingCartOutlined, CreditCardOutlined, ShopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Line, Pie, Column } from "@ant-design/charts";
import { useEffect, useState } from "react";
import {
  getDashboardCards,
  getSalesVsPurchases,
  getSalesDistribution,
  getPurchaseDistribution,
  getTopProducts,
  getTopCustomers,
  getCompanyComparison,
} from "@/hooks/overview";
import styles from "@/styles/Dashboard.module.css";

const formatCurrency = (num) => {
  const value = num || 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000) return `${sign}₨${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}₨${(abs / 1_000).toFixed(1)}K`;
  return `${sign}₨${abs.toLocaleString()}`;
};

const STAT_CARDS = [
  {
    key: "totalSales",
    title: "TOTAL SALES",
    subtitle: "Overall Sales",
    icon: <ShoppingCartOutlined />,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    key: "totalSaleDue",
    title: "TOTAL SALE DUE",
    subtitle: "Pending Payments",
    icon: <CreditCardOutlined />,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    key: "totalPurchases",
    title: "TOTAL PURCHASES",
    subtitle: "Total Spending",
    icon: <ShopOutlined />,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    key: "totalPurchaseDue",
    title: "TOTAL PURCHASE DUE",
    subtitle: "Outstanding Payables",
    icon: <ExclamationCircleOutlined />,
    gradient: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)",
  },
];

const EMPTY_CARDS = {
  totalSales: 0,
  totalSaleDue: 0,
  totalPurchases: 0,
  totalPurchaseDue: 0,
};

const EMPTY_CHARTS = {
  salesVsPurchases: { purchasesData: [], salesData: [] },
  salesDist: { paid: 0, due: 0, return: 0 },
  purchaseDist: { paid: 0, remaining: 0, total: 0 },
  companies: [],
};

const EMPTY_LISTS = {
  products: [],
  customers: [],
};

const getSettledValue = (result, fallback) => (result.status === "fulfilled" ? result.value : fallback);

const logDashboardTiming = (label, startedAt) => {
  if (typeof performance === "undefined") return;

  console.info(`${label} loaded in ${Math.round(performance.now() - startedAt)}ms`);
};

export default function Home() {
  const [cards, setCards] = useState(EMPTY_CARDS);
  const [chartsData, setChartsData] = useState(EMPTY_CHARTS);
  const [listsData, setListsData] = useState(EMPTY_LISTS);
  const [dashboardError, setDashboardError] = useState(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    const cardsStartedAt = performance.now();
    getDashboardCards()
      .then(setCards)
      .catch((error) => {
        console.error("dashboard cards error:", error);
        setCards(EMPTY_CARDS);
        setDashboardError("Some dashboard data could not be loaded.");
      })
      .finally(() => {
        logDashboardTiming("Dashboard cards", cardsStartedAt);
        setLoadingCards(false);
      });

    const chartsStartedAt = performance.now();
    Promise.allSettled([
      getSalesVsPurchases(),
      getSalesDistribution(),
      getPurchaseDistribution(),
      getCompanyComparison(),
    ])
      .then(([salesVsPurchases, salesDist, purchaseDist, companies]) => {
        const hasError = [salesVsPurchases, salesDist, purchaseDist, companies].some(
          (result) => result.status === "rejected"
        );

        if (hasError) {
          setDashboardError("Some dashboard charts could not be loaded.");
        }

        setChartsData({
          salesVsPurchases: getSettledValue(salesVsPurchases, EMPTY_CHARTS.salesVsPurchases),
          salesDist: getSettledValue(salesDist, EMPTY_CHARTS.salesDist),
          purchaseDist: getSettledValue(purchaseDist, EMPTY_CHARTS.purchaseDist),
          companies: getSettledValue(companies, EMPTY_CHARTS.companies),
        });
      })
      .finally(() => {
        logDashboardTiming("Dashboard charts", chartsStartedAt);
        setLoadingCharts(false);
      });

    const listsStartedAt = performance.now();
    Promise.allSettled([getTopProducts(), getTopCustomers()])
      .then(([products, customers]) => {
        const hasError = [products, customers].some((result) => result.status === "rejected");

        if (hasError) {
          setDashboardError("Some dashboard lists could not be loaded.");
        }

        setListsData({
          products: getSettledValue(products, EMPTY_LISTS.products),
          customers: getSettledValue(customers, EMPTY_LISTS.customers),
        });
      })
      .finally(() => {
        logDashboardTiming("Dashboard lists", listsStartedAt);
        setLoadingLists(false);
      });
  }, []);

  // Transform to flat array for multi-line chart
  const lineChartData = chartsData
    ? [
        ...chartsData.salesVsPurchases.purchasesData.map((d) => ({
          month: d.month,
          value: parseFloat(d.total),
          type: "Purchase",
        })),
        ...chartsData.salesVsPurchases.salesData.map((d) => ({
          month: d.month,
          value: parseFloat(d.total),
          type: "Sales",
        })),
      ]
    : [];

  const salesDonutData = chartsData
    ? [
        { type: "Paid", value: chartsData.salesDist.paid },
        { type: "Due", value: chartsData.salesDist.due },
        ...(chartsData.salesDist.return > 0 ? [{ type: "Return", value: chartsData.salesDist.return }] : []),
      ].filter((d) => d.value > 0)
    : [];

  const companiesData = (chartsData?.companies || []).map((c) => ({
    ...c,
    total: parseFloat(c.total) || 0,
    label: c.name.length > 13 ? c.name.slice(0, 12) + "…" : c.name,
  }));

  const purchasePieData = chartsData
    ? [
        { type: "Paid", value: chartsData.purchaseDist.paid },
        ...(chartsData.purchaseDist.remaining > 0
          ? [{ type: "Remaining", value: chartsData.purchaseDist.remaining }]
          : []),
      ].filter((d) => d.value > 0)
    : [];

  const cardTitle = (title, subtitle) => (
    <div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 400 }}>{subtitle}</div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      {dashboardError && (
        <Alert
          type="warning"
          showIcon
          closable
          message={dashboardError}
          onClose={() => setDashboardError(null)}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Row 1 — Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {STAT_CARDS.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <Card
              bordered={false}
              style={{ background: card.gradient, borderRadius: 12 }}
              styles={{ body: { padding: "20px 24px" } }}
            >
              <Spin spinning={loadingCards}>
                {loadingCards ? (
                  <Skeleton active paragraph={{ rows: 2 }} title={false} />
                ) : (
                  <div className={styles.statCard}>
                    <div className={styles.statCardIcon}>{card.icon}</div>
                    <div>
                      <div className={styles.statCardTitle}>{card.title}</div>
                      <div className={styles.statCardValue}>{formatCurrency(cards?.[card.key])}</div>
                      <div className={styles.statCardSubtitle}>{card.subtitle}</div>
                    </div>
                  </div>
                )}
              </Spin>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 2 — Line chart + Sales donut */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            bordered={false}
            title={cardTitle("Sales vs Purchases (Monthly)", "Monthly sales vs purchase performance")}
          >
            <Spin spinning={loadingCharts}>
              {loadingCharts ? (
                <Skeleton active paragraph={{ rows: 8 }} title={false} />
              ) : (
                <Line
                  data={lineChartData}
                  xField="month"
                  yField="value"
                  colorField="type"
                  height={260}
                  style={({ type }) => ({
                    lineWidth: 2,
                    lineDash: type === "Purchase" ? [4, 4] : undefined,
                  })}
                  axis={{
                    y: {
                      labelFormatter: (val) => {
                        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                        if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                        return val;
                      },
                    },
                  }}
                  tooltip={{
                    items: [
                      {
                        channel: "y",
                        valueFormatter: (val) => formatCurrency(val),
                      },
                    ],
                  }}
                  legend={{ position: "bottom" }}
                />
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} title={cardTitle("Sales (Paid/Due/Return)", "Sales Overview Paid, Due, and Returned")}>
            <Spin spinning={loadingCharts}>
              {loadingCharts ? (
                <Skeleton active paragraph={{ rows: 8 }} title={false} />
              ) : (
                <Pie
                  data={salesDonutData.length ? salesDonutData : [{ type: "No Data", value: 1 }]}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.6}
                  height={260}
                  scale={{ color: { range: ["#7c3aed", "#4f46e5", "#a78bfa"] } }}
                  tooltip={{
                    items: [
                      {
                        channel: "y",
                        valueFormatter: (val) => formatCurrency(val),
                      },
                    ],
                  }}
                  legend={{ position: "bottom" }}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Row 3 — Purchase donut + Company comparison */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card
            bordered={false}
            title={cardTitle("Purchase Distribution", "Purchase Overview Paid, Due, and Returned")}
          >
            <Spin spinning={loadingCharts}>
              {loadingCharts ? (
                <Skeleton active paragraph={{ rows: 8 }} title={false} />
              ) : (
                <Pie
                  data={purchasePieData.length ? purchasePieData : [{ type: "No Data", value: 1 }]}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.6}
                  height={260}
                  scale={{ color: { range: ["#059669", "#d1fae5"] } }}
                  tooltip={{
                    items: [
                      {
                        channel: "y",
                        valueFormatter: (val) => formatCurrency(val),
                      },
                    ],
                  }}
                  legend={{ position: "bottom" }}
                />
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card bordered={false} title={cardTitle("Company Comparison", "Revenue and orders by company")}>
            <Spin spinning={loadingCharts}>
              {loadingCharts ? (
                <Skeleton active paragraph={{ rows: 8 }} title={false} />
              ) : (
                <Column
                  data={companiesData}
                  xField="label"
                  yField="total"
                  height={260}
                  style={{ fill: "#7c3aed", radius: 4 }}
                  axis={{
                    y: {
                      labelFormatter: (val) => {
                        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                        if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                        return val;
                      },
                    },
                  }}
                  tooltip={{
                    items: [
                      {
                        channel: "y",
                        valueFormatter: (val) => formatCurrency(val),
                      },
                    ],
                  }}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Row 4 — Top Products + Top Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <span>
                <span style={{ marginRight: 6 }}>Top</span>Selling Products
              </span>
            }
          >
            <Spin spinning={loadingLists}>
              {loadingLists ? (
                <Skeleton active paragraph={{ rows: 5 }} title={false} />
              ) : (
                <List
                  dataSource={listsData?.products || []}
                  locale={{ emptyText: "No data" }}
                  renderItem={(item, index) => (
                    <List.Item extra={<span className={styles.rankBadge}>#{index + 1}</span>}>
                      <List.Item.Meta
                        title={item.name}
                        description={`${parseFloat(item.totalBales).toLocaleString()} Bales Sold`}
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            bordered={false}
            title={
              <span>
                <span style={{ marginRight: 6 }}>Top</span>Customers
              </span>
            }
          >
            <Spin spinning={loadingLists}>
              {loadingLists ? (
                <Skeleton active paragraph={{ rows: 5 }} title={false} />
              ) : (
                <List
                  dataSource={listsData?.customers || []}
                  locale={{ emptyText: "No data" }}
                  renderItem={(item, index) => (
                    <List.Item extra={<span className={styles.rankBadge}>#{index + 1}</span>}>
                      <List.Item.Meta title={item.name} description={`${formatCurrency(item.total)} Total Revenue`} />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
