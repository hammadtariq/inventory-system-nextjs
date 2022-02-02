import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Form, Button, Row, Col, Select } from "antd";

import AppBackButton from "@/components/backButton";
import UpdateSalesItems from "@/components/updateSaleItems";

import styles from "@/styles/SalesDetail.module.css";

const { Option } = Select;

const ViewSale = ({ sale }) => {
  const router = useRouter();
  const [customerId, setCustomerId] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  const { customer, soldDate, soldProducts, totalAmount } = sale;
  useEffect(() => {
    if (sale) {
      const { id } = customer;
      setCustomerId(id);
      setSelectedProducts(soldProducts);
    }
  }, [sale]);

  return (
    <div>
      <Row gutter={[24, 24]}>
        <Col span={8}>
          <div>
            <strong className={styles.headingStyle}>Customer Name: </strong>
            <span className={styles.contentStyle}>{`${customer?.firstName} ${customer?.lastName}`}</span>
          </div>
        </Col>
        <Col span={8}>
          <div>
            <strong className={styles.headingStyle}>Total Amount (RS): </strong>
            <span className={styles.contentStyle}>{`${totalAmount}`}</span>
          </div>
        </Col>
        <Col span={8}>
          <div>
            <strong className={styles.headingStyle}>Sale Date: </strong>
            <span className={styles.contentStyle}>{`${new Date(soldDate).toDateString()}`}</span>
          </div>
        </Col>

        {customerId && !!selectedProducts.length && (
          <Col span={24}>
            <UpdateSalesItems data={selectedProducts} viewOnly />
          </Col>
        )}
        <Col span={24}>
          <Form.Item>
            <AppBackButton />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default ViewSale;
