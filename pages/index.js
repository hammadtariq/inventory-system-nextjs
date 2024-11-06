import { Card, Col, Row } from "antd";
import styles from "@/styles/Dashboard.module.css";
import { DollarCircleOutlined, ShopOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import { Column, Line } from "@ant-design/plots";
import { useEffect, useState } from "react";
import { graphPurchaseTable, graphSaleTable, graphTablesCount } from "@/hooks/overview";

export default function Home() {
  const [tableCount, setTableCount] = useState();
  const [purchaseGraph, setPurchaseGraph] = useState([]);
  const [saleGraph, setSaleGraph] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tableData, purchaseData, saleData] = await Promise.all([
        graphTablesCount(),
        graphPurchaseTable(),
        graphSaleTable(),
      ]);

      const parsedTableData = {
        customers: tableData.customers,
        companies: tableData.companies,
        inventory: tableData.inventory,
        cheques: tableData.cheques,
      };

      setTableCount(parsedTableData);
      setPurchaseGraph(purchaseData);
      setSaleGraph(saleData);
    } catch (error) {
      console.error("Error retrieving data:", error);
    }
  };

  const items = [
    {
      id: 1,
      title: "Customers",
      count: tableCount ? tableCount.customers : 0,
      icon: <UserOutlined />,
    },
    {
      id: 2,
      title: "Companies",
      count: tableCount ? tableCount.companies : 0,
      icon: <TeamOutlined />,
    },
    {
      id: 3,
      title: "Inventory",
      count: tableCount ? tableCount.inventory : 0,
      icon: <ShopOutlined />,
    },
    {
      id: 4,
      title: "Cheques",
      count: tableCount ? tableCount.cheques : 0,
      icon: <DollarCircleOutlined />,
    },
  ];

  const purchase = {
    data: purchaseGraph,
    xField: "year",
    yField: "count",
    label: {},
    point: {
      size: 5,
      shape: "diamond",
      style: {
        fill: "white",
        stroke: "#5B8FF9",
        lineWidth: 2,
      },
    },
    tooltip: {
      showMarkers: false,
    },
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: "#000",
          fill: "red",
        },
      },
    },
    interactions: [
      {
        type: "marker-active",
      },
    ],
  };

  const sale = {
    data: saleGraph,
    xField: "year",
    yField: "count",
    label: {},
    point: {
      size: 5,
      shape: "diamond",
      style: {
        fill: "white",
        stroke: "#5B8FF9",
        lineWidth: 2,
      },
    },
    tooltip: {
      showMarkers: false,
    },
    state: {
      active: {
        style: {
          shadowBlur: 4,
          stroke: "#000",
          fill: "red",
        },
      },
    },
    interactions: [
      {
        type: "marker-active",
      },
    ],
  };
  return (
    <>
      <Row gutter={[40, 40]} justify="space-between">
        {items.map((item) => (
          <Col xs={24} sm={12} md={6} lg={5} key={item.id}>
            <Card className={styles.dCard} bordered={false}>
              <Row>
                <Col flex="1 0 80%">
                  <h2>{item.count}</h2>
                </Col>
                <Col flex="1 0 0">
                  <h3>{item.icon}</h3>
                </Col>
              </Row>
              <p>{item.title}</p>
            </Card>
          </Col>
        ))}
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <h3>Purchase</h3>
            <Line {...purchase} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <h3>Sales</h3>
            <Column {...sale} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
