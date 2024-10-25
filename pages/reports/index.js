import AppTitle from "@/components/title";
import { useState } from "react";
import styles from "@/styles/Ledger.module.css";
import { Tabs } from "antd";
import TabPane from "antd/lib/tabs/TabPane";
import CompanyReports from "@/components/companyReports";
import SalesReport from "@/components/salesReport";

export default function ReportsOverview() {
  const [activeKey, setActiveKey] = useState("sales");

  return (
    <div>
      <div className="container">
        <AppTitle level={2}>Reports</AppTitle>
      </div>

      <Tabs activeKey={activeKey} onChange={setActiveKey}>
        <TabPane tab="Sales" key="sales">
          <SalesReport />
        </TabPane>
        <TabPane tab="Company" key="company">
          <CompanyReports />
        </TabPane>
      </Tabs>
    </div>
  );
}
