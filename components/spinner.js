import { Spin } from "antd";

export default function Spinner() {
  return (
    <div>
      <div className="app_spinner">
        <Spin size="large" tip="Loading..." />
      </div>
    </div>
  );
}
