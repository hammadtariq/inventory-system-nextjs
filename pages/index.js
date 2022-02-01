import { useEffect } from "react";
import { Card, Col, Row } from "antd";
import { Line, Column } from "@ant-design/plots";
import { DollarCircleOutlined, ShopOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

import styles from "@/styles/Dashboard.module.css";

const items = [
  {
    id: 1,
    title: "Customers",
    count: 5,
    icon: <UserOutlined />,
  },
  {
    id: 2,
    title: "Companies",
    count: 50,
    icon: <TeamOutlined />,
  },
  {
    id: 3,
    title: "Inventory",
    count: 20,
    icon: <ShopOutlined />,
  },
  {
    id: 4,
    title: "Cheques",
    count: 8,
    icon: <DollarCircleOutlined />,
  },
];

const data = [
  {
    year: "1991",
    value: 3,
  },
  {
    year: "1992",
    value: 4,
  },
  {
    year: "1993",
    value: 3.5,
  },
  {
    year: "1994",
    value: 5,
  },
  {
    year: "1995",
    value: 4.9,
  },
  {
    year: "1996",
    value: 6,
  },
  {
    year: "1997",
    value: 7,
  },
  {
    year: "1998",
    value: 9,
  },
  {
    year: "1999",
    value: 13,
  },
];

export default function Home() {
  const config = {
    data,
    xField: "year",
    yField: "value",
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

  useEffect(() => {
    Promise.all([
      fetch("http://localhost:3000/api/cheques/count"),
      fetch("http://localhost:3000/api/company/count"),
      fetch("http://localhost:3000/api/customer/count"),
      fetch("http://localhost:3000/api/inventory/count"),
    ])
      .then(function (responses) {
        // Get a JSON object from each of the responses
        console.log("responses", responses);
        return Promise.all(
          responses.map(function (response) {
            return response.json();
          })
        );
      })
      .then(function (data) {
        // Log the data to the console
        // You would do something with both sets of data here
        console.log(data);
      })
      .catch(function (error) {
        // if there's an error, log it
        console.log(error);
      });
  }, []);

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
            <Line {...config} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card bordered={false}>
            <h3>Sales</h3>
            <Column {...config} />
          </Card>
        </Col>
      </Row>
    </>
  );
}
