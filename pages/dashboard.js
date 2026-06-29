import { Card, Col, Row, List, Skeleton, Spin, Select } from "antd";
import { ShoppingCartOutlined, CreditCardOutlined, ShopOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Line, Pie, Column } from "@ant-design/charts";
import { useEffect, useState } from "react";
import {
  getAvailableYears,
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
    title: "Total Sales",
    subtitle: "Overall revenue",
    icon: <ShoppingCartOutlined />,
    iconBg: "oklch(0.94 0.04 255)",
    iconColor: "#2563eb",
  },
  {
    key: "totalSaleDue",
    title: "Sale Due",
    subtitle: "Pending receivables",
    icon: <CreditCardOutlined />,
    iconBg: "#fffbeb",
    iconColor: "#d97706",
  },
  {
    key: "totalPurchases",
    title: "Total Purchases",
    subtitle: "Total spending",
    icon: <ShopOutlined />,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
  {
    key: "totalPurchaseDue",
    title: "Purchase Due",
    subtitle: "Outstanding payables",
    icon: <ExclamationCircleOutlined />,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
  },
];

export default function Home() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]);
  const [cards, setCards] = useState(null);
  const [chartsData, setChartsData] = useState(null);
  const [listsData, setListsData] = useState(null);
  const [loadingCards, setLoadingCards] = useState(true);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingLists, setLoadingLists] = useState(true);

  useEffect(() => {
    getAvailableYears().then((years) => {
      if (years && years.length > 0) {
        setAvailableYears(years.includes(currentYear) ? years : [currentYear, ...years]);
      }
    });
  }, []);

  useEffect(() => {
    setLoadingCards(true);
    setLoadingCharts(true);
    setLoadingLists(true);

    getDashboardCards(year)
      .then(setCards)
      .finally(() => setLoadingCards(false));

    Promise.all([
      getSalesVsPurchases(year),
      getSalesDistribution(year),
      getPurchaseDistribution(year),
      getCompanyComparison(year),
    ])
      .then(([salesVsPurchases, salesDist, purchaseDist, companies]) => {
        setChartsData({ salesVsPurchases, salesDist, purchaseDist, companies });
      })
      .finally(() => setLoadingCharts(false));

    Promise.all([getTopProducts(year), getTopCustomers(year)])
      .then(([products, customers]) => setListsData({ products, customers }))
      .finally(() => setLoadingLists(false));
  }, [year]);

  // Purchase series first in data, so range order is [purchase, sales]
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
      <div style={{ fontSize: 12, color: "oklch(0.44 0.018 255)", fontWeight: 400 }}>{subtitle}</div>
    </div>
  );

  return (
    <div className={styles.dashboard}>
      {/* Year filter */}
      <Row justify="end" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            value={year}
            onChange={setYear}
            style={{ width: 120 }}
            options={availableYears.map((y) => ({ label: String(y), value: y }))}
          />
        </Col>
      </Row>

      {/* Row 1 — Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {STAT_CARDS.map((card) => (
          <Col xs={24} sm={12} lg={12} xl={6} key={card.key}>
            <Card bordered={false} styles={{ body: { padding: "20px 24px" } }}>
              {loadingCards ? (
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: "55%" }} />
              ) : (
                <div className={styles.statCard}>
                  <div className={styles.statCardIcon} style={{ background: card.iconBg, color: card.iconColor }}>
                    {card.icon}
                  </div>
                  <div>
                    <div className={styles.statCardTitle}>{card.title}</div>
                    <div className={styles.statCardValue}>{formatCurrency(cards?.[card.key])}</div>
                    <div className={styles.statCardSubtitle}>{card.subtitle}</div>
                  </div>
                </div>
              )}
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
              <Line
                data={lineChartData}
                xField="month"
                yField="value"
                colorField="type"
                height={260}
                scale={{ color: { range: ["#d97706", "#2563eb"] } }}
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
                  items: [{ channel: "y", valueFormatter: (val) => formatCurrency(val) }],
                }}
                legend={{ position: "bottom" }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card bordered={false} title={cardTitle("Sales Distribution", "Sales overview paid, due, and returned")}>
            <Spin spinning={loadingCharts}>
              <Pie
                data={salesDonutData.length ? salesDonutData : [{ type: "No Data", value: 1 }]}
                angleField="value"
                colorField="type"
                innerRadius={0.6}
                height={260}
                scale={{ color: { range: ["#16a34a", "#d97706", "#dc2626"] } }}
                tooltip={{
                  items: [{ channel: "y", valueFormatter: (val) => formatCurrency(val) }],
                }}
                legend={{ position: "bottom" }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Row 3 — Purchase donut + Company comparison */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card bordered={false} title={cardTitle("Purchase Distribution", "Purchase overview paid and remaining")}>
            <Spin spinning={loadingCharts}>
              <Pie
                data={purchasePieData.length ? purchasePieData : [{ type: "No Data", value: 1 }]}
                angleField="value"
                colorField="type"
                innerRadius={0.6}
                height={260}
                scale={{ color: { range: ["#16a34a", "#d97706"] } }}
                tooltip={{
                  items: [{ channel: "y", valueFormatter: (val) => formatCurrency(val) }],
                }}
                legend={{ position: "bottom" }}
              />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card bordered={false} title={cardTitle("Company Comparison", "Revenue by company")}>
            <Spin spinning={loadingCharts}>
              <Column
                data={companiesData}
                xField="label"
                yField="total"
                height={260}
                style={{ fill: "#2563eb", radius: 4 }}
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
                  items: [{ channel: "y", valueFormatter: (val) => formatCurrency(val) }],
                }}
              />
            </Spin>
          </Card>
        </Col>
      </Row>

      {/* Row 4 — Top Products + Top Customers */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card bordered={false} title="Top Selling Products">
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
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card bordered={false} title="Top Customers">
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
          </Card>
        </Col>
      </Row>
    </div>
  );
}
