import AppTitle from "@/components/title";
import { useState } from "react";
import { Tabs } from "antd";
import CompanyReports from "@/components/companyReports";
import SalesReport from "@/components/salesReport";
import PurchaseReport from "@/components/purchaseReport";

export default function ReportsOverview() {
  const [activeKey, setActiveKey] = useState("sales");

  return (
    <div>
      <div className="container">
        <AppTitle level={2}>Reports</AppTitle>
      </div>

      <Tabs activeKey={activeKey} onChange={setActiveKey}>
        <Tabs.TabPane tab="Sales" key="sales">
          <SalesReport />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Purchase" key="purchase">
          <PurchaseReport />
        </Tabs.TabPane>
        <Tabs.TabPane tab="Company" key="company">
          <CompanyReports />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
}
